import { once } from 'node:events';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { send } from '../src/dynamic/execute.ts';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function serve(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  cleanups.push(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  return new URL(`http://127.0.0.1:${address.port}/main/api/upload`);
}

// A large virtual file makes accidental eager consumption observable without allocating a large test fixture.
function largeFile() {
  let read = 0;
  let cancelled = false;
  const size = 256 * 1024 * 1024;
  const file = new File([], 'archive.tar.gz');
  Object.defineProperty(file, 'size', { value: size });
  file.stream = () =>
    new ReadableStream<Uint8Array>({
      pull(controller) {
        if (read === size) controller.close();
        else {
          read += 65536;
          controller.enqueue(new Uint8Array(65536));
        }
      },
      cancel() {
        cancelled = true;
      },
    });
  return { file, read: () => read, cancelled: () => cancelled };
}

describe('file request transport', () => {
  it('encodes multipart files, repeated fields and escaped names with the original credentials', async () => {
    let received: Promise<void> = Promise.resolve();
    const url = await serve((request, response) => {
      received = (async () => {
        const chunks: Buffer[] = [];
        for await (const chunk of request as AsyncIterable<Uint8Array>)
          chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks);
        expect(Number(request.headers['content-length'])).toBe(body.length);
        expect(request.headers.authorization).toBe('Bearer test-session');
        const parsed = await new Response(body, {
          headers: { 'content-type': String(request.headers['content-type']) },
        }).formData();
        expect(parsed.getAll('label')).toEqual(['one\r\ntwo', 'three']);
        const file = parsed.get('file') as File;
        expect(body.toString()).toContain('filename="a%22%0D%0A.tar.gz"');
        expect(file.name).toBe('a"\r\n.tar.gz');
        expect(file.type).toBe('application/gzip');
        expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([
          0, 1, 255,
        ]);
        response.end('{"data":{"uploaded":true}}');
      })();
      void received.catch(() => response.end('{"data":{"uploaded":true}}'));
    });
    const form = new FormData();
    form.append('label', 'one\ntwo');
    form.append('label', 'three');
    form.append(
      'file',
      new File([new Uint8Array([0, 1, 255])], 'a"\r\n.tar.gz', {
        type: 'application/gzip',
      }),
    );
    await expect(
      send(
        url,
        {
          method: 'POST',
          headers: { authorization: 'Bearer test-session' },
          body: form,
        },
        {},
      ),
    ).resolves.toEqual({ data: { uploaded: true } });
    await received;
  });

  it.each(['cancel', 'disconnect', 'reject', 'timeout'] as const)(
    'bounds read-ahead and closes the file reader after %s without retrying',
    async (mode) => {
      const local = largeFile();
      const form = new FormData();
      form.append('file', local.file);
      const abort = new AbortController();
      let requests = 0;
      const url = await serve((request, response) => {
        requests++;
        request.once('data', () => {
          request.pause();
          if (mode === 'cancel') abort.abort();
          if (mode === 'disconnect') request.socket.destroy();
          if (mode === 'reject') {
            response.writeHead(413, { 'content-type': 'application/json' });
            response.end(
              '{"error":{"code":413,"status":"RESOURCE_EXHAUSTED","domain":"test","reason":"TOO_LARGE","message":"Too large"}}',
            );
          }
        });
      });
      await expect(
        send(
          url,
          { method: 'POST', body: form },
          {
            signal: abort.signal,
            ...(mode === 'timeout' ? { timeoutMs: 100 } : {}),
          },
        ),
      ).rejects.toMatchObject(
        mode === 'reject'
          ? { status: 413, reason: 'TOO_LARGE' }
          : { reason: 'NETWORK' },
      );
      expect(requests).toBe(1);
      expect(local.read()).toBeLessThan(16 * 1024 * 1024);
      expect(local.cancelled()).toBe(true);
    },
  );

  it('retains fetch injection, uses 30 minutes for files and 120 seconds for JSON, and honors overrides', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const controller = new AbortController();
    let signal: AbortSignal | null | undefined;
    const fetcher: typeof fetch = async (_url, init) => {
      signal = init?.signal;
      return Response.json({ data: 'ok' });
    };
    const url = new URL('https://example.com/api/upload');
    const form = new FormData();
    form.append('file', new File(['archive'], 'archive.tar.gz'));
    await send(
      url,
      { body: form, signal: controller.signal },
      { fetch: fetcher },
    );
    expect(timeout).toHaveBeenLastCalledWith(30 * 60_000);
    controller.abort();
    expect(signal?.aborted).toBe(true);
    await send(
      url,
      { body: new Blob(['archive']) },
      { fetch: fetcher, timeoutMs: 456 },
    );
    expect(timeout).toHaveBeenLastCalledWith(456);
    await send(url, { body: '{"label":"same"}' }, { fetch: fetcher });
    expect(timeout).toHaveBeenLastCalledWith(120_000);
  });

  it('sends ticket Blob bytes and ticket headers, without session credentials', async () => {
    let body = '';
    const url = await serve((request, response) => {
      expect(request.headers.authorization).toBe('Bearer ticket');
      expect(request.headers['x-api-key']).toBeUndefined();
      request.setEncoding('utf8');
      request.on('data', (chunk: string) => {
        body += chunk;
      });
      request.on('end', () => response.end('{"data":"accepted"}'));
    });
    await expect(
      send(
        url,
        {
          method: 'PUT',
          headers: { authorization: 'Bearer ticket' },
          body: new Blob(['archive']),
        },
        {},
      ),
    ).resolves.toEqual({ data: 'accepted' });
    expect(body).toBe('archive');
  });

  it('does not open a file reader when already cancelled', async () => {
    const local = largeFile();
    const form = new FormData();
    form.append('file', local.file);
    const abort = new AbortController();
    abort.abort();
    await expect(
      send(
        new URL('http://127.0.0.1:1/api/upload'),
        {
          method: 'POST',
          body: form,
        },
        { signal: abort.signal },
      ),
    ).rejects.toMatchObject({ reason: 'NETWORK' });
    expect(local.read()).toBe(0);
  });

  it('closes the request when reading the file fails', async () => {
    const file = new File([], 'broken.tar.gz');
    Object.defineProperty(file, 'size', { value: 1000 });
    file.stream = () =>
      new ReadableStream({
        start(controller) {
          controller.error(new Error('File changed'));
        },
      });
    const form = new FormData();
    form.append('file', file);
    const url = await serve((request) => request.resume());
    await expect(
      send(url, { method: 'POST', body: form }, {}),
    ).rejects.toMatchObject({ reason: 'NETWORK' });
  });

  it('returns a redirect without replaying the write or forwarding its credential', async () => {
    let requests = 0;
    const url = await serve((_request, response) => {
      requests++;
      response.writeHead(307, { location: '/another-upload' });
      response.end();
    });
    await expect(
      send(url, { method: 'POST', body: new Blob(['archive']) }, {}),
    ).rejects.toMatchObject({ status: 307, reason: 'HTTP_307' });
    expect(requests).toBe(1);
  });
});
