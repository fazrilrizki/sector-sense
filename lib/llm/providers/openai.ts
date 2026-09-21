import OpenAI from 'openai';
import type { LLMProvider, LLMRequest, LLMResponse } from './base.ts';
import { LLMError } from './base.ts';

const DEFAULT_MODEL_OPENAI = 'gpt-4o';
const DEFAULT_MODEL_OLLAMA = 'llama3.2';

export class OpenAICompatProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;
  private client: OpenAI;

  constructor() {
    const provider = process.env.LLM_PROVIDER ?? 'openai';
    const isOllama = provider === 'ollama';

    this.name = provider;

    if (isOllama) {
      const baseURL = process.env.OPENAI_BASE_URL ?? 'http://localhost:11434/v1';
      this.model = process.env.LLM_MODEL || DEFAULT_MODEL_OLLAMA;
      this.client = new OpenAI({ apiKey: 'ollama', baseURL });
    } else {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

      const baseURL = process.env.OPENAI_BASE_URL;
      this.model = process.env.LLM_MODEL || DEFAULT_MODEL_OPENAI;
      this.client = new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.2,
        response_format: { type: 'json_object' },
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const text = response.choices[0]?.message?.content ?? '';

      return {
        text,
        provider: this.name,
        model: this.model,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      };
    } catch (err) {
      throw new LLMError(
        `${this.name} completion failed: ${(err as Error).message}`,
        this.name,
        err,
      );
    }
  }
}
