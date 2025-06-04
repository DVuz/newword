import { NextRequest, NextResponse } from 'next/server';
const { DatabaseManager } = require('@/lib/database');

// GET handler for fetching words
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');

    console.log('📖 Fetching words:', { page, limit, search });

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let result;

    if (search) {
      // Search words
      const words = await DatabaseManager.searchWords(search);
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
  } catch (error) {
    console.error('❌ GET API Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

