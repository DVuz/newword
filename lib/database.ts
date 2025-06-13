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

// Enhanced interfaces for user-based words
interface WordMeaning {
  partOfSpeech: string;
  definition: string;
  examples: string[];
  vietnamese?: string;
}

interface UserInfo {
  userId: string;
  userEmail: string;
  userName: string;
  addedAt: Date;
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
  // ✅ NEW: User information
  addedBy: UserInfo;
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
  userWords?: number; // Words added by specific user
}

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
  'addedBy.userId'?: string; // ✅ NEW: Filter by user
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

  // ✅ UPDATED: Save single word with user info
  static async saveWord(wordData: WordData, userInfo: UserInfo): Promise<SaveResult> {
    try {
      const collection = await this.getWordsCollection();

      // ✅ NEW: Allow duplicate words for different users
      // Check if this specific user already has this word
      const existingWord = await collection.findOne({
        word: wordData.word.toLowerCase(),
        'addedBy.userId': userInfo.userId,
      });

      if (existingWord) {
        return { success: false, error: 'Bạn đã thêm từ này rồi' };
      }

      // Add user info and timestamps
      const wordWithUserInfo = {
        ...wordData,
        word: wordData.word.toLowerCase(), // Normalize word
        addedBy: {
          ...userInfo,
          addedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await collection.insertOne(wordWithUserInfo);
      console.log(`✅ Word saved by ${userInfo.userName}: ${wordData.word}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Error saving word ${wordData.word}:`, error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // ✅ UPDATED: Save multiple words with user info
  static async saveWords(words: WordData[], userInfo: UserInfo): Promise<SaveWordsResult> {
    let success = 0;
    const errors: Array<{ word: string; error: string }> = [];

    for (const wordData of words) {
      const result = await this.saveWord(wordData, userInfo);
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

  // ✅ UPDATED: Get words with user filtering
  static async getWords(
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getWordsCollection();

      // Build query filter
      const filter = userId ? { 'addedBy.userId': userId } : {};

      const words = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(filter);

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

  // ✅ UPDATED: Get words with date filtering and user filtering
  static async getWordsWithDateFilter(
    page: number = 1,
    limit: number = 20,
    dateQuery: DateFilterQuery = {}
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getWordsCollection();

      console.log('🔍 Date + User query:', dateQuery);

      const words = await collection
        .find(dateQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(dateQuery);

      console.log(`📊 Found ${total} words with date + user filter`);

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

  // ✅ UPDATED: Search words with user filtering
  static async searchWords(query: string, userId?: string): Promise<WordData[]> {
    try {
      const collection = await this.getWordsCollection();

      // Build search filter
      const searchConditions = [
        { word: { $regex: query, $options: 'i' } },
        { vietnamese: { $regex: query, $options: 'i' } },
        { 'meanings.definition': { $regex: query, $options: 'i' } },
      ];

      const filter: any = { $or: searchConditions };

      // Add user filter if provided
      if (userId) {
        filter['addedBy.userId'] = userId;
      }

      const words = await collection.find(filter).sort({ createdAt: -1 }).limit(20).toArray();

      return words;
    } catch (error: any) {
      console.error('Error searching words:', error);
      throw new Error('Failed to search words: ' + (error?.message || 'Unknown error'));
    }
  }

  // ✅ UPDATED: Search words with date and user filtering
  static async searchWordsWithDateFilter(
    query: string,
    dateQuery: DateFilterQuery = {}
  ): Promise<WordData[]> {
    try {
      const collection = await this.getWordsCollection();

      // Combine search query with date/user filter
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

      console.log('🔍 Search with date + user filter:', JSON.stringify(searchFilter, null, 2));

      const words = await collection.find(searchFilter).sort({ createdAt: -1 }).limit(50).toArray();

      console.log(`📊 Found ${words.length} words with search + date + user filter`);

      return words;
    } catch (error: any) {
      console.error('❌ Error searching words with date filter:', error);
      throw new Error(
        'Failed to search words with date filter: ' + (error?.message || 'Unknown error')
      );
    }
  }

  // ✅ UPDATED: Get word by name and user (optional)
  static async getWordByName(word: string, userId?: string): Promise<WordData | null> {
    try {
      const collection = await this.getWordsCollection();

      const filter: any = { word: word.toLowerCase() };
      if (userId) {
        filter['addedBy.userId'] = userId;
      }

      const result = await collection.findOne(filter);
      return result;
    } catch (error: any) {
      console.error('Error finding word:', error);
      throw new Error('Failed to find word: ' + (error?.message || 'Unknown error'));
    }
  }

  // ✅ UPDATED: Delete word (only if user owns it)
  static async deleteWord(word: string, userId: string): Promise<boolean> {
    try {
      const collection = await this.getWordsCollection();
      const result = await collection.deleteOne({
        word: word.toLowerCase(),
        'addedBy.userId': userId,
      });
      return result.deletedCount > 0;
    } catch (error: any) {
      console.error('Error deleting word:', error);
      return false;
    }
  }

  // ✅ UPDATED: Get statistics with user filtering
  static async getStatistics(userId?: string): Promise<Statistics> {
    try {
      const collection = await this.getWordsCollection();

      // Build base filter
      const baseFilter = userId ? { 'addedBy.userId': userId } : {};

      const total = await collection.countDocuments(baseFilter);

      // Today's words
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayFilter = {
        ...baseFilter,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      };
      const todayWords = await collection.countDocuments(todayFilter);

      // This week's words
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekFilter = {
        ...baseFilter,
        createdAt: { $gte: startOfWeek },
      };
      const weekWords = await collection.countDocuments(weekFilter);

      const result: Statistics = {
        totalWords: total,
        todayWords,
        weekWords,
      };

      // Add user-specific stats if userId provided
      if (userId) {
        result.userWords = total;
      }

      return result;
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      throw new Error('Failed to get statistics: ' + (error?.message || 'Unknown error'));
    }
  }

  // ✅ UPDATED: Get detailed date statistics with user filtering
  static async getWordDateStatistics(userId?: string): Promise<DateStats> {
    try {
      const collection = await this.getWordsCollection();
      const now = new Date();

      // Build base filter
      const baseFilter = userId ? { 'addedBy.userId': userId } : {};

      // Total words
      const total = await collection.countDocuments(baseFilter);

      // Today's words
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const today = await collection.countDocuments({
        ...baseFilter,
        createdAt: { $gte: startOfToday, $lt: endOfToday },
      });

      // This week's words
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      const week = await collection.countDocuments({
        ...baseFilter,
        createdAt: { $gte: startOfWeek, $lt: endOfWeek },
      });

      // This month's words
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const month = await collection.countDocuments({
        ...baseFilter,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      });

      // Recent days statistics
      const recentDays: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const count = await collection.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfDay, $lt: endOfDay },
        });

        recentDays.push({
          date: startOfDay.toISOString().split('T')[0],
          count,
        });
      }

      console.log('📊 Date statistics for user:', userId, { total, today, week, month });

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

  // ✅ NEW: Get user's word statistics
  static async getUserWordStats(userId: string): Promise<{
    totalWords: number;
    todayWords: number;
    weekWords: number;
    monthWords: number;
    firstWordDate: Date | null;
    lastWordDate: Date | null;
  }> {
    try {
      const collection = await this.getWordsCollection();
      const now = new Date();

      const baseFilter = { 'addedBy.userId': userId };

      // Get date ranges
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get counts
      const [totalWords, todayWords, weekWords, monthWords] = await Promise.all([
        collection.countDocuments(baseFilter),
        collection.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfToday, $lt: endOfToday },
        }),
        collection.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfWeek },
        }),
        collection.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfMonth },
        }),
      ]);

      // Get first and last word dates
      const firstWord = await collection.findOne(baseFilter, { sort: { createdAt: 1 } });
      const lastWord = await collection.findOne(baseFilter, { sort: { createdAt: -1 } });

      return {
        totalWords,
        todayWords,
        weekWords,
        monthWords,
        firstWordDate: firstWord?.createdAt || null,
        lastWordDate: lastWord?.createdAt || null,
      };
    } catch (error: any) {
      console.error('❌ Error getting user word stats:', error);
      throw error;
    }
  }
  static async getWordsWithUserFilter(
    page: number = 1,
    limit: number = 20,
    userId?: string,
    dateQuery: DateFilterQuery = {}
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getWordsCollection();

      // Build query with user filter if provided
      let query: any = { ...dateQuery };

      if (userId) {
        query['addedBy.userId'] = userId;
      }

      console.log('🔍 Database query:', query);

      // Count total documents
      const total = await collection.countDocuments(query);

      // Calculate pagination
      const skip = (page - 1) * limit;
      const pages = Math.ceil(total / limit);

      // Fetch words
      const words = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return {
        words: words.map((word: any) => ({
          ...word,
          _id: word._id.toString(),
        })),
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      };
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  // ✅ NEW: Search words with user filtering
  static async searchWordsWithUserFilter(
    searchTerm: string,
    userId?: string,
    dateQuery: DateFilterQuery = {}
  ): Promise<WordData[]> {
    try {
      const collection = await this.getWordsCollection();

      // Build search query
      const searchQuery = {
        $or: [
          { word: { $regex: searchTerm, $options: 'i' } },
          { vietnamese: { $regex: searchTerm, $options: 'i' } },
          { 'meanings.definition': { $regex: searchTerm, $options: 'i' } },
          { 'meanings.vietnamese': { $regex: searchTerm, $options: 'i' } },
        ],
      };

      // Combine with date and user filters
      let query: any = { $and: [searchQuery, dateQuery] };

      if (userId) {
        query.$and.push({ 'addedBy.userId': userId });
      }

      console.log('🔍 Search query:', query);

      const words = await collection.find(query).sort({ createdAt: -1 }).toArray();

      return words.map((word: any) => ({
        ...word,
        _id: word._id.toString(),
      }));
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }

  // ✅ NEW: Get date statistics for specific user
  static async getWordDateStatisticsForUser(userId?: string): Promise<DateStats> {
    try {
      const collection = await this.getWordsCollection();

      // Build base query with user filter
      let baseQuery: any = {};
      if (userId) {
        baseQuery['addedBy.userId'] = userId;
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get counts for different time periods
      const [today, week, month, total] = await Promise.all([
        collection.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfToday },
        }),
        collection.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfWeek },
        }),
        collection.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfMonth },
        }),
        collection.countDocuments(baseQuery),
      ]);

      // Get recent days data (last 7 days)
      const recentDaysData = await collection
        .aggregate([
          {
            $match: {
              ...baseQuery,
              createdAt: { $gte: startOfWeek },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ])
        .toArray();

      const recentDays = recentDaysData.map((item: { _id: string; count: number }) => ({
        date: item._id,
        count: item.count,
      }));

      return {
        today,
        week,
        month,
        total,
        recentDays,
      };
    } catch (error) {
      console.error('❌ Statistics error:', error);
      throw error;
    }
  }
  static async getWordsForUser(
    page: number = 1,
    limit: number = 20,
    userId: string,
    userRole: string,
    dateQuery: DateFilterQuery = {}
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getWordsCollection();

      let query: any = { ...dateQuery };

      // Admin gets all words (including words without addedBy)
      if (userRole === 'admin') {
        // Admin sees all words - no additional filter needed
        console.log('🔐 Admin access: fetching all words');
      } else {
        // Regular users only see their own words
        query['addedBy.userId'] = userId;
        console.log('👤 User access: fetching only user words for', userId);
      }

      console.log('🔍 Database query:', query);

      const words = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(query);

      return {
        words: words.map((word: any) => ({
          ...word,
          _id: word._id.toString(),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  // ✅ NEW: Search words with smart filtering
  static async searchWordsForUser(
    searchTerm: string,
    userId: string,
    userRole: string,
    dateQuery: DateFilterQuery = {}
  ): Promise<WordData[]> {
    try {
      const collection = await this.getWordsCollection();

      // Build search query
      const searchQuery = {
        $or: [
          { word: { $regex: searchTerm, $options: 'i' } },
          { vietnamese: { $regex: searchTerm, $options: 'i' } },
          { 'meanings.definition': { $regex: searchTerm, $options: 'i' } },
          { 'meanings.vietnamese': { $regex: searchTerm, $options: 'i' } },
        ],
      };

      let query: any = { $and: [searchQuery, dateQuery] };

      // Admin gets all words, users get only their words
      if (userRole !== 'admin') {
        query.$and.push({ 'addedBy.userId': userId });
      }

      console.log('🔍 Search query:', query);

      const words = await collection.find(query).sort({ createdAt: -1 }).toArray();

      return words.map((word: any) => ({
        ...word,
        _id: word._id.toString(),
      }));
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }

  // ✅ NEW: Get date statistics with smart filtering
  static async getDateStatisticsForUser(userId: string, userRole: string): Promise<DateStats> {
    try {
      const collection = await this.getWordsCollection();

      // Build base query
      let baseQuery: any = {};
      if (userRole !== 'admin') {
        baseQuery['addedBy.userId'] = userId;
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get counts for different time periods
      const [today, week, month, total] = await Promise.all([
        collection.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfToday },
        }),
        collection.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfWeek },
        }),
        collection.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfMonth },
        }),
        collection.countDocuments(baseQuery),
      ]);

      // Get recent days data (last 7 days)
      const recentDaysData = await collection
        .aggregate([
          {
            $match: {
              ...baseQuery,
              createdAt: { $gte: startOfWeek },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ])
        .toArray();

      const recentDays = recentDaysData.map((item: { _id: string; count: number }) => ({
        date: item._id,
        count: item.count,
      }));

      return {
        today,
        week,
        month,
        total,
        recentDays,
      };
    } catch (error) {
      console.error('❌ Statistics error:', error);
      throw error;
    }
  }
}

export { DatabaseManager };
export type {
  WordData,
  WordMeaning,
  UserInfo,
  SaveResult,
  SaveWordsResult,
  PaginationResult,
  Statistics,
  DateStats,
  DateFilterQuery,
};
