import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

// Interfaces
interface WordMeaning {
  partOfSpeech: string;
  definition: string;
  examples: string[];
  vietnamese?: string;
}

interface WordData {
  word: string;
  pronunciation: {
    uk: string;
    us: string;
  };
  audio: {
    uk: string;
    us: string;
  };
  level: string;
  frequency: string;
  meanings: WordMeaning[];
  vietnamese: string;
  createdAt: Date;
  source?: string;
}

interface ScrapeError {
  word: string;
  error: string;
}

class CambridgeScraper {
  private static readonly BASE_URL: string = 'https://dictionary.cambridge.org/dictionary/english';
  private static readonly TIMEOUT: number = 15000;
  private static readonly USER_AGENT: string =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  // Scrape single word from Cambridge
  static async scrapeWord(word: string): Promise<WordData> {
    try {
      const url: string = `${this.BASE_URL}/${encodeURIComponent(word.trim())}`;

      console.log(`🇬🇧 Cambridge scraping: ${url}`);

      const response: AxiosResponse = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        timeout: this.TIMEOUT,
      });

      const $: cheerio.CheerioAPI = cheerio.load(response.data);

      // Enhanced word existence check
      const hasContent: boolean = $('.pr.dictionary, .entry-body, .di-title').length > 0;
      const hasError: boolean = $('.no-results, .error-page, .not-found').length > 0;

      if (!hasContent || hasError) {
        throw new Error(`Word "${word}" not found in Cambridge Dictionary`);
      }

      // Extract basic word data
      const wordData: WordData = {
        word: word.toLowerCase().trim(),
        pronunciation: this.extractPronunciation($),
        audio: this.extractAudio($),
        level: this.extractLevel($),
        frequency: '', // Cambridge doesn't show frequency like Longman
        meanings: this.extractMeanings($),
        vietnamese: '',
        createdAt: new Date(),
        source: 'cambridge',
      };

      // Get Vietnamese translation
      wordData.vietnamese = await this.translateToVietnamese(word);

      // Translate meanings
      for (const meaning of wordData.meanings) {
        if (meaning.definition) {
          meaning.vietnamese = await this.translateToVietnamese(meaning.definition);
        }
      }

