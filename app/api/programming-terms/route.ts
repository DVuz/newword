import { NextRequest, NextResponse } from 'next/server';
import { GeminiTermsProcessor } from '@/lib/gemini-terms';
import { TermsDatabaseManager } from '@/lib/terms-database';

interface ProcessResult {
  processed: number;
  translated: number;
  saved: number;
  translationErrors: Array<{ word: string; error: string }>;
  saveErrors: Array<{ word: string; error: string }>;
}

// POST handler for creating new programming terms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words, mode } = body;

    console.log('📝 Received programming terms request:', { words: words?.length, mode });

    // Validate input
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'Invalid words array' }, { status: 400 });
    }

    // Clean and validate programming terms
    const cleanWords = GeminiTermsProcessor.validateProgrammingTerms(words);

    if (cleanWords.length === 0) {
      return NextResponse.json({ error: 'No valid programming terms found' }, { status: 400 });
    }

    console.log('🔍 Processing programming terms:', cleanWords);

    // Test database connection
    const dbConnected = await TermsDatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Process programming terms with Gemini AI
    console.log('🤖 Processing terms with Gemini AI...');
    const {
      results,
      errors: translationErrors,
      success: translated,
    } = await GeminiTermsProcessor.processProgrammingTerms(cleanWords);

    // Save to database
    console.log('💾 Saving programming terms to database...');
    const { success: saved, errors: saveErrors } = await TermsDatabaseManager.saveTerms(results);

    const response: ProcessResult = {
      processed: cleanWords.length,
      translated,
      saved,
      translationErrors,
      saveErrors,
    };

    console.log('✅ Programming terms processing completed:', response);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Programming Terms API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET handler for fetching programming terms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    console.log('📖 GET programming terms request:', { page, limit, search, category, difficulty });

    // Test database connection
    const dbConnected = await TermsDatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let result;

    if (search) {
      // Search terms
      const terms = await TermsDatabaseManager.searchTerms(search);
      result = {
        terms,
        pagination: {
          page: 1,
          limit: terms.length,
          total: terms.length,
          pages: 1,
        },
      };
    } else if (category) {
      // Get terms by category
      result = await TermsDatabaseManager.getTermsByCategory(category, page, limit);
    } else if (difficulty) {
      // Get terms by difficulty
      result = await TermsDatabaseManager.getTermsByDifficulty(difficulty, page, limit);
    } else {
      // Get all terms with pagination
      result = await TermsDatabaseManager.getTerms(page, limit);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ GET Programming Terms API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting programming terms
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    console.log('🗑️ DELETE request for programming term:', word);

    // Test database connection
    const dbConnected = await TermsDatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const deleted = await TermsDatabaseManager.deleteTerm(word);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `Programming term "${word}" deleted successfully`,
      });
    } else {
      return NextResponse.json({ error: 'Programming term not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('❌ DELETE Programming Terms API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
