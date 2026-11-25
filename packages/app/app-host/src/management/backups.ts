/**
 * Backups of an App's databases and files on a managed Host, taken and restored by the App's own `backup` commands
 * (`create`, `verify`, `inspect`, `restore`) wherever the App runs: in-process Apps through a child process of the
 * Host, external services through their backend (`ServiceBackend.commandRunner`). The App's release does the work, so
 * the archive matches its schema and the Host never reads its databases itself.
 *
 * Archives live where their runner keeps them (`<appVolumesDir>/<appId>/backups/` for in-process Apps), outside the
 * App's storage so that a backup never contains the previous ones; the Host records each one beside its record in
 * `<appVolumesDir>/<appId>/backups/<backupId>.json`. A control plane never reads either directly: it keeps the
 * `HostBackup` it is answered, restores by ID and deletes by ID.
 */
import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import type { AppRuntimeRegistry } from '../app-registry.ts';
import type { AppDefinition } from '../app-types.ts';
import {
  isServiceBackend,
  type AppCommandRunner,
  type BackupArchiveLocation,
} from '../service-backend.ts';
import { InProcessCommandRunner } from './app-command.ts';
import { assertCopyStorage, managedVolume } from './copy-restore-storage.ts';
import type { ManagedReconciler } from './managed-reconciler.ts';
import { assertOperationId } from './operation-log.ts';
import { HostManagementError, type OperationCheckpoint } from './scopes.ts';
import type {
  HostBackup,
  HostDeploymentSpec,
  HostRestoreResult,
  HostStatus,
} from './types.ts';

const APP_ID = /^[a-zA-Z0-9_-]+$/;
/** oclif's answer for a command an older release does not have. */
const MISSING_COMMAND = /command \S*backup\S* not found/i;

export interface HostBackupsOptions {
  readonly reconciler: ManagedReconciler;
  readonly registry: AppRuntimeRegistry;
  /** `<appVolumesDir>`: where in-process archives and every backup record live. */
  readonly volumesDir: string;
  readonly now?: () => number;
}

/** The step after which a restore is not repeated (`OperationCheckpoint`). */
const RESTORED = 'restored';

/** What the Host keeps of a backup: the answer, and where a service backend wrote its archive. */
interface BackupRecord extends HostBackup {
  readonly location?: BackupArchiveLocation;
}

export class HostBackups {
  /** Backups and restores of one App run one at a time. */
  private readonly locks = new Map<string, Promise<unknown>>();
  private readonly now: () => number;

  constructor(private readonly options: HostBackupsOptions) {
    this.now = options.now ?? Date.now;
  }

  /**
   * Backs the App up as it runs now (or, `offline`, requires it stopped): `backup create`, then `backup verify`
   * against the App and `backup inspect`, whose manifest the answer carries. A failed step leaves no archive.
   */
  create(
    appId: string,
    backupId: string,
    options: { readonly offline?: boolean } = {},
  ): Promise<HostBackup> {
    assertAppId(appId);
    assertOperationId(backupId);
    return this.withAppLock(appId, async () => {
      const spec = this.options.reconciler.specOf(appId);
      if (!spec)
        throw new HostManagementError(
          `App "${appId}" is not deployed on this Host`,
          'APP_NOT_FOUND',
        );
      // The configuration the App runs with now: one published since it was deployed must not be overwritten.
      const runner = await this.runnerFor(
        await this.options.reconciler.commandDefinition(spec, {
          config: 'current',
        }),
      );
      const name = archiveName(backupId);
      const archive = `${runner.backupsDir}/${name}`;
      // A repeat after an interrupted run starts over: the archive left behind is not known to be verified.
      await rm(this.recordPath(appId, backupId), { force: true });
      await runner.removeBackupFile(name);
      try {
        const created = (await runCommand(runner, [
          'backup',
          'create',
          '--output',
          archive,
          ...(options.offline ? ['--offline'] : []),
          '--json',
        ])) as { size?: unknown; sha256?: unknown };
        if (
          typeof created?.sha256 !== 'string' ||
          typeof created.size !== 'number'
        )
          throw new HostManagementError(
            'backup create did not report the archive it wrote',
            'BACKUP_FAILED',
          );
        await runCommand(runner, [
          'backup',
          'verify',
          archive,
          '--sha256',
          created.sha256,
          '--json',
        ]);
        const manifest = (await runCommand(runner, [
          'backup',
          'inspect',
          archive,
          '--json',
        ])) as Record<string, unknown>;
        const backup: HostBackup = {
          backupId,
          appId,
          createdAt: new Date(this.now()).toISOString(),
          size: created.size,
          sha256: created.sha256,
          complete: isComplete(manifest),
          manifest,
          version: spec.artifact?.version ?? null,
          artifact: releaseOf(runner, spec),
        };
        await this.writeRecord({ ...backup, location: runner.location });
        return backup;
      } catch (error) {
        await runner.removeBackupFile(name).catch(() => undefined);
        throw error;
      }
    });
  }

