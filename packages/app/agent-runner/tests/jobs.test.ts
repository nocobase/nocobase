// Jobs end to end: the real daemon claims a job beside runs, a job worker checks a commit out of a local bare
// repository into a worktree of its own, runs a tiny build that produces a tarball, and streams it to the fake
// server's upload route; plus failures, the timeout, cancelling, and what the command can see.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildJobEnv } from '../src/core/jobs/env.ts';
import { LineChunker } from '../src/core/jobs/process.ts';
import type { BuildJobSpec } from '../src/protocol/index.ts';
import { FakeServer, waitFor, type FakeJob } from './fake-server.ts';
import {
  cliEnv,
  git,
  groupAlive,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  type Daemon,
} from './helpers.ts';

/** Whether a process whose command line contains `marker` is running. */
function running(marker: string): boolean {
  try {
    return execFileSync('ps', ['-axo', 'command='], { encoding: 'utf8' })
      .split('\n')
      .some((line) => line.includes(marker));
  } catch {
    return false;
  }
}

const COMMIT = [
  '-c',
  'user.name=Test',
  '-c',
  'user.email=test@example.com',
  '-c',
  'commit.gpgsign=false',
  'commit',
  '--quiet',
  '-m',
];

/** What the build script prints, so the test can read what the command saw. */
const BUILD_SCRIPT = `#!/bin/sh
set -e
echo "flavor=$BUILD_FLAVOR"
echo "token=$NPM_TOKEN"
echo "home=$HOME"
echo "tmp=$TMPDIR"
env | sort > "$TMPDIR/env.txt"
echo "runner-vars=$(grep -c '^NOCOBASE_RUNNER' "$TMPDIR/env.txt" || true)"
echo "ssh-sock=\${SSH_AUTH_SOCK:-none}"
echo "home-entries=$(ls -A "$HOME" | tr '\\n' ' ')"
echo "git-helper=$(git config --get credential.helper || echo none)"
echo "warning on stderr" >&2
mkdir -p dist
printf 'built from %s\\n' "$(cat VERSION)" > dist/info.txt
tar -czf dist/out.tgz -C dist info.txt
`;

