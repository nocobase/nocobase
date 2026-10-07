// A file sent beside a request (`ticket` on a manifest parameter): the request answers an upload ticket, and the file
// is streamed straight to the ticket's URL with the ticket's headers only, never the session's. The upload's answer is
// the command's.
import { openAsBlob } from 'node:fs';

import { UploadTicketSchema } from '@nocobase/agent-protocol';

import { AppApiError } from '../lib/http.ts';
import { send } from './execute.ts';
import type { LocalFile } from './files.ts';
import { urlFor, type Session } from './session.ts';

/** What the upload answered: its `data`, and its message or else the ticket's. */
export interface TicketAnswer {
  readonly data: unknown;
  readonly message?: string;
}

/** Streams `file` to the ticket a request answered (`ticketData`, the answer's `data`). */
export async function streamToTicket(
  session: Session,
  ticketData: unknown,
  file: LocalFile,
  options: { readonly fetch?: typeof fetch; readonly timeoutMs?: number },
): Promise<TicketAnswer> {
  const parsed = UploadTicketSchema.safeParse(ticketData);
  if (!parsed.success)
    throw new AppApiError(
      0,
      'UPLOAD_FAILED',
      'The server answered no upload ticket.',
    );
  const ticket = parsed.data;
  const url = urlFor(session.server, ticket.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new AppApiError(
      0,
      'INVALID_REQUEST',
      `The upload ticket points at ${url.protocol}, which the CLI does not send to.`,
    );
  // A file-backed Blob: the body is read from disk as it is sent, never held in memory whole.
  const answer = await send(
    url,
    {
      method: ticket.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/gzip',
        // The file's own name, for a ticket that does not know it.
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        ...ticket.headers,
      },
      body: await openAsBlob(file.path),
    },
    { ...options, timeoutMs: options.timeoutMs ?? 30 * 60_000 },
  );
  const record =
    answer && typeof answer === 'object'
      ? (answer as { data?: unknown; meta?: { message?: unknown } })
      : undefined;
  const data = record && 'data' in record ? record.data : (answer ?? null);
  // The upload's own message says what it became; the ticket's is said before the file was sent.
  const message =
    typeof record?.meta?.message === 'string'
      ? record.meta.message
      : ticket.message;
  return { data, ...(message ? { message } : {}) };
}