  /**
   * Restores a backup: checks that it is complete, that the deployment runs the release it was taken with, and that
   * its archive verifies with that release, all while the App still runs; then stops the App, runs `backup restore`
   * with the deployment's release, configuration and environment, and deploys it. A refused restore leaves the App as
   * it was; a failed one leaves it stopped with the command's report in the error.
   *
   * Once the data is back the step is recorded (`checkpoint`), so a retry after the Host stopped only deploys the App
   * again and never puts the backup over what the App wrote after it came back.
   */
  restore(
    appId: string,
    options: {
      readonly backupId: string;
      readonly sourceAppId?: string;
      readonly sha256?: string;
      readonly deployment: HostDeploymentSpec;
      readonly checkpoint?: OperationCheckpoint;
      /** Deploys the App once its data is restored. */
      readonly deploy: (spec: HostDeploymentSpec) => Promise<HostStatus>;
    },
  ): Promise<HostRestoreResult> {
    assertAppId(appId);
    assertOperationId(options.backupId);
    if (!options.deployment || options.deployment.appId !== appId)
      throw new Error(
        `The deployment to restore must be one of App "${appId}"`,
      );
    const sourceAppId = options.sourceAppId;
    if (sourceAppId !== undefined) {
      assertAppId(sourceAppId);
      if (sourceAppId === appId)
        throw new HostManagementError(
          'The restore source must name a different App.',
          'BACKUP_INVALID_SOURCE',
        );
    }
    const restore = async (): Promise<HostRestoreResult> => {
      const previous = options.checkpoint?.previous;
      const restore =
        previous?.name === RESTORED
          ? ((previous.result as { restore?: Record<string, unknown> } | null)
              ?.restore ?? {})
          : await this.restoreData(appId, options);
      const status = await options.deploy(options.deployment);
      const deployed = status.deployments.find(
        (deployment) => deployment.appId === appId,
      );
      if (!deployed || deployed.observedState === 'failed')
        throw new HostManagementError(
          `The backup was restored, but App "${appId}" did not start: ${deployed?.error ?? 'the Host did not report it'}`,
          'RESTORE_START_FAILED',
          { restore, deployment: deployed ?? null },
        );
      return { restore, status };
    };
    if (!sourceAppId) return this.withAppLock(appId, restore);
    // A fixed lock order also lets two Apps request opposite-direction copies without deadlocking.
    const [first, second] =
      sourceAppId < appId ? [sourceAppId, appId] : [appId, sourceAppId];
    return this.withAppLock(first, () => this.withAppLock(second, restore));
  }

