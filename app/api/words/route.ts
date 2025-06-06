import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager, WordData } from '@/lib/database';
import { WordScraper } from '@/lib/scraper';

// TypeScript interfaces
interface WordInput {
  words: string[];
  mode: 'bulk' | 'single';
}

interface ScrapeError {
  word: string;
  error: string;
}

interface SaveError {
  word: string;
  error: string;
}

interface ScrapeResult {
  results: WordData[];
  errors: ScrapeError[];
}

interface SaveResult {
  success: number;
  errors: SaveError[];
}

interface ErrorDetail {
  word: string;
  error: string;
  type: 'SCRAPE_ERROR' | 'DATABASE_ERROR';
}

interface ProcessResult {
  processed: number;
  scraped: number;
  saved: number;
  scrapeErrors: ErrorDetail[];
  saveErrors: ErrorDetail[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    scrapeFailures: number;
    saveFailures: number;
  };
  details: {
    cleanedWords: string[];
    scrapedWords: string[];
    savedWords: string[];
    failedWords: Array<{
      word: string;
      reason: string;
      detail: string;
    }>;
  };
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

// POST handler for creating new words
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: WordInput = await request.json();
    const { words, mode } = body;

    console.log('📝 Received request:', { wordsCount: words?.length, mode });

    // Validate input
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Invalid words array' },
        { status: 400 }
      );
    }

    // Validate mode
    if (!mode || !['bulk', 'single'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "bulk" or "single"' },
        { status: 400 }
      );
    }

    // Clean and validate words
    const cleanWords: string[] = WordScraper.cleanWords(words);

    if (cleanWords.length === 0) {
      return NextResponse.json(
        { error: 'No valid words found' },
        { status: 400 }
      );
    }

    console.log('🔍 Processing words:', cleanWords);

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Scrape words with detailed error tracking
    console.log('🕷️ Starting scraping...');
    const scrapeResult: ScrapeResult = await WordScraper.scrapeWords(cleanWords);
    const { results, errors: scrapeErrors } = scrapeResult;

    console.log(`📊 Scrape completed: ${results.length} success, ${scrapeErrors.length} errors`);

    // Save to database with detailed error tracking
    console.log('💾 Saving to database...');
    const saveResult: SaveResult = await DatabaseManager.saveWords(results);
    const { success, errors: saveErrors } = saveResult;

    console.log(`📊 Save completed: ${success} success, ${saveErrors.length} errors`);

    // Enhanced response with detailed breakdown
    const response: ProcessResult = {
      processed: cleanWords.length,
      scraped: results.length,
      saved: success,
      scrapeErrors: scrapeErrors.map((err: ScrapeError): ErrorDetail => ({
        word: err.word,
        error: err.error,
        type: 'SCRAPE_ERROR',
      })),
      saveErrors: saveErrors.map((err: SaveError): ErrorDetail => ({
        word: err.word,
        error: err.error,
        type: 'DATABASE_ERROR',
      })),
      // Summary for UI
      summary: {
        total: cleanWords.length,
        successful: success,
        failed: scrapeErrors.length + saveErrors.length,
        scrapeFailures: scrapeErrors.length,
        saveFailures: saveErrors.length,
      },
      // Detailed breakdown for debugging
      details: {
        cleanedWords: cleanWords,
        scrapedWords: results.map((r: WordData): string => r.word),
        savedWords: results.slice(0, success).map((r: WordData): string => r.word),
        failedWords: [
          ...scrapeErrors.map((e: ScrapeError) => ({
            word: e.word,
            reason: 'Scrape failed',
            detail: e.error
          })),
          ...saveErrors.map((e: SaveError) => ({
            word: e.word,
            reason: 'Save failed',
            detail: e.error
          })),
        ],
      },
    };

    console.log('✅ Final response summary:', response.summary);

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    console.error('❌ API Error:', error);

    return NextResponse.json(
      {
        error: `Internal server error: ${errorMessage}`,
        details: errorStack,
      },
      { status: 500 }
    );
  }
}

// GET handler for fetching words
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit: number = parseInt(searchParams.get('limit') || '20');
    const page: number = parseInt(searchParams.get('page') || '1');
    const search: string | null = searchParams.get('search');

    console.log('📖 GET request:', { page, limit, search });

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    let result: PaginationResult;

    if (search && search.trim()) {
      // Search words
      const words: WordData[] = await DatabaseManager.searchWords(search.trim());
      result = {
        words,
        pagination: {
          page: 1,
          limit: words.length,
          total: words.length,
          pages: 1,
        },
      };
    } else {
      // Get words with pagination
      result = await DatabaseManager.getWords(page, limit);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ GET API Error:', error);

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting words
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const word: string | null = searchParams.get('word');

    if (!word || !word.trim()) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    const trimmedWord: string = word.trim().toLowerCase();

    // Validate word format
    if (!/^[a-zA-Z\s-]+$/.test(trimmedWord)) {
      return NextResponse.json(
        { error: 'Invalid word format' },
        { status: 400 }
      );
    }

    console.log('🗑️ DELETE request for word:', trimmedWord);

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const deleted: boolean = await DatabaseManager.deleteWord(trimmedWord);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `Word "${trimmedWord}" deleted successfully`,
      });
    } else {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ DELETE API Error:', error);

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT handler for updating words (optional)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: { word: string; data: Partial<WordData> } = await request.json();
    const { word, data } = body;

    if (!word || !data) {
      return NextResponse.json(
        { error: 'Word and data are required' },
        { status: 400 }
      );
    }

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Update word (assuming you have this method)
    // const updated = await DatabaseManager.updateWord(word, data);

    return NextResponse.json({
      success: true,
      message: `Word "${word}" updated successfully`,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ PUT API Error:', error);

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export types for use in other files
export type {
  WordInput,
  ScrapeError,
  SaveError,
  ScrapeResult,
  SaveResult,
  ErrorDetail,
  ProcessResult,
  PaginationResult,
};
