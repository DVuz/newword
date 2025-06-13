import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager, WordData, UserInfo } from '@/lib/database';
import { WordScraper } from '@/lib/scraper';
import { AuthMiddleware, AuthenticatedUser } from '@/lib/auth';

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
  // ✅ NEW: User info in response
  user: {
    userId: string;
    userName: string;
    userEmail: string;
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

// ✅ UPDATED: POST handler with authentication
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ✅ Authenticate user
    let authenticatedUser: AuthenticatedUser;
    try {
      authenticatedUser = await AuthMiddleware.authenticateRequest(request);
      console.log('🔐 Authenticated user:', authenticatedUser.userName);
    } catch (authError: any) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: authError.message,
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body: WordInput = await request.json();
    const { words, mode } = body;

    console.log('📝 Received request from user:', {
      userId: authenticatedUser.userId,
      userName: authenticatedUser.userName,
      wordsCount: words?.length,
      mode,
    });

    // Validate input
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'Invalid words array' }, { status: 400 });
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
      return NextResponse.json({ error: 'No valid words found' }, { status: 400 });
    }

    console.log('🔍 Processing words for user:', authenticatedUser.userName, cleanWords);

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ✅ Create user info for database
    const userInfo: UserInfo = AuthMiddleware.createUserInfo(authenticatedUser);

    // Scrape words with detailed error tracking
    console.log('🕷️ Starting scraping...');
    const scrapeResult = await WordScraper.scrapeWords(cleanWords);
    const { results: scrapedResults, errors: scrapeErrors } = scrapeResult;

    // Add user info to scraped results to match database WordData type
    const results: WordData[] = scrapedResults.map(word => ({
      ...word,
      addedBy: userInfo
    }));

    console.log(`📊 Scrape completed: ${results.length} success, ${scrapeErrors.length} errors`);

    // ✅ Save to database with user info
    console.log('💾 Saving to database with user info...');
    const saveResult: SaveResult = await DatabaseManager.saveWords(results, userInfo);
    const { success, errors: saveErrors } = saveResult;

    console.log(
      `📊 Save completed for ${authenticatedUser.userName}: ${success} success, ${saveErrors.length} errors`
    );

    // Enhanced response with user info
    const response: ProcessResult = {
      processed: cleanWords.length,
      scraped: results.length,
      saved: success,
      scrapeErrors: scrapeErrors.map(
        (err: ScrapeError): ErrorDetail => ({
          word: err.word,
          error: err.error,
          type: 'SCRAPE_ERROR',
        })
      ),
      saveErrors: saveErrors.map(
        (err: SaveError): ErrorDetail => ({
          word: err.word,
          error: err.error,
          type: 'DATABASE_ERROR',
        })
      ),
      summary: {
        total: cleanWords.length,
        successful: success,
        failed: scrapeErrors.length + saveErrors.length,
        scrapeFailures: scrapeErrors.length,
        saveFailures: saveErrors.length,
      },
      details: {
        cleanedWords: cleanWords,
        scrapedWords: results.map((r: WordData): string => r.word),
        savedWords: results.slice(0, success).map((r: WordData): string => r.word),
        failedWords: [
          ...scrapeErrors.map((e: ScrapeError) => ({
            word: e.word,
            reason: 'Scrape failed',
            detail: e.error,
          })),
          ...saveErrors.map((e: SaveError) => ({
            word: e.word,
            reason: 'Save failed',
            detail: e.error,
          })),
        ],
      },
      // ✅ Include user info in response
      user: {
        userId: authenticatedUser.userId,
        userName: authenticatedUser.userName,
        userEmail: authenticatedUser.userEmail,
      },
    };

    console.log('✅ Final response summary for', authenticatedUser.userName, ':', response.summary);

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

// ✅ UPDATED: GET handler with optional user filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit: number = parseInt(searchParams.get('limit') || '20');
    const page: number = parseInt(searchParams.get('page') || '1');
    const search: string | null = searchParams.get('search');
    const onlyMyWords: boolean = searchParams.get('onlyMyWords') === 'true';

    console.log('📖 GET request:', { page, limit, search, onlyMyWords });

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // Get user info if filtering by user
    let userId: string | undefined;
    if (onlyMyWords) {
      try {
        const authenticatedUser = await AuthMiddleware.authenticateRequest(request);
        userId = authenticatedUser.userId;
        console.log('👤 Filtering words for user:', authenticatedUser.userName);
      } catch (authError: any) {
        return NextResponse.json(
          {
            error: 'Unauthorized - cannot filter by user without authentication',
            details: authError.message,
          },
          { status: 401 }
        );
      }
    }

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let result: PaginationResult;

    if (search && search.trim()) {
      // Search words with optional user filtering
      const words: WordData[] = await DatabaseManager.searchWords(search.trim(), userId);
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
      // Get words with pagination and optional user filtering
      result = await DatabaseManager.getWords(page, limit, userId);
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        filteredByUser: !!userId,
        userId: userId || null,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ GET API Error:', error);

    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// ✅ UPDATED: DELETE handler with user ownership check
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // ✅ Authenticate user
    let authenticatedUser: AuthenticatedUser;
    try {
      authenticatedUser = await AuthMiddleware.authenticateRequest(request);
    } catch (authError: any) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: authError.message,
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const word: string | null = searchParams.get('word');

    if (!word || !word.trim()) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    const trimmedWord: string = word.trim().toLowerCase();

    // Validate word format
    if (!/^[a-zA-Z\s-]+$/.test(trimmedWord)) {
      return NextResponse.json({ error: 'Invalid word format' }, { status: 400 });
    }

    console.log('🗑️ DELETE request for word:', trimmedWord, 'by user:', authenticatedUser.userName);

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ✅ Delete only if user owns the word
    const deleted: boolean = await DatabaseManager.deleteWord(
      trimmedWord,
      authenticatedUser.userId
    );

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `Word "${trimmedWord}" deleted successfully`,
        user: authenticatedUser.userName,
      });
    } else {
      return NextResponse.json(
        { error: 'Word not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ DELETE API Error:', error);

    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// Export types
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