  private async restoreData(
    appId: string,
    options: {
      readonly backupId: string;
      readonly sourceAppId?: string;
      readonly sha256?: string;
      readonly deployment: HostDeploymentSpec;
      readonly checkpoint?: OperationCheckpoint;
    },
  ): Promise<Record<string, unknown>> {
    const sourceAppId = options.sourceAppId ?? appId;
    const backup = await this.readRecord(sourceAppId, options.backupId);
    if (!backup)
      throw new HostManagementError(
        `App "${sourceAppId}" has no backup "${options.backupId}" on this Host`,
        'BACKUP_NOT_FOUND',
      );
    if (!backup.complete)
      throw new HostManagementError(
        `Backup "${backup.backupId}" does not restore everything by itself (${describeGaps(backup.manifest)}); it cannot be restored automatically`,
        'BACKUP_INCOMPLETE',
        { limitations: backup.manifest.limitations ?? [] },
      );
    if (
      options.sourceAppId &&
      options.sha256 !== undefined &&
      options.sha256 !== backup.sha256
    )
      throw new HostManagementError(
        'The requested checksum does not match the recorded source archive.',
        'BACKUP_DIGEST_MISMATCH',
      );
    const copyArchive = options.sourceAppId
      ? await this.copyArchive(appId, sourceAppId, backup, options.deployment)
      : undefined;
    // Checked with the deployment's configuration in a file of its own: refused, the App keeps running as it was,
    // with the configuration it runs with now.
    const preflight = await this.options.reconciler.preflightDefinition(
      options.deployment,
    );
    const sha256 = options.sha256 ?? backup.sha256;
    try {
      const runner = await this.runnerFor(preflight.definition);
      const target = releaseOf(runner, options.deployment);
      if (backup.artifact !== null && target !== backup.artifact)
        throw new HostManagementError(
          `Backup "${backup.backupId}" was taken with release ${backup.version ?? '?'} (${backup.artifact}); restore it with the deployment of that release, not ${options.deployment.artifact?.version ?? '?'} (${target ?? 'none'})`,
          'BACKUP_ARTIFACT_MISMATCH',
          { backup: backup.artifact, deployment: target },
        );
      if (copyArchive) {
        if (!(runner instanceof InProcessCommandRunner))
          throw new HostManagementError(
            'Cross-instance restore requires in-process Apps on the same Host.',
            'BACKUP_UNSUPPORTED',
          );
        await assertCopyStorage(
          appId,
          path.join(copyArchive.targetVolume, 'storage'),
          copyArchive.source,
          runner,
        );
      }
      // The archive is missing, damaged or not this release's.
      await runCommand(runner, [
        'backup',
        'verify',
        copyArchive?.path ??
          `${runner.backupsDir}/${archiveName(backup.backupId)}`,
        '--sha256',
        sha256,
        '--json',
      ]);
    } finally {
      await preflight.dispose();
    }
    await this.options.reconciler.stopForRestore(appId);
    const runner = await this.runnerFor(
      await this.options.reconciler.commandDefinition(options.deployment),
    );
    const restore = (await runCommand(runner, [
      'backup',
      'restore',
      copyArchive?.path ??
        `${runner.backupsDir}/${archiveName(backup.backupId)}`,
      '--sha256',
      sha256,
      ...(copyArchive && backupUsesPostgres(backup)
        ? ['--postgres-target-owner']
        : []),
      '--json',
    ])) as Record<string, unknown>;
    await options.checkpoint?.save(RESTORED, { restore });
    return restore;
  }

  private async copyArchive(
    appId: string,
    sourceAppId: string,
    backup: BackupRecord,
    deployment: HostDeploymentSpec,
  ): Promise<{
    path: string;
    source: InProcessCommandRunner;
    targetVolume: string;
  }> {
    const sourceSpec = this.options.reconciler.specOf(sourceAppId);
    if (!sourceSpec)
      throw new HostManagementError(
        'The restore source is not deployed on this Host.',
        'APP_NOT_FOUND',
      );
    if (sourceSpec.scope?.id !== deployment.scope?.id)
      throw new HostManagementError(
        'The source App must belong to the target scope.',
        'APP_OWNED_BY_OTHER_SCOPE',
      );
    if (
      sourceSpec.backend !== 'in-process' ||
      deployment.backend !== 'in-process' ||
      backup.location
    )
      throw new HostManagementError(
        'Cross-instance restore requires in-process Apps on the same Host.',
        'BACKUP_UNSUPPORTED',
      );
    if (
      this.options.reconciler.specOf(appId) ||
      this.options.registry.definition(appId)
    )
      throw new HostManagementError(
        'Cross-instance restore requires a new target App.',
        'BACKUP_TARGET_EXISTS',
      );

    const sourceRoot = await managedVolume(
      this.options.volumesDir,
      sourceAppId,
    );
    // Validate the volume before preflight writes configuration or creates storage in it.
    const targetVolume = await managedVolume(this.options.volumesDir, appId);
    const dir = path.join(sourceRoot, 'backups');
    const file = path.join(dir, archiveName(backup.backupId));
    if (!(await lstat(dir)).isDirectory() || !(await lstat(file)).isFile())
      throw new HostManagementError(
        'The source archive must be a regular local file.',
        'BACKUP_INVALID_SOURCE',
      );
    const source =
      await this.options.reconciler.backupSourceDefinition(sourceSpec);
    return {
      path: file,
      source: new InProcessCommandRunner(source, dir),
      targetVolume,
    };
  }

