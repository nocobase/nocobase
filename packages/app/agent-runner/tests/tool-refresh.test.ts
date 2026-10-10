import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  RegisterRequestSchema,
  HeartbeatRequestSchema,
} from '../src/protocol/index.ts';
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

// Protocol 7 receivers predating requested detection validate this closed vocabulary before ignoring unknown fields.
const legacyFeatures = z.object({
  features: z.array(
    z.enum([
      'input',
      'steer',
      'attachments',
      'checkout',
      'directories',
      'secrets',
      'skills',
      'archives',
      'jobs.build',
      'mounts',
    ]),
  ),
});

it('registers and heartbeats against a receiver predating requested tool detection', async () => {
  const validateRegister = vi.fn((body) => {
    RegisterRequestSchema.parse(body);
    legacyFeatures.parse(body);
  });
  const validateHeartbeat = vi.fn((body) => {
    HeartbeatRequestSchema.parse(body);
    legacyFeatures.parse(body);
  });
  server = new FakeServer({ validateRegister, validateHeartbeat });
  await server.listen();
  home = tempDir('tool-refresh-compatibility-');
  vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
  await registerRunner(server.url, cliEnv(home), [
    '--cli',
    `appcli=${writeFakeCli(home)}`,
  ]);
  const paths = runnerPaths(home, `${home}-work`);
  daemon = new RunnerDaemon({
    paths,
    settings: await readSettings(paths),
    connections: await readConnections(paths),
    adapters: new Map([['claude', createEchoAdapter({ kind: 'claude' })]]),
    timings: FAST_TIMINGS,
    log: () => {},
  });
  await daemon.start();
  await waitFor(() => server.runners.values().next().value!.claims > 0, 5000);
  expect(validateRegister).toHaveBeenCalledOnce();
  expect(validateHeartbeat).toHaveBeenCalled();
  expect(
    server.runners.values().next().value!.register.toolsRefreshSupported,
  ).toBe(true);
  expect(server.lastHeartbeat()?.toolsRefreshSupported).toBe(true);
  expect(server.lastHeartbeat()?.features).not.toContain('tools.refresh');
});

it('waits for concurrent heartbeat detection and its acknowledged report before claiming', async () => {
  let finishReport: () => void = () => {};
  let holdReport = false;
  let reportReceived = false;
  server = new FakeServer({
    beforeHeartbeatResponse: async () => {
      if (!holdReport) return;
      reportReceived = true;
      await new Promise<void>((resolve) => {
        finishReport = resolve;
      });
    },
  });
  await server.listen();
  home = tempDir('tool-refresh-concurrent-');
  vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
  await registerRunner(server.url, cliEnv(home), [
    '--cli',
    `appcli=${writeFakeCli(home)}`,
  ]);
  const paths = runnerPaths(home, `${home}-work`);
  let finishDetection: () => void = () => {};
  let holdDetection = false;
  let detectionStarted = false;
  const detect = vi.fn(async () => {
    if (holdDetection) {
      detectionStarted = true;
      await new Promise<void>((resolve) => {
        finishDetection = resolve;
      });
    }
    return { installed: true, authenticated: !holdDetection };
  });
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
    timings: FAST_TIMINGS,
    log: () => {},
  });
  const link = daemon['links'][0]!;
  await daemon.heartbeat(link);
  const now = Date.now.bind(Date);
  vi.spyOn(Date, 'now').mockImplementation(() => now() + 10 * 60_000 + 1000);
  holdDetection = true;
  holdReport = true;
  const heartbeat = daemon.heartbeat(link);
  await waitFor(() => detectionStarted, 5000);
  const claim = daemon['claimAndStart'](link, 1, false);
  try {
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(server.runners.values().next().value!.claims).toBe(0);
    finishDetection();
    await waitFor(() => reportReceived, 5000);
    expect(server.lastHeartbeat()?.tools[0]?.authenticated).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(server.runners.values().next().value!.claims).toBe(0);
  } finally {
    finishDetection();
    finishReport();
    holdReport = false;
    await heartbeat;
    await claim;
  }
  expect(server.runners.values().next().value!.claims).toBe(1);
  expect(detect).toHaveBeenCalledTimes(2);
});

it('withholds claims after a failed fresh report and retries reporting on the next poll', async () => {
  server = new FakeServer();
  await server.listen();
  home = tempDir('tool-refresh-report-failure-');
  vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
  await registerRunner(server.url, cliEnv(home), [
    '--cli',
    `appcli=${writeFakeCli(home)}`,
  ]);
  const paths = runnerPaths(home, `${home}-work`);
  daemon = new RunnerDaemon({
    paths,
    settings: await readSettings(paths),
    connections: await readConnections(paths),
    adapters: new Map(),
    timings: FAST_TIMINGS,
    log: () => {},
  });
  const link = daemon['links'][0]!;
  await daemon.heartbeat(link);
  const now = Date.now.bind(Date);
  vi.spyOn(Date, 'now').mockImplementation(() => now() + 10 * 60_000 + 1000);
  const request = vi
    .spyOn(link.client, 'request')
    .mockRejectedValueOnce(new Error('report unavailable'));
  expect(await daemon['claimAndStart'](link, 1, false)).toBe(0);
  expect(server.runners.values().next().value!.claims).toBe(0);
  expect(request).toHaveBeenCalledOnce();
  request.mockRestore();
  expect(await daemon['claimAndStart'](link, 1, false)).toBe(0);
  expect(server.runners.values().next().value!.claims).toBe(1);
  expect(server.runners.values().next().value!.heartbeats).toHaveLength(2);
});
