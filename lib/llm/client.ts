import type { LLMProvider } from './providers/base.ts';
import { AnthropicProvider } from './providers/anthropic.ts';
import { GoogleProvider } from './providers/google.ts';
import { OpenAICompatProvider } from './providers/openai.ts';

export function getLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();

  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'google':
      return new GoogleProvider();
    case 'openai':
    case 'ollama':
      return new OpenAICompatProvider();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${provider}". Valid values: anthropic, google, openai, ollama`,
      );
  }
}
