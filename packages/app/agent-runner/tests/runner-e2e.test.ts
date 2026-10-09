// The runner end to end: the real daemon, its worker processes and the echo adapter against the in-memory server.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PROTOCOL_VERSION } from '../src/protocol/index.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cli,
  cliEnv,
  git,
  groupAlive,
  makeRemote,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  writeFakeCli,
  type Daemon,
} from './helpers.ts';

const COMMIT =
  'git -c user.name=Agent -c user.email=agent@example.com -c commit.gpgsign=false';

describe('runner end to end', () => {
  let server: FakeServer;
  let home: string;
  let scratch: string;
  let env: NodeJS.ProcessEnv;
  let fakeCli: string;
  const daemons: Daemon[] = [];
  const workDirOf = (key: string) =>
    path.join(workRootOf(home), 'test-app', key);

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-home-');
    scratch = tempDir('nocobase-runner-scratch-');
    env = cliEnv(home, {
      NOCOBASE_RUNNER_LEAK_CHECK: 'should-not-leak',
      UNLISTED_SECRET: 'should-not-leak',
    });
    fakeCli = writeFakeCli(scratch);
    await registerRunner(server.url, env, ['--cli', `appcli=${fakeCli}`]);
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

  it('registers with features and tools, and heartbeats', async () => {
    const runner = [...server.runners.values()][0];
    expect(runner?.register).toMatchObject({
      name: 'test-runner',
      protocolVersion: PROTOCOL_VERSION,
    });
    expect(runner?.register).not.toHaveProperty('labels');
    expect(runner?.register.features).toEqual(
      expect.arrayContaining([
        'input',
        'checkout',
        'directories',
        'secrets',
        'skills',
        'steer',
      ]),
    );
    expect(runner?.register.tools.map((tool) => tool.kind)).toContain('claude');
    // The key is in the runner's own directory, private, and apart from the registration.
    const keyFile = path.join(home, 'credentials', 'test-app.json');
    expect(statSync(keyFile).mode & 0o777).toBe(0o600);
    expect(statSync(path.dirname(keyFile)).mode & 0o777).toBe(0o700);
    expect(statSync(home).mode & 0o777).toBe(0o700);
    expect(readFileSync(keyFile, 'utf8')).toContain('runner-key-runner-1');
    expect(
      readFileSync(path.join(home, 'apps', 'test-app.json'), 'utf8'),
    ).not.toContain('runner-key');
    daemon();
    await waitFor(() => server.lastHeartbeat(), 10_000, 'a heartbeat');
    expect(server.lastHeartbeat()?.load).toEqual({ slots: 1, free: 1 });
  });

  it('claims, checks out, starts, streams events, pushes and completes', async () => {
    const remote = makeRemote(scratch);
    const run = server.enqueue({
      subject: { key: 'PM-7', url: 'http://app.test/PM-7' },
      workspace: {
        dirs: [
          {
            kind: 'repo',
            url: remote,
            defaultBranch: 'main',
            branch: 'agent/PM-7',
            path: 'app',
          },
        ],
        env: [{ name: 'DEPLOY_TOKEN', value: 'secret-value' }],
      },
      prompt: {
        system: 'System rules.',
        session: 'fresh',
        turn: [
          'say starting',
          'bash env',
          'bash appcli whoami',
          'bash cat .app/run.json',
          `bash cat ${path.join(home, 'credentials', 'test-app.json')}`,
          'bash ls /',
          'read /etc/hosts',
          'write notes.txt hello from the agent',
          `bash ${COMMIT} add notes.txt && ${COMMIT} commit -q -m agent-work`,
          `bash ${COMMIT} push origin HEAD:main`,
          'say all done',
        ].join('\n'),
      },
    });
    daemon();
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      20_000,
      'the run to end',
    );
    expect(run.fail).toBeUndefined();
    expect(run.status).toBe('completed');

    const workDir = workDirOf('PM-7');
    expect(run.start).toMatchObject({
      workDir,
      acceptsInput: true,
      adapter: { kind: 'claude', version: 'echo' },
    });
    expect(run.complete?.summary).toBe('all done');
    expect(run.complete?.usage?.[0]?.tool).toBe('claude');

    const events = server.events(run.payload.run.id);
    expect(events.map((event) => event.seq)).toEqual(
      events.map((_, index) => index + 1),
    );
    expect(events[0]).toMatchObject({
      type: 'checkout',
      meta: {
        kind: 'repo',
        branch: 'agent/PM-7',
        path: 'app',
        primary: true,
        fresh: true,
      },
    });

    // The agent's environment: whitelisted variables and the run's variables, its own HOME and TMPDIR, the push
    // guard as its hooks, nothing else. The variable's value is redacted from the transcript.
    const envOutput = events.find(
      (event) => event.type === 'toolResult' && event.output?.includes('PATH='),
    )?.output;
    expect(envOutput).toContain('DEPLOY_TOKEN=[REDACTED]');
    expect(JSON.stringify(events)).not.toContain('secret-value');
    expect(envOutput).not.toContain('should-not-leak');
    expect(envOutput).not.toMatch(/^NOCOBASE_RUNNER_/m);
    expect(envOutput).toContain(`HOME=${workDir}/.nocobase-runner/home`);
    expect(envOutput).toContain(`TMPDIR=${workDir}/.nocobase-runner/tmp`);
    expect(envOutput).toContain('GIT_CONFIG_KEY_0=core.hooksPath');
    expect(envOutput).toContain(`PATH=${workDir}/.nocobase-runner/bin:`);

    // The application's CLI is on the PATH and finds the run's credential, with the server filled in; the run token
    // it read is redacted from the transcript, which stays valid JSON.
    const whoami = events.find(
      (event) =>
        event.type === 'toolResult' && event.output?.includes('"args"'),
    )?.output;
    expect(JSON.parse(whoami ?? '{}')).toMatchObject({
      args: ['whoami'],
      credential: {
        token: '[REDACTED]',
        server: server.url,
      },
      home: `${workDir}/.nocobase-runner/home`,
    });

    // Refusals are in the transcript.
    const denials = events.filter((event) => event.type === 'permission');
    expect(denials.map((event) => event.meta?.reason)).toEqual([
      'The runner keeps credentials there; tools may not touch them.',
      'The runner keeps credentials there; tools may not touch them.',
      'ls outside the work directory: /',
      'Read outside the work directory: /etc/hosts',
    ]);
    // The push guard refused a push to main.
    expect(
      events.some(
        (event) =>
          event.type === 'toolResult' &&
          event.output?.includes('may push only the branch agent/PM-7'),
      ),
    ).toBe(true);

    // The branch reached the remote.
    expect(run.complete?.repos).toEqual([
      expect.objectContaining({
        url: remote,
        branch: 'agent/PM-7',
        pushed: true,
      }),
    ]);
    const bare = remote.replace('file://', '');
    expect(git(['rev-parse', 'refs/heads/agent/PM-7'], bare)).toBe(
      run.complete?.repos?.[0]?.headSha,
    );

    // The credentials file is gone; the worktree stays for the next run.
    await waitFor(
      () => !existsSync(path.join(workDir, '.app', 'run.json')),
      5_000,
      'credentials removal',
    );
    expect(readFileSync(path.join(workDir, 'app', 'notes.txt'), 'utf8')).toBe(
      'hello from the agent',
    );
    await waitFor(
      () => !existsSync(path.join(home, 'runs', `${run.payload.run.id}.json`)),
      5_000,
      'record',
    );
  });

  it("writes a 0600 credentials file for the application's CLI and removes it on cancel", async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say waiting\nhang' },
    });
    daemon();
    const workDir = workDirOf(run.payload.subject.key);
    const file = path.join(workDir, '.app', 'run.json');
    await waitFor(
      () => run.status === 'running' && existsSync(file),
      15_000,
      'the run to start',
    );
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(statSync(path.dirname(file)).mode & 0o777).toBe(0o700);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({
      runId: run.payload.run.id,
      token: run.payload.cli.credential.content.token,
      server: server.url,
    });
    // The shim on the agent's PATH starts the application's CLI.
    const shim = path.join(workDir, '.nocobase-runner', 'bin', 'appcli');
    expect(statSync(shim).mode & 0o777).toBe(0o700);
    expect(readFileSync(shim, 'utf8')).toContain(fakeCli);
    // It tells the CLI, and only the CLI, where the run's credentials are.
    expect(readFileSync(shim, 'utf8')).toContain(
      `AGENT_RUN_CREDENTIALS='${file}'\nexport AGENT_RUN_CREDENTIALS`,
    );
    server.cancel(run.payload.run.id);
    await waitFor(() => run.status === 'cancelled', 15_000, 'cancel');
    // The worker removes it as it exits, right after acknowledging the cancel.
    await waitFor(() => !existsSync(file), 5_000, 'credentials removal');
  });

  it('delivers an input that arrives mid-run and covers it on complete', async () => {
    const run = server.enqueue({
      prompt: {
        system: '',
        session: 'fresh',
        turn: 'say ready\nwait-input\nsay finished',
      },
    });
    daemon();
    const id = run.payload.run.id;
    await waitFor(
      () => server.events(id).some((event) => event.content === 'ready'),
      15_000,
      'ready',
    );
    const input = server.addInput(id, 'please also update the docs');
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      15_000,
      'completion',
    );
    expect(run.status).toBe('completed');
    expect(run.complete?.handledInputIds).toEqual([input.id]);
    const texts = server.events(id).map((event) => event.content);
    expect(texts).toContain(
      'got input: [comment from Ada at ' +
        input.at +
        ']\nplease also update the docs',
    );
    expect(
      server
        .events(id)
        .some(
          (event) => event.type === 'input' && event.meta?.inputId === input.id,
        ),
    ).toBe(true);
  });

  it('starts another turn when complete answers RUN_INPUT_PENDING', async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say one\nsleep 600' },
    });
    daemon();
    const id = run.payload.run.id;
    // An input added right as the turn ends may miss both the steer and the turn boundary; the complete fence
    // catches it.
    await waitFor(
      () => server.events(id).some((event) => event.content === 'one'),
      15_000,
      'first text',
    );
    const input = server.addInput(id, 'late comment');
    await waitFor(() => run.status === 'completed', 15_000, 'completion');
    expect(run.complete?.handledInputIds).toContain(input.id);
  });

  it('kills the process group within 15 s of a cancel, even when the tool ignores SIGTERM', async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say working\nhang-hard' },
    });
    daemon();
    const id = run.payload.run.id;
    const pid = await waitFor(
      () => (run.status === 'running' ? server.workerPid(id) : undefined),
      15_000,
      'pid',
    );
    await waitFor(
      () => server.events(id).some((event) => event.content === 'working'),
      10_000,
      'working',
    );
    expect(groupAlive(pid)).toBe(true);
    const cancelledAt = Date.now();
    server.cancel(id);
    await waitFor(
      () => !groupAlive(pid),
      15_000,
      'the process group to disappear',
    );
    expect(Date.now() - cancelledAt).toBeLessThan(15_000);
    await waitFor(() => run.status === 'cancelled', 10_000, 'cancelAck');
    expect(run.cancelAck).toBeDefined();
    expect(server.events(id).at(-1)).toMatchObject({
      type: 'status',
      meta: { status: 'cancelled' },
    });
  });

  it('kills the tool when the lease is lost and reports nothing more', async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say working\nhang' },
    });
    daemon();
    const id = run.payload.run.id;
    const pid = await waitFor(
      () => (run.status === 'running' ? server.workerPid(id) : undefined),
      15_000,
      'pid',
    );
    const reportsBefore = run.reports.length;
    server.loseLease(id);
    await waitFor(
      () => !groupAlive(pid),
      10_000,
      'the process group to disappear',
    );
    expect(run.reports.slice(reportsBefore)).toEqual([]);
    expect(run.status).toBe('running');
    await waitFor(
      () =>
        !existsSync(
          path.join(workDirOf(run.payload.subject.key), '.app', 'run.json'),
        ),
      5_000,
      'credentials removal',
    );
  });

  it('recovers an orphaned run after the daemon is killed with SIGKILL', async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say working\nhang' },
    });
    const first = daemon();
    const id = run.payload.run.id;
    const pid = await waitFor(
      () => (run.status === 'running' ? server.workerPid(id) : undefined),
      15_000,
      'pid',
    );
    first.child.kill('SIGKILL');
    await first.exited;
    // The worker outlives its daemon: it leads its own process group.
    expect(groupAlive(pid)).toBe(true);
    const recordFile = path.join(home, 'runs', `${id}.json`);
    expect(existsSync(recordFile)).toBe(true);

    daemon();
    await waitFor(
      () => run.status === 'failed',
      15_000,
      'the orphan to be reported',
    );
    expect(run.fail).toMatchObject({ reason: 'leaseExpired' });
    expect(groupAlive(pid)).toBe(false);
    // The record goes once the server has acknowledged the report.
    await waitFor(() => !existsSync(recordFile), 5_000, 'the record removal');
    expect(
      existsSync(
        path.join(workDirOf(run.payload.subject.key), '.app', 'run.json'),
      ),
    ).toBe(false);
    expect(server.events(id).at(-1)).toMatchObject({
      type: 'status',
      meta: { orphaned: true },
    });
  });

  it('keeps every event while the server answers 5xx and delivers them in order', async () => {
    const lines = Array.from(
      { length: 450 },
      (_, index) => `say line ${index + 1}`,
    );
    const run = server.enqueue({
      prompt: {
        system: '',
        session: 'fresh',
        turn: [...lines, 'sleep 300', 'say end'].join('\n'),
      },
    });
    server.eventsDown = true;
    daemon();
    const id = run.payload.run.id;
    await waitFor(
      () => server.eventsFailures >= 3,
      15_000,
      'failed event sends',
    );
    expect(run.events.size).toBe(0);
    server.eventsDown = false;
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      30_000,
      'completion',
    );
    expect(run.status).toBe('completed');
    const events = server.events(id);
    expect(events).toHaveLength(451);
    expect(events.map((event) => event.seq)).toEqual(
      events.map((_, index) => index + 1),
    );
    expect(events.at(-1)?.content).toBe('end');
  });

  it('redacts the secrets a run carries from its events, summary and failure detail', async () => {
    const secret = 'env-secret-0123456789';
    const github = `ghp_${'Ab1'.repeat(12)}`;
    const workspace = {
      dirs: [],
      env: [{ name: 'SERVICE_KEY', value: secret }],
    };
    const completed = server.enqueue({
      subject: { key: 'PM-8', url: 'http://app.test/PM-8' },
      workspace,
      prompt: {
        system: '',
        session: 'fresh',
        turn: [
          `say the key is ${secret}`,
          'bash printf "%s" "$SERVICE_KEY"',
          `write leak.txt ${github}`,
          `say done with ${secret} and ${github}`,
        ].join('\n'),
      },
    });
    const failed = server.enqueue({
      subject: { key: 'PM-9', url: 'http://app.test/PM-9' },
      workspace,
      prompt: {
        system: '',
        session: 'fresh',
        turn: `fail toolAuth login failed for ${secret}`,
      },
    });
    daemon();
    await waitFor(
      () => completed.status === 'completed' && failed.status === 'failed',
      20_000,
      'both runs to end',
    );
    const transcript = JSON.stringify([
      server.events(completed.payload.run.id),
      server.events(failed.payload.run.id),
      completed.complete,
      failed.fail,
    ]);
    expect(transcript).not.toContain(secret);
    expect(transcript).not.toContain(github);
    expect(completed.complete?.summary).toBe(
      'done with [REDACTED] and [REDACTED]',
    );
    expect(failed.fail).toMatchObject({
      reason: 'toolAuth',
      detail: expect.stringContaining('login failed for [REDACTED]'),
    });
    // The write itself happened: only what is reported is redacted.
    expect(readFileSync(path.join(workDirOf('PM-8'), 'leak.txt'), 'utf8')).toBe(
      github,
    );
  });

  it.each(['verdict', 'refuse'] as const)(
    'stays up and claims nothing while the application wants an upgrade (%s)',
    async (mode) => {
      server.unsupported = mode;
      const run = server.enqueue({
        prompt: { system: '', session: 'fresh', turn: 'say hello' },
      });
      const started = daemon();
      const runner = [...server.runners.values()][0]!;
      await waitFor(() => runner.heartbeatsSent >= 2, 10_000, 'heartbeats');
      // Heartbeats keep coming, nothing more is claimed, the run stays queued and the daemon stays up.
      const claims = runner.claims;
      const beats = runner.heartbeatsSent;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      expect(runner.protocolHeader).toBe(String(PROTOCOL_VERSION));
      expect(runner.heartbeatsSent).toBeGreaterThan(beats);
      expect(runner.claims).toBe(claims);
      expect(run.status).toBe('queued');
      expect(started.child.exitCode).toBeNull();
      expect(started.output()).toContain('upgrade required');

      server.unsupported = undefined;
      await waitFor(() => run.status === 'completed', 30_000, 'the run');
    },
  );

  it('fails with idleTimeout when the tool goes quiet', async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say working\nhang' },
      tool: {
        kind: 'claude',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: [],
          deniedPatterns: [],
          idleTimeoutMs: 1_000,
        },
      },
    });
    daemon();
    await waitFor(() => run.status === 'failed', 15_000, 'idle failure');
    expect(run.fail?.reason).toBe('idleTimeout');
  });

  it('reports a running run as runnerOffline when the runner stops', async () => {
    const run = server.enqueue({
      prompt: { system: '', session: 'fresh', turn: 'say working\nhang' },
    });
    const started = daemon();
    const pid = await waitFor(() =>
      run.status === 'running'
        ? server.workerPid(run.payload.run.id)
        : undefined,
    );
    await stopDaemon(started);
    expect(run.fail?.reason).toBe('runnerOffline');
    expect(groupAlive(pid)).toBe(false);
  });

  it('starts in the background, reports status and logs, and stops', async () => {
    const started = await cli(['start', '--json'], env);
    expect(started.code).toBe(0);
    const { pid } = (JSON.parse(started.stdout) as { result: { pid: number } })
      .result;
    try {
      const run = server.enqueue();
      await waitFor(
        () => run.status === 'completed',
        15_000,
        'a run in the background daemon',
      );
      const status = await cli(['status', '--json'], env);
      expect(JSON.parse(status.stdout)).toMatchObject({
        ok: true,
        result: { running: true, pid },
      });
      const again = await cli(['start'], env);
      expect(again.code).toBe(6);
      const logs = await cli(['logs', '-n', '50'], env);
      expect(logs.stdout).toContain(`run ${run.payload.run.id}: worker`);
      const runLog = await cli(['logs', '--run', run.payload.run.id], env);
      expect(runLog.stdout).toContain('completed');
    } finally {
      const stopped = await cli(['stop', '--json'], env);
      expect(JSON.parse(stopped.stdout)).toMatchObject({
        ok: true,
        command: 'stop',
        result: { stopped: true, pid },
      });
    }
    expect(groupAlive(pid)).toBe(false);
  });

  it('fails with checkoutFailed when a repository cannot be cloned', async () => {
    const run = server.enqueue({
      workspace: {
        dirs: [
          {
            kind: 'repo',
            url: `file://${scratch}/missing.git`,
            defaultBranch: 'main',
            branch: 'agent/PM-9',
            path: 'app',
          },
        ],
        env: [],
      },
    });
    daemon();
    await waitFor(() => run.status === 'failed', 15_000, 'checkout failure');
    expect(run.fail?.reason).toBe('checkoutFailed');
    expect(run.start).toBeUndefined();
  });
});

