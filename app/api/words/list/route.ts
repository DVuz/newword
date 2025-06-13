import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager, WordData, DateFilterQuery } from '@/lib/database';
import { AuthMiddleware, AuthenticatedUser } from '@/lib/auth';

interface WordListParams {
  page: number;
  limit: number;
  search?: string;
  date?: string;
  specificDate?: string;
}

interface WordListResponse {
  words: WordData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  dateStats: {
    today: number;
    week: number;
    month: number;
    total: number;
    recentDays: Array<{
      date: string;
      count: number;
    }>;
  };
  userInfo: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };
  meta: {
    userRole: string;
    dateFilter: string;
    searchQuery: string;
    hasLegacyWords: boolean;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const params: WordListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      date: searchParams.get('date') || 'all',
      specificDate: searchParams.get('specificDate') || undefined,
    };

    console.log('📖 Word List GET request:', params);

    // Validate pagination parameters
    if (params.page < 1 || params.limit < 1 || params.limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // ✅ Authenticate user (required)
    let authenticatedUser: AuthenticatedUser;
    try {
      authenticatedUser = await AuthMiddleware.authenticateRequest(request);
      console.log('🔐 Authenticated user:', {
        name: authenticatedUser.userName,
        role: authenticatedUser.userRole,
      });
    } catch (authError: any) {
      return NextResponse.json(
        {
          error: 'Cần đăng nhập để xem từ vựng',
          details: authError.message,
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ✅ Build date filter query
    const dateQuery: DateFilterQuery = {};

    if (params.date && params.date !== 'all') {
      const now = new Date();

      switch (params.date) {
        case 'today':
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          dateQuery.createdAt = { $gte: startOfToday, $lt: endOfToday };
          break;

        case 'week':
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateQuery.createdAt = { $gte: startOfWeek };
          break;

        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateQuery.createdAt = { $gte: startOfMonth };
          break;

        case 'specific':
          if (params.specificDate) {
            const specificDate = new Date(params.specificDate);
            const startOfDay = new Date(
              specificDate.getFullYear(),
              specificDate.getMonth(),
              specificDate.getDate()
            );
            const endOfDay = new Date(
              specificDate.getFullYear(),
              specificDate.getMonth(),
              specificDate.getDate() + 1
            );
            dateQuery.createdAt = { $gte: startOfDay, $lt: endOfDay };
          }
          break;
      }
    }

    console.log('🔍 Query filter:', {
      dateQuery,
      userId: authenticatedUser.userId,
      userRole: authenticatedUser.userRole,
    });

    let words: WordData[] = [];
    let pagination = {
      page: params.page,
      limit: params.limit,
      total: 0,
      pages: 0,
    };

    // ✅ Fetch words with smart filtering
    if (params.search && params.search.trim()) {
      // Search with user-based filtering
      words = await DatabaseManager.searchWordsForUser(
        params.search.trim(),
        authenticatedUser.userId,
        authenticatedUser.userRole,
        dateQuery
      );
      pagination = {
        page: 1,
        limit: words.length,
        total: words.length,
        pages: 1,
      };
    } else {
      // Regular fetch with user-based filtering
      const result = await DatabaseManager.getWordsForUser(
        params.page,
        params.limit,
        authenticatedUser.userId,
        authenticatedUser.userRole,
        dateQuery
      );
      words = result.words;
      pagination = result.pagination;
    }

    // ✅ Process words to handle missing addedBy field (for admin only)
    const processedWords: WordData[] = words.map(word => {
      if (!word.addedBy && authenticatedUser.userRole === 'admin') {
        // Admin sees legacy words with default addedBy
        return {
          ...word,
          addedBy: {
            userId: '1',
            userEmail: 'admin@newword.com',
            userName: 'Admin',
            addedAt: word.createdAt || new Date(),
          },
        };
      }
      return word;
    });

    // ✅ Get date statistics with user-based filtering
    const dateStats = await DatabaseManager.getDateStatisticsForUser(
      authenticatedUser.userId,
      authenticatedUser.userRole
    );

    // ✅ Check if there are legacy words (admin only)
    let hasLegacyWords = false;
    if (authenticatedUser.userRole === 'admin') {
      const collection = await DatabaseManager.getWordsCollection();
      const legacyWordsCount = await collection.countDocuments({
        addedBy: { $exists: false },
      });
      hasLegacyWords = legacyWordsCount > 0;
    }

    // ✅ Prepare response
    const response: WordListResponse = {
      words: processedWords,
      pagination,
      dateStats,
      userInfo: {
        userId: authenticatedUser.userId,
        userName: authenticatedUser.userName,
        userEmail: authenticatedUser.userEmail,
        userRole: authenticatedUser.userRole,
      },
      meta: {
        userRole: authenticatedUser.userRole,
        dateFilter: params.date || 'all',
        searchQuery: params.search || '',
        hasLegacyWords,
      },
    };

    console.log('✅ Word list response:', {
      wordsCount: words.length,
      userRole: authenticatedUser.userRole,
      userName: authenticatedUser.userName,
      dateFilter: params.date,
      hasLegacyWords,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Word List API Error:', error);

    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// ✅ DELETE handler with smart permission check
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
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    console.log('🗑️ DELETE word request:', {
      word,
      user: authenticatedUser.userName,
      role: authenticatedUser.userRole,
    });

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get collection
    const collection = await DatabaseManager.getWordsCollection();

    // Find the word first to check ownership
    const existingWord = await collection.findOne({
      word: { $regex: new RegExp(`^${word}$`, 'i') },
    });

    if (!existingWord) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    // ✅ Smart permission check
    let canDelete = false;
    let deleteReason = '';

    if (authenticatedUser.userRole === 'admin') {
      // Admin can delete any word (including legacy words)
      canDelete = true;
      deleteReason = 'Admin privileges';
      console.log('🔐 Admin delete access granted');
    } else {
      // Regular user can only delete their own words
      if (existingWord.addedBy?.userId === authenticatedUser.userId) {
        canDelete = true;
        deleteReason = 'Word owner';
        console.log('✅ User delete access granted (owner)');
      } else {
        canDelete = false;
        deleteReason = 'Not word owner';
        console.log('❌ User delete access denied (not owner)');
      }
    }

    if (!canDelete) {
      return NextResponse.json(
        {
          error: 'Bạn chỉ có thể xóa từ do mình thêm vào',
          details: `Access denied: ${deleteReason}`,
          wordOwner: existingWord.addedBy?.userName || 'Admin',
          currentUser: authenticatedUser.userName,
        },
        { status: 403 }
      );
    }

    // Delete the word
    const result = await collection.deleteOne({
      word: { $regex: new RegExp(`^${word}$`, 'i') },
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }

    console.log('✅ Word deleted successfully:', {
      word,
      deletedBy: authenticatedUser.userName,
      reason: deleteReason,
      originalOwner: existingWord.addedBy?.userName || 'Legacy/Admin',
    });

    return NextResponse.json({
      success: true,
      message: `Word "${word}" deleted successfully`,
      deletedBy: {
        userId: authenticatedUser.userId,
        userName: authenticatedUser.userName,
        userRole: authenticatedUser.userRole,
      },
      originalOwner: {
        userId: existingWord.addedBy?.userId || '1',
        userName: existingWord.addedBy?.userName || 'Admin',
      },
      accessReason: deleteReason,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ DELETE API Error:', error);

    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// Export types
export type { WordListParams, WordListResponse };
