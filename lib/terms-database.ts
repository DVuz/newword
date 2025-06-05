const { MongoClient, ServerApiVersion } = require('mongodb');

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://DzungVu:dungvu26@cluster0.obujmgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'newword';

// Reuse connection from main database
let client: any;
let clientPromise: any;

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

interface ProgrammingTerm {
  word: string;
  phonetic: string;
  audio_url: string;
  part_of_speech: string;
  definition_en: string;
  definition_vi: string;
  example: string;
  category: string;
  difficulty: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface SaveTermsResult {
  success: number;
  errors: Array<{ word: string; error: string }>;
}

interface PaginationResult {
  terms: ProgrammingTerm[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface TermsStatistics {
  totalTerms: number;
  todayTerms: number;
  weekTerms: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
}

class TermsDatabaseManager {
  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const client = await clientPromise;
      await client.db('admin').command({ ping: 1 });
      console.log('✅ Terms Database connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ Terms Database connection failed:', error);
      return false;
    }
  }

  // Get database instance
  static async getDatabase() {
    const client = await clientPromise;
    return client.db(dbName);
  }

  // Get terms collection
  static async getTermsCollection() {
    const db = await this.getDatabase();
    return db.collection('termscoding'); // Collection riêng cho programming terms
  }

  // Save single programming term
  static async saveTerm(termData: ProgrammingTerm): Promise<SaveResult> {
    try {
      const collection = await this.getTermsCollection();

      const existing = await collection.findOne({ word: termData.word });

      if (existing) {
        await collection.updateOne(
          { word: termData.word },
          {
            $set: {
              ...termData,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Updated programming term: ${termData.word}`);
      } else {
        await collection.insertOne(termData);
        console.log(`Inserted programming term: ${termData.word}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`Error saving programming term ${termData.word}:`, error?.message);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  // Save multiple programming terms
  static async saveTerms(terms: ProgrammingTerm[]): Promise<SaveTermsResult> {
    let success = 0;
    const errors: Array<{ word: string; error: string }> = [];

    for (const termData of terms) {
      const result = await this.saveTerm(termData);
      if (result.success) {
        success++;
      } else {
        errors.push({
          word: termData.word,
          error: result.error || 'Unknown error',
        });
      }
    }

    return { success, errors };
  }

  // Get programming terms with pagination
  static async getTerms(page: number = 1, limit: number = 20): Promise<PaginationResult> {
    try {
      const collection = await this.getTermsCollection();

      const terms = await collection
        .find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments({});

      return {
        terms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error fetching programming terms:', error);
      throw new Error('Failed to fetch programming terms: ' + (error?.message || 'Unknown error'));
    }
  }

  // Search programming terms
  static async searchTerms(query: string): Promise<ProgrammingTerm[]> {
    try {
      const collection = await this.getTermsCollection();

      const terms = await collection
        .find({
          $or: [
            { word: { $regex: query, $options: 'i' } },
            { definition_en: { $regex: query, $options: 'i' } },
            { definition_vi: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
            { example: { $regex: query, $options: 'i' } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

      return terms;
    } catch (error: any) {
      console.error('Error searching programming terms:', error);
      throw new Error('Failed to search programming terms: ' + (error?.message || 'Unknown error'));
    }
  }

  // Get terms by category
  static async getTermsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getTermsCollection();

      const terms = await collection
        .find({ category: { $regex: category, $options: 'i' } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments({
        category: { $regex: category, $options: 'i' },
      });

      return {
        terms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error fetching terms by category:', error);
      throw new Error('Failed to fetch terms by category: ' + (error?.message || 'Unknown error'));
    }
  }

  // Get terms by difficulty
  static async getTermsByDifficulty(
    difficulty: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult> {
    try {
      const collection = await this.getTermsCollection();

      const terms = await collection
        .find({ difficulty: { $regex: difficulty, $options: 'i' } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments({
        difficulty: { $regex: difficulty, $options: 'i' },
      });

      return {
        terms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error fetching terms by difficulty:', error);
      throw new Error(
        'Failed to fetch terms by difficulty: ' + (error?.message || 'Unknown error')
      );
    }
  }

  // Get programming term by name
  static async getTermByName(word: string): Promise<ProgrammingTerm | null> {
    try {
      const collection = await this.getTermsCollection();
      return await collection.findOne({ word: word.toLowerCase() });
    } catch (error: any) {
      console.error('Error getting programming term:', error);
      return null;
    }
  }

  // Delete programming term
  static async deleteTerm(word: string): Promise<boolean> {
    try {
      const collection = await this.getTermsCollection();
      const result = await collection.deleteOne({ word: word.toLowerCase() });
      return result.deletedCount > 0;
    } catch (error: any) {
      console.error('Error deleting programming term:', error);
      return false;
    }
  }

  // Get programming terms statistics
  static async getTermsStatistics(): Promise<TermsStatistics> {
    try {
      const collection = await this.getTermsCollection();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const [totalTerms, todayTerms, weekTerms, categoryStats, difficultyStats] = await Promise.all(
        [
          collection.countDocuments({}),
          collection.countDocuments({ createdAt: { $gte: today } }),
          collection.countDocuments({ createdAt: { $gte: weekAgo } }),
          collection
            .aggregate([
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ])
            .toArray(),
          collection
            .aggregate([
              { $group: { _id: '$difficulty', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ])
            .toArray(),
        ]
      );

      const byCategory: Record<string, number> = {};
      const byDifficulty: Record<string, number> = {};

      categoryStats.forEach((stat: any) => {
        byCategory[stat._id] = stat.count;
      });

      difficultyStats.forEach((stat: any) => {
        byDifficulty[stat._id] = stat.count;
      });

      return {
        totalTerms,
        todayTerms,
        weekTerms,
        byCategory,
        byDifficulty,
      };
    } catch (error: any) {
      console.error('Error getting programming terms statistics:', error);
      return {
        totalTerms: 0,
        todayTerms: 0,
        weekTerms: 0,
        byCategory: {},
        byDifficulty: {},
      };
    }
  }

  // Create indexes for better performance
  static async createIndexes(): Promise<void> {
    try {
      const collection = await this.getTermsCollection();

      await Promise.all([
        collection.createIndex({ word: 1 }, { unique: true }),
        collection.createIndex({ category: 1 }),
        collection.createIndex({ difficulty: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({
          word: 'text',
          definition_en: 'text',
          definition_vi: 'text',
          example: 'text',
        }),
      ]);

      console.log('✅ Programming terms indexes created successfully');
    } catch (error: any) {
      console.error('❌ Error creating programming terms indexes:', error);
    }
  }
}

export { TermsDatabaseManager, type ProgrammingTerm, type TermsStatistics };
