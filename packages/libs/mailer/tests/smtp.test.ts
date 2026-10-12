import { createServer, type Socket } from 'node:net';
import { afterEach, expect, it } from 'vitest';
import { createSmtpTransport } from '../src/index.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((close) => close()));
});

async function receiver(stall = false) {
  const sockets = new Set<Socket>();
  const messages: string[] = [];
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 local.test ESMTP\r\n');
    let input = '';
    let data = false;
    let message = '';
    socket.on('data', (chunk) => {
      input += chunk.toString();
      while (input.includes('\r\n')) {
        const end = input.indexOf('\r\n');
        const line = input.slice(0, end);
        input = input.slice(end + 2);
        if (data && line !== '.') {
          message += `${line}\r\n`;
          continue;
        }
        if (data) {
          data = false;
          messages.push(message);
          if (!stall) socket.write('250 queued\r\n');
        } else if (line.startsWith('EHLO'))
          socket.write('250-local.test\r\n250 PIPELINING\r\n');
        else if (line === 'DATA') {
          data = true;
          socket.write('354 send data\r\n');
        } else if (line === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No SMTP port.');
  cleanups.push(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  return { port: address.port, messages, sockets };
}

it('submits a real local SMTP message and closes its socket', async () => {
  const smtp = await receiver();
  const transport = createSmtpTransport({
    provider: 'smtp',
    host: '127.0.0.1',
    port: smtp.port,
    from: 'sender@example.test',
  });
  const result = await transport.send({
    to: 'recipient@example.test',
    subject: 'Synthetic message',
    text: 'Synthetic text',
  });
  expect(result.status).toBe('accepted');
  expect(smtp.messages).toHaveLength(1);
  expect(smtp.messages[0]).toContain('Synthetic text');
  await transport.close();
});

it('ends a stalled DATA operation after cancellation and reports an unknown submission', async () => {
  const smtp = await receiver(true);
  const transport = createSmtpTransport({
    provider: 'smtp',
    host: '127.0.0.1',
    port: smtp.port,
    from: 'sender@example.test',
  });
  const cancel = new AbortController();
  const completion = transport.send(
    {
      to: 'recipient@example.test',
      subject: 'Synthetic message',
      text: 'Synthetic text',
    },
    { signal: cancel.signal },
  );
  await import('vitest').then(({ vi }) =>
    vi.waitFor(() => expect(smtp.messages).toHaveLength(1)),
  );
  cancel.abort();
  expect((await completion).status).toBe('submission_unknown');
  await import('vitest').then(({ vi }) =>
    vi.waitFor(() => expect(smtp.sockets.size).toBe(0)),
  );
  await transport.close();
});