  /**
   * Removes a backup's archive, then its record; false when there was none. The archive is found where it was
   * written, also once its App was removed with its data kept; when it cannot be removed the record stays, so the
   * delete can be asked again.
   */
  delete(appId: string, backupId: string): Promise<boolean> {
    assertAppId(appId);
    assertOperationId(backupId);
    return this.withAppLock(appId, async () => {
      const record = await this.readRecord(appId, backupId);
      if (!record) return false;
      const name = archiveName(backupId);
      if (record.location) {
        const location = record.location;
        const backend = this.options.registry
          .listBackends()
          .find(
            (candidate) =>
              isServiceBackend(candidate) &&
              candidate.name === location.backend,
          );
        if (
          !backend ||
          !isServiceBackend(backend) ||
          !backend.removeBackupArchive
        )
          throw new HostManagementError(
            `The "${location.backend}" backend that keeps backup "${backupId}" is not available on this Host`,
            'BACKEND_UNAVAILABLE',
          );
        await backend.removeBackupArchive(location, appId, name);
      } else await rm(path.join(this.backupsDir(appId), name), { force: true });
      await rm(this.recordPath(appId, backupId), { force: true });
      return true;
    });
  }

  /** The recorded backup, or null. */
  async read(appId: string, backupId: string): Promise<HostBackup | null> {
    const record = await this.readRecord(appId, backupId);
    if (!record) return null;
    const { location: _location, ...backup } = record;
    return backup;
  }

