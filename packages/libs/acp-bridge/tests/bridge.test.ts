import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BRIDGE_HEADERS } from '../src/protocol.js';

interface Seen {
  readonly path: string;
  readonly key: string | undefined;
  readonly person: string | undefined;
  readonly body: Record<string, unknown>;
}

type Answer = { readonly status?: number; readonly data?: unknown };

let root: string;
let server: Server;
let seen: Seen[];
let answer: (request: Seen) => Answer;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'acp-bridge-run-'));
  // No agent is found: the bridge looks in the home directory and on PATH, both empty here.
  vi.stubEnv('HOME', root);
  seen = [];
  server = createServer((request, response) => {
    let text = '';
    request.on('data', (chunk: Buffer) => (text += chunk.toString()));
    request.on('end', () => {
      const one: Seen = {
        path: request.url ?? '',
        key: request.headers[BRIDGE_HEADERS.computerKey] as string | undefined,
        person: request.headers.authorization,
        body: JSON.parse(text || '{}') as Record<string, unknown>,
      };
      seen.push(one);
      const { status = 200, data } = one.path.endsWith('/poll')
        ? { data: { commands: [] } }
        : answer(one);
      const body = JSON.stringify(
        status === 200
          ? { data }
          : { error: { reason: 'AGENT_SESSIONS_COMPUTER_KEY_INVALID' } },
      );
      // A poll waits a little, as the application's does.
      setTimeout(
        () => response.writeHead(status).end(body),
        one.path.endsWith('/poll') ? 30 : 0,
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
});

async function run(
  reconnect?: boolean,
): Promise<{ readonly done: Promise<void>; readonly stop: () => void }> {
  const { runBridge } = await import('../src/bridge.js');
  const stop = new AbortController();
  const done = runBridge({
    server: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    headers: { authorization: 'Bearer person' },
    client: { name: 'test', version: '0.0.0' },
    stateFile: path.join(root, 'state.json'),
    env: { PATH: '' },
    ...(reconnect === undefined ? {} : { reconnect }),
    signal: stop.signal,
    log: () => undefined,
  });
  return { done, stop: () => stop.abort() };
}

async function until(test: () => boolean): Promise<void> {
  for (let waited = 0; waited < 5_000; waited += 10) {
    if (test()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('It did not happen.');
}

const registers = (): Seen[] =>
  seen.filter((request) => request.path.endsWith('/register'));

describe('runBridge', () => {
  it('connects as the person once, then with the computer’s key kept for its owner only', async () => {
    answer = (request) => ({
      data: {
        computerId: 'c1',
        ...(request.person && !request.key ? { key: 'k1' } : {}),
      },
    });
    const { done, stop } = await run();
    await until(
      () =>
        registers().length >= 2 &&
        seen.some((request) => request.path.endsWith('/poll')),
    );
    stop();
    await done;

    expect(registers()[0]).toMatchObject({
      person: 'Bearer person',
      key: undefined,
      body: { computerId: null, bridgeStartedAt: expect.any(String) },
    });
    for (const later of seen.slice(1))
      expect(later).toMatchObject({ key: 'k1', person: undefined });
    const file = path.join(root, 'state.json');
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({
      computerId: 'c1',
      key: 'k1',
    });
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  it('stops when the application no longer accepts the key, if it may not connect again', async () => {
    await writeFile(
      path.join(root, 'state.json'),
      JSON.stringify({ computerId: 'c1', key: 'old' }),
    );
    answer = (request) =>
      request.key ? { status: 401 } : { data: { computerId: 'c2', key: 'k2' } };
    const { done } = await run(false);
    await expect(done).rejects.toMatchObject({
      name: 'BridgeStopped',
      message: expect.stringMatching(/no longer connected/u),
    });
    expect(registers().every((request) => request.key === 'old')).toBe(true);
  });

  it('connects again as the person when the key is refused at start', async () => {
    await writeFile(
      path.join(root, 'state.json'),
      JSON.stringify({ computerId: 'c1', key: 'old' }),
    );
    answer = (request) =>
      request.key === 'old'
        ? { status: 401 }
        : {
            data: {
              computerId: 'c1',
              ...(request.key ? {} : { key: 'new' }),
            },
          };
    const { done, stop } = await run();
    await until(() => seen.some((request) => request.key === 'new'));
    stop();
    await done;

    expect(registers()[1]).toMatchObject({
      person: 'Bearer person',
      key: undefined,
      body: { computerId: 'c1' },
    });
    expect(
      JSON.parse(await readFile(path.join(root, 'state.json'), 'utf8')),
    ).toEqual({ computerId: 'c1', key: 'new' });
  });
});
