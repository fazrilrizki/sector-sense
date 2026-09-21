import type { AnalysisInput } from './schemas.ts';
import type { LLMRequest } from './providers/base.ts';

const SYSTEM_PROMPT = `You are a quantitative financial analyst specializing in Indonesian equities (IDX).
Your task is to analyze structured financial data and generate an investment thesis in JSON format.

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences, no explanation.
- Do not hallucinate metrics. Base all analysis strictly on the input data provided.
- Use English for field values.
- The JSON must match this exact structure:
{
  "targetTicker": "string",
  "analysisTimestamp": "ISO 8601 datetime string",
  "bullCase": {
    "summary": "string",
    "points": [{ "title": "string", "description": "string", "supportingMetric": "string (optional)" }],
    "confidenceScore": 0.0-1.0
  },
  "bearCase": {
    "summary": "string",
    "points": [{ "title": "string", "description": "string", "supportingMetric": "string (optional)" }],
    "confidenceScore": 0.0-1.0
  },
  "recommendation": {
    "action": "BUY | HOLD | SWITCH",
    "targetOption": "OPTION_A | OPTION_B",
    "rationale": "string",
    "riskLevel": "LOW | MEDIUM | HIGH"
  },
  "comparisonSummary": {
    "targetRank": integer >= 1,
    "strongestCompetitor": "ticker string or omit if none",
    "keyDifferentiator": "string"
  }
}
OPTION_A means: proceed with the target stock's dividend.
OPTION_B means: switch to a competitor stock.`;

export function buildAnalysisPrompt(input: AnalysisInput): LLMRequest {
  const competitorSummary = input.financialScores.competitors
    .map(
      (c) =>
        `  - ${c.ticker}: healthScore=${c.healthScore.toFixed(2)}, profitability=${c.profitability.toFixed(2)}, solvency=${c.solvency.toFixed(2)}, liquidity=${c.liquidity.toFixed(2)}, growth=${c.growth.toFixed(2)}, dividendSustainability=${c.dividendSustainability.toFixed(2)}`,
    )
    .join('\n');

  const userContent = `Analyze the following IDX stock data and generate the investment thesis JSON.

TARGET STOCK: ${input.targetTicker}
Financial Health Score: ${input.financialScores.target.healthScore.toFixed(2)}/10
  - Profitability: ${input.financialScores.target.profitability.toFixed(2)}
  - Solvency: ${input.financialScores.target.solvency.toFixed(2)}
  - Liquidity: ${input.financialScores.target.liquidity.toFixed(2)}
  - Growth: ${input.financialScores.target.growth.toFixed(2)}
  - Dividend Sustainability: ${input.financialScores.target.dividendSustainability.toFixed(2)}

COMPETITORS:
${competitorSummary}

DIVIDEND TRAP RISK (${input.targetTicker}):
  - Risk Level: ${input.eventRisk.dividendTrapRisk}
  - Estimated Price Drop at Ex-Date: ${input.eventRisk.estimatedPriceDropPct.toFixed(2)}%
  - Dividend Yield: ${input.eventRisk.dividendYieldPct.toFixed(2)}%
  - Net Dividend Benefit: ${(input.eventRisk.dividendYieldPct - input.eventRisk.estimatedPriceDropPct).toFixed(2)}%

Generate the JSON now.`;

  return {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS ?? '2048', 10),
    temperature: 0.2,
  };
}
