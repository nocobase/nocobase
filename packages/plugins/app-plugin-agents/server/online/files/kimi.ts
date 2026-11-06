import type {
  ExtractOptions,
  ExtractRequest,
  ExtractResponse,
  TextExtractor,
} from '@nocobase/document-extractor';
import { CHAT_ATTACHMENT_SIZE_MAX } from '../../../shared/conversations.js';
import {
  baseUrlOf,
  headersOf,
  modelFetch,
  type ModelConnection,
} from '../providers.js';
import {
  ByteLimitError,
  characters,
  FileInputBudget,
  readBoundedBytes,
} from './input.js';

interface KimiOptions {
  readonly timeoutMs?: number;
  readonly cleanupTimeoutMs?: number;
  readonly onWarning?: (message: string) => void;
}

/** A single connection-bound protocol adapter, with no retries or cross-execution results. */
class KimiExtractor {
  private readonly filesUrl: string;
  private readonly headers: Headers;
  private readonly timeoutMs: number;
  private readonly cleanupTimeoutMs: number;
  private readonly warn: (message: string) => void;

  constructor(
    connection: ModelConnection,
    sessionId: string,
    options: KimiOptions,
  ) {
    const base = baseUrlOf(connection);
    if (!base || !connection.apiKey)
      throw new Error(
        'Kimi file extraction requires a valid service endpoint and explicit API key.',
      );
    const url = new URL(base);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error('Invalid Kimi file extraction service endpoint.');
    this.filesUrl = `${base.replace(/\/+$/u, '')}/files`;
    this.headers = new Headers({
      ...headersOf(connection, sessionId),
      Authorization: `Bearer ${connection.apiKey}`,
    });
    this.timeoutMs = options.timeoutMs ?? 300_000;
    this.cleanupTimeoutMs = options.cleanupTimeoutMs ?? 5_000;
    if (
      !Number.isSafeInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > 300_000 ||
      !Number.isSafeInteger(this.cleanupTimeoutMs) ||
      this.cleanupTimeoutMs < 1 ||
      this.cleanupTimeoutMs > 5_000
    )
      throw new RangeError('Invalid Kimi extraction deadline.');
    this.warn = options.onWarning ?? ((message) => console.warn(message));
  }

  async extract(
    request: ExtractRequest,
    options: ExtractOptions = {},
  ): Promise<ExtractResponse> {
    const deadline = AbortSignal.timeout(this.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, deadline])
      : deadline;
    const maxChars = options.maxOutputChars ?? FileInputBudget.maxOutputChars;
    let id: string | undefined;
    let attempted = false;
    let result: ExtractResponse;
    try {
      signal.throwIfAborted();
      if (request.bytes.byteLength > CHAT_ATTACHMENT_SIZE_MAX)
        throw new ByteLimitError();
      if (
        !Number.isSafeInteger(maxChars) ||
        maxChars < 0 ||
        maxChars > FileInputBudget.maxOutputChars
      )
        throw new ByteLimitError();
      attempted = true;
      id = await this.upload(request, signal);
      const markdown = await this.content(id, signal, maxChars);
      signal.throwIfAborted();
      result = { status: 'ready', markdown, hasText: Boolean(markdown.trim()) };
    } catch (error) {
      const code = options.signal?.aborted
        ? 'aborted'
        : deadline.aborted
          ? 'timeout'
          : error instanceof ByteLimitError
            ? 'too-large'
            : 'invalid-document';
      result = {
        status: 'failed',
        code,
        error: 'Remote file extraction failed.',
      };
    } finally {
      if (id) await this.cleanup(id);
      else if (attempted)
        this.warning(
          'Remote file cleanup could not be confirmed: no usable file identifier was received.',
        );
    }
    return options.signal?.aborted
      ? {
          status: 'failed',
          code: 'aborted',
          error: 'File extraction was cancelled.',
        }
      : result;
  }

  private async upload(
    request: ExtractRequest,
    signal: AbortSignal,
  ): Promise<string> {
    const form = new FormData();
    form.set('purpose', 'file-extract');
    form.set(
      'file',
      new Blob([new Uint8Array(request.bytes)], {
        type: request.mediaType ?? 'application/octet-stream',
      }),
      request.filename ?? `document.${request.ext}`,
    );
    const response = await this.request('POST', this.filesUrl, signal, form);
    const metadata: unknown = JSON.parse(
      await this.text(response, signal, 64 * 1024),
    );
    if (
      typeof metadata !== 'object' ||
      metadata === null ||
      !('id' in metadata) ||
      typeof metadata.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,256}$/u.test(metadata.id)
    )
      throw new Error('Invalid remote file identifier.');
    return metadata.id;
  }

  private async content(
    id: string,
    signal: AbortSignal,
    maxChars: number,
  ): Promise<string> {
    const response = await this.request(
      'GET',
      `${this.filesUrl}/${encodeURIComponent(id)}/content`,
      signal,
    );
    const mediaType = response.headers
      .get('content-type')
      ?.split(';')[0]
      ?.trim()
      .toLowerCase();
    if (mediaType !== 'text/plain' && mediaType !== 'application/json') {
      await response.body?.cancel();
      throw new Error('Unsupported remote extraction response.');
    }
    const text = await this.text(
      response,
      signal,
      maxChars * (mediaType === 'application/json' ? 12 : 4) + 64 * 1024,
    );
    let markdown: string;
    if (mediaType === 'text/plain') markdown = text;
    else {
      const content: unknown = JSON.parse(text);
      if (
        typeof content !== 'object' ||
        content === null ||
        !('content' in content) ||
        typeof content.content !== 'string'
      )
        throw new Error('Unsupported remote extraction response.');
      markdown = content.content;
    }
    signal.throwIfAborted();
    if (characters(markdown) > maxChars) throw new ByteLimitError();
    return markdown;
  }

  private async request(
    method: string,
    url: string,
    signal: AbortSignal,
    body?: FormData,
  ): Promise<Response> {
    const response = await modelFetch(url, {
      method,
      headers: this.headers,
      signal,
      body,
      redirect: 'error',
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('Remote file request failed.');
    }
    return response;
  }

  private async text(
    response: Response,
    signal: AbortSignal,
    maxBytes: number,
  ): Promise<string> {
    if (!response.body) throw new Error('Missing remote file response.');
    const bytes = await readBoundedBytes(response.body, signal, maxBytes);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  private async cleanup(id: string): Promise<void> {
    try {
      const response = await this.request(
        'DELETE',
        `${this.filesUrl}/${encodeURIComponent(id)}`,
        AbortSignal.timeout(this.cleanupTimeoutMs),
      );
      await response.body?.cancel();
    } catch {
      this.warning(
        'Remote file cleanup failed; a temporary file may remain at the configured service.',
      );
    }
  }

  private warning(message: string): void {
    try {
      this.warn(message);
    } catch {
      /* Diagnostics must not replace the extraction outcome. */
    }
  }
}

/** Credentials and endpoint remain in this private execution-bound closure, never in messages or cache keys. */
export function kimiExtractor(
  connection: ModelConnection,
  sessionId: string,
  options: KimiOptions = {},
): TextExtractor {
  const extractor = new KimiExtractor(connection, sessionId, options);
  return (request, extractOptions) =>
    extractor.extract(request, extractOptions);
}
