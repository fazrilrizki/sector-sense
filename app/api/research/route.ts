import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateResearch } from '@/lib/services/research';
import { ComparisonError } from '@/lib/services/comparison';
import { LLMError, LLMParseError } from '@/lib/llm';

const EventRiskSchema = z.object({
  dividendTrapRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  estimatedPriceDropPct: z.number(),
  dividendYieldPct: z.number(),
});

const RequestSchema = z.object({
  targetTicker: z.string().min(1).toUpperCase(),
  competitorTickers: z.array(z.string().min(1).toUpperCase()).min(1).max(3),
  eventRisk: EventRiskSchema.optional(),
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

  try {
    const result = await generateResearch(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ComparisonError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }

    if (err instanceof LLMParseError) {
      return NextResponse.json(
        { error: 'LLM response could not be parsed', message: err.message },
        { status: 502 },
      );
    }

    if (err instanceof LLMError) {
      return NextResponse.json(
        { error: 'LLM provider error', message: err.message },
        { status: 502 },
      );
    }

    console.error('[/api/research] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
