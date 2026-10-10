import { afterEach, expect, it, vi } from 'vitest';
import { createEchoAdapter } from '../src/agent/adapters/echo.ts';
import { RunnerDaemon } from '../src/core/loop.ts';
import { readConnections, readSettings } from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  FAST_TIMINGS,
  registerRunner,
  removeDir,
  tempDir,
  writeFakeCli,
} from './helpers.ts';

let server: FakeServer;
let home: string;
let daemon: RunnerDaemon;
afterEach(async () => {
  await daemon?.stop();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await server?.close();
  if (home) {
    removeDir(home);
    removeDir(`${home}-work`);
  }
});

it('recreates detection on a refresh command and after ten minutes, acknowledging fresh reports', async () => {
  server = new FakeServer();
  await server.listen();
  home = tempDir('tool-refresh-');
  vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
  await registerRunner(server.url, cliEnv(home), [
    '--cli',
    `appcli=${writeFakeCli(home)}`,
  ]);
  const paths = runnerPaths(home, `${home}-work`);
  let authenticated = false;
  const detect = vi.fn(async () => ({ installed: true, authenticated }));
  const adaptersFor = vi.fn(
    () =>
      new Map([
        [
          'claude' as const,
          { ...createEchoAdapter({ kind: 'claude' }), detect },
        ],
      ]),
  );
  daemon = new RunnerDaemon({
    paths,
    settings: await readSettings(paths),
    connections: await readConnections(paths),
    adapters: adaptersFor(),
    adaptersFor,
    timings: FAST_TIMINGS,
    log: () => {},
  });
  await daemon.start();
  await waitFor(() => server.lastHeartbeat(), 5000);
  expect(server.lastHeartbeat()?.tools[0]?.authenticated).toBe(false);
  const initial = detect.mock.calls.length;
  authenticated = true;
  server.toolsRefreshRequestId = 'refresh-one';
  await waitFor(
    () => server.lastHeartbeat()?.toolsRefreshCompletedId === 'refresh-one',
    5000,
  );
  expect(server.lastHeartbeat()?.tools[0]?.authenticated).toBe(true);
  expect(detect).toHaveBeenCalledTimes(initial + 1);
  const sent = server.runners.values().next().value!.heartbeatsSent;
  await waitFor(
    () => server.runners.values().next().value!.heartbeatsSent > sent + 1,
    5000,
  );
  expect(detect).toHaveBeenCalledTimes(initial + 1);
  server.toolsRefreshRequestId = undefined;
  const now = Date.now.bind(Date);
  vi.spyOn(Date, 'now').mockImplementation(() => now() + 10 * 60_000 + 1000);
  authenticated = false;
  await waitFor(
    () => server.lastHeartbeat()?.tools[0]?.authenticated === false,
    5000,
  );
  expect(detect).toHaveBeenCalledTimes(initial + 2);
});

it('refreshes stale detection before claiming even when the next heartbeat is not due', async () => {
  server = new FakeServer();
  await server.listen();
  home = tempDir('tool-refresh-claim-');
  vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
  await registerRunner(server.url, cliEnv(home), [
    '--cli',
    `appcli=${writeFakeCli(home)}`,
  ]);
  const paths = runnerPaths(home, `${home}-work`);
  let authenticated = false;
  const detect = vi.fn(async () => ({ installed: true, authenticated }));
  const adaptersFor = () =>
    new Map([
      ['claude' as const, { ...createEchoAdapter({ kind: 'claude' }), detect }],
    ]);
  daemon = new RunnerDaemon({
    paths,
    settings: await readSettings(paths),
    connections: await readConnections(paths),
    adapters: adaptersFor(),
    adaptersFor,
    timings: { ...FAST_TIMINGS, heartbeatIntervalMs: 60_000 },
    log: () => {},
  });
  await daemon.start();
  expect(server.lastHeartbeat()?.tools[0]?.authenticated).toBe(false);
  const initial = detect.mock.calls.length;
  authenticated = true;
  const now = Date.now.bind(Date);
  vi.spyOn(Date, 'now').mockImplementation(() => now() + 10 * 60_000 + 1000);
  await waitFor(
    () => server.lastHeartbeat()?.tools[0]?.authenticated === true,
    5000,
  );
  expect(detect).toHaveBeenCalledTimes(initial + 1);
});