describe('jobs', () => {
  let server: FakeServer;
  let home: string;
  let scratch: string;
  let env: NodeJS.ProcessEnv;
  let remote: string;
  let seed: string;
  const daemons: Daemon[] = [];

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-home-');
    scratch = tempDir('nocobase-runner-scratch-');
    env = cliEnv(home, {
      NOCOBASE_RUNNER_LEAK_CHECK: 'should-not-leak',
      SSH_AUTH_SOCK: '/tmp/should-not-leak.sock',
    });
    await registerRunner(server.url, env);

    // A bare "remote" with a tiny project: a build script and a version file, on `main` and a side branch.
    const bare = path.join(scratch, 'app.git');
    seed = path.join(scratch, 'seed');
    git(['init', '--quiet', '--bare', '--initial-branch=main', bare]);
    git(['init', '--quiet', '--initial-branch=main', seed]);
    writeFileSync(path.join(seed, 'build.sh'), BUILD_SCRIPT);
    writeFileSync(path.join(seed, 'VERSION'), '1.0.0\n');
    git(['add', '.'], seed);
    git([...COMMIT, 'build'], seed);
    git(['remote', 'add', 'origin', bare], seed);
    git(['push', '--quiet', 'origin', 'main'], seed);
    remote = `file://${bare}`;
  });

  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(scratch);
  });

  const daemon = (): Daemon => {
    const started = startDaemon(env);
    daemons.push(started);
    return started;
  };

  const head = (): string => git(['rev-parse', 'HEAD'], seed);

  const build = (overrides: Partial<BuildJobSpec> = {}): BuildJobSpec => ({
    repo: { url: remote, ref: 'main', sha: head() },
    command: { argv: ['sh', 'build.sh'] },
    env: [
      { name: 'BUILD_FLAVOR', value: 'preview' },
      { name: 'NPM_TOKEN', value: 'npm_supersecret', secret: true },
      { name: 'NOCOBASE_RUNNER_HOME', value: '/tmp/not-allowed' },
    ],
    outputs: [
      {
        path: 'dist/out.tgz',
        upload: {
          url: '/uploads/out.tgz',
          method: 'POST',
          headers: { authorization: 'Bearer ticket-123456' },
          contentType: 'application/gzip',
        },
      },
    ],
    timeoutSec: 120,
    ...overrides,
  });

  const ended = (job: FakeJob, timeoutMs = 60_000) =>
    waitFor(
      () => ['completed', 'failed', 'cancelled'].includes(job.status),
      timeoutMs,
      `job ${job.payload.job.id} to end`,
    );

  const logText = (job: FakeJob): string =>
    server
      .jobLog(job.payload.job.id)
      .map((event) => event.content ?? `[${event.phase ?? event.type}]`)
      .join('\n');

  it('announces the job features', async () => {
    daemon();
    const beat = await waitFor(
      () => server.lastHeartbeat(),
      15_000,
      'heartbeat',
    );
    expect(beat.features).toEqual(expect.arrayContaining(['jobs.build']));
    expect(beat.features).not.toContain('jobs.git.check');
    expect(beat.jobs).toEqual([]);
  });

  it('builds a commit in a worktree of its own and uploads the output with the given headers', async () => {
    const job = server.enqueueJob({ kind: 'build', spec: build() });
    daemon();
    await ended(job);
    expect(job.fail).toBeUndefined();
    expect(job.status).toBe('completed');

    // The upload arrived with exactly the headers given, and its checksum matches what the runner reports.
    expect(server.uploads).toHaveLength(1);
    const [upload] = server.uploads;
    expect(upload).toMatchObject({
      name: 'out.tgz',
      method: 'POST',
      headers: expect.objectContaining({
        authorization: 'Bearer ticket-123456',
        'content-type': 'application/gzip',
      }),
    });
    expect(upload?.headers).not.toHaveProperty('x-nocobase-runner-key');
    expect(job.result).toEqual({
      kind: 'build',
      sha: head(),
      exitCode: 0,
      durationMs: expect.any(Number),
      outputs: [
        {
          path: 'dist/out.tgz',
          sha256: upload?.sha256,
          size: upload?.size,
          upload: {
            status: 201,
            body: { data: { id: 'release-1', size: upload?.size } },
          },
        },
      ],
    });

    // The log: phases, the command's output on both streams, secrets redacted.
    const events = server.jobLog(job.payload.job.id);
    expect(
      events
        .filter((event) => event.type === 'phase')
        .map((event) => event.phase),
    ).toEqual(['checkout', 'command', 'upload']);
    expect(
      events.some(
        (event) =>
          event.stream === 'stderr' && event.content === 'warning on stderr',
      ),
    ).toBe(true);
    const text = logText(job);
    expect(text).toContain('flavor=preview');
    expect(text).toContain('token=[REDACTED]');
    expect(text).not.toContain('npm_supersecret');
    expect(text).not.toContain('ticket-123456');

    // The command saw none of the runner's own: no runner variables, no SSH agent, a private home without keys, and no
    // host git credential helper.
    const runnerKey = [...server.runners.values()][0]!.key;
    expect(text).not.toContain(runnerKey);
    expect(text).not.toContain('should-not-leak');
    expect(text).toContain('runner-vars=0');
    expect(text).toContain('ssh-sock=none');
    expect(text).toContain('git-helper=none');
    const homeLine = text.split('\n').find((line) => line.startsWith('home='))!;
    expect(homeLine).toContain(path.join(workRootOf(home), '.jobs'));
    expect(homeLine).not.toContain(home + path.sep);
    const entries = text
      .split('\n')
      .find((line) => line.startsWith('home-entries='))!;
    for (const secret of ['.ssh', '.gitconfig', '.npmrc', '.nocobase-runner'])
      expect(entries).not.toContain(secret);

    // The job's directory is gone; the bare cache stays for the next checkout, and no agent workspace was touched.
    await waitFor(
      () =>
        !existsSync(
          path.join(workRootOf(home), '.jobs', 'test-app', job.payload.job.id),
        ),
      10_000,
      'the job directory to go',
    );
    expect(
      readdirSync(path.join(home, 'repos')).some((name) =>
        name.endsWith('.git'),
      ),
    ).toBe(true);
    expect(existsSync(path.join(workRootOf(home), 'test-app'))).toBe(false);
    // The heartbeat reports the job while it is held only.
    await waitFor(
      () => server.lastHeartbeat()?.jobs?.length === 0,
      10_000,
      'an empty heartbeat',
    );
  });

  it('builds the head of a ref, and fails a missing commit as a checkout failure', async () => {
    const byRef = server.enqueueJob({
      kind: 'build',
      spec: build({
        repo: { url: remote, ref: 'main' },
        command: {
          shell: 'mkdir -p dist && git rev-parse HEAD > dist/out.tgz',
        },
      }),
    });
    const missing = server.enqueueJob({
      kind: 'build',
      spec: build({
        repo: { url: remote, ref: 'main', sha: 'deadbeefdeadbeef' },
      }),
    });
    daemon();
    await ended(byRef);
    expect(byRef.result).toMatchObject({ kind: 'build', sha: head() });
    await ended(missing);
    expect(missing.fail).toMatchObject({ reason: 'checkoutFailed' });
  });

  it('reports a failing command with its exit code, and a missing output', async () => {
    const failing = server.enqueueJob({
      kind: 'build',
      spec: build({ command: { shell: 'echo broken >&2; exit 3' } }),
    });
    const noOutput = server.enqueueJob({
      kind: 'build',
      spec: build({ command: { argv: ['true'] } }),
    });
    daemon();
    await ended(failing);
    expect(failing.fail).toMatchObject({
      reason: 'commandFailed',
      exitCode: 3,
      sha: head(),
      detail: expect.stringContaining('broken'),
    });
    await ended(noOutput);
    expect(noOutput.fail).toMatchObject({
      reason: 'outputMissing',
      sha: head(),
    });
    expect(server.uploads).toHaveLength(0);
  });

  it('fails an upload the store refuses', async () => {
    server.uploadStatus = 409;
    const job = server.enqueueJob({ kind: 'build', spec: build() });
    daemon();
    await ended(job);
    expect(job.fail).toMatchObject({
      reason: 'uploadFailed',
      detail: expect.stringContaining('409'),
    });
    expect(job.fail?.detail).not.toContain('ticket-123456');
  });

  it('stops a command that runs past its timeout', async () => {
    const job = server.enqueueJob({
      kind: 'build',
      spec: build({
        command: { shell: 'sleep 61.25 & wait' },
        timeoutSec: 2,
      }),
    });
    daemon();
    await ended(job, 30_000);
    expect(job.fail).toMatchObject({ reason: 'jobTimeout' });
    // The command's whole process group went, the backgrounded child too.
    await waitFor(() => !running('sleep 61.25'), 10_000, 'the command to go');
  });

  it('cancels a running command and acknowledges', async () => {
    const job = server.enqueueJob({
      kind: 'build',
      spec: build({ command: { shell: 'echo started; sleep 62.5' } }),
    });
    daemon();
    await waitFor(
      () => logText(job).includes('started'),
      30_000,
      'the command to start',
    );
    const heartbeatPid = await waitFor(
      () =>
        server
          .lastHeartbeat()
          ?.jobs?.find((entry) => entry.jobId === job.payload.job.id)?.pid,
      10_000,
      'the worker pid',
    );
    server.job(job.payload.job.id).cancelRequested = true;
    await ended(job, 30_000);
    expect(job.status).toBe('cancelled');
    expect(job.cancelAcked).toBe(true);
    await waitFor(
      () => !groupAlive(heartbeatPid),
      10_000,
      'the worker group to go',
    );
    await waitFor(() => !running('sleep 62.5'), 10_000, 'the command to go');
  });
});

