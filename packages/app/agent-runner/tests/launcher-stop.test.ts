import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { expect, it } from 'vitest';

import { launcherPidPath, readLauncherPid } from '../src/core/launcher.ts';
import { readDaemonPid } from '../src/core/loop.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  BIN,
  cli,
  cliEnv,
  registerRunner,
  removeDir,
  tempDir,
  workRootOf,
} from './helpers.ts';

it('stops a launcher during backoff and refuses duplicate foreground, background and service starts', async () => {
  const home = tempDir('launcher-backoff-');
  const paths = runnerPaths(home, workRootOf(home));
  const env = cliEnv(home);
  const server = new FakeServer();
  let launcher: ChildProcess | undefined;
  await server.listen();
  try {
    await registerRunner(server.url, env);
    launcher = spawn(process.execPath, [BIN, 'service', 'run'], {
      env: { ...env, NOCOBASE_RUNNER_TIMINGS: '{' },
      stdio: 'ignore',
    });
    const closed = new Promise<number | null>((resolve) =>
      launcher!.on('close', resolve),
    );
    const log = () =>
      existsSync(paths.daemonLog) ? readFileSync(paths.daemonLog, 'utf8') : '';
    await waitFor(() => log().includes('retrying in 10 seconds'));
    const owner = await readLauncherPid(paths);
    expect(owner?.pid).toBe(launcher.pid);
    for (const args of [
      ['start'],
      ['start', '--foreground'],
      ['service', 'run'],
    ]) {
      const duplicate = await cli(args, env);
      expect(duplicate.code).toBe(6);
      expect(duplicate.stderr).toContain('launcher is already running');
      expect((await readLauncherPid(paths))?.pid).toBe(owner?.pid);
    }
    const stopped = await cli(['stop', '--json'], env);
    expect(stopped.code).toBe(0);
    expect(JSON.parse(stopped.stdout).result.stopped).toBe(true);
    expect(await closed).toBe(0);
    expect(await readLauncherPid(paths)).toBeUndefined();
    expect(existsSync(launcherPidPath(paths))).toBe(false);
    const afterStop = log();
    // Observe beyond the real first retry interval: a stop must cancel the actual background timer.
    await sleep(10_100);
    expect(log()).toBe(afterStop);
    expect(log()).not.toContain('retrying in 20 seconds');
    expect(log()).not.toContain('starting for');
    // Releasing ownership permits an explicit later start, without stale launcher records.
    expect((await cli(['start'], env)).code).toBe(0);
    expect((await cli(['stop'], env)).code).toBe(0);
  } finally {
    await cli(['stop', '--timeout', '0'], env);
    launcher?.kill('SIGTERM');
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
  }
});

it('forces a stopped daemon through its launcher, then remains stopped beyond the retry interval', async () => {
  const home = tempDir('launcher-force-stop-');
  const paths = runnerPaths(home, workRootOf(home));
  const env = cliEnv(home);
  const server = new FakeServer();
  let pid: number | undefined;
  await server.listen();
  try {
    await registerRunner(server.url, env);
    const started = await cli(['start', '--json'], env);
    expect(started.code).toBe(0);
    pid = (await readDaemonPid(paths))?.pid;
    expect(pid).toBeDefined();
    const launcher = await readLauncherPid(paths);
    expect(launcher).toBeDefined();
    // A suspended daemon cannot handle SIGTERM; timeout zero deterministically exercises forced termination.
    process.kill(pid!, 'SIGSTOP');
    const stopped = await cli(['stop', '--timeout', '0'], env);
    expect(stopped.code).toBe(0);
    expect(stopped.stdout).toContain('Runner stopped');
    expect(stopped.stderr).toContain('asking its launcher');
    expect(await readLauncherPid(paths)).toBeUndefined();
    expect(await readDaemonPid(paths)).toBeUndefined();
    expect(existsSync(paths.daemonPid)).toBe(false);
    const afterStop = readFileSync(paths.daemonLog, 'utf8');
    await sleep(10_100);
    expect(readFileSync(paths.daemonLog, 'utf8')).toBe(afterStop);
    expect(afterStop).toContain('Runner ended with signal SIGKILL');
    expect(afterStop.split('starting for')).toHaveLength(2);
    expect(afterStop).not.toContain('retrying in');
  } finally {
    if (pid !== undefined) {
      try {
        process.kill(pid, 'SIGCONT');
      } catch {
        /* Already stopped. */
      }
    }
    await cli(['stop', '--timeout', '0'], env);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
  }
});
