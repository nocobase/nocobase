// What a run leaves running, and a daemon that stops with something still running: a worker that ends takes the
// processes the run started with it, in whatever process group they run, and a daemon its service supervises exits once
// it has updated itself, even with a process still running that it cannot stop, so the service starts the new version.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runnerVersion } from '../src/core/loop.ts';
import { RESTART_EXIT_CODE } from '../src/core/update.ts';
import { FakeServer, waitFor, type FakeRun } from './fake-server.ts';
import {
  cliEnv,
  FAST_TIMINGS,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  writeFakeCli,
  type Daemon,
} from './helpers.ts';

const NEXT = '99.0.0';

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function kill(pid: number): void {
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // Already gone.
  }
}

/** A standalone tarball whose `bin/nocobase-runner` prints its version and arguments. */
function tarball(scratch: string, version: string): Uint8Array {
  const staging = path.join(scratch, `staging-${version}`);
  const bin = path.join(staging, 'nocobase-runner', 'bin', 'nocobase-runner');
  mkdirSync(path.dirname(bin), { recursive: true });
  writeFileSync(bin, `#!/bin/sh\necho nocobase-runner ${version} "$@"\n`);
  chmodSync(bin, 0o755);
  const file = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', file, '-C', staging, 'nocobase-runner']);
  return new Uint8Array(readFileSync(file));
}

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

/** An installation as the install script leaves it, with `version` current; returns its version directory. */
function installation(prefix: string, version: string): string {
  const dir = path.join(prefix, 'versions', version);
  mkdirSync(path.join(dir, 'bin'), { recursive: true });
  writeFileSync(path.join(dir, 'bin', 'nocobase-runner'), '#!/bin/sh\n');
  symlinkSync(path.join('versions', version), path.join(prefix, 'current'));
  return dir;
}

function findFile(dir: string, name: string): string | undefined {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === name) return full;
    if (entry.isDirectory()) {
      const found = findFile(full, name);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * A script the agent runs: it starts `sleep 3600` in a process group of its own, as a development server would be,
 * writes its pid to `leftover.pid`, and exits after `stayMs`, leaving the sleep to init.
 */
function leaveScript(stayMs: number): string {
  return (
    "import { spawn } from 'node:child_process'; import { writeFileSync } from 'node:fs'; " +
    "const child = spawn('sleep', ['3600'], { detached: true, stdio: 'ignore' }); child.unref(); " +
    `writeFileSync('leftover.pid', String(child.pid)); setTimeout(() => {}, ${stayMs});`
  );
}

describe('leftover processes', () => {
  let server: FakeServer;
  let home: string;
  let scratch: string;
  const daemons: Daemon[] = [];
  const leftovers: number[] = [];

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-leftover-home-');
    scratch = tempDir('nocobase-runner-leftover-scratch-');
    await registerRunner(server.url, cliEnv(home), [
      '--cli',
      `appcli=${writeFakeCli(scratch)}`,
    ]);
  });

  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    for (const pid of leftovers.splice(0)) kill(pid);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(scratch);
  });

  const env = (extra: Record<string, string> = {}) =>
    cliEnv(home, {
      NOCOBASE_RUNNER_TIMINGS: JSON.stringify({
        ...FAST_TIMINGS,
        processScanMs: 100,
      }),
      ...extra,
    });

  /** Queues a run whose agent runs `leaveScript(stayMs)`. */
  const enqueueLeaving = (stayMs: number): FakeRun =>
    server.enqueue({
      tool: {
        kind: 'claude',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: ['^node\\b'],
          deniedPatterns: [],
          idleTimeoutMs: 60_000,
        },
      },
      prompt: {
        system: '',
        session: 'fresh',
        turn: [
          `write leave.mjs ${leaveScript(stayMs)}`,
          'bash node leave.mjs',
          'say done',
        ].join('\n'),
      },
    });

  /** The pid of the process the run left, once it has written it. */
  const leftoverPid = async (): Promise<number> => {
    const file = await waitFor(
      () =>
        existsSync(workRootOf(home)) &&
        findFile(workRootOf(home), 'leftover.pid'),
      20_000,
      'the leftover process',
    );
    const pid = Number(
      await waitFor(() => readFileSync(file, 'utf8').trim() || false),
    );
    leftovers.push(pid);
    return pid;
  };

  it('leaves nothing the run started running once its worker ends, in any process group', async () => {
    const run = enqueueLeaving(1_500);
    const daemon = startDaemon(env());
    daemons.push(daemon);
    const leftover = await leftoverPid();
    expect(alive(leftover)).toBe(true);
    await waitFor(() => run.complete, 20_000, 'the run to complete');
    await waitFor(() => !alive(leftover), 10_000, 'the leftover to be stopped');
    await waitFor(
      () => daemon.output().includes('process group(s) the worker left behind'),
      5_000,
      'the cleanup to be logged',
    );
    // The daemon goes on.
    expect(daemon.child.exitCode).toBeNull();
  }, 60_000);

  it('exits for its service after updating while a process the run left is still running, and the service starts the new version', async () => {
    const prefix = path.join(scratch, 'install');
    const versionDir = installation(prefix, runnerVersion());
    const bytes = tarball(scratch, NEXT);
    server.distFiles.set(
      `nocobase-runner/${NEXT}/nocobase-runner.tar.gz`,
      bytes,
    );
    // Gone from below the worker at once, so nothing the runner keeps can find it: it is still running at the update.
    const run = enqueueLeaving(0);
    const daemon = startDaemon(
      env({
        NOCOBASE_RUNNER_SERVICE: '1',
        NOCOBASE_RUNNER_INSTALLATION: versionDir,
      }),
    );
    daemons.push(daemon);
    const leftover = await leftoverPid();
    await waitFor(() => run.complete, 20_000, 'the run to complete');
    expect(alive(leftover)).toBe(true);
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: NEXT,
      downloadUrl: `/api/agents/dist/products/nocobase-runner/versions/${NEXT}/files/nocobase-runner.tar.gz`,
      sha256: sha256(bytes),
      reason: 'test',
    };

    const code = await Promise.race([
      daemon.exited,
      new Promise<'still running'>((resolve) =>
        setTimeout(() => resolve('still running'), 30_000),
      ),
    ]);
    expect(code).toBe(RESTART_EXIT_CODE);
    // 'exit' may come before the last of its output.
    await waitFor(() =>
      daemon.output().includes(`runner exiting (${RESTART_EXIT_CODE})`),
    );
    expect(daemon.output()).toContain('runner stopped');
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(`versions/${NEXT}`);
    // What the service runs next is the new version.
    expect(
      execFileSync(
        path.join(prefix, 'current', 'bin', 'nocobase-runner'),
        ['start', '--foreground'],
        { encoding: 'utf8' },
      ),
    ).toContain(`nocobase-runner ${NEXT} start --foreground`);
  }, 90_000);

  it('exits with 0 when stopped', async () => {
    const daemon = startDaemon(env());
    daemons.push(daemon);
    await waitFor(
      () => daemon.output().includes('starting for'),
      10_000,
      'the daemon to start',
    );
    await stopDaemon(daemon);
    expect(await daemon.exited).toBe(0);
    await waitFor(() => daemon.output().includes('runner exiting (0)'));
  }, 30_000);
});
