import { createServer } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationMailer } from '../src/mailers/index.js';

afterEach(() => vi.unstubAllGlobals());

it.each([
  'accepted',
  'refused',
  'disconnected',
  'cancelled',
  'shutdown',
] as const)(
  'preserves %s across a controlled HTTP fixture without resubmission',
  async (mode) => {
    let received!: () => void;
    const submitted = new Promise<void>((resolve) => {
      received = resolve;
    });
    let count = 0;
    const server = createServer(async (request, response) => {
      for await (const _chunk of request) {
        /* consume the request before acknowledging submission */
      }
      count += 1;
      expect(request.headers['idempotency-key']).toBe('synthetic-key');
      received();
      if (mode === 'disconnected') {
        request.socket.destroy();
        return;
      }
      if (mode === 'cancelled' || mode === 'shutdown') return;
      response.writeHead(mode === 'refused' ? 429 : 200, {
        'content-type': 'application/json',
      });
      response.end(
        JSON.stringify(
          mode === 'refused'
            ? {
                name: 'rate_limit_exceeded',
                message: 'synthetic-private-provider-body',
              }
            : { id: 'synthetic-id' },
        ),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('No fixture port.');
    const nativeFetch = globalThis.fetch;
    vi.stubGlobal('fetch', (url: string, options: RequestInit) => {
      expect(url).toBe('https://api.resend.com/emails');
      return nativeFetch(`http://127.0.0.1:${address.port}/emails`, options);
    });
    const mailer = new ApplicationMailer({
      default: 'main',
      main: {
        provider: 'resend',
        apiKey: 'synthetic-private-key',
        from: 'sender@example.test',
      },
    });
    const controller = new AbortController();
    try {
      const completion = mailer.send(
        { to: 'synthetic@example.test', subject: 'Notice', text: 'Synthetic' },
        { signal: controller.signal, idempotencyKey: 'synthetic-key' },
      );
      await submitted;
      if (mode === 'cancelled') controller.abort();
      if (mode === 'shutdown') await mailer.close();
      const result = await completion;
      expect(result.status).toBe(
        mode === 'accepted'
          ? 'accepted'
          : mode === 'refused'
            ? 'failed'
            : 'submission_unknown',
      );
      if (mode === 'refused')
        expect(result).toMatchObject({ disposition: 'same_provider' });
      expect(JSON.stringify(result)).not.toMatch(/synthetic-private/u);
      expect(count).toBe(1);
    } finally {
      controller.abort();
      await mailer.close();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
