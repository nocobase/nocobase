import { createServer } from 'node:http';
import { createServer as createSmtpServer, type Socket } from 'node:net';
import { afterEach, expect, it, vi } from 'vitest';
import { MailSenderFactory } from '../src/mailers/index.js';

afterEach(() => vi.unstubAllGlobals());

async function smtpFixture() {
  const sockets = new Set<Socket>();
  let credentials: { user: string; pass: string } | undefined;
  const server = createSmtpServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 local.test ESMTP\r\n');
    let input = '';
    let inData = false;
    socket.on('data', (chunk) => {
      input += chunk.toString();
      while (input.includes('\r\n')) {
        const end = input.indexOf('\r\n');
        const line = input.slice(0, end);
        input = input.slice(end + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            socket.write('250 queued\r\n');
          }
        } else if (line.startsWith('EHLO')) {
          socket.write(
            '250-local.test\r\n250-AUTH PLAIN\r\n250 PIPELINING\r\n',
          );
        } else if (line.startsWith('AUTH PLAIN ')) {
          const [user = '', pass = ''] = Buffer.from(
            line.slice('AUTH PLAIN '.length),
            'base64',
          )
            .toString('utf8')
            .split('\0')
            .slice(-2);
          credentials = { user, pass };
          socket.write('235 authenticated\r\n');
        } else if (line === 'AUTH PLAIN') {
          socket.write('334 continue\r\n');
        } else if (line === 'DATA') {
          inData = true;
          socket.write('354 send data\r\n');
        } else if (line === 'QUIT') {
          socket.end('221 bye\r\n');
        } else {
          socket.write('250 ok\r\n');
        }
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No SMTP fixture port.');
  return {
    port: address.port,
    get credentials() {
      return credentials;
    },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

it('uses snapshotted legacy SMTP credentials for the first real send', async () => {
  const smtp = await smtpFixture();
  const config = {
    provider: 'smtp' as const,
    host: '127.0.0.1',
    port: smtp.port,
    auth: { user: 'synthetic-user', pass: 'original-pass' },
    from: 'sender@example.test',
  };
  const sender = new MailSenderFactory().createFromConfig(config);
  config.auth.pass = 'changed-pass';
  try {
    await expect(
      sender.send({
        to: 'recipient@example.test',
        subject: 'Snapshot test',
        text: 'Synthetic message',
      }),
    ).resolves.toMatchObject({ status: 'accepted' });
    expect(smtp.credentials).toEqual({
      user: 'synthetic-user',
      pass: 'original-pass',
    });
  } finally {
    await sender.close();
    await smtp.close();
  }
});

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
    let networkClose!: () => void;
    const networkClosed = new Promise<void>((resolve) => {
      networkClose = resolve;
    });
    let networkClosedFlag = false;
    let count = 0;
    const server = createServer(async (request, response) => {
      for await (const _chunk of request) {
        /* consume the request before acknowledging submission */
      }
      count += 1;
      expect(request.headers['idempotency-key']).toBe('synthetic-key');
      received();
      if (mode === 'shutdown') {
        const markClosed = (): void => {
          networkClosedFlag = true;
          networkClose();
        };
        request.socket.once('close', markClosed);
        response.once('close', markClosed);
      }
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
    const mailer = new MailSenderFactory({
      default: 'main',
      main: {
        provider: 'resend',
        apiKey: 'synthetic-private-key',
        from: 'sender@example.test',
      },
    }).create();
    const controller = new AbortController();
    try {
      const completion = mailer.send(
        { to: 'synthetic@example.test', subject: 'Notice', text: 'Synthetic' },
        { signal: controller.signal, idempotencyKey: 'synthetic-key' },
      );
      await submitted;
      if (mode === 'cancelled') controller.abort();
      if (mode === 'shutdown') {
        await mailer.close();
        await networkClosed;
        expect(networkClosedFlag).toBe(true);
      }
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
