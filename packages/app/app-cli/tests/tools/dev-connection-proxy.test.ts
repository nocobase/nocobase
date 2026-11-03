// @vitest-environment node
import http from 'node:http';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { afterEach, expect, it } from 'vitest';

import { createDevConnectionProxy } from '../../src/tools/scripts/dev/connection-proxy.mjs';

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});

async function unusedPort() {
  const server = net.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as net.AddressInfo).port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

it('keeps a module fetch pending across backend downtime and forwards a POST exactly once', async () => {
  const targetPort = await unusedPort();
  const proxy = await createDevConnectionProxy({
    host: '127.0.0.1',
    port: 0,
    targetPort,
  });
  cleanup.push(proxy.close);
  const base = `http://127.0.0.1:${proxy.port}`;
  let received = 0;
  const start = async () => {
    const server = http.createServer(async (request, response) => {
      received++;
      let body = '';
      for await (const chunk of request) body += chunk;
      response.setHeader('connection', 'close');
      response.end(
        `${request.method} ${request.url} ${request.headers.host} ${body}`,
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(targetPort, '127.0.0.1', resolve),
    );
    return async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    };
  };
  let settled = false;
  const pending = fetch(`${base}/main/packages/shared/src/index.ts?t=1`)
    .then((response) => response.text())
    .then((body) => {
      settled = true;
      return body;
    });
  await delay(150);
  expect(settled).toBe(false);
  const stop = await start();
  expect(await pending).toContain(
    `GET /main/packages/shared/src/index.ts?t=1 127.0.0.1:${proxy.port}`,
  );
  await stop();
  const post = fetch(`${base}/main/api/example`, {
    method: 'POST',
    body: 'payload',
  }).then((response) => response.text());
  await delay(150);
  cleanup.push(await start());
  expect(await post).toContain('payload');
  expect(received).toBe(2);
});

it('forwards upgraded connections without interpreting their bytes', async () => {
  const backend = http.createServer();
  backend.on('upgrade', (_request, socket, head) => {
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\n',
    );
    if (head.length) socket.write(head);
    socket.pipe(socket);
  });
  await new Promise<void>((resolve) => backend.listen(0, '127.0.0.1', resolve));
  cleanup.push(
    () => new Promise<void>((resolve) => backend.close(() => resolve())),
  );
  const proxy = await createDevConnectionProxy({
    host: '127.0.0.1',
    port: 0,
    targetPort: (backend.address() as net.AddressInfo).port,
  });
  cleanup.push(proxy.close);
  const socket = net.connect(proxy.port, '127.0.0.1');
  cleanup.push(async () => {
    socket.destroy();
  });
  const reply = new Promise<string>((resolve, reject) => {
    let data = '';
    socket.on('error', reject);
    socket.on('data', (chunk) => {
      data += chunk;
      if (data.includes('hello')) resolve(data);
    });
  });
  socket.write(
    'GET /main/ws HTTP/1.1\r\nHost: app.local\r\nConnection: Upgrade\r\nUpgrade: fixture\r\n\r\nhello',
  );
  expect(await reply).toContain('101 Switching Protocols');
});

it('bounds backend downtime', async () => {
  const proxy = await createDevConnectionProxy({
    host: '127.0.0.1',
    port: 0,
    targetPort: await unusedPort(),
    connectTimeoutMs: 100,
    retryMs: 10,
  });
  cleanup.push(proxy.close);
  await expect(
    fetch(`http://127.0.0.1:${proxy.port}/main/client/index.ts`),
  ).rejects.toThrow();
});

it('does not replay a request after the backend has received it', async () => {
  let requests = 0;
  const backend = http.createServer((request) => {
    requests++;
    request.socket.destroy();
  });
  await new Promise<void>((resolve) => backend.listen(0, '127.0.0.1', resolve));
  cleanup.push(
    () => new Promise<void>((resolve) => backend.close(() => resolve())),
  );
  const proxy = await createDevConnectionProxy({
    host: '127.0.0.1',
    port: 0,
    targetPort: (backend.address() as net.AddressInfo).port,
  });
  cleanup.push(proxy.close);
  await expect(
    fetch(`http://127.0.0.1:${proxy.port}/api/write`, {
      method: 'POST',
      body: 'one mutation',
    }),
  ).rejects.toThrow();
  await delay(100);
  expect(requests).toBe(1);
});

it('drains a large response before closing the client connection', async () => {
  const body = 'export const value = 1;\n'.repeat(100_000);
  const backend = http.createServer((_request, response) => {
    response.setHeader('connection', 'close');
    response.end(body);
  });
  await new Promise<void>((resolve) => backend.listen(0, '127.0.0.1', resolve));
  cleanup.push(
    () => new Promise<void>((resolve) => backend.close(() => resolve())),
  );
  const proxy = await createDevConnectionProxy({
    host: '127.0.0.1',
    port: 0,
    targetPort: (backend.address() as net.AddressInfo).port,
  });
  cleanup.push(proxy.close);
  expect(
    await (await fetch(`http://127.0.0.1:${proxy.port}/module.js`)).text(),
  ).toBe(body);
});

it('closes pending connections when development stops', async () => {
  const proxy = await createDevConnectionProxy({
    host: '127.0.0.1',
    port: 0,
    targetPort: await unusedPort(),
  });
  const socket = net.connect(proxy.port, '127.0.0.1');
  socket.on('error', () => {});
  await new Promise<void>((resolve) => socket.once('connect', resolve));
  const closed = new Promise<void>((resolve) =>
    socket.once('close', () => resolve()),
  );
  await proxy.close();
  await closed;
});
