import type { MailProviderResult } from '../../../shared/mail.js';
import { failure } from './errors.js';
import { responseError } from './http.js';
import type { GmailMessageResource } from './types.js';

const MAX_BATCH_RESPONSE_BYTES = 64 * 1024 * 1024;

export interface GmailBatchItemResult {
  readonly id: string;
  readonly result: MailProviderResult<GmailMessageResource>;
}

export async function parseGmailBatchResponse(
  response: Response,
  ids: readonly string[],
): Promise<MailProviderResult<readonly GmailBatchItemResult[]>> {
  if (!response.ok) {
    return { ok: false, error: await responseError('GMAIL', response) };
  }
  const contentType = response.headers.get('content-type') ?? '';
  const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  if (!boundary) return invalidBatchResponse();
  let body: string;
  try {
    body = await readLimitedText(response, MAX_BATCH_RESPONSE_BYTES);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Gmail batch response exceeded the size limit.'
    ) {
      return failure(
        'GMAIL_BATCH_RESPONSE_TOO_LARGE',
        error.message,
        'content',
        false,
      );
    }
    return failure(
      'GMAIL_BATCH_RESPONSE_INVALID',
      error instanceof Error
        ? error.message
        : 'Gmail returned an invalid batch response.',
      'network',
      true,
    );
  }

  const marker = `--${boundary[1] ?? boundary[2]}`;
  const parts = body
    .split(marker)
    .slice(1)
    .map((part) => part.replace(/^\r?\n/, '').replace(/\r?\n$/, ''))
    .filter((part) => part && part !== '--');
  const parsed = new Map<number, MailProviderResult<GmailMessageResource>>();
  for (const part of parts) {
    const separator = part.search(/\r?\n\r?\n/);
    if (separator < 0) return invalidBatchResponse();
    const outerHeaders = part.slice(0, separator);
    const inner = part.slice(separator).replace(/^\r?\n\r?\n/, '');
    const indexMatch = /(?:response-)?item-(\d+)/i.exec(outerHeaders);
    const statusMatch = /^HTTP\/\d(?:\.\d)?\s+(\d{3})(?:\s+([^\r\n]*))?/i.exec(
      inner,
    );
    if (!indexMatch || !statusMatch) return invalidBatchResponse();
    const index = Number(indexMatch[1]);
    if (!Number.isSafeInteger(index) || index < 0 || index >= ids.length) {
      return invalidBatchResponse();
    }
    const responseSeparator = inner.search(/\r?\n\r?\n/);
    if (responseSeparator < 0) return invalidBatchResponse();
    const responseHead = inner.slice(0, responseSeparator);
    const responseBody = inner
      .slice(responseSeparator)
      .replace(/^\r?\n\r?\n/, '');
    const headers = new Headers();
    for (const line of responseHead.split(/\r?\n/).slice(1)) {
      const colon = line.indexOf(':');
      if (colon > 0)
        headers.set(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
    }
    const status = Number(statusMatch[1]);
    if (status < 200 || status >= 300) {
      parsed.set(index, {
        ok: false,
        error: await responseError(
          'GMAIL',
          new Response(responseBody, {
            status,
            statusText: statusMatch[2] ?? '',
            headers,
          }),
        ),
      });
      continue;
    }
    try {
      parsed.set(index, {
        ok: true,
        value: JSON.parse(responseBody) as GmailMessageResource,
      });
    } catch {
      return invalidBatchResponse();
    }
  }
  if (parsed.size !== ids.length) return invalidBatchResponse();
  return {
    ok: true,
    value: ids.map((id, index) => ({ id, result: parsed.get(index)! })),
  };
}

async function readLimitedText(
  response: Response,
  maxBytes: number,
): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('Gmail batch response exceeded the size limit.');
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function invalidBatchResponse(): MailProviderResult<never> {
  return failure(
    'GMAIL_BATCH_RESPONSE_INVALID',
    'Gmail returned an invalid batch response.',
    'network',
    true,
  );
}
