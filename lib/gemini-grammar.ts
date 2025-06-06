const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyAbpsNCZkGbMJCt1xQ7F-3QT_TFr9OsWeM'
);

interface GrammarStructure {
  id: string;
  name: string;
  type: string;
  description: string;
  structure: string;
  usage: string[];
  examples: Array<{
    sentence: string;
    meaning: string;
    highlight?: string;
  }>;
  relatedStructures?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: Date;
}

interface GrammarProcessResult {
  success: number;
  errors: Array<{ grammar: string; error: string }>;
  results: GrammarStructure[];
}

class GeminiGrammarProcessor {
  private static model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  static async processGrammarStructure(grammarInput: string): Promise<GrammarStructure> {
    try {
      console.log(`🔍 Processing grammar: ${grammarInput}`);

      const prompt = `
Phân tích cấu trúc ngữ pháp tiếng Anh "${grammarInput}" và trả về thông tin chi tiết theo format JSON sau:

{
  "id": "snake_case_id",
  "name": "Tên chính thức của cấu trúc",
  "type": "Loại ngữ pháp (causative, conditional, modal, tense, etc.)",
  "description": "Mô tả chi tiết khi nào và tại sao sử dụng cấu trúc này",
  "structure": "Công thức cấu trúc (ví dụ: have + someone + base verb)",
  "usage": [
    "Cách sử dụng 1",
    "Cách sử dụng 2",
    "Cách sử dụng 3"
  ],
  "examples": [
    {
      "sentence": "Câu ví dụ 1",
      "meaning": "Nghĩa tiếng Việt",
      "highlight": "phần cần highlight trong câu"
    },
    {
      "sentence": "Câu ví dụ 2",
      "meaning": "Nghĩa tiếng Việt",
      "highlight": "phần cần highlight trong câu"
    },
    {
      "sentence": "Câu ví dụ 3",
      "meaning": "Nghĩa tiếng Việt",
      "highlight": "phần cần highlight trong câu"
    }
  ],
  "relatedStructures": ["Cấu trúc liên quan 1", "Cấu trúc liên quan 2"],
  "level": "beginner/intermediate/advanced",
  "tags": ["tag1", "tag2", "tag3"]
}

Yêu cầu:
- Chỉ trả về JSON, không có text thêm
- Phân tích chính xác về mặt ngữ pháp
- Ví dụ phải thực tế, dễ hiểu
- Highlight chính xác phần cấu trúc trong câu
- Level phù hợp với độ phức tạp
- Tags hữu ích cho tìm kiếm
- ID phải unique và snake_case
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const data = JSON.parse(cleanText);

      // Validate required fields
      if (!data.name || !data.structure || !data.examples || data.examples.length === 0) {
        throw new Error('Invalid grammar structure data');
      }

      const grammarStructure: GrammarStructure = {
        id: data.id || this.generateId(data.name),
        name: data.name,
        type: data.type || 'general',
        description: data.description || '',
        structure: data.structure,
        usage: data.usage || [],
        examples: data.examples || [],
        relatedStructures: data.relatedStructures || [],
        level: data.level || 'intermediate',
        tags: data.tags || [],
        createdAt: new Date(),
      };

      console.log(`✅ Successfully processed: ${grammarInput}`);
      return grammarStructure;
    } catch (error: any) {
      console.error(`❌ Error processing grammar "${grammarInput}":`, error.message);
      throw new Error(`Failed to process grammar "${grammarInput}": ${error.message}`);
    }
  }

  static async processMultipleGrammarStructures(
    grammarInputs: string[]
  ): Promise<GrammarProcessResult> {
    const results: GrammarStructure[] = [];
    const errors: Array<{ grammar: string; error: string }> = [];

    console.log(`🚀 Processing ${grammarInputs.length} grammar structures...`);

    for (const grammar of grammarInputs) {
      try {
        const grammarData = await this.processGrammarStructure(grammar);
        results.push(grammarData);

        // Delay giữa các calls để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        errors.push({
          grammar,
          error: error.message || 'Processing failed',
        });
        console.error(`❌ Failed to process "${grammar}":`, error.message);
      }
    }

    return {
      success: results.length,
      errors,
      results,
    };
  }

  private static generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  static validateGrammarInputs(inputs: string[]): string[] {
    return inputs
      .map(input => input.trim())
      .filter(input => input && input.length > 2)
      .slice(0, 10); // Limit to 10 structures per batch
  }
}

export { GeminiGrammarProcessor, type GrammarStructure, type GrammarProcessResult };
