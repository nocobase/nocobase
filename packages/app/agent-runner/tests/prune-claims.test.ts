import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { workspaceRecordPath } from '../src/core/checkout.ts';
import { spoolPaths } from '../src/core/events.ts';
import { RunnerDaemon, type DaemonOptions } from '../src/core/loop.ts';
import { readConnections, readSettings } from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { RUNNER_ROUTES } from '../src/protocol/index.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  FAST_TIMINGS,
  registerRunner,
  removeDir,
  tempDir,
  writeFakeCli,
} from './helpers.ts';

describe('claiming and pruning the shared store', () => {
  let server: FakeServer;
  let home: string;
  const daemons: RunnerDaemon[] = [];

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-prune-claims-');
    vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
    await registerRunner(server.url, cliEnv(home), [
      '--cli',
      `appcli=${writeFakeCli(home)}`,
    ]);
  });

  afterEach(async () => {
    for (const runner of daemons.splice(0)) await runner.stop();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    await server.close();
    removeDir(home);
    removeDir(`${home}-work`);
  });

  const daemon = async (
    pruneStore: DaemonOptions['pruneStore'],
    readDisk?: DaemonOptions['readDisk'],
  ) => {
    const paths = runnerPaths(home, `${home}-work`);
    const [connection] = await readConnections(paths);
    if (connection === undefined) throw new Error('Not registered.');
    const runner = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [connection],
      adapters: new Map(),
      timings: FAST_TIMINGS,
      log: () => {},
      pruneStore,
      ...(readDisk ? { readDisk } : {}),
    });
    daemons.push(runner);
    return runner;
  };

  const abandoned = () => {
    const dir = path.join(`${home}-work`, 'app', 'abandoned-task');
    const record = workspaceRecordPath(runnerPaths(home, `${home}-work`), dir);
    mkdirSync(dir, { recursive: true });
    mkdirSync(path.dirname(record), { recursive: true });
    writeFileSync(
      record,
      JSON.stringify({
        subjectKey: 'abandoned-task',
        repos: [],
        lastUsedAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
      }),
    );
  };

  /** Holds a real server response after it has assigned any leases, before the daemon receives it. */
  const holdClaim = (runner: RunnerDaemon) => {
    const link = runner['links'][0]!;
    const received = Promise.withResolvers<void>();
    const deliver = Promise.withResolvers<void>();
    const request = link.client.request.bind(link.client);
    const spy = vi
      .spyOn(link.client, 'request')
      .mockImplementation(async (...args) => {
        const response = await request(...args);
        if (args[1] === RUNNER_ROUTES.claim) {
          received.resolve();
          await deliver.promise;
        }
        return response;
      });
    return { link, received, deliver, spy };
  };

  it('finishes a received claim and worker startup before pruning, without delaying lease renewal', async () => {
    const prune = vi.fn(async () => true);
    const runner = await daemon(prune);
    const run = server.enqueue({
      subject: { key: 'install-task' },
      prompt: { system: '', turn: 'sleep 1000\nsay done', session: 'fresh' },
    });
    const { link, received, deliver } = holdClaim(runner);
    // Match daemon startup: report detection before holding the post-claim policy check.
    await runner.heartbeat(link);
    const checkingPolicy = Promise.withResolvers<void>();
    const finishPolicy = Promise.withResolvers<void>();
    const policy = runner['policyOf'].bind(runner);
    vi.spyOn(
      runner as unknown as { policyOf: typeof policy },
      'policyOf',
    ).mockImplementation(async (...args: Parameters<typeof policy>) => {
      checkingPolicy.resolve();
      await finishPolicy.promise;
      return policy(...args);
    });
    const supervisor = runner['supervisor'];
    const spawn = supervisor.spawn.bind(supervisor);
    const starting = Promise.withResolvers<void>();
    const finishStart = Promise.withResolvers<void>();
    vi.spyOn(supervisor, 'spawn').mockImplementation(async (...args) => {
      starting.resolve();
      await finishStart.promise;
      return spawn(...args);
    });

    const claim = runner['claimFrom'](link, 1, false);
    await received.promise;
    abandoned();
    const collection = runner['collectGarbage']();
    expect(prune).not.toHaveBeenCalled();
    expect(await runner['claimFrom'](link, 1, false)).toBe(0);
    deliver.resolve();
    await checkingPolicy.promise;
    expect(await runner['claimFrom'](link, 1, false)).toBe(0);
    expect(prune).not.toHaveBeenCalled();
    finishPolicy.resolve();
    await starting.promise;
    await runner.pruneStore();
    expect(prune).not.toHaveBeenCalled();
    finishStart.resolve();
    expect(await claim).toBe(1);
    await collection;
    await waitFor(() => run.leases > 0);
    expect(prune).not.toHaveBeenCalled();
    await waitFor(() => prune.mock.calls.length === 1);
    expect(run.complete).toBeDefined();
  });

  it('waits for an outstanding claim when the last worker exits', async () => {
    const prune = vi.fn(async () => true);
    const runner = await daemon(prune);
    const link = runner['links'][0]!;
    server.enqueue({
      subject: { key: 'active-task' },
      prompt: { system: '', turn: 'sleep 500\nsay done', session: 'fresh' },
    });
    await runner['claimFrom'](link, 1, false);
    const [worker] = runner['supervisor'].runs.values();
    if (worker === undefined) throw new Error('No worker started.');
    const { received, deliver } = holdClaim(runner);
    const pending = runner['claimFrom'](link, 1, false);
    await received.promise;
    abandoned();
    const collection = runner['collectGarbage']();
    await worker.exited;
    expect(runner.activeRuns).toEqual([]);
    expect(prune).not.toHaveBeenCalled();
    deliver.resolve();
    expect(await pending).toBe(0);
    await collection;
    expect(prune).toHaveBeenCalledOnce();
  });

  it('sends no new claim while pruning, then claims and starts work after it finishes', async () => {
    const started = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<void>();
    const runner = await daemon(async () => {
      started.resolve();
      await finish.promise;
      return true;
    });
    const run = server.enqueue({ subject: { key: 'queued-task' } });
    const link = runner['links'][0]!;
    const request = vi.spyOn(link.client, 'request');
    abandoned();
    const collection = runner['collectGarbage']();
    await started.promise;
    expect(await runner['claimFrom'](link, 1, false)).toBe(0);
    expect(request).not.toHaveBeenCalled();
    expect(run.status).toBe('queued');
    await runner.heartbeat(link);
    expect(server.lastHeartbeat()?.load).toMatchObject({
      free: 0,
      draining: 'pruning',
    });
    finish.resolve();
    await collection;
    expect(await runner['claimFrom'](link, 1, false)).toBe(1);
    await waitFor(() => run.complete);
  });

  it('pauses new claims when cleanup cannot recover space and resumes on heartbeat without any worker exit', async () => {
    let freeBytes = 0;
    const runner = await daemon(
      async () => true,
      async () => ({ freeBytes, totalBytes: 100 * 1024 ** 3 }),
    );
    const run = server.enqueue({ subject: { key: 'waiting-for-space' } });
    await runner.start();
    await waitFor(() => runner['diskPaused'] && !runner['collecting']);
    expect(run.status).toBe('queued');
    expect(runner.activeRuns).toEqual([]);
    freeBytes = 10 * 1024 ** 3;
    await waitFor(() => run.complete);
    expect(runner['diskPaused']).toBe(false);
  });

  it('collects immediately when a heartbeat first discovers pressure, without collecting again on every heartbeat', async () => {
    let freeBytes = 10 * 1024 ** 3;
    const runner = await daemon(
      async () => true,
      async () => ({ freeBytes, totalBytes: 100 * 1024 ** 3 }),
    );
    const link = runner['links'][0]!;
    await runner.heartbeat(link);
    const collect = vi.spyOn(runner, 'collectGarbage');
    freeBytes = 0;
    await runner.heartbeat(link);
    await runner['collecting'];
    expect(collect).toHaveBeenCalledOnce();
    expect(runner['diskPaused']).toBe(true);
    await runner.heartbeat(link);
    expect(collect).toHaveBeenCalledOnce();
    freeBytes = 10 * 1024 ** 3;
    await runner.heartbeat(link);
    expect(runner['diskPaused']).toBe(false);
  });

  it('honors a heartbeat pause that arrives while the claim disk probe is still pending', async () => {
    const probing = Promise.withResolvers<void>();
    const probe = Promise.withResolvers<{
      freeBytes: number;
      totalBytes: number;
    }>();
    let first = true;
    const runner = await daemon(
      async () => true,
      async () => {
        if (first) {
          first = false;
          probing.resolve();
          return probe.promise;
        }
        return { freeBytes: 0, totalBytes: 100 * 1024 ** 3 };
      },
    );
    const link = runner['links'][0]!;
    const run = server.enqueue({ subject: { key: 'probe-pause-race' } });
    const claim = runner['claimFrom'](link, 1, false);
    await probing.promise;
    await runner.heartbeat(link);
    await runner['collecting'];
    expect(runner['diskPaused']).toBe(true);
    probe.resolve({ freeBytes: 10 * 1024 ** 3, totalBytes: 100 * 1024 ** 3 });
    expect(await claim).toBe(0);
    expect(run.status).toBe('queued');
  });

  it('reports disk-full worker spawn failures and failed tool output with the dedicated reason', async () => {
    const runner = await daemon(async () => true);
    const link = runner['links'][0]!;
    const failedSpawn = server.enqueue({ subject: { key: 'spawn-disk-full' } });
    const spy = vi
      .spyOn(runner['supervisor'], 'spawn')
      .mockRejectedValueOnce(
        Object.assign(new Error('write'), { code: 'ENOSPC' }),
      );
    expect(await runner['claimFrom'](link, 1, false)).toBe(1);
    expect(failedSpawn.fail?.reason).toBe('runnerDiskFull');
    spy.mockRestore();
    const failedTool = server.enqueue({
      subject: { key: 'tool-disk-full' },
      prompt: {
        system: '',
        turn: 'sleep 1000\nsay before failure\nfail toolProcess No space left on device',
        session: 'fresh',
      },
    });
    expect(await runner['claimFrom'](link, 1, false)).toBe(1);
    await waitFor(() => failedTool.start);
    const ack = spoolPaths(
      runnerPaths(home, `${home}-work`).runsDir,
      failedTool.payload.run.id,
    ).ack;
    writeFileSync(ack, '0');
    chmodSync(ack, 0o400);
    await waitFor(() => failedTool.fail);
    expect(failedTool.fail?.reason).toBe('runnerDiskFull');
  });

  it('releases the claim exclusion after a failed request so pending cleanup can proceed', async () => {
    const prune = vi.fn(async () => true);
    const runner = await daemon(prune);
    const link = runner['links'][0]!;
    await runner.heartbeat(link);
    const response = Promise.withResolvers<never>();
    vi.spyOn(link.client, 'request').mockReturnValue(response.promise);
    const claim = runner['claimFrom'](link, 1, false);
    // Observe rejection while driving the response, before asserting the settled claim below.
    void claim.catch(() => undefined);
    await waitFor(() => runner['claimsInFlight'] === 1);
    abandoned();
    const collection = runner['collectGarbage']();
    expect(prune).not.toHaveBeenCalled();
    response.reject(new Error('claim unavailable'));
    await expect(claim).rejects.toThrow('claim unavailable');
    await collection;
    expect(prune).toHaveBeenCalledOnce();
  });

  it.each(['false', 'rejection'] as const)(
    'retains cleanup after %s, backs off, and retries without removing another directory',
    async (failure) => {
      let now = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => now);
      const prune = vi.fn(async () => true);
      if (failure === 'false') prune.mockResolvedValueOnce(false);
      else prune.mockRejectedValueOnce(new Error('prune unavailable'));
      const runner = await daemon(prune);
      abandoned();
      await runner['collectGarbage']();
      expect(prune).toHaveBeenCalledTimes(1);
      await runner.pruneStore();
      await runner['collectGarbage']();
      expect(prune).toHaveBeenCalledTimes(1);
      now += 5 * 60_000;
      await runner['collectGarbage']();
      expect(prune).toHaveBeenCalledTimes(2);
      now += 5 * 60_000;
      await runner['collectGarbage']();
      expect(prune).toHaveBeenCalledTimes(2);
    },
  );
});
