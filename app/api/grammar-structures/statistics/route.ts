import { NextRequest, NextResponse } from 'next/server';
import { GrammarDatabaseManager } from '@/lib/grammar-database';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET grammar structures statistics request');

    const statistics = await GrammarDatabaseManager.getGrammarStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('❌ Grammar Structures Statistics API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
