// The owner's local policy (runner/local-policy.ts) and the isolation of deterministic steps (runner/isolation.ts):
// reading and merging the file, what the runner reports and refuses, and the daemon holding claims against it.
import { chmodSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { JobPayload, RunPayload } from '../src/protocol/index.ts';
import { checkIsolation, userIsolation } from '../src/core/isolation.ts';
import { runCommand } from '../src/core/jobs/process.ts';
import {
  featuresFor,
  policyFor,
  readLocalPolicy,
  refuseJob,
  refuseRun,
} from '../src/core/local-policy.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  type Daemon,
} from './helpers.ts';

const run = (overrides: Partial<RunPayload> = {}): RunPayload =>
  ({
    run: { id: 'r1' },
    subject: { key: 'NP-1' },
    agent: { id: 'a1', name: 'Coder' },
    workspace: {
      dirs: [
        {
          kind: 'repo',
          url: 'git@github.com:acme/app.git',
          defaultBranch: 'main',
          branch: 'agent/NP-1',
          path: 'app',
        },
      ],
      env: [],
    },
    ...overrides,
  }) as unknown as RunPayload;

const job = (kind: 'build', url: string): JobPayload =>
  ({
    job: { id: 'j1', kind, spec: { repo: { url } } },
  }) as unknown as JobPayload;

describe('the local policy', () => {
  let dir: string;
  beforeEach(() => {
    dir = tempDir('nocobase-runner-policy-');
  });
  afterEach(() => removeDir(dir));

  const read = (content: unknown) => {
    const file = path.join(dir, 'policy.json');
    writeFileSync(
      file,
      typeof content === 'string' ? content : JSON.stringify(content),
    );
    return readLocalPolicy({ policy: file });
  };

  it('takes everything without a file', async () => {
    const policy = policyFor(
      await readLocalPolicy({ policy: path.join(dir, 'none.json') }),
      'acme',
    );
    expect(policy).toEqual({
      reported: undefined,
      build: true,
      isolation: { mode: 'none' },
    });
    expect(refuseRun(policy, run())).toBeUndefined();
    expect(featuresFor(['input', 'jobs.build'], policy, undefined)).toEqual([
      'input',
      'jobs.build',
    ]);
  });

  it('takes nothing while the file cannot be used', async () => {
    for (const content of ['{ not json', { agents: 'Coder' }, { extra: 1 }]) {
      const policy = policyFor(await read(content), 'acme');
      expect(policy.error).toBeDefined();
      expect(policy.reported).toEqual({ agents: [], subjects: [], repos: [] });
      expect(featuresFor(['input', 'jobs.build'], policy, undefined)).toEqual([
        'input',
      ]);
      expect(refuseRun(policy, run())).toMatch(/cannot be used/u);
    }
  });

  it('narrows each application with its own entry, field by field', async () => {
    const file = await read({
      agents: ['Coder'],
      build: false,
      apps: { acme: { repos: ['github.com/acme/*'], build: true } },
    });
    expect(policyFor(file, 'acme')).toMatchObject({
      reported: { agents: ['Coder'], repos: ['github.com/acme/*'] },
      build: true,
    });
    expect(policyFor(file, 'other')).toMatchObject({
      reported: { agents: ['Coder'] },
      build: false,
    });
  });

  it('refuses runs and jobs outside it, and leaves out what it never takes', async () => {
    const policy = policyFor(
      await read({
        agents: ['Coder'],
        subjects: ['NP-*'],
        repos: ['github.com/acme/*'],
      }),
      'acme',
    );
    expect(refuseRun(policy, run())).toBeUndefined();
    expect(
      refuseRun(policy, run({ agent: { id: 'a2', name: 'Reviewer' } })),
    ).toMatch(/agent Reviewer/u);
    const { agent: _agent, ...anonymous } = run();
    expect(refuseRun(policy, anonymous as RunPayload)).toMatch(
      /does not say which agent/u,
    );
    expect(refuseRun(policy, run({ subject: { key: 'OPS-1' } }))).toMatch(
      /OPS-1/u,
    );
    expect(
      refuseJob(policy, job('build', 'https://github.com/other/x'), undefined),
    ).toMatch(/repository/u);
    expect(
      refuseJob(policy, job('build', 'https://github.com/acme/x'), undefined),
    ).toBeUndefined();
    expect(
      refuseJob(policy, job('build', 'https://github.com/acme/x'), 'no sudo'),
    ).toMatch(/cannot isolate/u);
    expect(featuresFor(['input', 'jobs.build'], policy, undefined)).toEqual([
      'input',
      'jobs.build',
    ]);
    expect(
      refuseJob(
        policyFor(await read({ build: false }), 'acme'),
        job('build', 'https://github.com/acme/x'),
        undefined,
      ),
    ).toMatch(/build jobs/u);
    expect(
      featuresFor(['input', 'jobs.build'], policy, 'container unsupported'),
    ).toEqual(['input']);
  });
});

