import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDividendTrapAnalysis } from '@/lib/services/dividendTrap';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol || symbol.trim().length === 0) {
    return NextResponse.json({ error: 'Missing required query param: symbol' }, { status: 400 });
  }

  try {
    const result = await getDividendTrapAnalysis(symbol.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/dividend-trap] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
