import { CacheManager } from '../cache/index.ts';
import type { RequestOptions } from '../core/types.ts';
import {
  SectorsAuthError,
  SectorsError,
  SectorsRateLimitError,
} from '../core/errors.ts';
import type {
  McpJsonRpcRequest,
  McpJsonRpcResponse,
  McpListToolsResult,
  McpCallToolResult,
  McpToolDefinition,
} from './types.ts';

export class SectorsMcpClient {
  private readonly mcpUrl: string;
  private readonly apiKey: string;
  private readonly cacheManager: CacheManager;
  private requestId = 0;

  constructor(
    mcpUrl = 'https://sectors-mcp.supertype.ai/mcp',
    apiKey = '',
    cacheManager?: CacheManager
  ) {
    this.mcpUrl = mcpUrl;
    this.apiKey = apiKey;
    this.cacheManager = cacheManager || new CacheManager();
  }

  private nextId(): number {
    return ++this.requestId;
  }

  /**
   * Discovers all available tools registered on the Sectors MCP server (65+ tools).
   * Cached for 24 hours under the static tier.
   */
  async listTools(options?: RequestOptions): Promise<McpToolDefinition[]> {
    const cacheKey = 'mcp:tools:list';
    return this.cacheManager.getOrSet(
      cacheKey,
      undefined,
      async () => {
        const response = await this.sendJsonRpc<McpListToolsResult>(
          'tools/list',
          {},
          options
        );
        return response.tools;
      },
      { tier: 'static', tags: ['mcp:tools'], ...options }
    );
  }

  /**
   * Invokes an MCP tool by name with arguments.
   * Caches results according to options (default tier: market).
   */
  async callTool(
    name: string,
    toolArgs?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<McpCallToolResult> {
    const cacheKey = `mcp:call:${name}`;
    return this.cacheManager.getOrSet(
      cacheKey,
      toolArgs,
      () =>
        this.sendJsonRpc<McpCallToolResult>(
          'tools/call',
          { name, arguments: toolArgs || {} },
          options
        ),
      { tier: 'market', tags: [`mcp:${name}`], ...options }
    );
  }

  /**
   * Executes an MCP tool and parses the first text content item as JSON.
   */
  async callToolAndParseJson<T>(
    name: string,
    toolArgs?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const result = await this.callTool(name, toolArgs, options);
    if (result.isError) {
      const errorMsg =
        result.content?.map((c) => c.text).join(' ') ||
        'MCP tool execution failed';
      throw new SectorsError(errorMsg, 500, `mcp/${name}`, result);
    }

    const firstText = result.content?.find((c) => c.type === 'text')?.text;
    if (!firstText) {
      return {} as T;
    }

    try {
      return JSON.parse(firstText) as T;
    } catch {
      return firstText as unknown as T;
    }
  }

  /**
   * Internal JSON-RPC HTTP transport execution.
   */
  private async sendJsonRpc<T>(
    method: string,
    params: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const timeoutMs = options?.timeoutMs ?? 15_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const payload: McpJsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = this.apiKey.startsWith('Bearer ')
        ? this.apiKey
        : `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        throw new SectorsAuthError(
          'Unauthorized: Please configure a valid SECTORS_API_KEY for MCP.',
          'mcp'
        );
      }

      if (response.status === 429) {
        throw new SectorsRateLimitError(
          'Sectors MCP rate limit exceeded.',
          'mcp'
        );
      }

      if (!response.ok) {
        throw new SectorsError(
          `Sectors MCP HTTP error (${response.status}): ${response.statusText}`,
          response.status,
          'mcp'
        );
      }

      const json = (await response.json()) as McpJsonRpcResponse<T>;

      if (json.error) {
        throw new SectorsError(
          `Sectors MCP JSON-RPC error: ${json.error.message} (code: ${json.error.code})`,
          500,
          'mcp',
          json.error
        );
      }

      return json.result as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if ((err as Error).name === 'AbortError') {
        throw new SectorsError(
          `Sectors MCP request timed out after ${timeoutMs}ms.`,
          408,
          'mcp'
        );
      }
      throw err;
    }
  }
}
