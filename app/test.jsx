import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion } from 'mongodb';
import axios from 'axios';
import * as cheerio from 'cheerio';

// MongoDB connection
const uri = 'mongodb+srv://DzungVu:Dungvu26%40@cluster0.obujmgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Word scraper class
class WordScraper {
  static async scrapeWord(word: string): Promise<any> {
    try {
      const url = `https://www.ldoceonline.com/dictionary/${encodeURIComponent(word)}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      if ($('.dictionary').length === 0) {
        throw new Error('Word not found in dictionary');
      }

      // Extract word data
      const wordData = {
        word: word.toLowerCase(),
        pronunciation: {
          uk: $('.PRON').first().text().trim() || '',
          us: $('.AMEVARPRON').first().text().trim() || '',
        },
        audio: {
          uk: $('.speaker.brefile').first().attr('data-src-mp3') || '',
          us: $('.speaker.amefile').first().attr('data-src-mp3') || '',
        },
        level: $('.LEVEL').first().text().trim() || '',
        frequency: $('.FREQ').first().attr('title') || '',
        meanings: [] as any[],
        createdAt: new Date(),
      };

      // Extract meanings
      $('.Sense').slice(0, 3).each((i, sense) => {
        const $sense = $(sense);
        const meaning = {
          partOfSpeech: $sense.closest('.dictionary').find('.POS').first().text().trim() || '',
          definition: $sense.find('.DEF').text().trim() || '',
          examples: [] as string[],
        };

        // Extract examples
        $sense.find('.EXAMPLE').slice(0, 3).each((j, example) => {
          const exampleText = $(example).text().trim();
          if (exampleText) {
            meaning.examples.push(exampleText);
          }
        });

        if (meaning.definition) {
          wordData.meanings.push(meaning);
        }
      });

      return wordData;
    } catch (error: any) {
      throw new Error(`Failed to scrape word "${word}": ${error.message}`);
    }
  }

  static async translateToVietnamese(text: string): Promise<string> {
    try {
      // Simple translation using Google Translate (you can implement your own)
      const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`);
      return response.data[0][0][0] || '';
    } catch (error) {
      console.error('Translation failed:', error);
      return '';
    }
  }
}

// Database operations
class WordDatabase {
  static async saveWords(words: any[]): Promise<{ success: number; errors: any[] }> {
    let success = 0;
    const errors: any[] = [];

    try {
      await client.connect();
      const db = client.db('newword');
      const collection = db.collection('words');

      for (const wordData of words) {
        try {
          // Check if word already exists
          const existing = await collection.findOne({ word: wordData.word });

          if (existing) {
            // Update existing word
            await collection.updateOne(
              { word: wordData.word },
              {
                $set: {
                  ...wordData,
                  updatedAt: new Date()
                }
              }
            );
          } else {
            // Insert new word
            await collection.insertOne(wordData);
          }

          success++;
        } catch (error: any) {
          errors.push({
            word: wordData.word,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      errors.push({
        word: 'database_connection',
        error: error.message,
      });
    } finally {
      await client.close();
    }

    return { success, errors };
  }
}

// API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words, mode } = body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Invalid words array' },
        { status: 400 }
      );
    }

    // Validate and clean words
    const cleanWords = words
      .map(w => w.trim().toLowerCase())
      .filter(w => w && /^[a-zA-Z\s-]+$/.test(w))
      .slice(0, 50); // Limit to 50 words

    if (cleanWords.length === 0) {
      return NextResponse.json(
        { error: 'No valid words found' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process each word
    for (let i = 0; i < cleanWords.length; i++) {
      const word = cleanWords[i];

      try {
        console.log(`Processing word ${i + 1}/${cleanWords.length}: ${word}`);

        // Scrape word data
        const wordData = await WordScraper.scrapeWord(word);

        // Add Vietnamese translation
        wordData.vietnamese = await WordScraper.translateToVietnamese(word);

        results.push(wordData);

        // Add delay between requests
        if (i < cleanWords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`Error processing ${word}:`, error.message);
        errors.push({
          word,
          error: error.message,
        });
      }
    }

    // Save to database
    const saveResult = await WordDatabase.saveWords(results);

    return NextResponse.json({
      success: true,
      data: {
        processed: cleanWords.length,
        scraped: results.length,
        saved: saveResult.success,
        scrapeErrors: errors,
        saveErrors: saveResult.errors,
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler to fetch words
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    await client.connect();
    const db = client.db('newword');
    const collection = db.collection('words');

    const words = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments({});

    await client.close();

    return NextResponse.json({
      success: true,
      data: {
        words,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error: any) {
    console.error('GET API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
