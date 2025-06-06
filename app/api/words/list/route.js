import { NextRequest, NextResponse } from 'next/server';
const { DatabaseManager } = require('@/lib/database');

// GET handler for fetching words with date filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const dateFilter = searchParams.get('date'); // 'all', 'today', 'week', 'month', 'specific'
    const specificDate = searchParams.get('specificDate'); // Format: YYYY-MM-DD

    console.log('📖 Fetching words:', {
      page,
      limit,
      search,
      dateFilter,
      specificDate,
    });

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Build date filter query
    let dateQuery = {};

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;

        case 'week':
          // Get start of week (Monday)
          const dayOfWeek = now.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;

        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;

        case 'specific':
          if (specificDate) {
            const date = new Date(specificDate);
            startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
          }
          break;
      }

      if (startDate && endDate) {
        dateQuery.createdAt = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    let result;

    if (search) {
      // Search words with date filter
      const words = await DatabaseManager.searchWordsWithDateFilter(search, dateQuery);
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
      // Get words with pagination and date filter
      result = await DatabaseManager.getWordsWithDateFilter(page, limit, dateQuery);
    }

    // Add date statistics
    const dateStats = await DatabaseManager.getWordDateStatistics();

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        dateStats,
      },
    });
  } catch (error) {
    console.error('❌ GET API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message,
      },
      { status: 500 }
    );
  }
}
