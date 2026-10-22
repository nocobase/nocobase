// Installing standalone tarballs the application serves: the runner updating itself (by hand and between runs), the
// installation layout it relies on, and the application CLI of kind `archive`.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  readConnections,
  readSettings,
  writeSettings,
  runnerClient,
} from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import {
  activateVersion,
  ChecksumError,
  detectInstallation,
  pruneVersions,
  unpackTarball,
} from '../src/lib/install.ts';
import { CliUnavailableError, resolveCli } from '../src/agent/cli.ts';
import { RunnerDaemon, runnerVersion } from '../src/core/loop.ts';
import { servicePlan } from '../src/core/service.ts';
import { isNewer, updateDecision } from '../src/core/update.ts';
import { PROTOCOL_VERSION, RUNNER_ROUTES } from '../src/protocol/index.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  cli,
  registerRunner,
  removeDir,
  tempDir,
  git,
  makeRemote,
  writeFakeCli,
  FAST_TIMINGS,
} from './helpers.ts';

const scratch = tempDir('nocobase-runner-update-');
afterAll(() => removeDir(scratch));

/** A standalone tarball like `oclif pack tarballs` makes: one top directory with `bin/<name>`. */
function tarball(name: string, version: string): Uint8Array {
  const staging = path.join(scratch, `staging-${name}-${version}`);
  mkdirSync(path.join(staging, name, 'bin'), { recursive: true });
  const bin = path.join(staging, name, 'bin', name);
  writeFileSync(bin, `#!/bin/sh\necho ${name} ${version}\n`);
  chmodSync(bin, 0o755);
  const file = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', file, '-C', staging, name]);
  return new Uint8Array(readFileSync(file));
}

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

/** An installation as the install script leaves it, with `version` current. */
function installation(prefix: string, version: string): void {
  const dir = path.join(prefix, 'versions', version);
  mkdirSync(path.join(dir, 'bin'), { recursive: true });
  writeFileSync(path.join(dir, 'bin', 'nocobase-runner'), '#!/bin/sh\n');
  symlinkSync(path.join('versions', version), path.join(prefix, 'current'));
}

