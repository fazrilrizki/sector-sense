import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateBullBearAnalysis } from '@/lib/llm';
import { LLMError, LLMParseError } from '@/lib/llm';

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

  try {
    const result = await generateBullBearAnalysis(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.flatten() },
        { status: 422 },
      );
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

    console.error('[/api/analysis] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
