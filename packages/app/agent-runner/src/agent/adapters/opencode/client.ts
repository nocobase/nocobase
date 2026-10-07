/**
 * A minimal client for the `opencode serve` HTTP API of OpenCode 2.x (the
 * `/api/...` HttpApi surface; its OpenAPI document is served at
 * `/openapi.json`). Only the calls the adapter needs. Every request carries
 * HTTP basic auth with the per-run password.
 *
 * Not the `@opencode-ai/sdk` package: its current release (1.x) targets the
 * 1.x server API (`/session`, `/event`, `/session/:id/permissions/:id`),
 * which OpenCode 2.x no longer serves.
 */
import { isRecord } from './util.ts';

export type FetchFn = typeof fetch;

/** One bus event from `GET /api/event`. */
export interface OpencodeEvent {
  id?: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ModelRef {
  providerID: string;
  id: string;
  variant?: string;
}

export interface PermissionRule {
  action: string;
  resource: string;
  effect: 'allow' | 'deny' | 'ask';
}

export interface SessionInfo {
  id: string;
  model?: ModelRef;
  [key: string]: unknown;
}

export interface ModelInfo {
  id: string;
  modelID?: string;
  providerID: string;
  variants?: { id: string }[];
}

export class OpencodeHttpError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(method: string, path: string, status: number, body: string) {
    super(
      `OpenCode server ${method} ${path} failed with status ${status}${body ? `: ${body.slice(0, 500)}` : ''}`,
    );
    this.name = 'OpencodeHttpError';
    this.status = status;
    this.body = body;
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

export interface ClientOptions {
  baseUrl: string;
  username: string;
  password: string;
  fetch?: FetchFn;
}

export class OpencodeClient {
  private readonly baseUrl: string;
  private readonly authorization: string;
  private readonly fetchFn: FetchFn;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.authorization = `Basic ${Buffer.from(`${options.username}:${options.password}`).toString('base64')}`;
    this.fetchFn = options.fetch ?? fetch;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    timeoutMs: number = REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    const response = await this.fetchFn(this.baseUrl + path, {
      method,
      headers: {
        authorization: this.authorization,
        accept: 'application/json',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    if (!response.ok)
      throw new OpencodeHttpError(method, path, response.status, text);
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private static data<T>(payload: unknown): T {
    return (
      isRecord(payload) && 'data' in payload ? payload.data : payload
    ) as T;
  }

  async createSession(body: {
    model?: ModelRef;
    permissions?: PermissionRule[];
    location?: { directory: string };
    title?: string;
  }): Promise<SessionInfo> {
    return OpencodeClient.data(
      await this.request('POST', '/api/session', body),
    );
  }

  async getSession(id: string): Promise<SessionInfo> {
    return OpencodeClient.data(
      await this.request('GET', `/api/session/${encodeURIComponent(id)}`),
    );
  }

  async updateSession(
    id: string,
    body: { permissions?: PermissionRule[] },
  ): Promise<void> {
    await this.request('PATCH', `/api/session/${encodeURIComponent(id)}`, body);
  }

  async switchModel(id: string, model: ModelRef): Promise<void> {
    await this.request('POST', `/api/session/${encodeURIComponent(id)}/model`, {
      model,
    });
  }

  async putInstruction(id: string, key: string, value: unknown): Promise<void> {
    await this.request(
      'PUT',
      `/api/experimental/session/${encodeURIComponent(id)}/instructions/entries/${encodeURIComponent(key)}`,
      { value },
    );
  }

  /** Admits one user input; returns its inbox id. */
  async prompt(
    id: string,
    text: string,
    delivery?: 'steer' | 'queue',
  ): Promise<string | undefined> {
    const item = OpencodeClient.data<{ id?: string } | undefined>(
      await this.request(
        'POST',
        `/api/session/${encodeURIComponent(id)}/prompt`,
        { text, ...(delivery ? { delivery } : {}) },
      ),
    );
    return item?.id;
  }

  async replyPermission(
    sessionId: string,
    requestId: string,
    decision: 'once' | 'always' | 'reject',
    message?: string,
  ): Promise<void> {
    await this.request(
      'POST',
      `/api/session/${encodeURIComponent(sessionId)}/permission/${encodeURIComponent(requestId)}/reply`,
      { decision, ...(message ? { message } : {}) },
    );
  }

  async interrupt(id: string, timeoutMs?: number): Promise<boolean> {
    const result = await this.request<{ interrupted?: boolean } | undefined>(
      'POST',
      `/api/session/${encodeURIComponent(id)}/interrupt`,
      undefined,
      timeoutMs,
    );
    return Boolean(result?.interrupted);
  }

  async cancelForm(sessionId: string, formId: string): Promise<void> {
    await this.request(
      'DELETE',
      `/api/session/${encodeURIComponent(sessionId)}/form/${encodeURIComponent(formId)}`,
    );
  }

  async listModels(): Promise<ModelInfo[]> {
    const models = OpencodeClient.data<unknown>(
      await this.request('GET', '/api/model'),
    );
    return Array.isArray(models) ? (models as ModelInfo[]) : [];
  }

  /**
   * Subscribes to the bus. Resolves once the stream is open, so no event of
   * a session created afterwards is missed.
   */
  async events(signal: AbortSignal): Promise<AsyncIterable<OpencodeEvent>> {
    const response = await this.fetchFn(this.baseUrl + '/api/event', {
      headers: {
        authorization: this.authorization,
        accept: 'text/event-stream',
      },
      signal,
    });
    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      throw new OpencodeHttpError('GET', '/api/event', response.status, text);
    }
    return parseEventStream(response.body);
  }
}

/** Parses a server-sent event stream into the bus events it carries. */
export async function* parseEventStream(
  body: AsyncIterable<Uint8Array>,
): AsyncGenerator<OpencodeEvent> {
  const decoder = new TextDecoder();
  let buffer = '';
  const flush = function* (block: string): Generator<OpencodeEvent> {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''))
      .join('\n');
    if (!data) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (!isRecord(parsed) || typeof parsed.type !== 'string') return;
    yield {
      ...(typeof parsed.id === 'string' ? { id: parsed.id } : {}),
      type: parsed.type,
      data: isRecord(parsed.data) ? parsed.data : {},
    };
  };
  for await (const chunk of body) {
    buffer = (buffer + decoder.decode(chunk, { stream: true })).replace(
      /\r\n/g,
      '\n',
    );
    let index: number;
    while ((index = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      yield* flush(block);
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) yield* flush(buffer);
}
