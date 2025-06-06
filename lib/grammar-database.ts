const { MongoClient, ServerApiVersion } = require('mongodb');

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://DzungVu:dungvu26@cluster0.obujmgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'newword';

interface GrammarStructure {
  id: string;
  name: string;
  type: string; // causative, conditional, modal, etc.
  description: string;
  structure: string;
  usage: string[];
  examples: Array<{
    sentence: string;
    meaning: string;
    highlight?: string; // phần cần highlight trong câu
  }>;
  relatedStructures?: string[]; // liên kết với các cấu trúc khác
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
}

interface GrammarProcessResult {
  success: number;
  errors: Array<{ grammar: string; error: string }>;
  results: GrammarStructure[];
}

class GrammarDatabaseManager {
  private static client: any;
  private static clientPromise: any;

  static async getClient() {
    if (!this.clientPromise) {
      this.client = new MongoClient(uri, {
        serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      });
      this.clientPromise = this.client.connect();
    }
    return this.clientPromise;
  }

  static async saveGrammarStructures(
    structures: GrammarStructure[]
  ): Promise<{ success: number; errors: Array<{ grammar: string; error: string }> }> {
    const client = await this.getClient();
    const db = client.db(dbName);
    const collection = db.collection('grammar_structures');

    let success = 0;
    const errors: Array<{ grammar: string; error: string }> = [];

    for (const structure of structures) {
      try {
        await collection.replaceOne(
          { id: structure.id },
          { ...structure, updatedAt: new Date() },
          { upsert: true }
        );
        success++;
      } catch (error: any) {
        errors.push({
          grammar: structure.name,
          error: error.message || 'Database save failed',
        });
      }
    }

    return { success, errors };
  }

  static async getGrammarStructures(page = 1, limit = 20) {
    const client = await this.getClient();
    const db = client.db(dbName);
    const collection = db.collection('grammar_structures');

    const skip = (page - 1) * limit;

    const [structures, total] = await Promise.all([
      collection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments({}),
    ]);

    return {
      structures,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async searchGrammarStructures(query: string) {
    const client = await this.getClient();
    const db = client.db(dbName);
    const collection = db.collection('grammar_structures');

    return await collection
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { type: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
      })
      .toArray();
  }

  static async getGrammarStatistics() {
    const client = await this.getClient();
    const db = client.db(dbName);
    const collection = db.collection('grammar_structures');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalStructures, todayStructures, weekStructures, byTypeAgg, byLevelAgg] =
      await Promise.all([
        collection.countDocuments({}),
        collection.countDocuments({ createdAt: { $gte: today } }),
        collection.countDocuments({ createdAt: { $gte: weekAgo } }),
        collection.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]).toArray(),
        collection.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]).toArray(),
      ]);

    const byType = byTypeAgg.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const byLevel = byLevelAgg.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      totalStructures,
      todayStructures,
      weekStructures,
      byType,
      byLevel,
    };
  }
}

export { GrammarDatabaseManager, type GrammarStructure, type GrammarProcessResult };
