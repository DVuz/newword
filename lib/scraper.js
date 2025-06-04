const axios = require('axios');
const cheerio = require('cheerio');

class WordScraper {
  static BASE_URL = 'https://www.ldoceonline.com/dictionary';
  static TIMEOUT = 15000;
  static DELAY_BETWEEN_REQUESTS = 2000;
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  // Scrape single word
  static async scrapeWord(word) {
    try {
      const url = `${this.BASE_URL}/${encodeURIComponent(word.trim())}`;

      console.log(`Scraping: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        timeout: this.TIMEOUT,
      });

      const $ = cheerio.load(response.data);

      // Check if word exists
      if ($('.dictionary').length === 0 || $('.Error').length > 0) {
        throw new Error(`Word "${word}" not found in dictionary`);
      }

      // Extract basic word data
      const wordData = {
        word: word.toLowerCase().trim(),
        pronunciation: this.extractPronunciation($),
        audio: this.extractAudio($),
        level: $('.LEVEL').first().text().trim() || '',
        frequency: $('.FREQ').first().attr('title') || '',
        meanings: this.extractMeanings($),
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
    } catch (error) {
      console.error(`Error scraping word "${word}":`, error.message);
      throw new Error(`Failed to scrape word "${word}": ${error.message}`);
    }
  }

  // Extract pronunciation
  static extractPronunciation($) {
    return {
      uk: $('.PRON').first().text().trim() || '',
      us: $('.AMEVARPRON').first().text().trim() || $('.PRON').first().text().trim() || '',
    };
  }

  // Extract audio URLs
  static extractAudio($) {
    return {
      uk: $('.speaker.brefile').first().attr('data-src-mp3') || '',
      us: $('.speaker.amefile').first().attr('data-src-mp3') || '',
    };
  }

  // Extract meanings and examples
  static extractMeanings($) {
    const meanings = [];

    $('.Sense')
      .slice(0, 3)
      .each((i, sense) => {
        const $sense = $(sense);
        const $entry = $sense.closest('.Entry');

        const meaning = {
          partOfSpeech: $entry.find('.POS').first().text().trim() || '',
          definition: $sense.find('.DEF').text().trim() || '',
          examples: [],
        };

        // Extract examples
        $sense
          .find('.EXAMPLE')
          .slice(0, 2)
          .each((j, example) => {
            const exampleText = $(example).text().trim();
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
  static async translateToVietnamese(text) {
    try {
      const response = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
          text
        )}`,
        { timeout: 5000 }
      );

      return response.data[0]?.[0]?.[0] || '';
    } catch (error) {
      console.error('Translation failed:', error);
      return '';
    }
  }

  // Scrape multiple words with delay
  static async scrapeWords(words) {
    const results = [];
    const errors = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      try {
        console.log(`Processing word ${i + 1}/${words.length}: ${word}`);

        const wordData = await this.scrapeWord(word);
        results.push(wordData);

        console.log(`✅ Successfully scraped: ${word}`);

        // Add delay between requests
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
        }
      } catch (error) {
        console.error(`❌ Error processing ${word}:`, error.message);
        errors.push({
          word,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }

  // Validate word format
  static validateWord(word) {
    return /^[a-zA-Z\s-]+$/.test(word.trim());
  }

  // Clean and validate words array
  static cleanWords(words) {
    return words
      .map(w => w.trim().toLowerCase())
      .filter(w => w && this.validateWord(w))
      .slice(0, 50); // Limit to 50 words
  }
}

module.exports = { WordScraper };