describe('job environment', () => {
  it('passes only an allowlist and the job variables, never the runner own', () => {
    const env = buildJobEnv({
      source: {
        PATH: '/usr/bin',
        LANG: 'en_US.UTF-8',
        NOCOBASE_RUNNER_HOME: '/secret',
        SSH_AUTH_SOCK: '/agent.sock',
        AWS_SECRET_ACCESS_KEY: 'aws',
        HOME: '/Users/runner',
      },
      env: [
        { name: 'NODE_ENV', value: 'production' },
        { name: 'NOCOBASE_RUNNER_HOME', value: '/override' },
        { name: 'GIT_CONFIG_GLOBAL', value: '/x' },
        { name: 'HOME', value: '/x' },
        { name: 'SSH_AUTH_SOCK', value: '/x' },
      ],
      home: '/jobs/1/home',
      tmpDir: '/jobs/1/tmp',
    });
    expect(env).toEqual({
      PATH: '/usr/bin',
      LANG: 'en_US.UTF-8',
      NODE_ENV: 'production',
      HOME: '/jobs/1/home',
      TMPDIR: '/jobs/1/tmp',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_TERMINAL_PROMPT: '0',
    });
  });

  it('chunks output by whole lines and marks a piece cut inside a line', async () => {
    const chunks: string[] = [];
    const partials: boolean[] = [];
    const chunker = new LineChunker((text, partial) => {
      chunks.push(text);
      partials.push(partial);
    });
    chunker.write('one\ntw');
    chunker.write('o\nthree');
    chunker.flush();
    expect(chunks.join('\n')).toBe('one\ntwo\nthree');
    expect(partials).toEqual([false]);
    chunker.write('progress');
    chunker.flush(false);
    expect(partials.at(-1)).toBe(true);
    const big = new LineChunker((text) => chunks.push(text));
    chunks.length = 0;
    big.write(`${'x'.repeat(10_000)}\n${'y'.repeat(10_000)}\n`);
    expect(chunks).toEqual(['x'.repeat(10_000)]);
    big.flush();
    expect(chunks).toEqual(['x'.repeat(10_000), 'y'.repeat(10_000)]);
  });
});