describe('isolation of deterministic steps', () => {
  let dir: string;
  beforeEach(() => {
    dir = tempDir('nocobase-runner-isolation-');
  });
  afterEach(() => removeDir(dir));

  /** A `sudo` that runs what follows `--` as the same user, or refuses. */
  const fakeSudo = (works: boolean): string => {
    const file = path.join(dir, works ? 'sudo-ok' : 'sudo-no');
    writeFileSync(
      file,
      works
        ? '#!/bin/sh\nwhile [ "$1" != "--" ]; do shift; done\nshift\nexec "$@"\n'
        : '#!/bin/sh\necho "sudo: a password is required" >&2\nexit 1\n',
    );
    chmodSync(file, 0o755);
    return file;
  };

  it('refuses containers and platforms without sudo, and a user sudo will not run', async () => {
    expect(await checkIsolation({ mode: 'container', image: 'node' })).toEqual({
      problem: expect.stringMatching(/container is not supported/u),
    });
    expect(
      await checkIsolation(
        { mode: 'user', user: 'build' },
        { platform: 'win32' },
      ),
    ).toEqual({
      problem: expect.stringMatching(
        /not supported on this platform \(win32\)/u,
      ),
    });
    expect(
      await checkIsolation(
        { mode: 'user', user: 'build' },
        { platform: 'linux', sudo: fakeSudo(false) },
      ),
    ).toEqual({ problem: expect.stringMatching(/sudo -n -u build true/u) });
    expect(
      await checkIsolation(
        { mode: 'user', user: 'build' },
        { platform: 'linux', sudo: fakeSudo(true) },
      ),
    ).toHaveProperty('isolation');
  });

  it('runs a step as the other user with its environment on standard input, never in its arguments', async () => {
    const isolation = userIsolation('build', fakeSudo(true));
    const started = isolation.wrap(
      'sh',
      ['-c', 'echo "token=$NPM_TOKEN" && pwd'],
      {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        NPM_TOKEN: "s3cr'et value",
      },
    );
    expect(started.args.slice(0, 5)).toEqual(['-n', '-u', 'build', '-H', '--']);
    expect(JSON.stringify(started.args)).not.toContain('s3cr');
    expect(started.env).not.toHaveProperty('NPM_TOKEN');
    const lines: string[] = [];
    const outcome = await runCommand({
      command: started.command,
      args: started.args,
      cwd: dir,
      env: started.env,
      ...(started.stdin !== undefined ? { stdin: started.stdin } : {}),
      signal: new AbortController().signal,
      log: (_stream, text) => lines.push(text),
    });
    expect(outcome.exitCode).toBe(0);
    expect(lines.join('\n')).toContain("token=s3cr'et value");
  });
});

describe('the daemon under a local policy', () => {
  let server: FakeServer;
  let home: string;
  let env: NodeJS.ProcessEnv;
  const daemons: Daemon[] = [];

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-home-');
    env = cliEnv(home);
    writeFileSync(
      path.join(home, 'policy.json'),
      JSON.stringify({
        agents: ['Reviewer'],
        subjects: ['PM-*'],
        build: false,
        isolation: { mode: 'container', image: 'node:24' },
      }),
    );
    await registerRunner(server.url, env);
  });

  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
  });

  it('reports its policy, leaves out what it never takes, and refuses runs outside it', async () => {
    const runner = [...server.runners.values()][0];
    expect(runner?.register.policy).toEqual({
      agents: ['Reviewer'],
      subjects: ['PM-*'],
    });
    expect(runner?.register.features).not.toContain('jobs.build');

    const coder = server.enqueue({
      subject: { key: 'PM-1', url: 'http://app.test/PM-1' },
      agent: { id: 'a1', name: 'Coder' },
    });
    const elsewhere = server.enqueue({
      subject: { key: 'OPS-1', url: 'http://app.test/OPS-1' },
      agent: { id: 'a2', name: 'Reviewer' },
    });
    const daemon = startDaemon(env);
    daemons.push(daemon);
    await waitFor(() => server.lastHeartbeat(), 10_000, 'a heartbeat');
    expect(server.lastHeartbeat()?.policy).toEqual({
      agents: ['Reviewer'],
      subjects: ['PM-*'],
    });
    expect(server.lastHeartbeat()?.features).not.toContain('jobs.build');
    await waitFor(
      () => coder.status === 'failed' && elsewhere.status === 'failed',
      10_000,
      'both runs refused',
    );
    expect(coder.fail).toMatchObject({
      reason: 'policyRefused',
      detail: expect.stringMatching(/agent Coder/u),
    });
    expect(elsewhere.fail).toMatchObject({
      reason: 'policyRefused',
      detail: expect.stringMatching(/OPS-1/u),
    });
  });
});
