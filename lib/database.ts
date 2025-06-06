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

// Enhanced interfaces for date filtering
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

// New interfaces for enhanced date filtering
interface DateStats {
  today: number;
  week: number;
  month: number;
  total: number;
  recentDays: Array<{
    date: string;
    count: number;
  }>;
}

interface DateFilterQuery {
  createdAt?: {
    $gte?: Date;
    $lt?: Date;
  };
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

      // Check if word exists
      const existingWord = await collection.findOne({ word: wordData.word });
      if (existingWord) {
        return { success: false, error: 'Word already exists' };
      }

      // Add timestamps
      const wordWithTimestamps = {
        ...wordData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await collection.insertOne(wordWithTimestamps);
      console.log(`✅ Word saved: ${wordData.word}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Error saving word ${wordData.word}:`, error);
      return { success: false, error: error.message || 'Unknown error' };
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

  // Get words with pagination (original method)
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

  // NEW: Get words with date filtering and pagination
  static async getWordsWithDateFilter(
    page: number = 1,
    limit: number = 20,
    dateQuery: DateFilterQuery = {}
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getWordsCollection();

      console.log('🔍 Date query:', dateQuery);

      const words = await collection
        .find(dateQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(dateQuery);

      console.log(`📊 Found ${total} words with date filter`);

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
      console.error('❌ Error fetching words with date filter:', error);
      throw new Error(
        'Failed to fetch words with date filter: ' + (error?.message || 'Unknown error')
      );
    }
  }

  // Search words (original method)
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

  // NEW: Search words with date filtering
  static async searchWordsWithDateFilter(
    query: string,
    dateQuery: DateFilterQuery = {}
  ): Promise<WordData[]> {
    try {
      const collection = await this.getWordsCollection();

      // Combine search query with date filter
      const searchFilter = {
        $and: [
          {
            $or: [
              { word: { $regex: query, $options: 'i' } },
              { vietnamese: { $regex: query, $options: 'i' } },
              { 'meanings.definition': { $regex: query, $options: 'i' } },
            ],
          },
          dateQuery,
        ],
      };

      console.log('🔍 Search with date filter:', JSON.stringify(searchFilter, null, 2));

      const words = await collection
        .find(searchFilter)
        .sort({ createdAt: -1 })
        .limit(50) // Increased limit for search results
        .toArray();

      console.log(`📊 Found ${words.length} words with search + date filter`);

      return words;
    } catch (error: any) {
      console.error('❌ Error searching words with date filter:', error);
      throw new Error(
        'Failed to search words with date filter: ' + (error?.message || 'Unknown error')
      );
    }
  }

  // Get word by name
  static async getWordByName(word: string): Promise<WordData | null> {
    try {
      const collection = await this.getWordsCollection();
      const result = await collection.findOne({ word: word.toLowerCase() });
      return result;
    } catch (error: any) {
      console.error('Error finding word:', error);
      throw new Error('Failed to find word: ' + (error?.message || 'Unknown error'));
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

  // Get statistics (original method)
  static async getStatistics(): Promise<Statistics> {
    try {
      const collection = await this.getWordsCollection();

      const total = await collection.countDocuments({});

      // Today's words
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayWords = await collection.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      // This week's words
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekWords = await collection.countDocuments({
        createdAt: { $gte: startOfWeek },
      });

      return {
        totalWords: total,
        todayWords,
        weekWords,
      };
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      throw new Error('Failed to get statistics: ' + (error?.message || 'Unknown error'));
    }
  }

  // NEW: Get detailed date statistics
  static async getWordDateStatistics(): Promise<DateStats> {
    try {
      const collection = await this.getWordsCollection();
      const now = new Date();

      // Total words
      const total = await collection.countDocuments({});

      // Today's words
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const today = await collection.countDocuments({
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      });

      // This week's words (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      const week = await collection.countDocuments({
        createdAt: { $gte: startOfWeek, $lt: endOfWeek },
      });

      // This month's words
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const month = await collection.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      });

      // Recent days statistics (last 7 days)
      const recentDays: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const count = await collection.countDocuments({
          createdAt: { $gte: startOfDay, $lt: endOfDay },
        });

        recentDays.push({
          date: startOfDay.toISOString().split('T')[0], // YYYY-MM-DD format
          count,
        });
      }

      console.log('📊 Date statistics:', { total, today, week, month });

      return {
        total,
        today,
        week,
        month,
        recentDays,
      };
    } catch (error: any) {
      console.error('❌ Error getting date statistics:', error);
      throw new Error('Failed to get date statistics: ' + (error?.message || 'Unknown error'));
    }
  }
}

export { DatabaseManager };
export type {
  WordData,
  WordMeaning,
  SaveResult,
  SaveWordsResult,
  PaginationResult,
  Statistics,
  DateStats,
  DateFilterQuery,
};
