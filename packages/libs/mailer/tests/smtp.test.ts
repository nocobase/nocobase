import { createServer, type Socket } from 'node:net';
import { afterEach, expect, it, vi } from 'vitest';
import { createSmtpTransport } from '../src/index.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((close) => close()));
});

async function receiver(stall = false) {
  const sockets = new Set<Socket>();
  const messages: string[] = [];
  let connections = 0;
  const server = createServer((socket) => {
    connections++;
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
          message = '';
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
  return {
    port: address.port,
    messages,
    sockets,
    get connections() {
      return connections;
    },
    resume() {
      stall = false;
      for (const socket of sockets) socket.write('250 queued\r\n');
    },
  };
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

const message = {
  to: 'recipient@example.test',
  subject: 'Synthetic',
  text: 'Synthetic',
};
const sender = (port: number) =>
  createSmtpTransport({
    provider: 'smtp',
    host: '127.0.0.1',
    port,
    from: 'sender@example.test',
  });

it('reuses exactly one real connection for sequential and concurrent submissions until close', async () => {
  const smtp = await receiver();
  const transport = sender(smtp.port);
  cleanups.push(() => transport.close());
  expect(smtp.connections).toBe(0);
  expect((await transport.send(message)).status).toBe('accepted');
  expect((await transport.send(message)).status).toBe('accepted');
  expect(
    (await Promise.all([transport.send(message), transport.send(message)])).map(
      (result) => result.status,
    ),
  ).toEqual(['accepted', 'accepted']);
  expect(smtp.messages).toHaveLength(4);
  expect(smtp.connections).toBe(1);
  expect(smtp.sockets.size).toBe(1);
  await transport.close();
  await vi.waitFor(() => expect(smtp.sockets.size).toBe(0));
  expect((await transport.send(message)).status).toBe('failed');
  expect(smtp.connections).toBe(1);
});

it('aborts only the waiting submission while the active message keeps its reusable connection', async () => {
  const smtp = await receiver(true);
  const transport = sender(smtp.port);
  cleanups.push(() => transport.close());
  const active = transport.send(message);
  await vi.waitFor(() => expect(smtp.messages).toHaveLength(1));
  const cancelled = new AbortController();
  const waiting = transport.send(
    { ...message, subject: 'Must not be sent' },
    { signal: cancelled.signal },
  );
  cancelled.abort();
  expect((await waiting).status).toBe('submission_unknown');
  expect(smtp.sockets.size).toBe(1);
  smtp.resume();
  expect((await active).status).toBe('accepted');
  expect((await transport.send(message)).status).toBe('accepted');
  expect(smtp.messages).toHaveLength(2);
  expect(smtp.connections).toBe(1);
});

it('never replays a submission whose DATA response was lost, and reconnects for a later explicit send', async () => {
  const smtp = await receiver(true);
  const transport = sender(smtp.port);
  cleanups.push(() => transport.close());
  const pending = transport.send(message);
  await vi.waitFor(() => expect(smtp.messages).toHaveLength(1));
  for (const socket of smtp.sockets) socket.destroy();
  expect((await pending).status).toBe('submission_unknown');
  expect(smtp.connections).toBe(1);
  expect(smtp.messages).toHaveLength(1);
  smtp.resume();
  expect(
    (await transport.send({ ...message, subject: 'Later explicit send' }))
      .status,
  ).toBe('accepted');
  expect(smtp.connections).toBe(2);
  expect(smtp.messages).toHaveLength(2);
});

it('cancels a stalled send and all waiting work during shutdown without transmitting it', async () => {
  const smtp = await receiver(true);
  const transport = sender(smtp.port);
  const active = transport.send(message);
  await vi.waitFor(() => expect(smtp.messages).toHaveLength(1));
  const waiting = transport.send({ ...message, subject: 'Must not be sent' });
  await transport.close();
  expect((await active).status).toBe('submission_unknown');
  expect((await waiting).status).toBe('submission_unknown');
  await vi.waitFor(() => expect(smtp.sockets.size).toBe(0));
  expect(smtp.messages).toHaveLength(1);
  expect(smtp.connections).toBe(1);
});

it('enforces the original execution deadline without retrying stalled DATA', async () => {
  const smtp = await receiver(true);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const transport = sender(smtp.port);
  try {
    const pending = transport.send(message);
    await vi.waitFor(() => expect(smtp.messages).toHaveLength(1));
    await vi.advanceTimersByTimeAsync(20_001);
    expect((await pending).status).toBe('submission_unknown');
    expect(smtp.messages).toHaveLength(1);
    expect(smtp.connections).toBe(1);
  } finally {
    vi.useRealTimers();
    await transport.close();
  }
});
