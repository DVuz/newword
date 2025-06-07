import { NextRequest, NextResponse } from 'next/server';
const { DatabaseManager } = require('@/lib/database');

// TypeScript interfaces for better type safety
interface SearchParams {
  limit: number;
  page: number;
  search: string | null;
  dateFilter: string | null;
  specificDate: string | null;
}

interface DateQuery {
  createdAt?: {
    $gte: Date;
    $lt: Date;
  };
}

interface WordData {
  _id: string;
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
  meanings: Array<{
    partOfSpeech: string;
    definition: string;
    examples: string[];
    vietnamese?: string;
  }>;
  vietnamese: string;
  createdAt: Date;
  source?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DateStatistics {
  today: number;
  week: number;
  month: number;
  total: number;
  recentDays: Array<{
    date: string;
    count: number;
  }>;
}

interface DatabaseResult {
  words: WordData[];
  pagination: PaginationInfo;
}

interface APIResponse {
  success: boolean;
  data: {
    words: WordData[];
    pagination: PaginationInfo;
    dateStats: DateStatistics;
  };
}

interface APIError {
  error: string;
}

// GET handler for fetching words with enhanced date filtering and pagination
export async function GET(request: NextRequest): Promise<NextResponse<APIResponse | APIError>> {
  try {
    // Extract and validate search parameters
    const { searchParams } = new URL(request.url);
    const limit: number = parseInt(searchParams.get('limit') || '20');
    const page: number = parseInt(searchParams.get('page') || '1');
    const search: string | null = searchParams.get('search');
    const dateFilter: string | null = searchParams.get('date'); // 'all', 'today', 'week', 'month', 'specific'
    const specificDate: string | null = searchParams.get('specificDate'); // Format: YYYY-MM-DD

    console.log('📖 Fetching words with params:', {
      page,
      limit,
      search: search ? `"${search}"` : null,
      dateFilter,
      specificDate,
    });

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100' },
        { status: 400 }
      );
    }

    // Validate date filter
    const validDateFilters: string[] = ['all', 'today', 'week', 'month', 'specific'];
    if (dateFilter && !validDateFilters.includes(dateFilter)) {
      return NextResponse.json(
        { error: 'Invalid date filter. Must be one of: all, today, week, month, specific' },
        { status: 400 }
      );
    }

    // Validate specific date format if provided
    if (dateFilter === 'specific' && specificDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(specificDate)) {
        return NextResponse.json(
          { error: 'Invalid specific date format. Must be YYYY-MM-DD' },
          { status: 400 }
        );
      }
    }

    // Test database connection
    const dbConnected: boolean = await DatabaseManager.testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Build enhanced date filter query
    let dateQuery: DateQuery = {};

    if (dateFilter && dateFilter !== 'all') {
      const now: Date = new Date();
      let startDate: Date | undefined, endDate: Date | undefined;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          console.log('📅 Today filter:', { startDate, endDate });
          break;

        case 'week':
          // Get start of week (Monday)
          const dayOfWeek: number = now.getDay();
          const diffToMonday: number = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          console.log('📅 Week filter:', { startDate, endDate });
          break;

        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          console.log('📅 Month filter:', { startDate, endDate });
          break;

        case 'specific':
          if (specificDate) {
            const date: Date = new Date(specificDate + 'T00:00:00.000Z');
            // Validate date is not in future
            if (date > now) {
              return NextResponse.json(
                { error: 'Specific date cannot be in the future' },
                { status: 400 }
              );
            }
            startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
            console.log('📅 Specific date filter:', { specificDate, startDate, endDate });
          }
          break;

        default:
          console.warn('⚠️ Unknown date filter:', dateFilter);
          break;
      }

      if (startDate && endDate) {
        dateQuery.createdAt = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    let result: DatabaseResult;

    if (search && search.trim()) {
      // Search words with date filter and pagination
      console.log('🔍 Performing search with pagination...');

      // Check if the search method with pagination exists
      if (typeof DatabaseManager.searchWordsWithDateFilterPaginated === 'function') {
        result = await DatabaseManager.searchWordsWithDateFilterPaginated(
          search.trim(),
          dateQuery,
          page,
          limit
        );
      } else {
        // Fallback to regular search if paginated method doesn't exist
        console.log('⚠️ Paginated search method not found, using fallback...');
        const searchResults: WordData[] = await DatabaseManager.searchWordsWithDateFilter(
          search.trim(),
          dateQuery
        );

        // Manual pagination for search results
        const total: number = searchResults.length;
        const pages: number = Math.ceil(total / limit);
        const startIndex: number = (page - 1) * limit;
        const endIndex: number = startIndex + limit;
        const paginatedWords: WordData[] = searchResults.slice(startIndex, endIndex);

        result = {
          words: paginatedWords,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        };
      }
    } else {
      // Get words with pagination and date filter
      console.log('📖 Fetching words with date filter...');
      result = await DatabaseManager.getWordsWithDateFilter(page, limit, dateQuery);
    }

    // Add date statistics
    console.log('📊 Fetching date statistics...');
    const dateStats: DateStatistics = await DatabaseManager.getWordDateStatistics();

    // Log success
    console.log('✅ API Success:', {
      wordsCount: result.words.length,
      pagination: result.pagination,
      hasDateStats: !!dateStats,
    });

    const response: APIResponse = {
      success: true,
      data: {
        ...result,
        dateStats,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    // Enhanced error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    console.error('❌ GET API Error:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const publicErrorMessage = isProduction
      ? 'Internal server error occurred'
      : `Internal server error: ${errorMessage}`;

    return NextResponse.json(
      { error: publicErrorMessage },
      { status: 500 }
    );
  }
}

// Helper function to validate date string
function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Export types for use in other files
export type { WordData, PaginationInfo, DateStatistics, APIResponse, APIError };
