import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDecisionMatrix } from '@/lib/services/decisionMatrix';
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
  allocatedCapital: z.number().positive().optional(),
  riskTolerance: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']).optional(),
  eventRisk: EventRiskSchema.optional(),
});

const DEFAULT_CAPITAL = 10_000_000; // Rp 10 juta (matches user_profiles.base_capital default)

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

  const { targetTicker, competitorTickers, allocatedCapital, riskTolerance, eventRisk } = parsed.data;

  // Resolve allocatedCapital: request → user profile → default
  let capital = allocatedCapital;
  if (!capital) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('base_capital, risk_tolerance')
      .eq('id', user.id)
      .single();

    capital = profile?.base_capital ?? DEFAULT_CAPITAL;
  }

  const resolvedRiskTolerance =
    riskTolerance ??
    (() => {
      // Will be fetched again only if needed — profile already fetched above if capital was missing
      return 'MODERATE' as const;
    })();

  try {
    const result = await getDecisionMatrix({
      targetTicker,
      competitorTickers,
      allocatedCapital: capital,
      riskTolerance: resolvedRiskTolerance,
      eventRisk,
    });

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

    console.error('[/api/decision-matrix] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
