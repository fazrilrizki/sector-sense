import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, LLMRequest, LLMResponse } from './base.ts';
import { LLMError } from './base.ts';

const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GoogleProvider implements LLMProvider {
  readonly name = 'google';
  readonly model: string;
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');

    this.model = process.env.LLM_MODEL || DEFAULT_MODEL;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const userMessages = request.messages.filter((m) => m.role !== 'system');

    try {
      const generativeModel = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: systemMessage?.content,
        generationConfig: {
          maxOutputTokens: request.maxTokens ?? 2048,
          temperature: request.temperature ?? 0.2,
          responseMimeType: 'application/json',
        },
      });

      const prompt = userMessages.map((m) => m.content).join('\n\n');
      const result = await generativeModel.generateContent(prompt);
      const text = result.response.text();

      return {
        text,
        provider: this.name,
        model: this.model,
        inputTokens: result.response.usageMetadata?.promptTokenCount,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount,
      };
    } catch (err) {
      throw new LLMError(`Google AI completion failed: ${(err as Error).message}`, this.name, err);
    }
  }
}
