import { NextRequest, NextResponse } from 'next/server';

// Import với TypeScript proper way
const { DatabaseManager } = require('@/lib/database');
const { WordScraper } = require('@/lib/scraper');

// POST handler for creating new words
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words, mode } = body;

    console.log('📝 Received request:', { words: words?.length, mode });

    // Validate input
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'Invalid words array' }, { status: 400 });
    }

    // Clean and validate words
    const cleanWords = WordScraper.cleanWords(words);

    if (cleanWords.length === 0) {
      return NextResponse.json({ error: 'No valid words found' }, { status: 400 });
    }

    console.log('🔍 Processing words:', cleanWords);

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Scrape words với detailed error tracking
    console.log('🕷️ Starting scraping...');
    const { results, errors: scrapeErrors } = await WordScraper.scrapeWords(cleanWords);
    console.log(`📊 Scrape completed: ${results.length} success, ${scrapeErrors.length} errors`);

    // Save to database với detailed error tracking
    console.log('💾 Saving to database...');
    const { success, errors: saveErrors } = await DatabaseManager.saveWords(results);
    console.log(`📊 Save completed: ${success} success, ${saveErrors.length} errors`);

    // Enhanced response với detailed breakdown
    const response = {
      processed: cleanWords.length,
      scraped: results.length,
      saved: success,
      scrapeErrors: scrapeErrors.map(err => ({
        word: err.word,
        error: err.error,
        type: 'SCRAPE_ERROR',
      })),
      saveErrors: saveErrors.map(err => ({
        word: err.word,
        error: err.error,
        type: 'DATABASE_ERROR',
      })),
      // Summary cho UI
      summary: {
        total: cleanWords.length,
        successful: success,
        failed: scrapeErrors.length + saveErrors.length,
        scrapeFailures: scrapeErrors.length,
        saveFailures: saveErrors.length,
      },
      // Detailed breakdown cho debugging
      details: {
        cleanedWords: cleanWords,
        scrapedWords: results.map(r => r.word),
        savedWords: results.slice(0, success).map(r => r.word),
        failedWords: [
          ...scrapeErrors.map(e => ({ word: e.word, reason: 'Scrape failed', detail: e.error })),
          ...saveErrors.map(e => ({ word: e.word, reason: 'Save failed', detail: e.error })),
        ],
      },
    };

    console.log('✅ Final response summary:', response.summary);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error?.message || 'Unknown error'),
        details: error?.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}

// GET handler for fetching words
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');

    console.log('📖 GET request:', { page, limit, search });

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
  } catch (error: any) {
    console.error('❌ GET API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting words
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    console.log('🗑️ DELETE request for word:', word);

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const deleted = await DatabaseManager.deleteWord(word);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `Word "${word}" deleted successfully`,
      });
    } else {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('❌ DELETE API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
