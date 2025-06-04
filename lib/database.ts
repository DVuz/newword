const { MongoClient, ServerApiVersion } = require('mongodb');

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://DzungVu:dungvu26@cluster0.obujmgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'newword';

let client: any;
let clientPromise: any;

// Declare global type
declare global {
  var _mongoClientPromise: any;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  clientPromise = client.connect();
}

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
  updatedAt?: Date;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface SaveWordsResult {
  success: number;
  errors: Array<{
    word: string;
    error: string;
  }>;
}

interface PaginationResult {
  words: WordData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Statistics {
  totalWords: number;
  todayWords: number;
  weekWords: number;
}

class DatabaseManager {
  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const client = await clientPromise;
      await client.db('admin').command({ ping: 1 });
      console.log('✅ Database connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // Get database instance
  static async getDatabase() {
    const client = await clientPromise;
    return client.db(dbName);
  }

  // Get words collection
  static async getWordsCollection() {
    const db = await this.getDatabase();
    return db.collection('words');
  }

  // Save single word
  static async saveWord(wordData: WordData): Promise<SaveResult> {
    try {
      const collection = await this.getWordsCollection();

      const existing = await collection.findOne({ word: wordData.word });

      if (existing) {
        await collection.updateOne(
          { word: wordData.word },
          {
            $set: {
              ...wordData,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Updated word: ${wordData.word}`);
      } else {
        await collection.insertOne(wordData);
        console.log(`Inserted word: ${wordData.word}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`Error saving word ${wordData.word}:`, error?.message);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  // Save multiple words
  static async saveWords(words: WordData[]): Promise<SaveWordsResult> {
    let success = 0;
    const errors: Array<{ word: string; error: string }> = [];

    for (const wordData of words) {
      const result = await this.saveWord(wordData);
      if (result.success) {
        success++;
      } else {
        errors.push({
          word: wordData.word,
          error: result.error || 'Unknown error',
        });
      }
    }

    return { success, errors };
  }

  // Get words with pagination
  static async getWords(page: number = 1, limit: number = 20): Promise<PaginationResult> {
    try {
      const collection = await this.getWordsCollection();

      const words = await collection
        .find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments({});

      return {
        words,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error fetching words:', error);
      throw new Error('Failed to fetch words: ' + (error?.message || 'Unknown error'));
    }
  }

  // Search words
  static async searchWords(query: string): Promise<WordData[]> {
    try {
      const collection = await this.getWordsCollection();

      const words = await collection
        .find({
          $or: [
            { word: { $regex: query, $options: 'i' } },
            { vietnamese: { $regex: query, $options: 'i' } },
            { 'meanings.definition': { $regex: query, $options: 'i' } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

      return words;
    } catch (error: any) {
      console.error('Error searching words:', error);
      throw new Error('Failed to search words: ' + (error?.message || 'Unknown error'));
    }
  }

  // Get word by name
  static async getWordByName(word: string): Promise<WordData | null> {
    try {
      const collection = await this.getWordsCollection();
      return await collection.findOne({ word: word.toLowerCase() });
    } catch (error: any) {
      console.error('Error getting word:', error);
      return null;
    }
  }

  // Delete word
  static async deleteWord(word: string): Promise<boolean> {
    try {
      const collection = await this.getWordsCollection();
      const result = await collection.deleteOne({ word: word.toLowerCase() });
      return result.deletedCount > 0;
    } catch (error: any) {
      console.error('Error deleting word:', error);
      return false;
    }
  }

  // Get statistics
  static async getStatistics(): Promise<Statistics> {
    try {
      const collection = await this.getWordsCollection();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const [totalWords, todayWords, weekWords] = await Promise.all([
        collection.countDocuments({}),
        collection.countDocuments({ createdAt: { $gte: today } }),
        collection.countDocuments({ createdAt: { $gte: weekAgo } }),
      ]);

      return { totalWords, todayWords, weekWords };
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      return { totalWords: 0, todayWords: 0, weekWords: 0 };
    }
  }
}

export { DatabaseManager };