describe('working directories, initialization prompts and skills', () => {
  let server: FakeServer;
  let home: string;
  let scratch: string;
  let env: NodeJS.ProcessEnv;
  const daemons: Daemon[] = [];

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-dirs-');
    scratch = tempDir('nocobase-runner-dirs-scratch-');
    env = cliEnv(home);
    await registerRunner(server.url, env, [
      '--cli',
      `appcli=${writeFakeCli(scratch)}`,
    ]);
    server.skillBundles.set('pr-etiquette', {
      slug: 'pr-etiquette',
      version: '2',
      hash: 'h2',
      files: [
        {
          path: 'SKILL.md',
          content:
            '---\nname: pr-etiquette\ndescription: How we write PRs.\n---\n\nKeep it short.\n',
        },
        { path: 'references/example.md', content: 'An example.' },
      ],
    });
    daemons.push(startDaemon(env));
  });

  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(scratch);
  });

  const ended = (run: { status: string }) =>
    waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      20_000,
      'the run to end',
    );
  const texts = (id: string) =>
    server
      .events(id)
      .filter((event) => event.type === 'text')
      .map((event) => event.content ?? '');

  it('works in a directory in place, gives its initialization prompt once, and caches skills', async () => {
    const own = path.join(scratch, 'project');
    mkdirSync(own);
    writeFileSync(path.join(own, 'existing.txt'), 'mine');
    const enqueue = (id: string, clean = false) =>
      server.enqueue({
        run: { id },
        subject: { key: 'PM-20', url: 'http://app.test/PM-20' },
        workspace: {
          dirs: [
            {
              kind: 'directory',
              path: own,
              name: 'project',
              initPrompt: 'Run pnpm install, then copy .env.example to .env.',
            },
          ],
          env: [],
          ...(clean ? { clean } : {}),
        },
        skills: [
          {
            slug: 'pr-etiquette',
            name: 'PR etiquette',
            version: '2',
            hash: 'h2',
            description: 'How we write PRs.',
            bundleUrl: `/api/agents/runners/runs/${id}/skills/pr-etiquette`,
          },
        ],
        prompt: {
          system:
            'Rules.\n\n{{runner.workspaceInit}}\n\nNotes:\n{{runner.workspaceNotes}}',
          session: 'fresh',
          turn: [
            'system',
            'skills',
            'write made-by-agent.txt hi',
            'bash appcli whoami',
            'say done',
          ].join('\n'),
        },
      });

    const first = enqueue('d-1');
    await ended(first);
    expect(first.fail).toBeUndefined();
    const [system, skills] = texts('d-1');
    expect(system).toContain(
      `This working directory was just prepared for this task. Before you start working, do the following in ${own}:`,
    );
    expect(system).toContain('copy .env.example to .env');
    expect(system).toContain(`You start in ${own}.`);
    expect(system).not.toContain('{{runner.');
    const workDir = path.join(workRootOf(home), 'test-app', 'PM-20');
    const skillsDir = path.join(
      workDir,
      '.nocobase-runner',
      'plugin',
      'skills',
    );
    expect(skills).toBe(`skills: pr-etiquette at ${skillsDir}`);
    expect(
      readFileSync(
        path.join(skillsDir, 'pr-etiquette', 'references', 'example.md'),
        'utf8',
      ),
    ).toBe('An example.');
    expect(
      JSON.parse(
        readFileSync(
          path.join(
            workDir,
            '.nocobase-runner',
            'plugin',
            '.claude-plugin',
            'plugin.json',
          ),
          'utf8',
        ),
      ),
    ).toMatchObject({ name: 'nocobase-runner' });
    // The agent writes in the directory, and its CLI finds the run from there.
    expect(readFileSync(path.join(own, 'made-by-agent.txt'), 'utf8')).toBe(
      'hi',
    );
    expect(existsSync(path.join(own, '.nocobase-runner'))).toBe(false);
    const whoami = server
      .events('d-1')
      .find(
        (event) =>
          event.type === 'toolResult' && event.output?.includes('"args"'),
      )?.output;
    // The CLI read the run's token, which the transcript shows redacted.
    expect(JSON.parse(whoami ?? '{}')).toMatchObject({
      credential: { token: '[REDACTED]', runId: 'd-1' },
    });
    expect(
      server
        .events('d-1')
        .find(
          (event) => event.type === 'status' && event.meta?.phase === 'init',
        ),
    ).toMatchObject({ meta: { dirs: [own] } });

    const second = enqueue('d-2');
    await ended(second);
    expect(texts('d-2')[0]).not.toContain('just prepared');
    expect(server.skillFetches.get('pr-etiquette')).toBe(1);

    const third = enqueue('d-3', true);
    await ended(third);
    expect(texts('d-3')[0]).toContain('just prepared');
    expect(readFileSync(path.join(own, 'existing.txt'), 'utf8')).toBe('mine');
  });

  it('places mounts in the work directory, names them in the notes, and caches them by hash', async () => {
    server.mountBundles.set('knowledge', {
      name: 'knowledge',
      hash: 'k1',
      files: [
        { path: 'INDEX.md', content: '# Knowledge\n\n- project/setup.md\n' },
        {
          path: 'project/setup.md',
          content: '---\nversion: 3\n---\n\n# Setup\n',
        },
      ],
    });
    const enqueue = (id: string) =>
      server.enqueue({
        run: { id },
        subject: { key: 'PM-30', url: 'http://app.test/PM-30' },
        mounts: [
          {
            name: 'knowledge',
            hash: 'k1',
            bundleUrl: `/api/agents/runners/runs/${id}/mounts/knowledge`,
            target: '.nocobase-runner/knowledge',
            note: 'The team knowledge base; start with INDEX.md.',
          },
        ],
        prompt: {
          system: 'Notes:\n{{runner.workspaceNotes}}',
          session: 'fresh',
          turn: 'system\nsay done',
        },
      });

    const first = enqueue('m-1');
    await ended(first);
    expect(first.fail).toBeUndefined();
    const workDir = path.join(workRootOf(home), 'test-app', 'PM-30');
    const target = path.join(workDir, '.nocobase-runner', 'knowledge');
    expect(readFileSync(path.join(target, 'INDEX.md'), 'utf8')).toContain(
      'project/setup.md',
    );
    expect(
      readFileSync(path.join(target, 'project', 'setup.md'), 'utf8'),
    ).toContain('version: 3');
    expect(existsSync(path.join(target, '.complete'))).toBe(false);
    expect(texts('m-1')[0]).toContain(
      `- ${target}: The team knowledge base; start with INDEX.md.`,
    );

    // What the agent changed there is replaced on the next run, from the cache.
    writeFileSync(path.join(target, 'project', 'setup.md'), 'draft');
    writeFileSync(path.join(target, 'scratch.md'), 'mine');
    const second = enqueue('m-2');
    await ended(second);
    expect(
      readFileSync(path.join(target, 'project', 'setup.md'), 'utf8'),
    ).toContain('# Setup');
    expect(existsSync(path.join(target, 'scratch.md'))).toBe(false);
    expect(server.mountFetches.get('knowledge')).toBe(1);
  });

  it('starts in an empty directory of its own when the run names none', async () => {
    const run = server.enqueue({
      subject: { key: 'PM-21', url: 'http://app.test/PM-21' },
      prompt: {
        system: '{{runner.workspaceInit}}{{runner.workspaceNotes}}',
        session: 'fresh',
        turn: 'system\nwrite scratch.txt ok',
      },
    });
    await ended(run);
    const workDir = path.join(workRootOf(home), 'test-app', 'PM-21');
    expect(texts(run.payload.run.id)[0]).toContain(
      `Your working directory is ${workDir}, an empty directory kept for this task`,
    );
    expect(readFileSync(path.join(workDir, 'scratch.txt'), 'utf8')).toBe('ok');
  });

  it('fails with checkoutFailed when a directory is not on this runner', async () => {
    const run = server.enqueue({
      workspace: {
        dirs: [{ kind: 'directory', path: path.join(scratch, 'nowhere') }],
        env: [],
      },
    });
    await ended(run);
    expect(run.fail?.reason).toBe('checkoutFailed');
  });
});

