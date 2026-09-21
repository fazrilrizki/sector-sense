import { ZodError } from 'zod';
import { getLLMProvider } from './client.ts';
import { AnalysisInputSchema, BullBearAnalysisOutputSchema } from './schemas.ts';
import type { AnalysisInput, BullBearAnalysisOutput } from './schemas.ts';
import { buildAnalysisPrompt } from './prompts.ts';
import { getMockAnalysis } from './mock.ts';
import { LLMParseError } from './providers/base.ts';

export async function generateBullBearAnalysis(
  rawInput: unknown,
): Promise<BullBearAnalysisOutput> {
  const input: AnalysisInput = AnalysisInputSchema.parse(rawInput);

  if (process.env.MOCK_API === 'true') {
    return getMockAnalysis(input);
  }

  const provider = getLLMProvider();
  const request = buildAnalysisPrompt(input);
  const response = await provider.complete(request);

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch (err) {
    throw new LLMParseError(
      `Provider "${provider.name}" returned non-JSON response`,
      response.text,
      err,
    );
  }

  try {
    return BullBearAnalysisOutputSchema.parse(parsed);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new LLMParseError(
        `Provider "${provider.name}" JSON failed schema validation: ${err.message}`,
        response.text,
        err,
      );
    }
    throw err;
  }
}
