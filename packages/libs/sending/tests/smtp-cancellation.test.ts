import { createServer, type Socket } from 'node:net';
import { createLogger } from '@nocobase/logging';
import { expect, it, vi } from 'vitest';
import { createSmtpProviderDefinition } from '../src/email/providers/smtp.js';
import type { PreparedEmailMessage } from '../src/email/types.js';

it('aborts the actual SMTP DATA connection without closing another concurrent submission', async () => {
  const sockets = new Set<Socket>();
  let count = 0;
  let stalled = false;
  const server = createServer((socket) => {
    const sequence = ++count;
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 localhost ESMTP\r\n');
    let buffer = '';
    let data = false;
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let index: number;
      while ((index = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (data) {
          if (line === '.') {
            if (sequence === 1) stalled = true;
            else {
              data = false;
              socket.write('250 Accepted\r\n');
            }
          }
        } else if (line === 'DATA') {
          data = true;
          socket.write('354 Send message\r\n');
        } else if (line === 'QUIT') socket.end('221 Bye\r\n');
        else socket.write('250 localhost\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No SMTP address.');
  const provider = await createSmtpProviderDefinition().createProvider(
    {
      logger: createLogger({ level: 'silent' }),
      now: async () => new Date().toISOString(),
    },
    {
      provider: 'smtp',
      host: '127.0.0.1',
      port: address.port,
      from: 'system@example.test',
    },
  );
  const controller = new AbortController();
  const input = (signal: AbortSignal) => ({
    notificationId: 'test',
    deliveryId: 'test',
    provider: { type: 'smtp' },
    deadline: new Date(Date.now() + 20000).toISOString(),
    signal,
    message: {
      to: 'recipient@example.test',
      content: { subject: 'Test', text: 'Test' },
    } satisfies PreparedEmailMessage,
  });
  try {
    const pending = provider.send(input(controller.signal));
    await vi.waitFor(() => expect(stalled).toBe(true));
    const accepted = provider.send(input(new AbortController().signal));
    controller.abort();
    expect(await pending).toMatchObject({ status: 'submission_unknown' });
    expect(await accepted).toMatchObject({ status: 'accepted' });
    await vi.waitFor(() => expect(sockets.size).toBe(0));
  } finally {
    controller.abort();
    await provider.close?.();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
