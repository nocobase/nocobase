import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { legacyMetaPath } from '../src/core/checkout.ts';
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

  const daemon = async (pruneStore: DaemonOptions['pruneStore']) => {
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
    });
    daemons.push(runner);
    return runner;
  };

  const abandoned = () => {
    const dir = path.join(`${home}-work`, 'app', 'abandoned-task');
    mkdirSync(path.dirname(legacyMetaPath(dir)), { recursive: true });
    writeFileSync(
      legacyMetaPath(dir),
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
    await runner['collectGarbage']();
    expect(prune).not.toHaveBeenCalled();
    deliver.resolve();
    await starting.promise;
    await runner.pruneStore();
    expect(prune).not.toHaveBeenCalled();
    finishStart.resolve();
    expect(await claim).toBe(1);
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
    await runner['collectGarbage']();
    await worker.exited;
    expect(runner.activeRuns).toEqual([]);
    expect(prune).not.toHaveBeenCalled();
    deliver.resolve();
    expect(await pending).toBe(0);
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
    finish.resolve();
    await collection;
    expect(await runner['claimFrom'](link, 1, false)).toBe(1);
    await waitFor(() => run.complete);
  });

  it('releases the claim exclusion after a failed request so pending cleanup can proceed', async () => {
    const prune = vi.fn(async () => true);
    const runner = await daemon(prune);
    const link = runner['links'][0]!;
    const response = Promise.withResolvers<never>();
    vi.spyOn(link.client, 'request').mockReturnValue(response.promise);
    const claim = runner['claimFrom'](link, 1, false);
    // Observe rejection while driving the response, before asserting the settled claim below.
    void claim.catch(() => undefined);
    abandoned();
    await runner['collectGarbage']();
    expect(prune).not.toHaveBeenCalled();
    response.reject(new Error('claim unavailable'));
    await expect(claim).rejects.toThrow('claim unavailable');
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
