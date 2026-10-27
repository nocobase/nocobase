import { afterEach, describe, expect, it } from 'vitest';

import { claim, createHarness, type Harness } from './harness.js';
import { RunnerDaemon } from '../../../app/agent-runner/src/core/loop.ts';
import {
  acquireLock,
  taskWorkDir,
} from '../../../app/agent-runner/src/core/checkout.ts';
import { loadAdapters } from '../../../app/agent-runner/src/agent/adapters/registry.ts';
import { ApiClient } from '../../../app/agent-runner/src/lib/http.ts';
import { runnerPaths } from '../../../app/agent-runner/src/lib/home.ts';
import { workspaceInUse } from '../../../app/agent-runner/src/core/workspace-use.ts';
import {
  HEADERS,
  PROTOCOL_VERSION,
  RUNNER_ROUTES,
  type RunPayload,
} from '../../../app/agent-runner/src/protocol/index.ts';
import type {
  AppConnection,
  AppRegistration,
  RunnerSettings,
} from '../../../app/agent-runner/src/lib/config.ts';
import {
  FAST_TIMINGS,
  removeDir,
  tempDir,
} from '../../../app/agent-runner/tests/helpers.ts';

async function waitFor<T>(
  check: () => T | undefined | false | Promise<T | undefined | false>,
  timeoutMs: number,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value !== undefined && value !== false) return value;
    if (Date.now() > deadline)
      throw new Error('Timed out waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe('runner startup workspace timeout', () => {
  let harness: Harness | undefined;
  let daemon: RunnerDaemon | undefined;
  let cleanupLock: Awaited<ReturnType<typeof acquireLock>> | undefined;
  let home: string | undefined;
  let workRoot: string | undefined;

  afterEach(async () => {
    await daemon?.stop();
    await cleanupLock?.release();
    await harness?.close();
    if (home) removeDir(home);
    if (workRoot) removeDir(workRoot);
    harness = undefined;
    daemon = undefined;
    cleanupLock = undefined;
    home = undefined;
    workRoot = undefined;
  });

  it('reports a real startup cleanup timeout as workspaceBusy and requeues the last attempt', async () => {
    harness = await createHarness();
    const agentId = await harness.createAgent({ maxAttempts: 1 });
    const runId = await harness.enqueue(agentId, 'cleanup-timeout');
    const runner = await harness.registerRunner({ slots: 1 });

    home = tempDir('runner-startup-workspace-busy-home-');
    workRoot = `${home}-work`;
    const paths = runnerPaths(home, workRoot);
    const registration: AppRegistration = {
      key: 'test-app',
      app: { id: 'test-app', name: 'Test App' },
      server: 'http://agents.test',
      runnerId: runner.runnerId,
      heartbeatIntervalMs: 60_000,
      pollTimeoutMs: 200,
      variables: {},
      cli: {},
      registeredAt: new Date().toISOString(),
    };
    const connection: AppConnection = {
      registration,
      runnerKey: runner.key,
    };
    let workspaceDir: string | undefined;
    const client = new ApiClient({
      server: registration.server,
      headers: {
        [HEADERS.runnerKey]: runner.key,
        [HEADERS.protocol]: String(PROTOCOL_VERSION),
      },
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const path = url.pathname.replace(/^\/api/u, '');
        url.pathname = path;
        const response = await harness!.app.fetch(new Request(url, init));
        if (path === RUNNER_ROUTES.claim.replace(/^\/api/u, '')) {
          const body = (await response.clone().json()) as {
            data: { runs: RunPayload[] };
          };
          const payload = body.data.runs[0];
          if (payload) {
            workspaceDir = taskWorkDir(
              paths,
              registration.key,
              payload.workspace.key ?? payload.subject.key,
            );
            cleanupLock = await acquireLock(`${workspaceDir}.lock`);
          }
        }
        return response;
      },
    });
    const settings: RunnerSettings = {
      name: 'test-runner',
      slots: 1,
      agentTools: 'runner',
      autoUpdate: false,
      minFreeDisk: null,
    };
    daemon = new RunnerDaemon({
      paths,
      settings,
      connections: [connection],
      adapters: loadAdapters({
        ...process.env,
        NOCOBASE_RUNNER_ADAPTER: 'echo',
      }),
      slots: 1,
      timings: {
        // Selection is fetched first, then background detection reaches the server on a later heartbeat.
        heartbeatIntervalMs: FAST_TIMINGS.heartbeatIntervalMs,
        pollTimeoutMs: 200,
        pollFallbackMs: 100,
        workspaceCleanupWaitMs: 0,
      },
      clients: new Map([[registration.key, client]]),
      pruneStore: async () => false,
      log: () => undefined,
    });

    await daemon.start();
    const queued = await waitFor(async () => {
      const run = await harness!.services.runs.get(runId);
      return run.status === 'queued' && run.failureReason === 'workspaceBusy'
        ? run
        : undefined;
    }, 15_000);
    expect(queued).toMatchObject({
      status: 'queued',
      failureReason: 'workspaceBusy',
      runnerId: null,
      maxAttempts: 1,
      attempt: 2,
    });
    expect(workspaceDir).toBeDefined();
    expect(await workspaceInUse(paths, workspaceDir!)).toBe(false);

    await daemon.stop();
    daemon = undefined;
    await cleanupLock.release();
    cleanupLock = undefined;
    harness.clock.advance(31_000);
    const heartbeat = await harness.request(
      'POST',
      '/agents/runners/heartbeat',
      {
        runnerKey: runner.key,
        body: {
          version: '0.0.2',
          features: ['workspaceKey', 'input', 'checkout', 'directories'],
          tools: [{ kind: 'claude', authenticated: true }],
          active: [],
          load: { slots: 1, free: 1 },
        },
      },
    );
    expect(heartbeat.status).toBe(200);
    const reclaimed = await claim(harness, runner);
    expect(reclaimed[0]?.run).toMatchObject({ id: runId, attempt: 2 });
  });
});
