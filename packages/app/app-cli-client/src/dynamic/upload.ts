// File bodies use Node HTTP: fetch can read ahead of a slow socket even for a file-backed Blob.
import { randomUUID } from 'node:crypto';
import { openAsBlob } from 'node:fs';
import type { Stats } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { mediaTypeOf } from '../lib/mime.ts';
import type { LocalFile } from './files.ts';

const localFiles = new WeakMap<Blob, { path: string; info: Stats }>();

/** Keep a real File for injected fetches. Blob cancellation defers closing until GC, so native HTTP owns the handle. */
export async function localFileBody(file: LocalFile): Promise<File> {
  const info = await stat(file.path);
  const body = new File([await openAsBlob(file.path)], file.name, {
    type: mediaTypeOf(file.name),
  });
  localFiles.set(body, { path: file.path, info });
  return body;
}

const crlf = (value: string) => value.replace(/\r\n|\r|\n/gu, '\r\n');
const quoted = (value: string) =>
  crlf(value).replace(/[\r\n"]/gu, (char) =>
    char === '\r' ? '%0D' : char === '\n' ? '%0A' : '%22',
  );

/** Read at most one Blob chunk ahead; cancellation also closes the file-backed reader. */
async function* bytes(blob: Blob): AsyncGenerator<Uint8Array> {
  const local = localFiles.get(blob);
  if (local) {
    const file = await open(local.path, 'r');
    const unchanged = (info: Stats) => {
      if (
        info.size !== local.info.size ||
        info.mtimeMs !== local.info.mtimeMs ||
        info.ctimeMs !== local.info.ctimeMs
      )
        throw new Error(`File changed while uploading: ${local.path}`);
    };
    try {
      unchanged(await file.stat());
      const stream = file.createReadStream({
        autoClose: false,
        highWaterMark: 65536,
      });
      try {
        yield* stream as AsyncIterable<Uint8Array>;
        unchanged(await file.stat());
      } finally {
        stream.destroy();
      }
    } finally {
      await file.close();
    }
    return;
  }
  const reader = blob.stream().getReader();
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) return;
      yield next.value;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

function encode(body: FormData | Blob, headers: Headers): Readable {
  if (body instanceof Blob) {
    if (!headers.has('content-type') && body.type)
      headers.set('content-type', body.type);
    headers.set('content-length', String(body.size));
    return Readable.from(bytes(body), { objectMode: false });
  }
  const boundary = `----nocobase-${randomUUID()}`;
  const parts: (Buffer | Blob)[] = [];
  for (const [name, value] of body) {
    const disposition = `--${boundary}\r\nContent-Disposition: form-data; name="${quoted(name)}"`;
    if (typeof value === 'string') {
      parts.push(Buffer.from(`${disposition}\r\n\r\n${crlf(value)}\r\n`));
    } else {
      parts.push(
        Buffer.from(
          `${disposition}; filename="${quoted(value.name)}"\r\nContent-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
        ),
        value,
        Buffer.from('\r\n'),
      );
    }
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  headers.set('content-type', `multipart/form-data; boundary=${boundary}`);
  headers.set(
    'content-length',
    String(
      parts.reduce(
        (size, part) => size + (part instanceof Blob ? part.size : part.length),
        0,
      ),
    ),
  );
  return Readable.from(
    (async function* () {
      for (const part of parts) {
        if (part instanceof Blob) yield* bytes(part);
        else yield part;
      }
    })(),
    { objectMode: false },
  );
}

/** One file request, with no replay or redirect of a write and the same Response error parsing as JSON requests. */
export async function fileRequest(
  url: URL,
  init?: RequestInit,
): Promise<Response> {
  if (!(init?.body instanceof FormData || init?.body instanceof Blob))
    throw new TypeError('Expected a file body.');
  init.signal?.throwIfAborted();
  const target = url;
  if (target.protocol !== 'http:' && target.protocol !== 'https:')
    throw new TypeError(`Cannot upload to ${target.protocol}`);
  const headers = new Headers(init.headers);
  const source = encode(init.body, headers);
  const request = (target.protocol === 'https:' ? httpsRequest : httpRequest)(
    target,
    {
      method: init.method,
      headers: Object.fromEntries(headers),
      signal: init.signal ?? undefined,
    },
  );
  // Attach the response/error listeners before piping, including for a pre-aborted signal.
  const response = new Promise<Response>((resolve, reject) => {
    request.once('error', reject);
    request.once('response', (incoming) => {
      void (async () => {
        const chunks: Buffer[] = [];
        for await (const chunk of incoming as AsyncIterable<Uint8Array>)
          chunks.push(Buffer.from(chunk));
        const responseHeaders = new Headers();
        for (let i = 0; i < incoming.rawHeaders.length; i += 2)
          responseHeaders.append(
            incoming.rawHeaders[i],
            incoming.rawHeaders[i + 1],
          );
        const status = incoming.statusCode ?? 500;
        resolve(
          new Response(
            [204, 205, 304].includes(status) ? null : Buffer.concat(chunks),
            {
              status,
              headers: responseHeaders,
            },
          ),
        );
      })().catch(reject);
    });
  });
  const sending = pipeline(source, request).catch(() => undefined);
  try {
    return await response;
  } finally {
    // Also stop reading if the server rejects before consuming the body.
    source.destroy();
    request.destroy();
    await sending;
  }
}