describe('one runner, several applications', () => {
  it('claims from each application, sharing its slots, and reports each run to its own', async () => {
    const first = new FakeServer();
    const second = new FakeServer({ app: { id: 'crm', name: 'CRM' } });
    await first.listen();
    await second.listen();
    const home = tempDir('nocobase-runner-multi-');
    const scratch = tempDir('nocobase-runner-multi-scratch-');
    const env = cliEnv(home);
    const fake = writeFakeCli(scratch);
    const started: Daemon[] = [];
    try {
      await registerRunner(first.url, env, ['--cli', `appcli=${fake}`]);
      await registerRunner(second.url, env, ['--cli', `appcli=${fake}`]);
      const runs = [
        first.enqueue({ run: { id: 'a-1' } }),
        second.enqueue({ run: { id: 'b-1' } }),
        first.enqueue({ run: { id: 'a-2' } }),
        second.enqueue({ run: { id: 'b-2' } }),
      ];
      started.push(startDaemon(env));
      await waitFor(
        () => runs.every((run) => run.status === 'completed'),
        30_000,
        'every run to complete',
      );
      expect(first.run('a-1').complete?.summary).toBe('hello');
      expect(second.run('b-2').complete?.summary).toBe('hello');
      // Each application heard only about its own runs.
      const actives = (server: FakeServer) =>
        [...server.runners.values()].flatMap((runner) =>
          runner.heartbeats.flatMap((beat) =>
            beat.active.map((run) => run.runId),
          ),
        );
      expect(actives(first).every((id) => id.startsWith('a-'))).toBe(true);
      expect(actives(second).every((id) => id.startsWith('b-'))).toBe(true);
      expect(
        existsSync(path.join(workRootOf(home), 'crm', 'PM-1')) ||
          existsSync(path.join(workRootOf(home), 'crm', 'PM-2')),
      ).toBe(true);
    } finally {
      for (const daemon of started) await stopDaemon(daemon);
      await first.close();
      await second.close();
      removeDir(home);
      removeDir(workRootOf(home));
      removeDir(scratch);
    }
  });
});

