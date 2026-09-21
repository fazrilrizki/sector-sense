import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getComparisonMatrix, ComparisonError } from '@/lib/services/comparison';

const RequestSchema = z.object({
  targetTicker: z.string().min(1).toUpperCase(),
  competitorTickers: z.array(z.string().min(1).toUpperCase()).min(1).max(3),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { targetTicker, competitorTickers } = parsed.data;

  try {
    const matrix = await getComparisonMatrix(targetTicker, competitorTickers);
    return NextResponse.json(matrix);
  } catch (err) {
    if (err instanceof ComparisonError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }

    console.error('[/api/comparison] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