  private async readRecord(
    appId: string,
    backupId: string,
  ): Promise<BackupRecord | null> {
    try {
      const value = JSON.parse(
        await readFile(this.recordPath(appId, backupId), 'utf8'),
      ) as BackupRecord;
      return value?.backupId === backupId && value.appId === appId
        ? value
        : null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------------------------------------------

  private async runnerFor(
    definition: AppDefinition,
  ): Promise<AppCommandRunner> {
    if (definition.backend === 'in-process')
      return new InProcessCommandRunner(
        definition,
        this.backupsDir(definition.id),
      );
    const backend = this.options.registry.backendOf(definition);
    if (!backend || !isServiceBackend(backend) || !backend.commandRunner)
      throw new HostManagementError(
        `The "${definition.backend}" backend of App "${definition.id}" cannot back Apps up`,
        'BACKUP_UNSUPPORTED',
      );
    return await backend.commandRunner(definition);
  }

  private backupsDir(appId: string): string {
    return path.join(this.options.volumesDir, appId, 'backups');
  }

  private recordPath(appId: string, backupId: string): string {
    return path.join(this.backupsDir(appId), `${backupId}.json`);
  }

  private async writeRecord(backup: BackupRecord): Promise<void> {
    const target = this.recordPath(backup.appId, backup.backupId);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(backup)}\n`, {
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async withAppLock<T>(appId: string, work: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(appId) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(work);
    const settled = run.catch(() => undefined);
    this.locks.set(appId, settled);
    try {
      return await run;
    } finally {
      if (this.locks.get(appId) === settled) this.locks.delete(appId);
    }
  }
}

function backupUsesPostgres(backup: HostBackup): boolean {
  const { connections } = backup.manifest;
  return (
    Array.isArray(connections) &&
    connections.some(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'dialect' in item &&
        item.dialect === 'postgres',
    )
  );
}

/**
 * Whether an archive restores everything by itself: every database exported (`dump`), every disk's files in it, and
 * nothing the command listed as a limitation (an external recovery point, a remote disk's versioning).
 */
export function isComplete(manifest: Record<string, unknown>): boolean {
  const connections = manifest.connections;
  const disks = manifest.disks;
  const limitations = manifest.limitations;
  return (
    Array.isArray(connections) &&
    Array.isArray(disks) &&
    Array.isArray(limitations) &&
    limitations.length === 0 &&
    connections.every(
      (connection) => (connection as { mode?: unknown })?.mode === 'dump',
    ) &&
    disks.every((disk) => (disk as { mode?: unknown })?.mode === 'files')
  );
}

/**
 * Runs one command with `--json` and answers its result; a failure becomes a `HostManagementError` with the
 * command's code and details, and a release without the command fails with `BACKUP_COMMAND_UNAVAILABLE`.
 */
async function runCommand(
  runner: AppCommandRunner,
  args: readonly string[],
): Promise<unknown> {
  const output = await runner.run(args);
  const envelope = parseEnvelope(output.stdout);
  const command = args.slice(0, 2).join(' ');
  if (envelope?.ok === true && output.exitCode === 0)
    return envelope.result ?? null;
  const unavailable = (): HostManagementError =>
    new HostManagementError(
      `The App's release has no "${command}" command; deploy a release built with an @nocobase/app-cli that has the backup commands`,
      'BACKUP_COMMAND_UNAVAILABLE',
    );
  if (envelope?.ok === false && envelope.error) {
    const { code, message, details } = envelope.error;
    if (code === 'INVALID_USAGE' && MISSING_COMMAND.test(message ?? ''))
      throw unavailable();
    throw new HostManagementError(
      message || `${command} failed`,
      typeof code === 'string' && code ? code : 'BACKUP_FAILED',
      details,
    );
  }
  if (MISSING_COMMAND.test(`${output.stdout}\n${output.stderr}`))
    throw unavailable();
  const tail = (output.stderr || output.stdout).trim().slice(-2000);
  throw new HostManagementError(
    `${command} exited with code ${output.exitCode}${tail ? `: ${tail}` : ''}`,
    'BACKUP_FAILED',
  );
}

interface Envelope {
  readonly ok?: unknown;
  readonly result?: unknown;
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
    readonly details?: unknown;
  };
}

/** The `--json` document a command printed: its whole output, or the last line that is one. */
function parseEnvelope(stdout: string): Envelope | null {
  const text = stdout.trim();
  const candidates = [text, ...text.split('\n').reverse()];
  for (const candidate of candidates) {
    if (!candidate.trim().startsWith('{')) continue;
    try {
      const value = JSON.parse(candidate) as Envelope;
      if (value && typeof value === 'object' && typeof value.ok === 'boolean')
        return value;
    } catch {
      // Not the document.
    }
  }
  return null;
}

/**
 * The release a command runs: what its backend chose (the image digest for this platform), or the spec's archive
 * checksum.
 */
function releaseOf(
  runner: AppCommandRunner,
  spec: HostDeploymentSpec,
): string | null {
  return runner.release ?? spec.artifact?.checksum ?? null;
}

/** What an incomplete manifest leaves out, for the error that refuses it. */
function describeGaps(manifest: Record<string, unknown>): string {
  const limitations = Array.isArray(manifest.limitations)
    ? manifest.limitations.filter((item) => typeof item === 'string')
    : [];
  return limitations.length
    ? limitations.join('; ')
    : 'a database or disk is not in the archive';
}

function archiveName(backupId: string): string {
  return `${backupId}.tar.gz`;
}

function assertAppId(appId: string): void {
  if (typeof appId !== 'string' || !APP_ID.test(appId))
    throw new Error('Invalid app ID');
}
