/**
 * Backups and restores on a managed Host, through its child process and IPC channel, with a stand-in for a release's
 * `backup` commands (`fixtures/backup-cli.mjs`): what the Host runs and with which environment, how it answers a
 * repeated operation, a failure with the command's code and report, a release without the commands, an incomplete
 * archive, and a Host killed while a backup runs. `backup-integration.test.ts` runs the same against a real release.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
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
    config: { provider: 'file', content: 'demo: true\n', revision: operationId },
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
    await host.applyDeployment(spec('d-1', withCli));
    await data('first');

    const backup = await host.createBackup!('demo', {
      operationId: 'b-1',
      scope,
    });
    expect(backup).toMatchObject({
      backupId: 'b-1',
      appId: 'demo',
      version: '0.0.1',
      artifact: withCli.checksum,
      complete: true,
      manifest: { connections: [{ name: 'main', mode: 'dump' }] },
    });
    expect(backup.sha256).toMatch(/^[0-9a-f]{64}$/);
    // create, then verify against the App, then inspect; each with the App's configuration file.
    expect(await commands()).toEqual([
      'backup create config',
      'backup verify config',
      'backup inspect config',
    ]);
    const archive = path.join(volumesDir, 'demo', 'backups', 'b-1.tar.gz');
    await expect(stat(archive)).resolves.toBeTruthy();

    // The same operation answers its result without running anything.
    await expect(
      host.createBackup!('demo', { operationId: 'b-1', scope }),
    ).resolves.toEqual(backup);
    expect(await commands()).toEqual([]);
    await expect(host.getOperation('b-1', { scope })).resolves.toMatchObject({
      kind: 'backup',
      state: 'succeeded',
      appId: 'demo',
      result: backup,
    });
  });

  it('reports an archive that does not restore everything by itself as incomplete', async () => {
    await host.applyDeployment(
      spec('d-2', withCli, {
        BACKUP_CLI_MANIFEST: JSON.stringify({
          connections: [{ name: 'main', mode: 'recovery-point' }],
          limitations: ['main is restored from an external recovery point'],
        }),
      }),
    );
    await expect(
      host.createBackup!('demo', { operationId: 'b-partial', scope }),
    ).resolves.toMatchObject({ complete: false });
    await host.applyDeployment(spec('d-3', withCli));
    await commands();
  });

  it('restores a backup with the given deployment and starts the App', async () => {
    await data('changed');
    const restored = await host.restoreBackup!('demo', {
      operationId: 'r-1',
      scope,
      backupId: 'b-1',
      deployment: spec('r-1', withCli),
    });
    expect(restored.restore).toMatchObject({
      connections: [{ name: 'main', status: 'restored' }],
    });
    expect(restored.status.deployments).toMatchObject([
      { appId: 'demo', observedState: 'running', operationId: 'r-1' },
    ]);
    expect(await data()).toBe('first');
    expect(await commands()).toEqual(['backup restore config']);
  });

  it('keeps the command code and report of a failed restore and leaves the App stopped', async () => {
    const failure = await host
      .restoreBackup!('demo', {
        operationId: 'r-wrong',
        scope,
        backupId: 'b-1',
        sha256: '0'.repeat(64),
        deployment: spec('r-wrong', withCli),
      })
      .catch((error: unknown) => error);
    expect(failure).toMatchObject({
      code: 'BACKUP_DIGEST_MISMATCH',
      details: { connections: [{ name: 'main', status: 'not-started' }] },
    });
    await expect(
      host.getOperation('r-wrong', { scope }),
    ).resolves.toMatchObject({
      kind: 'restore',
      state: 'failed',
      errorCode: 'BACKUP_DIGEST_MISMATCH',
      errorDetails: { connections: [{ name: 'main', status: 'not-started' }] },
    });
    const status = await host.getStatus({ scope: scope.id });
    expect(status.deployments).toMatchObject([
      { appId: 'demo', observedState: 'stopped' },
    ]);
    // Asked again, the recorded failure answers without running the command.
    await commands();
    await expect(
      host.restoreBackup!('demo', {
        operationId: 'r-wrong',
        scope,
        backupId: 'b-1',
        deployment: spec('r-wrong', withCli),
      }),
    ).rejects.toMatchObject({ code: 'BACKUP_DIGEST_MISMATCH' });
    expect(await commands()).toEqual([]);
    await expect(
      host.restoreBackup!('demo', {
        operationId: 'r-missing',
        scope,
        backupId: 'b-none',
        deployment: spec('r-missing', withCli),
      }),
    ).rejects.toMatchObject({ code: 'BACKUP_NOT_FOUND' });
  });

  it('refuses a release without the backup commands', async () => {
    await host.applyDeployment(spec('d-old', withoutCli));
    await expect(
      host.createBackup!('demo', { operationId: 'b-old', scope }),
    ).rejects.toMatchObject({ code: 'BACKUP_COMMAND_UNAVAILABLE' });
    await expect(
      host.createBackup!('missing', { operationId: 'b-missing', scope }),
    ).rejects.toMatchObject({ code: 'APP_NOT_FOUND' });
  });

  it('ends a backup with its killed Host, keeps it interrupted and runs it again when asked', async () => {
    const deployment = spec('d-4', withCli, {
      BACKUP_CLI_HOLD: path.join(root, 'hold'),
      BACKUP_CLI_PID: path.join(root, 'cli.pid'),
    });
    await host.applyDeployment(deployment);
    await writeFile(path.join(root, 'hold'), '');
    const pending = host
      .createBackup!('demo', { operationId: 'b-killed', scope })
      .catch((error: unknown) => error);
    await waitFor(async () =>
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
      host.getOperation('b-killed', { scope }),
    ).resolves.toMatchObject({ kind: 'backup', state: 'interrupted' });
    await expect(host.getOperation('b-1', { scope })).resolves.toMatchObject({
      state: 'succeeded',
    });
    await host.restoreDeploymentSet({
      revision: 1,
      scope,
      deployments: [deployment],
    });
    await commands();
    await expect(
      host.createBackup!('demo', { operationId: 'b-killed', scope }),
    ).resolves.toMatchObject({ backupId: 'b-killed', complete: true });
    expect(await commands()).toEqual([
      'backup create config',
      'backup verify config',
      'backup inspect config',
    ]);
  }, 60_000);

  it('removes a backup', async () => {
    await expect(
      host.deleteBackup!('demo', 'b-1', { scope }),
    ).resolves.toEqual({ deleted: true });
    await expect(
      stat(path.join(volumesDir, 'demo', 'backups', 'b-1.tar.gz')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      host.deleteBackup!('demo', 'b-1', { scope }),
    ).resolves.toEqual({ deleted: false });
  });
});

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