describe('installation layout', () => {
  it('unpacks only a tarball that matches its checksum', async () => {
    const bytes = tarball('acme', '9.0.0');
    const dest = path.join(scratch, 'unpack', 'versions', '9.0.0');
    await expect(
      unpackTarball(bytes, '0'.repeat(64), dest),
    ).rejects.toBeInstanceOf(ChecksumError);
    expect(existsSync(dest)).toBe(false);
    await unpackTarball(bytes, sha256(bytes), dest);
    expect(readFileSync(path.join(dest, 'bin', 'acme'), 'utf8')).toContain(
      'acme 9.0.0',
    );
    expect(existsSync(`${dest}.partial`)).toBe(false);
  });

  it('finds the installation a version runs from, switches and prunes versions', async () => {
    const prefix = path.join(scratch, 'layout');
    installation(prefix, '1.0.0');
    mkdirSync(path.join(prefix, 'versions', '0.9.0'));
    mkdirSync(path.join(prefix, 'versions', '1.1.0'));
    writeFileSync(
      path.join(prefix, 'install.json'),
      JSON.stringify({ binLink: '/somewhere/acme' }),
    );
    expect(detectInstallation(path.join(prefix, 'versions', '1.0.0'))).toEqual({
      prefix,
      versionDir: path.join(prefix, 'versions', '1.0.0'),
      version: '1.0.0',
      current: path.join(prefix, 'current'),
      binLink: '/somewhere/acme',
      mode: 'runner',
    });
    expect(detectInstallation(path.join(scratch, 'not', 'installed'))).toBe(
      undefined,
    );
    // The repository's own runner is not an installation.
    expect(detectInstallation()).toBe(undefined);

    await activateVersion(
      { prefix, current: path.join(prefix, 'current') },
      '1.1.0',
    );
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/1.1.0');
    expect(await pruneVersions({ prefix }, ['1.1.0', '1.0.0'])).toEqual([
      '0.9.0',
    ]);
  });

  it('orders versions when deciding whether to update', () => {
    expect(isNewer('0.1.1', '0.1.0')).toBe(true);
    expect(isNewer('0.1.0', '0.1.0-alpha.3')).toBe(true);
    expect(isNewer('0.1.0-alpha.3', '0.1.0')).toBe(false);
    expect(isNewer('0.1.0', '0.1.0')).toBe(false);
  });

  it('counts a newer server protocol as behind even when the versions are the same', () => {
    const running = '0.1.0-beta.7';
    expect(
      updateDecision({ running, offered: '0.1.0-beta.8', serverProtocol: 11 }),
    ).toBe('update');
    expect(
      updateDecision({ running, serverProtocol: 10, runnerProtocol: 9 }),
    ).toBe('protocol');
    expect(
      updateDecision({
        running,
        offered: running,
        serverProtocol: 10,
        runnerProtocol: 9,
      }),
    ).toBe('protocol');
    expect(
      updateDecision({ running, serverProtocol: 9, runnerProtocol: 9 }),
    ).toBe('none');
    expect(updateDecision({ running, runnerProtocol: 9 })).toBe('none');
    expect(
      updateDecision({ running, serverProtocol: 8, runnerProtocol: 9 }),
    ).toBe('none');
  });

  it('runs the service from the current launcher under its own label', () => {
    const plan = servicePlan({
      paths: runnerPaths(
        '/Users/u/.nocobase-runner',
        '/Users/u/.nocobase-runner-work',
      ),
      command: ['/Users/u/.local/share/acme/current/bin/acme'],
      platform: 'darwin',
      home: '/Users/u',
      uid: 501,
      env: { PATH: '/usr/bin' },
      label: 'com.example.test-runner',
    });
    expect(plan.file).toBe(
      '/Users/u/Library/LaunchAgents/com.example.test-runner.plist',
    );
    expect(plan.content).toContain('<string>com.example.test-runner</string>');
    expect(plan.content).toContain(
      '<string>/Users/u/.local/share/acme/current/bin/acme</string>',
    );
    expect(plan.content).toContain('<key>NOCOBASE_RUNNER_SERVICE</key>');
    expect(plan.uninstall).toEqual([
      ['launchctl', 'bootout', 'gui/501/com.example.test-runner'],
    ]);
    const linux = servicePlan({
      paths: runnerPaths(
        '/home/u/.nocobase-runner',
        '/home/u/.nocobase-runner-work',
      ),
      command: ['/x/acme', 'runner'],
      platform: 'linux',
      home: '/home/u',
      env: { PATH: '/usr/bin' },
      label: 'com.example.test-runner',
    });
    expect(linux.file).toBe(
      '/home/u/.config/systemd/user/com.example.test-runner.service',
    );
    expect(() =>
      servicePlan({
        paths: runnerPaths('/h', '/w'),
        command: ['/x'],
        platform: 'linux',
        label: '../escape',
      }),
    ).toThrow('Not a service label');
  });
});

