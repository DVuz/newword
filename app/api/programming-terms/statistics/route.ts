import { NextRequest, NextResponse } from 'next/server';
import { TermsDatabaseManager } from '@/lib/terms-database';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET programming terms statistics request');

    // Test database connection
    const dbConnected = await TermsDatabaseManager.testConnection();
    if (!dbConnected) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const statistics = await TermsDatabaseManager.getTermsStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('❌ Programming Terms Statistics API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
