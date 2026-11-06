import { expect, it, vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createEchoAdapter } from '../src/agent/adapters/echo.ts';
import { readConnections, readSettings } from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { RunnerDaemon } from '../src/core/loop.ts';
import { MODEL_REFRESH_INTERVAL_MS } from '../src/core/tool-capabilities.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  registerRunner,
  removeDir,
  tempDir,
  workRootOf,
} from './helpers.ts';

it('reports a changed program on heartbeats while a running task remains active', async () => {
  const home = tempDir('runner-status-');
  const server = new FakeServer();
  let daemon: RunnerDaemon | undefined;
  const logs: string[] = [];
  vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
  try {
    await server.listen();
    const cli = path.join(home, 'appcli.mjs');
    await writeFile(cli, "process.stdout.write('appcli');\n");
    await registerRunner(server.url, cliEnv(home), ['--cli', `appcli=${cli}`]);
    const paths = runnerPaths(home, workRootOf(home));
    const realNow = Date.now;
    let elapsed = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + elapsed);
    let version = '2.0.28';
    const adaptersFor = vi.fn(() => {
      let cached:
        | Promise<{
            installed: boolean;
            authenticated: boolean;
            version: string;
            path: string;
          }>
        | undefined;
      return new Map([
        [
          'claude' as const,
          {
            ...createEchoAdapter(),
            detect: () =>
              (cached ??= Promise.resolve({
                installed: true,
                authenticated: true,
                version,
                path: '/same/tool',
              })),
          },
        ],
      ]);
    });
    daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: await readConnections(paths),
      adapters: new Map([['claude', createEchoAdapter()]]),
      adaptersFor,
      readDisk: async () => undefined,
      timings: {
        heartbeatIntervalMs: 60_000,
        pollTimeoutMs: 100,
        pollFallbackMs: 100,
      },
      log: (message) => logs.push(message),
    });
    await daemon.start();
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say ready\nwait-input' },
    });
    await waitFor(
      () => [...run.events.values()].some((event) => event.type === 'text'),
      10_000,
      'active task',
    ).catch((error: unknown) => {
      throw new Error(
        `${String(error)}; ${logs.join('; ')}; ${JSON.stringify(run.fail)}`,
      );
    });
    const link = daemon['links'][0]!;
    await daemon.heartbeat(link);
    await (
      await link.detection?.capabilities
    )?.['pending'];
    await daemon.heartbeat(link);
    expect(server.lastHeartbeat()?.tools[0]?.version).toBe('2.0.28');
    version = '2.0.29';
    elapsed += MODEL_REFRESH_INTERVAL_MS;
    await daemon.heartbeat(link);
    await (
      await link.detection?.capabilities
    )?.['pending'];
    await daemon.heartbeat(link);
    expect(server.lastHeartbeat()?.tools[0]).toMatchObject({
      version: '2.0.29',
      path: '/same/tool',
    });
    expect(daemon.activeRuns).toContain(run.payload.run.id);
    expect(run.complete).toBeUndefined();
    expect(adaptersFor.mock.calls.length).toBe(3);
  } finally {
    vi.restoreAllMocks();
    await daemon?.stop();
    vi.unstubAllEnvs();
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
  }
}, 30_000);