describe('served tarballs', () => {
  let server: FakeServer;
  let home: string;

  beforeEach(async () => {
    server = new FakeServer();
    server.capacity = { slots: 2, toolSlots: {} };
    await server.listen();
    home = tempDir('nocobase-runner-update-home-');
    await registerRunner(server.url, cliEnv(home), [
      '--cli',
      `appcli=${writeFakeCli(home)}`,
    ]);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await server.close();
    removeDir(home);
    removeDir(`${home}-work`);
  });

  const connection = async () => {
    const [found] = await readConnections(runnerPaths(home, `${home}-work`));
    if (found === undefined) throw new Error('Not registered.');
    return found;
  };

  it('installs an archive CLI once, with the runner key, checking its checksum', async () => {
    const bytes = tarball('appcli', '2.0.0');
    server.distFiles.set('appcli/2.0.0/appcli.tar.gz', bytes);
    const paths = runnerPaths(home, `${home}-work`);
    const client = runnerClient(await connection());
    const cli = (sha: string) => ({
      name: 'appcli',
      package: {
        kind: 'archive' as const,
        version: '2.0.0',
        url: '/api/agents/dist/products/appcli/versions/2.0.0/files/appcli.tar.gz',
        sha256: sha,
      },
      credential: { file: '.app/run.json', content: {} },
    });
    await expect(
      resolveCli({ paths, cli: cli('0'.repeat(64)), client }),
    ).rejects.toBeInstanceOf(CliUnavailableError);
    const entry = await resolveCli({ paths, cli: cli(sha256(bytes)), client });
    expect(entry).toMatch(
      /cli\/appcli\/archive-2\.0\.0-[0-9a-f]{12}\/bin\/appcli$/u,
    );
    expect(execFileSync(entry, { encoding: 'utf8' })).toBe('appcli 2.0.0\n');
    server.distFiles.clear();
    expect(await resolveCli({ paths, cli: cli(sha256(bytes)), client })).toBe(
      entry,
    );
    await expect(
      resolveCli({ paths, cli: cli(sha256(bytes)) }).then(() => 'reused'),
    ).resolves.toBe('reused');
  });

  it('refuses to download from another origin', async () => {
    const client = runnerClient(await connection());
    await expect(
      client.download('https://elsewhere.example.com/x.tar.gz'),
    ).rejects.toThrow('another origin');
  });

  it.each(['graceful', 'forced'] as const)(
    'interrupts a running tool (%s), preserves its worktree and uncommitted files before installing, reporting zero capacity',
    async (mode) => {
      vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
      const remote = makeRemote(home);
      const run = server.enqueue({
        workspace: {
          dirs: [
            {
              kind: 'repo',
              url: remote,
              defaultBranch: 'main',
              branch: 'agent/upgrade',
              path: 'repo',
            },
          ],
          env: [],
          git: { author: { name: 'Test', email: 'test@example.com' } },
        },
        prompt: {
          system: '',
          session: 'fresh',
          turn: `write upgrade.txt preserved\n${mode === 'forced' ? 'hang-hard' : 'hang'}`,
        },
      });
      const paths = runnerPaths(home, `${home}-work`);
      const apply = vi.fn(async () => {
        expect(run.fail?.reason).toBe('runnerUpgrade');
        expect(existsSync(String(run.start?.workDir))).toBe(true);
      });
      const daemon = new RunnerDaemon({
        paths,
        settings: await readSettings(paths),
        connections: [await connection()],
        adapters: new Map(),
        timings: {
          ...FAST_TIMINGS,
          cancelGraceMs: mode === 'forced' ? 1 : 10_000,
          killGraceMs: mode === 'forced' ? 1 : 5_000,
        },
        toolSlots: { claude: 2 },
        log: () => {},
        selfUpdate: {
          installation: { prefix: home, current: path.join(home, 'current') },
          apply,
        },
      });
      try {
        await daemon.start();
        await waitFor(
          () =>
            run.status === 'running' &&
            existsSync(
              path.join(String(run.start?.workDir), 'repo/upgrade.txt'),
            ),
          30_000,
          'tool running',
        );
        const cache = git(
          ['rev-parse', '--git-common-dir'],
          path.join(String(run.start?.workDir), 'repo'),
        );
        server.upgrade = {
          minVersion: '0.0.0',
          latestVersion: '99.0.0',
          downloadUrl: '/update',
          sha256: 'a'.repeat(64),
          reason: 'test',
        };
        await waitFor(
          () => daemon.updatedTo === '99.0.0',
          30_000,
          'upgrade completed',
        );
        await daemon.wait();
        expect(apply).toHaveBeenCalledOnce();
        if (mode === 'forced')
          expect(
            [...run.events.values()].some(
              (event) => event.meta?.orphaned === true,
            ),
          ).toBe(true);
        const refs = git(
          ['for-each-ref', '--format=%(refname)', 'refs/runner/resume'],
          cache,
        )
          .split('\n')
          .filter(Boolean);
        expect(refs).toEqual([]);
        expect(
          readFileSync(
            path.join(String(run.start?.workDir), 'repo/upgrade.txt'),
            'utf8',
          ),
        ).toBe('preserved');
        expect(
          git(
            ['status', '--porcelain'],
            path.join(String(run.start?.workDir), 'repo'),
          ),
        ).toContain('upgrade.txt');
        const heartbeats = [...server.runners.values()]
          .flatMap((runner) => runner.heartbeats)
          .filter((heartbeat) => heartbeat.load.draining === 'updatePending');
        expect(heartbeats.length).toBeGreaterThan(0);
        expect(heartbeats.every((heartbeat) => heartbeat.load.free === 0)).toBe(
          true,
        );
        expect(
          heartbeats.every(
            (heartbeat) => heartbeat.load.tools?.claude?.free === 0,
          ),
        ).toBe(true);
      } finally {
        await daemon.stop();
      }
    },
  );

  it('stops an existing tool before a long-poll claim returns, then preserves late workers and waits for all exit reports before installing', async () => {
    server['options'].pollTimeoutMs = 30_000;
    vi.stubEnv('NOCOBASE_RUNNER_ADAPTER', 'echo');
    const remote = makeRemote(home);
    const enqueue = (key: string) =>
      server.enqueue({
        subject: { key },
        workspace: {
          dirs: [
            {
              kind: 'repo',
              url: remote,
              defaultBranch: 'main',
              branch: `agent/${key}`,
              path: 'repo',
            },
          ],
          env: [],
          git: { author: { name: 'Test', email: 'test@example.com' } },
        },
        prompt: {
          system: '',
          session: 'fresh',
          turn: `write ${key}.txt preserved\nhang`,
        },
      });
    const existing = enqueue('existing');
    const paths = runnerPaths(home, `${home}-work`);
    const apply = vi.fn(async () => {
      for (const run of [existing, late]) {
        expect(run.fail?.reason).toBe('runnerUpgrade');
        expect(existsSync(String(run.start?.workDir))).toBe(true);
      }
      expect(daemon.activeRuns).toEqual([]);
    });
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        ...FAST_TIMINGS,
        pollTimeoutMs: 30_000,
        cancelGraceMs: 10_000,
      },
      log: () => {},
      selfUpdate: {
        installation: { prefix: home, current: path.join(home, 'current') },
        apply,
      },
    });
    const link = daemon['links'][0]!;
    const deliver = Promise.withResolvers<void>();
    const received = Promise.withResolvers<void>();
    const finishExit = Promise.withResolvers<void>();
    const exiting = Promise.withResolvers<void>();
    const supervisor = daemon['supervisor'];
    const afterExit = supervisor['afterExit'].bind(supervisor);
    let late: ReturnType<typeof enqueue>;
    const enforceCancel = supervisor.enforceCancel.bind(supervisor);
    const cancelSpy = vi
      .spyOn(supervisor, 'enforceCancel')
      .mockImplementation(async (runId, upgrade) => {
        // Let the late tool make a real edit so its cancellation also exercises local preservation.
        if (runId === late?.payload.run.id)
          await waitFor(
            () =>
              existsSync(
                path.join(String(late.start?.workDir), 'repo/late.txt'),
              ),
            30_000,
          );
        await enforceCancel(runId, upgrade);
      });
    const exitSpy = vi
      .spyOn(
        supervisor as unknown as { afterExit: typeof afterExit },
        'afterExit',
      )
      .mockImplementation(async (...args: Parameters<typeof afterExit>) => {
        if (args[0] === late?.payload.run.id) {
          exiting.resolve();
          await finishExit.promise;
        }
        await afterExit(...args);
      });
    let pendingClaim: Promise<number> | undefined;
    let responseSpy: ReturnType<typeof vi.spyOn> | undefined;
    try {
      await daemon.heartbeat(link);
      await daemon['claimFrom'](link, 1, false);
      await waitFor(
        () =>
          existsSync(
            path.join(String(existing.start?.workDir), 'repo/existing.txt'),
          ),
        30_000,
      );
      const cache = git(
        ['rev-parse', '--git-common-dir'],
        path.join(String(existing.start?.workDir), 'repo'),
      );
      const request = link.client.request.bind(link.client);
      responseSpy = vi
        .spyOn(link.client, 'request')
        .mockImplementation(async (...args) => {
          const response = await request(...args);
          if (args[1] === RUNNER_ROUTES.claim) {
            received.resolve();
            await deliver.promise;
          }
          return response;
        });
      const claims = server.runners.values().next().value!.claims;
      pendingClaim = daemon['claimFrom'](link, 1, true);
      await waitFor(
        () => server.runners.values().next().value!.claims > claims,
      );
      server.upgrade = {
        minVersion: '0.0.0',
        latestVersion: '99.0.0',
        downloadUrl: '/update',
        sha256: 'a'.repeat(64),
        reason: 'test',
      };
      await daemon.heartbeat(link);
      // The request is still long-polling: the already running tool must stop first.
      await waitFor(() => existing.fail?.reason === 'runnerUpgrade', 30_000);
      expect(daemon['claimsInFlight']).toBe(1);
      expect(apply).not.toHaveBeenCalled();
      expect(await daemon['claimFrom'](link, 1, false)).toBe(0);
      late = enqueue('late');
      await received.promise;
      expect(late.start).toBeUndefined();
      deliver.resolve();
      expect(await pendingClaim).toBe(1);
      await exiting.promise;
      expect(late.fail?.reason).toBe('runnerUpgrade');
      expect(apply).not.toHaveBeenCalled();
      finishExit.resolve();
      await waitFor(() => daemon.updatedTo === '99.0.0', 30_000);
      await daemon.wait();
      expect(apply).toHaveBeenCalledOnce();
      const refs = git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/resume'],
        cache,
      )
        .split('\n')
        .filter(Boolean);
      expect(refs).toEqual([]);
      for (const [key, run] of [
        ['existing', existing],
        ['late', late],
      ] as const)
        expect(
          readFileSync(
            path.join(String(run.start?.workDir), `repo/${key}.txt`),
            'utf8',
          ),
        ).toBe('preserved');
      expect(existsSync(String(late.start?.workDir))).toBe(true);
      expect(server.lastHeartbeat()?.load).toMatchObject({
        free: 0,
        draining: 'updatePending',
      });
    } finally {
      deliver.resolve();
      finishExit.resolve();
      await pendingClaim?.catch(() => undefined);
      await daemon.stop();
      responseSpy?.mockRestore();
      cancelSpy.mockRestore();
      exitSpy.mockRestore();
    }
  });

  it('updates itself between runs when the application serves a newer runner, then stops for its service', async () => {
    const prefix = path.join(scratch, 'self-update');
    installation(prefix, runnerVersion());
    const next = '99.0.0';
    const bytes = tarball('nocobase-runner', next);
    server.distFiles.set(
      `nocobase-runner/${next}/nocobase-runner.tar.gz`,
      bytes,
    );
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: next,
      downloadUrl: `/api/agents/dist/products/nocobase-runner/versions/${next}/files/nocobase-runner.tar.gz`,
      sha256: sha256(bytes),
      reason: 'test',
    };
    const paths = runnerPaths(home, `${home}-work`);
    const logs: string[] = [];
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
      selfUpdate: {
        installation: { prefix, current: path.join(prefix, 'current') },
      },
    });
    await daemon.start();
    await daemon.wait();
    expect(daemon.updatedTo).toBe(next);
    expect(daemon.exitCode).toBe(75);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(`versions/${next}`);
    expect(
      readFileSync(
        path.join(prefix, 'versions', next, 'bin', 'nocobase-runner'),
        'utf8',
      ),
    ).toContain(`nocobase-runner ${next}`);
    // The version it ran stays, to switch back to by hand.
    expect(existsSync(path.join(prefix, 'versions', runnerVersion()))).toBe(
      true,
    );
    // The new version carries no Node, so the service's launcher gets the one this runner ran on: its PATH may have
    // none.
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(process.execPath);
    expect(logs.join('\n')).toContain(`updated to nocobase-runner ${next}`);
  });

  it('explicitly restarts an installed service after a manual update, even when its daemon is stopped', async () => {
    const prefix = path.join(scratch, 'manual-service-update');
    installation(prefix, runnerVersion());
    const next = '99.0.8';
    const bytes = tarball('nocobase-runner', next);
    server.distFiles.set(`nocobase-runner/${next}/runner.tar.gz`, bytes);
    server.resolution.artifact = {
      product: 'nocobase-runner',
      version: next,
      target: 'linux-x64',
      url: `/api/agents/dist/products/nocobase-runner/versions/${next}/files/runner.tar.gz`,
      sha256: sha256(bytes),
      size: bytes.length,
      channel: 'stable',
    };
    const paths = runnerPaths(home, `${home}-work`);
    await writeSettings(
      {
        ...(await readSettings(paths)),
        serviceLabel: 'com.example.manual-update',
      },
      paths,
    );
    const bin = path.join(home, 'fake-service-bin');
    mkdirSync(bin);
    const calls = path.join(home, 'service-calls.json');
    for (const name of ['systemctl', 'launchctl']) {
      const executable = path.join(bin, name);
      writeFileSync(
        executable,
        `#!${process.execPath}\nimport { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(calls)}, JSON.stringify(process.argv.slice(2)));\n`,
      );
      chmodSync(executable, 0o755);
    }
    const result = await cli(
      ['update'],
      cliEnv(home, {
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        NOCOBASE_RUNNER_INSTALLATION: path.join(
          prefix,
          'versions',
          runnerVersion(),
        ),
      }),
    );
    expect(result.stderr).toBe('');
    expect(result.code).toBe(0);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(`versions/${next}`);
    expect(JSON.parse(readFileSync(calls, 'utf8'))).toEqual(
      process.platform === 'darwin'
        ? [
            'kickstart',
            '-k',
            `gui/${process.getuid?.() ?? 501}/com.example.manual-update`,
          ]
        : ['--user', 'restart', 'com.example.manual-update.service'],
    );
  });

  it('only logs an update when it is not an installation its service supervises', async () => {
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: '99.0.0',
      downloadUrl:
        '/api/agents/dist/products/nocobase-runner/versions/99.0.0/files/x.tar.gz',
      sha256: '0'.repeat(64),
      reason: 'test',
    };
    const paths = runnerPaths(home, `${home}-work`);
    const logs: string[] = [];
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
    });
    await daemon.start();
    await waitFor(() =>
      logs.some((line) => line.includes('nocobase-runner 99.0.0 is available')),
    );
    await daemon.stop();
    expect(daemon.updatedTo).toBeUndefined();
  });

  it('says how to catch up when the application speaks a newer protocol but offers no newer version', async () => {
    const paths = runnerPaths(home, `${home}-work`);
    const run = async (protocolVersion: number): Promise<string[]> => {
      server.protocolVersion = protocolVersion;
      const logs: string[] = [];
      const daemon = new RunnerDaemon({
        paths,
        settings: await readSettings(paths),
        connections: [await connection()],
        adapters: new Map(),
        timings: {
          heartbeatIntervalMs: 50,
          pollTimeoutMs: 200,
          pollFallbackMs: 200,
        },
        log: (message) => logs.push(message),
      });
      await daemon.start();
      const runner = [...server.runners.values()][0]!;
      const sent = runner.heartbeatsSent;
      await waitFor(() => runner.heartbeatsSent >= sent + 3);
      await daemon.stop();
      expect(daemon.updatedTo).toBeUndefined();
      return logs.filter((line) => line.includes('runner protocol'));
    };

    const behind = await run(PROTOCOL_VERSION + 1);
    // Once, however many heartbeats said so.
    expect(behind).toHaveLength(1);
    expect(behind[0]).toContain(
      `runner protocol ${PROTOCOL_VERSION + 1} and this runner`,
    );
    expect(behind[0]).toContain(`speaks ${PROTOCOL_VERSION}`);
    expect(behind[0]).toContain('nocobase-runner update');
    expect(await run(PROTOCOL_VERSION)).toEqual([]);
  });

  it('keeps a failed update from stopping the runner', async () => {
    const prefix = path.join(scratch, 'failed-update');
    installation(prefix, runnerVersion());
    server.upgrade = {
      minVersion: '0.0.0',
      latestVersion: '99.0.0',
      downloadUrl:
        '/api/agents/dist/products/nocobase-runner/versions/99.0.0/files/missing.tar.gz',
      sha256: '0'.repeat(64),
      reason: 'test',
    };
    const paths = runnerPaths(home, `${home}-work`);
    const logs: string[] = [];
    const daemon = new RunnerDaemon({
      paths,
      settings: await readSettings(paths),
      connections: [await connection()],
      adapters: new Map(),
      timings: {
        heartbeatIntervalMs: 100,
        pollTimeoutMs: 200,
        pollFallbackMs: 200,
      },
      log: (message) => logs.push(message),
      selfUpdate: {
        installation: { prefix, current: path.join(prefix, 'current') },
      },
    });
    await daemon.start();
    await waitFor(() =>
      logs.some((line) => line.includes('update to 99.0.0 failed')),
    );
    await daemon.stop();
    expect(daemon.updatedTo).toBeUndefined();
    expect(readlinkSync(path.join(prefix, 'current'))).toBe(
      `versions/${runnerVersion()}`,
    );
  });
});
