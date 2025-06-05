const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyAbpsNCZkGbMJCt1xQ7F-3QT_TFr9OsWeM'
);

interface ProgrammingTerm {
  word: string;
  phonetic: string;
  audio_url: string;
  part_of_speech: string;
  definition_en: string;
  definition_vi: string;
  example: string;
  category: string; // programming, web, mobile, database, etc.
  difficulty: string; // beginner, intermediate, advanced
  createdAt: Date;
}

interface ProcessResult {
  success: number;
  errors: Array<{ word: string; error: string }>;
  results: ProgrammingTerm[];
}

class GeminiTermsProcessor {
  private static model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  private static readonly PRONUNCIATION_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  private static readonly TIMEOUT = 10000;

  // Dịch một programming term với Gemini
  static async translateProgrammingTerm(
    word: string
  ): Promise<Omit<ProgrammingTerm, 'phonetic' | 'audio_url' | 'createdAt'>> {
    try {
      const prompt = `
Trả về thông tin chi tiết về programming term "${word}" theo format JSON sau:

{
  "word": "${word}",
  "part_of_speech": "Từ loại (noun, verb, adjective, etc.)",
  "definition_en": "Định nghĩa tiếng Anh ngắn gọn về thuật ngữ lập trình này (max 25 từ)",
  "definition_vi": "Định nghĩa tiếng Việt dễ hiểu về thuật ngữ lập trình này (max 30 từ)",
  "example": "1 câu ví dụ tiếng Anh trong context lập trình, đơn giản dễ hiểu",
  "category": "Phân loại: programming, web, mobile, database, algorithm, framework, language, etc.",
  "difficulty": "Mức độ: beginner, intermediate, advanced"
}

Yêu cầu:
- Chỉ trả về JSON, không có text thêm
- Định nghĩa phải chính xác về mặt kỹ thuật
- Ví dụ phải thực tế, có thể chạy được code
- Nếu không phải thuật ngữ lập trình, trả về null cho các field
- Focus vào programming context
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

      // Validate programming term
      if (!data.definition_en || !data.definition_vi || !data.category) {
        throw new Error('Invalid or non-programming term');
      }

      return {
        word: data.word.toLowerCase(),
        part_of_speech: data.part_of_speech || 'noun',
        definition_en: data.definition_en,
        definition_vi: data.definition_vi,
        example: data.example || '',
        category: data.category || 'programming',
        difficulty: data.difficulty || 'beginner',
      };
    } catch (error: any) {
      console.error(`❌ Gemini translation error for "${word}":`, error.message);
      throw new Error(`Failed to translate programming term "${word}": ${error.message}`);
    }
  }

  // Lấy pronunciation từ Dictionary API
  static async getPronunciation(word: string): Promise<{ phonetic: string; audio_url: string }> {
    try {
      const response = await axios.get(`${this.PRONUNCIATION_API}/${encodeURIComponent(word)}`, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const data = response.data[0];

      let phonetic = '';
      let audio_url = '';

      // Lấy phonetic đầu tiên có sẵn
      if (data.phonetic) {
        phonetic = data.phonetic;
      }

      // Tìm audio URL (ưu tiên US pronunciation)
      if (data.phonetics && Array.isArray(data.phonetics)) {
        const audioEntry = data.phonetics.find(
          (p: any) => p.audio && (p.audio.includes('-us.mp3') || p.audio.includes('.mp3'))
        );
        if (audioEntry) {
          audio_url = audioEntry.audio;
          if (audioEntry.text && !phonetic) {
            phonetic = audioEntry.text;
          }
        }
      }

      return {
        phonetic: phonetic || '',
        audio_url: audio_url || '',
      };
    } catch (error: any) {
      console.error(`❌ Pronunciation error for "${word}":`, error.message);
      return {
        phonetic: '',
        audio_url: '',
      };
    }
  }

  // Xử lý một programming term hoàn chỉnh
  static async processProgrammingTerm(word: string): Promise<ProgrammingTerm> {
    try {
      console.log(`🔍 Processing programming term: ${word}`);

      // Dịch term với Gemini
      const termData = await this.translateProgrammingTerm(word);

      // Lấy pronunciation
      const pronunciation = await this.getPronunciation(word);

      // Delay nhỏ giữa API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      const result: ProgrammingTerm = {
        ...termData,
        phonetic: pronunciation.phonetic,
        audio_url: pronunciation.audio_url,
        createdAt: new Date(),
      };

      console.log(`✅ Successfully processed: ${word}`);
      return result;
    } catch (error: any) {
      console.error(`❌ Error processing "${word}":`, error.message);
      throw error;
    }
  }

  // Xử lý nhiều programming terms
  static async processProgrammingTerms(words: string[]): Promise<ProcessResult> {
    const results: ProgrammingTerm[] = [];
    const errors: Array<{ word: string; error: string }> = [];

    console.log(`🚀 Processing ${words.length} programming terms...`);

    for (const word of words) {
      try {
        const termData = await this.processProgrammingTerm(word);
        results.push(termData);

        // Delay giữa các terms để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error: any) {
        errors.push({
          word,
          error: error.message || 'Processing failed',
        });
        console.error(`❌ Failed to process "${word}":`, error.message);
      }
    }

    return {
      success: results.length,
      errors,
      results,
    };
  }

  // Validate programming terms
  static validateProgrammingTerms(words: string[]): string[] {
    return words
      .map(w => w.trim().toLowerCase())
      .filter(w => w && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(w)) // Allow programming naming conventions
      .slice(0, 20); // Limit to 20 terms per batch for performance
  }

  // Check if term is programming-related (basic validation)
  static isProgrammingTerm(word: string): boolean {
    const programmingKeywords = [
      'declare',
    ];

    const word_lower = word.toLowerCase();
    return programmingKeywords.some(
      keyword => word_lower.includes(keyword) || keyword.includes(word_lower)
    );
  }
}

export { GeminiTermsProcessor, type ProgrammingTerm, type ProcessResult };