      return wordData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error(`Timeout scraping "${word}" from Cambridge`);
        }
        if (error.message.includes('404')) {
          throw new Error(`Word "${word}" not found in Cambridge`);
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Cambridge error for "${word}":`, errorMessage);
      throw new Error(`Failed to scrape word "${word}" from Cambridge: ${errorMessage}`);
    }
  }

  // Extract pronunciation from Cambridge
  private static extractPronunciation($: cheerio.CheerioAPI): { uk: string; us: string } {
    const ukPron: string = $('.uk .pron .ipa').first().text().trim();
    const usPron: string = $('.us .pron .ipa').first().text().trim();

    return {
      uk: ukPron || '',
      us: usPron || ukPron || '', // Fallback to UK if US not available
    };
  }

  // Extract audio URLs from Cambridge
  private static extractAudio($: cheerio.CheerioAPI): { uk: string; us: string } {
    let ukAudio: string = '';
    let usAudio: string = '';

    // UK audio
    const ukAudioElement = $('.uk .daud audio source[type="audio/mpeg"]');
    if (ukAudioElement.length > 0) {
      ukAudio = ukAudioElement.attr('src') || '';
      if (ukAudio && !ukAudio.startsWith('http')) {
        ukAudio = `https://dictionary.cambridge.org${ukAudio}`;
      }
    }

    // US audio
    const usAudioElement = $('.us .daud audio source[type="audio/mpeg"]');
    if (usAudioElement.length > 0) {
      usAudio = usAudioElement.attr('src') || '';
      if (usAudio && !usAudio.startsWith('http')) {
        usAudio = `https://dictionary.cambridge.org${usAudio}`;
      }
    }

    return {
      uk: ukAudio,
      us: usAudio,
    };
  }

  // Extract level from Cambridge (if available)
  private static extractLevel($: cheerio.CheerioAPI): string {
    // Cambridge sometimes has level indicators in different places
    const levelElement = $('.level, .cef-level, .level-indicator').first();
    return levelElement.text().trim() || '';
  }

  // Extract meanings and examples from Cambridge
  private static extractMeanings($: cheerio.CheerioAPI): WordMeaning[] {
    const meanings: WordMeaning[] = [];

    // Cambridge structure: .pr.entry-body .sense-body .def-block
    $('.entry-body .sense-body .def-block, .entry-body .pr.dsense .def-block')
      .slice(0, 3)
      .each((i: number, defBlock: cheerio.Element) => {
        const $defBlock = $(defBlock);
        const $entry = $defBlock.closest('.entry, .pr.di');

        // Get part of speech
        const partOfSpeech: string = $entry.find('.pos, .dpos').first().text().trim() || '';

        // Get definition
        const definition: string = $defBlock.find('.def, .ddef_d').text().trim() || '';

        if (!definition) return; // Skip if no definition

        const meaning: WordMeaning = {
          partOfSpeech: partOfSpeech,
          definition: definition,
          examples: [],
        };

        // Extract examples
        $defBlock
          .find('.examp .eg, .dexamp .deg')
          .slice(0, 2)
          .each((j: number, example: cheerio.Element) => {
            let exampleText: string = $(example).text().trim();

            // Clean up example text (remove internal links text)
            exampleText = exampleText.replace(/\s+/g, ' ').trim();

            if (exampleText && !exampleText.includes('→')) {
              meaning.examples.push(exampleText);
            }
          });

        meanings.push(meaning);
      });

    return meanings;
  }

  // Translate text to Vietnamese
  private static async translateToVietnamese(text: string): Promise<string> {
    try {
      const response: AxiosResponse = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
          text
        )}`,
        { timeout: 5000 }
      );

      return response.data[0]?.[0]?.[0] || '';
    } catch (error: unknown) {
      console.error('Cambridge translation failed:', error);
      return '';
    }
  }

  // Test if Cambridge has the word
  static async hasWord(word: string): Promise<boolean> {
    try {
      const url: string = `${this.BASE_URL}/${encodeURIComponent(word.trim())}`;

      const response: AxiosResponse = await axios.get(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 10000,
      });

      const $: cheerio.CheerioAPI = cheerio.load(response.data);

      // Enhanced check for word existence
      const hasContent: boolean = $('.pr.dictionary, .entry-body, .di-title').length > 0;
      const hasError: boolean = $('.no-results, .error-page, .not-found').length > 0;

      return hasContent && !hasError;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Cambridge check failed for "${word}":`, errorMessage);
      return false;
    }
  }

  // Validate word format
  static validateWord(word: string): boolean {
    return /^[a-zA-Z\s-]+$/.test(word.trim());
  }

  // Clean and validate words array
  static cleanWords(words: string[]): string[] {
    return words
      .map((w: string) => w.trim().toLowerCase())
      .filter((w: string) => w && this.validateWord(w))
      .slice(0, 50); // Limit to 50 words
  }

  // Scrape multiple words
  static async scrapeWords(
    words: string[]
  ): Promise<{ results: WordData[]; errors: ScrapeError[] }> {
    const results: WordData[] = [];
    const errors: ScrapeError[] = [];
    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < words.length; i++) {
      const word: string = words[i];

      try {
        console.log(`🔍 Cambridge processing word ${i + 1}/${words.length}: ${word}`);

        const wordData: WordData = await this.scrapeWord(word);
        results.push(wordData);

        console.log(`✅ Cambridge success for: ${word}`);

        // Add delay between requests to avoid rate limiting
        if (i < words.length - 1) {
          await delay(2000);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Cambridge error processing ${word}:`, errorMessage);
        errors.push({
          word,
          error: errorMessage,
        });
      }
    }

    console.log(`📊 Cambridge Summary: ${results.length} success, ${errors.length} errors`);

    return { results, errors };
  }

  // Check if Cambridge is accessible
  static async isAccessible(): Promise<boolean> {
    try {
      const response: AxiosResponse = await axios.get(this.BASE_URL, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error: unknown) {
      console.error('Cambridge accessibility check failed:', error);
      return false;
    }
  }

  // Get word suggestions (if available)
  static async getWordSuggestions(word: string): Promise<string[]> {
    try {
      const url: string = `${this.BASE_URL}/${encodeURIComponent(word.trim())}`;

      const response: AxiosResponse = await axios.get(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 10000,
      });

      const $: cheerio.CheerioAPI = cheerio.load(response.data);
      const suggestions: string[] = [];

      // Look for spelling suggestions
      $('.spell-suggestion, .did-you-mean, .suggestions')
        .find('a')
        .each((i: number, element: cheerio.Element) => {
          const suggestion: string = $(element).text().trim();
          if (suggestion && suggestions.length < 5) {
            suggestions.push(suggestion);
          }
        });

      return suggestions;
    } catch (error: unknown) {
      console.error(`Failed to get suggestions for "${word}":`, error);
      return [];
    }
  }
}

export { CambridgeScraper };
export type { WordData, WordMeaning, ScrapeError };
