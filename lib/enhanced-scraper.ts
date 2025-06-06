import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { CambridgeScraper, WordData, WordMeaning, ScrapeError } from './cambridge-scraper';

// Additional interfaces
interface ScrapeResult {
  results: WordData[];
  errors: ScrapeError[];
}

interface WordAvailability {
  word: string;
  longman: boolean;
  cambridge: boolean;
  recommended: 'longman' | 'cambridge' | null;
  error?: string;
}

class EnhancedWordScraper {
  private static readonly BASE_URL: string = 'https://www.ldoceonline.com/dictionary';
  private static readonly TIMEOUT: number = 15000;
  private static readonly DELAY_BETWEEN_REQUESTS: number = 2000;
  private static readonly USER_AGENT: string =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  // Scrape single word with fallback to Cambridge
  static async scrapeWord(word: string): Promise<WordData> {
    console.log(`🔍 Starting scrape for: ${word}`);

    // First, try Longman
    try {
      const longmanData: WordData = await this.scrapeLongman(word);
      console.log(`✅ Longman success for: ${word}`);
      return { ...longmanData, source: 'longman' };
    } catch (longmanError: unknown) {
      const longmanErrorMessage =
        longmanError instanceof Error ? longmanError.message : 'Unknown error';
      console.log(`⚠️ Longman failed for "${word}": ${longmanErrorMessage}`);

      // If Longman fails, try Cambridge
      try {
        console.log(`🔄 Trying Cambridge for: ${word}`);
        const cambridgeData: WordData = await CambridgeScraper.scrapeWord(word);
        console.log(`✅ Cambridge success for: ${word}`);
        return { ...cambridgeData, source: 'cambridge' };
      } catch (cambridgeError: unknown) {
        const cambridgeErrorMessage =
          cambridgeError instanceof Error ? cambridgeError.message : 'Unknown error';
        console.log(`❌ Cambridge also failed for "${word}": ${cambridgeErrorMessage}`);
        throw new Error(`Both Longman and Cambridge failed for "${word}"`);
      }
    }
  }

  // Scrape from Longman (original method)
  private static async scrapeLongman(word: string): Promise<WordData> {
    const url: string = `${this.BASE_URL}/${encodeURIComponent(word.trim())}`;
    console.log(`📖 Longman scraping: ${url}`);

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

    // Check if word exists in Longman
    if ($('.dictionary').length === 0 || $('.Error').length > 0) {
      throw new Error(`Word "${word}" not found in Longman Dictionary`);
    }

    // Extract basic word data from Longman
    const wordData: WordData = {
      word: word.toLowerCase().trim(),
      pronunciation: this.extractLongmanPronunciation($),
      audio: this.extractLongmanAudio($),
      level: $('.LEVEL').first().text().trim() || '',
      frequency: $('.FREQ').first().attr('title') || '',
      meanings: this.extractLongmanMeanings($),
      vietnamese: '',
      createdAt: new Date(),
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
  }

  // Extract pronunciation from Longman
  private static extractLongmanPronunciation($: cheerio.CheerioAPI): { uk: string; us: string } {
    return {
      uk: $('.PRON').first().text().trim() || '',
      us: $('.AMEVARPRON').first().text().trim() || $('.PRON').first().text().trim() || '',
    };
  }

  // Extract audio URLs from Longman
  private static extractLongmanAudio($: cheerio.CheerioAPI): { uk: string; us: string } {
    return {
      uk: $('.speaker.brefile').first().attr('data-src-mp3') || '',
      us: $('.speaker.amefile').first().attr('data-src-mp3') || '',
    };
  }

  // Extract meanings and examples from Longman
  private static extractLongmanMeanings($: cheerio.CheerioAPI): WordMeaning[] {
    const meanings: WordMeaning[] = [];

    $('.Sense')
      .slice(0, 3)
      .each((i: number, sense: any) => {
        const $sense = $(sense);
        const $entry = $sense.closest('.Entry');

        const meaning: WordMeaning = {
          partOfSpeech: $entry.find('.POS').first().text().trim() || '',
          definition: $sense.find('.DEF').text().trim() || '',
          examples: [],
        };

        // Extract examples
        $sense
          .find('.EXAMPLE')
          .slice(0, 2)
          .each((j: number, example: any) => {
            const exampleText: string = $(example).text().trim();
            if (exampleText && !exampleText.includes('→')) {
              meaning.examples.push(exampleText);
            }
          });

        if (meaning.definition) {
          meanings.push(meaning);
        }
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
      console.error('Translation failed:', error);
      return '';
    }
  }

  // Scrape multiple words with enhanced fallback
  static async scrapeWords(words: string[]): Promise<ScrapeResult> {
    const results: WordData[] = [];
    const errors: ScrapeError[] = [];

    for (let i = 0; i < words.length; i++) {
      const word: string = words[i];

      try {
        console.log(`Processing word ${i + 1}/${words.length}: ${word}`);

        const wordData: WordData = await this.scrapeWord(word);
        results.push(wordData);

        console.log(`✅ Successfully scraped: ${word} (source: ${wordData.source})`);

        // Add delay between requests
        if (i < words.length - 1) {
          await new Promise<void>(resolve => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing ${word}:`, errorMessage);
        errors.push({
          word,
          error: errorMessage,
        });
      }
    }

    // Log summary
    const longmanCount: number = results.filter(r => r.source === 'longman').length;
    const cambridgeCount: number = results.filter(r => r.source === 'cambridge').length;

    console.log(`📊 Scraping Summary:`);
    console.log(`   - Longman: ${longmanCount} words`);
    console.log(`   - Cambridge: ${cambridgeCount} words`);
    console.log(`   - Errors: ${errors.length} words`);

    return { results, errors };
  }

  // Check word availability across dictionaries
  static async checkWordAvailability(word: string): Promise<WordAvailability> {
    const availability: WordAvailability = {
      word: word,
      longman: false,
      cambridge: false,
      recommended: null,
    };

    // Check Longman
    try {
      const url: string = `${this.BASE_URL}/${encodeURIComponent(word.trim())}`;
      const response: AxiosResponse = await axios.get(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 10000,
      });
      const $: cheerio.CheerioAPI = cheerio.load(response.data);
      availability.longman = $('.dictionary').length > 0 && $('.Error').length === 0;
    } catch (error: unknown) {
      availability.longman = false;
    }

    // Check Cambridge
    try {
      await CambridgeScraper.scrapeWord(word);
      availability.cambridge = true;
    } catch (error: unknown) {
      availability.cambridge = false;
    }

    // Set recommendation
    if (availability.longman) {
      availability.recommended = 'longman';
    } else if (availability.cambridge) {
      availability.recommended = 'cambridge';
    } else {
      availability.recommended = null;
    }

    return availability;
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

  // Batch check word availability (useful for preprocessing)
  static async batchCheckAvailability(words: string[]): Promise<WordAvailability[]> {
    const results: WordAvailability[] = [];

    for (const word of words.slice(0, 10)) {
      // Limit for demonstration
      try {
        const availability: WordAvailability = await this.checkWordAvailability(word);
        results.push(availability);

        // Small delay between checks
        await new Promise<void>(resolve => setTimeout(resolve, 500));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error checking availability for ${word}:`, errorMessage);
        results.push({
          word: word,
          longman: false,
          cambridge: false,
          recommended: null,
          error: errorMessage,
        });
      }
    }

    return results;
  }
}

export { EnhancedWordScraper };
export type { ScrapeResult, WordAvailability };