describe('limits per coding tool', () => {
  it('keeps them and says how many runs of each it can take', async () => {
    const server = new FakeServer();
    await server.listen();
    const home = tempDir('nocobase-runner-tools-');
    const scratch = tempDir('nocobase-runner-tools-scratch-');
    const env = cliEnv(home);
    const started: Daemon[] = [];
    try {
      await registerRunner(server.url, env, [
        '--slots',
        '2,claude=1',
        '--cli',
        `appcli=${writeFakeCli(scratch)}`,
      ]);
      const registered = [...server.runners.values()][0];
      expect(registered?.register).toMatchObject({
        slots: 2,
        toolSlots: { claude: 1 },
      });
      const status = await cli(['status', '--json'], env);
      expect(JSON.parse(status.stdout).result).toMatchObject({
        slots: 2,
        toolSlots: { claude: 1 },
      });
      started.push(startDaemon(env));
      await waitFor(
        () => (registered?.claimBodies.length ?? 0) > 0,
        10_000,
        'a claim from the runner',
      );
      expect(registered?.claimBodies[0]).toEqual({
        free: 2,
        tools: { claude: 1 },
      });
      await waitFor(() => server.lastHeartbeat(), 10_000, 'a heartbeat');
      expect(server.lastHeartbeat()?.load).toEqual({
        slots: 2,
        free: 2,
        tools: { claude: { slots: 1, free: 1 } },
      });
    } finally {
      for (const daemon of started) await stopDaemon(daemon);
      await server.close();
      removeDir(home);
      removeDir(workRootOf(home));
      removeDir(scratch);
    }
  });
});
