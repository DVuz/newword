import { NextRequest, NextResponse } from 'next/server';
import { GeminiGrammarProcessor } from '@/lib/gemini-grammar';
import { GrammarDatabaseManager } from '@/lib/grammar-database';

interface ProcessResult {
  processed: number;
  analyzed: number;
  saved: number;
  analysisErrors: Array<{ grammar: string; error: string }>;
  saveErrors: Array<{ grammar: string; error: string }>;
}

// POST handler for creating grammar structures
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grammarInputs, mode } = body;

    console.log('📝 Received grammar structures request:', {
      grammarInputs: grammarInputs?.length,
      mode,
    });

    // Validate input
    if (!grammarInputs || !Array.isArray(grammarInputs) || grammarInputs.length === 0) {
      return NextResponse.json({ error: 'Invalid grammar inputs array' }, { status: 400 });
    }

    // Clean and validate grammar inputs
    const cleanInputs = GeminiGrammarProcessor.validateGrammarInputs(grammarInputs);

    if (cleanInputs.length === 0) {
      return NextResponse.json({ error: 'No valid grammar inputs found' }, { status: 400 });
    }

    console.log('🔍 Processing grammar structures:', cleanInputs);

    // Process grammar structures with Gemini AI
    console.log('🤖 Processing grammar structures with Gemini AI...');
    const {
      results,
      errors: analysisErrors,
      success: analyzed,
    } = await GeminiGrammarProcessor.processMultipleGrammarStructures(cleanInputs);

    // Save to database
    console.log('💾 Saving grammar structures to database...');
    const { success: saved, errors: saveErrors } =
      await GrammarDatabaseManager.saveGrammarStructures(results);

    const response: ProcessResult = {
      processed: cleanInputs.length,
      analyzed,
      saved,
      analysisErrors,
      saveErrors,
    };

    console.log('✅ Grammar structures processing completed:', response);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Grammar Structures API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET handler for fetching grammar structures
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const level = searchParams.get('level');

    console.log('📖 GET grammar structures request:', { page, limit, search, type, level });

    let result;

    if (search) {
      // Search structures
      const structures = await GrammarDatabaseManager.searchGrammarStructures(search);
      result = {
        structures,
        pagination: {
          page: 1,
          limit: structures.length,
          total: structures.length,
          pages: 1,
        },
      };
    } else {
      // Get all structures with pagination
      result = await GrammarDatabaseManager.getGrammarStructures(page, limit);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ GET Grammar Structures API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
