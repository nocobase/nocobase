/**
 * Backups and restores on a managed Host, through its child process and IPC channel, with a stand-in for a release's
 * `backup` commands (`fixtures/backup-cli.mjs`): what the Host runs and with which environment, how it answers a
 * repeated or concurrent operation, a restore refused before the App stops, a failure with the command's code and
 * report, a release without the commands, and a Host killed while a backup runs or after a restore put the data back.
 * Each case takes the backups it needs. `backup-integration.test.ts` runs the same against a real release.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { c as createTar } from 'tar';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  ArtifactReference,
  HostDeploymentSpec,
  HostManagementService,
  HostScope,
} from '../src/index.ts';
import { AppHostSupervisor } from '../src/supervisor.ts';

const scope: HostScope = { id: 'backups' };

let root: string;
let volumesDir: string;
let supervisor: AppHostSupervisor;
let host: HostManagementService;
let withCli: ArtifactReference;
let withoutCli: ArtifactReference;
let otherCli: ArtifactReference;
let log: string;

async function artifact(
  artifactDir: string,
  name: string,
  cli: boolean,
): Promise<ArtifactReference> {
  const source = path.join(root, 'sources', name);
  await cp(
    fileURLToPath(new URL('../fixtures/app-dist/demo', import.meta.url)),
    source,
    { recursive: true },
  );
  if (cli) {
    // Its server waits while `$DEMO_START_HOLD` exists, having written `$DEMO_START_MARK`: a deployment held there.
    // It also takes published configuration.
    const server = path.join(source, 'dist', 'server');
    await rename(
      path.join(server, 'embedded.js'),
      path.join(server, 'embedded-base.js'),
    );
    await writeFile(
      path.join(server, 'embedded.js'),
      [
        "import { existsSync, writeFileSync } from 'node:fs';",
        "import { createServer as base } from './embedded-base.js';",
        `// ${name}`,
        'export async function createServer(scope) {',
        '  const hold = scope.env?.DEMO_START_HOLD;',
        '  if (hold && existsSync(hold)) {',
        "    writeFileSync(scope.env.DEMO_START_MARK, '');",
        '    while (existsSync(hold)) await new Promise((resolve) => setTimeout(resolve, 20));',
        '  }',
        '  const app = await base(scope);',
        "  return { ...app, config: { reload: async () => ({ status: 'reloaded' }) } };",
        '}',
        '',
      ].join('\n'),
    );
    await mkdir(path.join(source, 'dist', 'cli'), { recursive: true });
    await cp(
      fileURLToPath(new URL('./fixtures/backup-cli.mjs', import.meta.url)),
      path.join(source, 'dist', 'cli', 'index.js'),
    );
  }
  const key = `${name}.tar.gz`;
  const file = path.join(artifactDir, key);
  await createTar({ cwd: source, file, gzip: true }, ['.']);
  const checksum = createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
  return { key, appId: 'demo', version: '0.0.1', checksum };
}

function spec(
  operationId: string,
  release: ArtifactReference,
  env: Record<string, string> = {},
): HostDeploymentSpec {
  return {
    id: 'demo',
    appId: 'demo',
    operationId,
    scope,
    artifact: release,
    desiredState: 'running',
    backend: 'in-process',
    activation: 'eager',
    config: {
      provider: 'file',
      content: 'demo: true\n',
      revision: operationId,
    },
    env: { BACKUP_CLI_LOG: log, ...env },
  };
}

async function startSupervisor(): Promise<void> {
  supervisor = AppHostSupervisor.create({
    mode: 'managed',
    driver: 'auto',
    appRevisionsDir: path.join(root, 'revisions'),
    appVolumesDir: volumesDir,
    configPath: path.join(root, 'host.json'),
    startTimeoutMs: 20_000,
    autoRestart: false,
  });
  host = await supervisor.getManagementClient();
}

async function data(value?: string): Promise<string> {
  const file = path.join(volumesDir, 'demo', 'storage', 'data.txt');
  if (value !== undefined) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, value);
  }
  return await readFile(file, 'utf8');
}

async function commands(): Promise<string[]> {
  const text = await readFile(log, 'utf8').catch(() => '');
  await writeFile(log, '');
  return text.split('\n').filter(Boolean);
}

async function waitFor(
  predicate: () => Promise<boolean> | boolean,
  timeoutMs = 20_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate())) {
    if (Date.now() > deadline) throw new Error('Condition was not met in time');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

describe('backups on a managed Host', () => {
  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'app-host-backups-'));
    volumesDir = path.join(root, 'volumes');
    log = path.join(root, 'commands.log');
    const artifactDir = path.join(root, 'artifacts');
    await mkdir(artifactDir, { recursive: true });
    withCli = await artifact(artifactDir, 'with-cli', true);
    withoutCli = await artifact(artifactDir, 'without-cli', false);
    otherCli = await artifact(artifactDir, 'other-cli', true);
    await writeFile(
      path.join(root, 'host.json'),
      JSON.stringify({
        host: {
          mode: 'managed',
          server: { host: '127.0.0.1', port: 0 },
          artifact: {
            driver: 'fs',
            location: artifactDir,
            visibility: 'private',
          },
          appRevisionsDir: path.join(root, 'revisions'),
          appVolumesDir: volumesDir,
          controlDir: path.join(root, 'control'),
          logging: { file: { directory: path.join(root, 'host-logs') } },
        },
      }),
    );
    await startSupervisor();
  }, 60_000);

  afterAll(async () => {
    await supervisor?.shutdown();
    if (root) await rm(root, { recursive: true, force: true });
  }, 60_000);

  it('backs an App up with its own release, configuration and environment, once per operation', async () => {
    await host.applyDeployment(spec('create-d', withCli));
    await data('first');
    await commands();

    const backup = await host.createBackup!('demo', {
      operationId: 'create-b',
      scope,
    });
    expect(backup).toMatchObject({
      backupId: 'create-b',
      appId: 'demo',
      version: '0.0.1',
      artifact: withCli.checksum,
      complete: true,
      manifest: { connections: [{ name: 'main', mode: 'dump' }] },
    });
    expect(backup).not.toHaveProperty('location');
    expect(backup.sha256).toMatch(/^[0-9a-f]{64}$/);
    // create, then verify against the App, then inspect; each with the App's configuration file.
    expect(await commands()).toEqual([
      'backup create demo: true',
      'backup verify demo: true',
      'backup inspect demo: true',
    ]);
    await expect(stat(archive('create-b'))).resolves.toBeTruthy();

    // The same operation answers its result without running anything.
    await expect(
      host.createBackup!('demo', { operationId: 'create-b', scope }),
    ).resolves.toEqual(backup);
    expect(await commands()).toEqual([]);
    await expect(
      host.getOperation('create-b', { scope }),
    ).resolves.toMatchObject({
      kind: 'backup',
      state: 'succeeded',
      appId: 'demo',
      result: backup,
    });
  });

  it('backs an App up with the configuration published since it was deployed', async () => {
    const deployment = spec('config-d', withCli);
    await host.applyDeployment({
      ...deployment,
      config: { provider: 'file', content: 'demo: A\n', revision: 'config-d' },
    });
    await host.publishAppConfig('demo', 'demo: B\n');
    await commands();
    await host.createBackup!('demo', { operationId: 'config-b', scope });
    expect(await commands()).toEqual([
      'backup create demo: B',
      'backup verify demo: B',
      'backup inspect demo: B',
    ]);
    await expect(
      readFile(
        path.join(volumesDir, 'demo', 'configs', 'config.config-d.yml'),
        'utf8',
      ),
    ).resolves.toBe('demo: B\n');
  });

  it('runs one operation once when it is asked for twice at the same time, and refuses its ID for anything else', async () => {
    await host.applyDeployment(spec('twice-d', withCli));
    await data('before');
    await host.createBackup!('demo', { operationId: 'twice-b', scope });
    await data('after');
    await commands();

    const restore = () =>
      host.restoreBackup!('demo', {
        operationId: 'twice-r',
        scope,
        backupId: 'twice-b',
        deployment: spec('twice-r', withCli),
      });
    const [first, second] = await Promise.all([restore(), restore()]);
    expect(second).toEqual(first);
    expect(
      (await commands()).filter((line) => line.startsWith('backup restore')),
    ).toHaveLength(1);
    expect(await data()).toBe('before');

    // The same ID for another kind of operation or another App is refused, under way or recorded.
    await expect(
      host.createBackup!('demo', { operationId: 'twice-r', scope }),
    ).rejects.toMatchObject({ code: 'OPERATION_CONFLICT' });
    await expect(
      host.applyDeployment(spec('twice-b', withCli)),
    ).rejects.toMatchObject({ code: 'OPERATION_CONFLICT' });
    await host.applyDeployment(
      spec('twice-d2', withCli, { BACKUP_CLI_HOLD: path.join(root, 'hold') }),
    );
    await writeFile(path.join(root, 'hold'), '');
    const held = host.createBackup!('demo', {
      operationId: 'twice-held',
      scope,
    });
    await waitFor(async () =>
      (await readFile(log, 'utf8')).includes('backup create'),
    );
    await expect(
      host.restoreBackup!('demo', {
        operationId: 'twice-held',
        scope,
        backupId: 'twice-b',
        deployment: spec('twice-held', withCli),
      }),
    ).rejects.toMatchObject({ code: 'OPERATION_CONFLICT' });
    await rm(path.join(root, 'hold'));
    await expect(held).resolves.toMatchObject({ backupId: 'twice-held' });
  });

  it('refuses a restore it cannot finish before it stops the App', async () => {
    await host.applyDeployment(spec('refuse-d', withCli));
    await data('kept');
    const backup = await host.createBackup!('demo', {
      operationId: 'refuse-b',
      scope,
    });
    await host.applyDeployment(
      spec('refuse-partial-d', withCli, {
        BACKUP_CLI_MANIFEST: JSON.stringify({
          connections: [{ name: 'main', mode: 'recovery-point' }],
          limitations: ['main is restored from an external recovery point'],
        }),
      }),
    );
    await expect(
      host.createBackup!('demo', { operationId: 'refuse-partial', scope }),
    ).resolves.toMatchObject({ complete: false });
    await host.applyDeployment(spec('refuse-d2', withCli));
    await data('changed');
    await commands();

    const refusals: [string, Partial<Parameters<typeof restore>[0]>, string][] =
      [
        ['incomplete', { backupId: 'refuse-partial' }, 'BACKUP_INCOMPLETE'],
        [
          'other-release',
          { deployment: spec('other-release', otherCli) },
          'BACKUP_ARTIFACT_MISMATCH',
        ],
        ['digest', { sha256: '0'.repeat(64) }, 'BACKUP_DIGEST_MISMATCH'],
        ['missing', { backupId: 'refuse-none' }, 'BACKUP_NOT_FOUND'],
      ];
    function restore(options: {
      operationId: string;
      backupId?: string;
      sha256?: string;
      deployment?: HostDeploymentSpec;
    }) {
      return host.restoreBackup!('demo', {
        scope,
        backupId: backup.backupId,
        deployment: spec(options.operationId, withCli),
        ...options,
      });
    }
    for (const [operationId, options, code] of refusals) {
      await expect(restore({ operationId, ...options })).rejects.toMatchObject({
        code,
      });
      expect(await running()).toBe(true);
    }
    // A missing archive is found by verify, also while the App runs.
    await rm(archive('refuse-b'));
    await expect(restore({ operationId: 'gone' })).rejects.toMatchObject({
      code: 'BACKUP_ARCHIVE_NOT_FOUND',
    });
    expect(await running()).toBe(true);
    expect(
      (await commands()).filter((line) => line.startsWith('backup restore')),
    ).toEqual([]);
    expect(await data()).toBe('changed');
  });

  it('restores a backup with the given deployment and starts the App', async () => {
    await host.applyDeployment(spec('restore-d', withCli));
    await data('first');
    await host.createBackup!('demo', { operationId: 'restore-b', scope });
    await data('changed');
    await commands();
    const restored = await host.restoreBackup!('demo', {
      operationId: 'restore-r',
      scope,
      backupId: 'restore-b',
      deployment: spec('restore-r', withCli),
    });
    expect(restored.restore).toMatchObject({
      connections: [{ name: 'main', status: 'restored' }],
    });
    expect(restored.status.deployments).toMatchObject([
      { appId: 'demo', observedState: 'running', operationId: 'restore-r' },
    ]);
    expect(await data()).toBe('first');
    expect(await commands()).toEqual([
      'backup verify demo: true',
      'backup restore demo: true',
    ]);
  });

  it('keeps the command code and report of a failed restore and leaves the App stopped', async () => {
    await host.applyDeployment(spec('fail-d', withCli));
    await host.createBackup!('demo', { operationId: 'fail-b', scope });
    const deployment = spec('fail-r', withCli, {
      BACKUP_CLI_FAIL_RESTORE: '1',
    });
    const failure = await host.restoreBackup!('demo', {
      operationId: 'fail-r',
      scope,
      backupId: 'fail-b',
      deployment,
    }).catch((error: unknown) => error);
    expect(failure).toMatchObject({
      code: 'RESTORE_IMPORT_FAILED',
      details: { connections: [{ name: 'main', status: 'rolled-back' }] },
    });
    await expect(host.getOperation('fail-r', { scope })).resolves.toMatchObject(
      {
        kind: 'restore',
        state: 'failed',
        errorCode: 'RESTORE_IMPORT_FAILED',
        errorDetails: {
          connections: [{ name: 'main', status: 'rolled-back' }],
        },
      },
    );
    expect(await running()).toBe(false);
    // Asked again, the recorded failure answers without running the command.
    await commands();
    await expect(
      host.restoreBackup!('demo', {
        operationId: 'fail-r',
        scope,
        backupId: 'fail-b',
        deployment,
      }),
    ).rejects.toMatchObject({ code: 'RESTORE_IMPORT_FAILED' });
    expect(await commands()).toEqual([]);
  });

  it('refuses a release without the backup commands', async () => {
    await host.applyDeployment(spec('old-d', withoutCli));
    await expect(
      host.createBackup!('demo', { operationId: 'old-b', scope }),
    ).rejects.toMatchObject({ code: 'BACKUP_COMMAND_UNAVAILABLE' });
    await expect(
      host.createBackup!('missing', { operationId: 'missing-b', scope }),
    ).rejects.toMatchObject({ code: 'APP_NOT_FOUND' });
  });

  it('ends a backup with its killed Host, keeps it interrupted and runs it again when asked', async () => {
    const deployment = spec('killed-d', withCli, {
      BACKUP_CLI_HOLD: path.join(root, 'hold'),
      BACKUP_CLI_PID: path.join(root, 'cli.pid'),
    });
    await host.applyDeployment(deployment);
    await data('killed');
    await writeFile(path.join(root, 'hold'), '');
    const pending = host.createBackup!('demo', {
      operationId: 'killed-b',
      scope,
    }).catch((error: unknown) => error);
    await waitFor(
      async () =>
        (await readFile(path.join(root, 'cli.pid'), 'utf8').catch(() => ''))
          .length > 0,
    );
    const cli = Number(await readFile(path.join(root, 'cli.pid'), 'utf8'));
    killHost();
    expect(await pending).toBeInstanceOf(Error);
    await supervisor.shutdown();
    // The command does not outlive its Host.
    await waitFor(() => !alive(cli));
    await rm(path.join(root, 'hold'));
    await rm(path.join(root, 'cli.pid'));

    await startSupervisor();
    await expect(
      host.getOperation('killed-b', { scope }),
    ).resolves.toMatchObject({ kind: 'backup', state: 'interrupted' });
    await host.restoreDeploymentSet({
      revision: 1,
      scope,
      deployments: [deployment],
    });
    await commands();
    await expect(
      host.createBackup!('demo', { operationId: 'killed-b', scope }),
    ).resolves.toMatchObject({ backupId: 'killed-b', complete: true });
    expect(await commands()).toEqual([
      'backup create demo: true',
      'backup verify demo: true',
      'backup inspect demo: true',
    ]);
  }, 60_000);

  it('does not restore the data again when its Host was killed after the data was back', async () => {
    const env = {
      DEMO_START_HOLD: path.join(root, 'start-hold'),
      DEMO_START_MARK: path.join(root, 'start-mark'),
    };
    const deployment = spec('resume-d', withCli, env);
    await host.applyDeployment(deployment);
    await data('backed-up');
    await host.createBackup!('demo', { operationId: 'resume-b', scope });
    await data('replaced');
    await commands();

    // The restore puts the data back, then its deployment holds while the App starts; the Host is killed there.
    await writeFile(env.DEMO_START_HOLD, '');
    const restore = () =>
      host.restoreBackup!('demo', {
        operationId: 'resume-r',
        scope,
        backupId: 'resume-b',
        deployment: spec('resume-r', withCli, env),
      });
    const pending = restore().catch((error: unknown) => error);
    await waitFor(
      async () => (await stat(env.DEMO_START_MARK).catch(() => null)) !== null,
    );
    expect(await data()).toBe('backed-up');
    killHost();
    expect(await pending).toBeInstanceOf(Error);
    await supervisor.shutdown();
    await rm(env.DEMO_START_HOLD);
    await rm(env.DEMO_START_MARK);

    await startSupervisor();
    await expect(
      host.getOperation('resume-r', { scope }),
    ).resolves.toMatchObject({
      kind: 'restore',
      state: 'interrupted',
      checkpoint: 'restored',
    });
    // What the App wrote once it was back is not overwritten by the retry, which only deploys it again.
    await data('written-after');
    await commands();
    const restored = await restore();
    expect(restored.restore).toMatchObject({
      connections: [{ name: 'main', status: 'restored' }],
    });
    expect(restored.status.deployments).toMatchObject([
      { appId: 'demo', observedState: 'running', operationId: 'resume-r' },
    ]);
    expect(await commands()).toEqual([]);
    expect(await data()).toBe('written-after');
  }, 60_000);

  it('removes a backup', async () => {
    await host.applyDeployment(spec('remove-d', withCli));
    await host.createBackup!('demo', { operationId: 'remove-b', scope });
    await expect(
      host.deleteBackup!('demo', 'remove-b', { scope }),
    ).resolves.toEqual({ deleted: true });
    await expect(stat(archive('remove-b'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(
      host.deleteBackup!('demo', 'remove-b', { scope }),
    ).resolves.toEqual({ deleted: false });
  });
});

function archive(backupId: string): string {
  return path.join(volumesDir, 'demo', 'backups', `${backupId}.tar.gz`);
}

async function running(): Promise<boolean> {
  const status = await host.getStatus({ scope: scope.id });
  return (
    status.deployments.find((deployment) => deployment.appId === 'demo')
      ?.observedState === 'running'
  );
}

/** Kills the Host process outright, and the `tsx` launcher it runs under when run from sources. */
function killHost(): void {
  const launcher = supervisor.getInfo().pid!;
  const tsx = readFileSync(`/proc/${launcher}/cmdline`, 'utf8').includes('tsx');
  const children = tsx
    ? spawnSync('pgrep', ['-P', String(launcher)], { encoding: 'utf8' })
        .stdout.split('\n')
        .filter(Boolean)
        .map(Number)
    : [];
  for (const pid of [...children, launcher]) process.kill(pid, 'SIGKILL');
}
