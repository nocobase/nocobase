import { existsSync } from 'node:fs';
import { rm, statfs } from 'node:fs/promises';
import path from 'node:path';
import { Flags } from '@oclif/core';
import { pendingTaskCount, runAppCli } from '../lib/app-cli.ts';
import {
  backupForUpgrade,
  backupName,
  readDatabaseInventory,
  removeBackup,
  restoreDatabase,
  type BackupResult,
} from '../lib/backup.ts';
import { confirm } from '../lib/confirm.ts';
import { switchCurrent } from '../lib/current-link.ts';
import { healthUrl, mountPathOf, readAppEnv } from '../lib/env-file.ts';
import { assertFixedMountPath } from '../lib/mount-path.ts';
import {
  EXIT_FAILED,
  EXIT_INVALID,
  EXIT_ROLLBACK_FAILED,
  EXIT_ROLLED_BACK,
  InstallerError,
} from '../lib/errors.ts';
import {
  installerCommand,
  installerCommandLine,
  shellQuote,
} from '../lib/invocation.ts';
import {
  layoutOf,
  releaseDir,
  releaseLinkTarget,
  type Layout,
} from '../lib/layout.ts';
import { acquireLock } from '../lib/lock.ts';
import {
  checkPlatform,
  checkPm2,
  checkPnpm,
  checkPortFree,
  currentNodeMajor,
} from '../lib/prechecks.ts';
import { resolveTemplateVersion } from '../lib/registry.ts';
import {
  assertStorageOutsideRelease,
  buildFromTemplate,
  checkArchiveDriver,
  unpackRelease,
  verifyBuildTarget,
  type PreparedRelease,
} from '../lib/release.ts';
import { runCommand } from '../lib/run-command.ts';
import {
  capitalize,
  hostsApplications,
  resolveArchivePath,
  subjectOf,
  templateOf,
} from '../lib/source.ts';
import {
  checkPm2Ownership,
  errorLogCommandLine,
  errorLogTail,
  startAdvice,
  startApp,
  stopApp,
  type ServiceOptions,
} from '../lib/service.ts';
import {
  findRelease,
  fixedMountPathOf,
  readState,
  writeState,
  type InstallerState,
  type ReleaseRecord,
} from '../lib/state.ts';
import { compareVersions } from '../lib/version.ts';
import type { CommandDeps, CommandOutcome } from './install.ts';

/** A build needs room for the sources and development dependencies (about 900 MB) plus the release and a backup. */
const MINIMUM_FREE_BYTES = 2 * 1024 ** 3;

export const UPGRADE_FLAGS = {
  dir: Flags.string({
    description:
      'Installation root managed by app-installer. Defaults to the current directory.',
  }),
  archive: Flags.string({
    description:
      'For an installation from a deployment archive: the new archive, built by `pnpm build --tar` for this machine.',
  }),
  to: Flags.string({
    description:
      'For a template installation: the version or dist-tag to upgrade to, latest by default, or the installed version with --rebuild. A build of that version already on disk is reused.',
  }),
  'backup-done': Flags.boolean({
    default: false,
    description:
      'Confirm that the databases app-installer cannot back up, any but SQLite, are backed up.',
  }),
  'health-timeout': Flags.integer({
    default: 180,
    min: 1,
    description:
      'Seconds to wait for the new release to answer its health check.',
  }),
  keep: Flags.integer({
    default: 3,
    min: 2,
    description:
      'Releases to keep on disk, counting the new one; the one upgraded from is always kept so rollback stays possible.',
  }),
  'keep-source': Flags.boolean({
    default: false,
    description:
      'For a template installation: keep the build directory with the sources and development dependencies.',
  }),
  rebuild: Flags.boolean({
    default: false,
    description:
      'For a template installation: build the target again even when a build of it is on disk, the running version included: for a machine whose Node major changed and has no newer version to upgrade to.',
  }),
  yes: Flags.boolean({
    default: false,
    description: 'Proceed without asking for confirmation.',
  }),
  json: Flags.boolean({
    default: false,
    description: 'Print one JSON result on stdout; progress stays on stderr.',
  }),
};

export interface UpgradeInput {
  flags: {
    dir?: string;
    archive?: string;
    to?: string;
    'backup-done': boolean;
    'health-timeout': number;
    keep: number;
    'keep-source': boolean;
    rebuild: boolean;
    yes: boolean;
    json: boolean;
  };
}

/**
 * The installation was interrupted by a previous operation that never finished; refuse to stack another on top. The one
 * operation that may follow an interrupted rebuild is the rebuild again, with `resumeRebuild`: it builds a fresh release
 * and switches to it, which `rollback` cannot do when the release it would return to was built for another Node.
 */
export function assertNoPending(
  state: InstallerState,
  root: string,
  resumeRebuild = false,
): void {
  if (!state.pending) return;
  if (state.pending.rebuild && resumeRebuild) return;
  const { action, from, to, startedAt } = state.pending;
  throw new InstallerError(
    'OPERATION_INTERRUPTED',
    `${state.pending.rebuild ? 'A rebuild of' : action === 'upgrade' ? 'An upgrade from' : 'A rollback from'} ${from}${state.pending.rebuild ? '' : ` to ${to}`}, started ${startedAt}, did not finish; ${subjectOf(state)} may be stopped or half-switched.`,
    {
      exitCode: EXIT_INVALID,
      suggestions: [
        state.pending.rebuild
          ? {
              message:
                'Run the rebuild again; it builds a fresh release and switches to it:',
              run: installerCommandLine(
                ['upgrade', '--dir', root, '--rebuild'],
                { registry: state.registry },
              ),
            }
          : {
              message:
                'Recover first; an interrupted upgrade is undone and an interrupted rollback is finished:',
              run: installerCommandLine(['rollback', '--dir', root], {
                registry: state.registry,
              }),
            },
      ],
    },
  );
}

/**
 * Keeps the newest `keep` releases by install time. `protect` — the current release and the one it was upgraded from,
 * which `rollback` returns to — is never pruned, whatever its install time.
 */
export function releasesToPrune(
  releases: readonly ReleaseRecord[],
  protect: readonly string[],
  keep: number,
): ReleaseRecord[] {
  const newestFirst = [...releases].sort((a, b) =>
    b.installedAt.localeCompare(a.installedAt),
  );
  const kept = new Set(protect);
  for (const record of newestFirst) {
    if (kept.size >= keep) break;
    kept.add(record.id);
  }
  return releases.filter((record) => !kept.has(record.id));
}

/** Whether a recorded release can run here: built for this platform, architecture and Node major. */
function fitsMachine(record: ReleaseRecord): boolean {
  try {
    verifyBuildTarget(record.buildTarget);
    return true;
  } catch {
    return false;
  }
}

/** The newest build of `version` on disk that can run here, which an upgrade to that version reuses. */
function reusableBuild(
  state: InstallerState,
  layout: Layout,
  version: string,
): ReleaseRecord | undefined {
  return [...state.releases]
    .filter(
      (record) =>
        record.version === version &&
        existsSync(releaseDir(layout, record.id)) &&
        fitsMachine(record),
    )
    .sort((a, b) => b.builtAt.localeCompare(a.builtAt))[0];
}

function recordOf(prepared: PreparedRelease): ReleaseRecord {
  return {
    id: prepared.id,
    version: prepared.version,
    builtAt: prepared.builtAt,
    installedAt: new Date().toISOString(),
    buildTarget: prepared.buildTarget,
    ...(prepared.relocatable
      ? { relocatable: true as const }
      : { basePath: prepared.basePath! }),
  };
}

function replaceRecord(state: InstallerState, record: ReleaseRecord): void {
  state.releases = [
    ...state.releases.filter((entry) => entry.id !== record.id),
    record,
  ];
}

async function checkFreeSpace(root: string): Promise<void> {
  const stats = await statfs(root);
  const free = stats.bavail * stats.bsize;
  if (free < MINIMUM_FREE_BYTES) {
    throw new InstallerError(
      'DISK_LOW',
      `${root} has ${Math.round(free / 1024 ** 2)} MB free; building a release needs about ${MINIMUM_FREE_BYTES / 1024 ** 3} GB.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message:
              'Free some space, or lower --keep to prune old releases on the next upgrade.',
          },
        ],
      },
    );
  }
}

/**
 * An upgrade takes the kind of source the install did: a template installation moves between template versions, and
 * one installed from an archive moves to another archive.
 */
function checkUpgradeSource(
  state: InstallerState,
  root: string,
  flags: UpgradeInput['flags'],
): void {
  const template = templateOf(state);
  if (template && flags.archive !== undefined) {
    throw new InstallerError(
      'INVALID_USAGE',
      `${root} was installed from the ${template.name} template, which upgrades to a template version with --to, not to an archive.`,
      { exitCode: EXIT_INVALID },
    );
  }
  if (!template) {
    if (flags.archive === undefined) {
      throw new InstallerError(
        'INVALID_USAGE',
        `${root} was installed from a deployment archive; pass the new one with --archive.`,
        {
          exitCode: EXIT_INVALID,
          // No `run`: a suggestion's command runs as printed, and the archive's path is not known here.
          suggestions: [
            {
              message: `Build it for this machine in the application project, copy it to the server, then run: ${installerCommand(`upgrade --dir ${shellQuote(root)} --archive <the copied archive>`, { registry: state.registry })}`,
            },
          ],
        },
      );
    }
    const templateOnly = [
      flags.to !== undefined && '--to',
      flags.rebuild && '--rebuild',
      flags['keep-source'] && '--keep-source',
    ].filter(Boolean);
    if (templateOnly.length > 0) {
      throw new InstallerError(
        'INVALID_USAGE',
        `${templateOnly.join(', ')} apply to a template installation; ${root} upgrades from the archive given with --archive.`,
        { exitCode: EXIT_INVALID },
      );
    }
  }
}

/**
 * The archive must be a later build of the same application: its package name owns the migration history in the
 * database. An archive from before relocatable builds also has its base path compiled into the client, so it has to
 * be the path the installation serves now.
 */
function checkArchiveMatches(
  state: InstallerState,
  prepared: PreparedRelease,
  env: Record<string, string>,
): void {
  if (prepared.appName !== state.appName) {
    throw new InstallerError(
      'APP_MISMATCH',
      `The archive holds ${prepared.appName}, but this installation runs ${state.appName}; a different application has a migration history of its own.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message:
              'Install a different application into a directory of its own with install --archive.',
          },
        ],
      },
    );
  }
  if (!prepared.relocatable) {
    assertFixedMountPath('The archive', prepared.basePath!, mountPathOf(env));
  }
}

interface RollbackContext {
  layout: Layout;
  state: InstallerState;
  service: ServiceOptions;
  from: ReleaseRecord;
  to: ReleaseRecord;
  rebuild: boolean;
  pending: number;
  backup: BackupResult;
  /** Set when this upgrade put the release on disk rather than reusing one already recorded. */
  newRecord: ReleaseRecord | undefined;
  timeoutMs: number;
  cause: unknown;
}

/**
 * Undoes an upgrade that failed after the switch: the new release is stopped, `current` goes back, the databases are
 * restored when the new release may have migrated them, and the previous release is started again. Always throws: exit
 * 3 when the previous release is healthy again, exit 4 when it is not.
 *
 * When the previous release does not come back, the operation stays pending and the new release stays on disk and on
 * record: it may be the only one that can run, as when the machine's Node major changed, and `rollback` recovers from
 * the pending state.
 */
async function rollBackUpgrade(context: RollbackContext): Promise<never> {
  const { layout, state, service, from, to, backup } = context;
  const subject = subjectOf(state);
  const reason =
    context.cause instanceof Error
      ? context.cause.message
      : String(context.cause);
  await service.pm2.remove(service.name).catch(() => undefined);
  const log = await errorLogTail(layout);
  const hasDatabase = backup.databases.some(
    (database) => database.files.length > 0,
  );

  let databaseRestored = false;
  let healthy = false;
  let rollbackError: unknown;
  try {
    await switchCurrent(layout, releaseLinkTarget(from.id));
    if (context.pending > 0 && hasDatabase) {
      await restoreDatabase(layout, backup.relative);
      databaseRestored = true;
    }
    healthy = await startApp({ ...service, timeoutMs: context.timeoutMs });
  } catch (error) {
    rollbackError = error;
  }

  const kept = context.newRecord !== undefined;
  if (healthy) {
    if (kept) {
      await rm(path.dirname(releaseDir(layout, to.id)), {
        recursive: true,
        force: true,
      });
    }
    delete state.pending;
  } else if (kept) {
    replaceRecord(state, context.newRecord!);
  }
  state.history.push({
    action: 'upgrade',
    from: from.id,
    to: to.id,
    at: new Date().toISOString(),
    outcome: 'rolled-back',
    migrations: context.pending,
    backup: backup.relative,
    databaseRestored,
    ...(context.rebuild ? { rebuild: true } : {}),
  });
  await writeState(layout, state);

  const doing = context.rebuild
    ? `Rebuilding ${to.version}`
    : `Upgrading to ${to.id}`;
  const externalDatabaseNote =
    context.pending > 0 && !hasDatabase
      ? ` ${to.id} may already have migrated the external database; restore it from your own backup if ${from.id} misbehaves.`
      : '';
  if (healthy) {
    throw new InstallerError(
      'UPGRADE_ROLLED_BACK',
      `${doing} failed (${reason}). ${from.id} is running again${databaseRestored ? ' on the databases restored from the backup' : ''}.${externalDatabaseNote}`,
      {
        exitCode: EXIT_ROLLED_BACK,
        details: { log, backup: backup.relative, databaseRestored },
        suggestions: [
          {
            message: 'The failed release logged:',
            run: errorLogCommandLine(layout),
          },
        ],
      },
    );
  }
  throw new InstallerError(
    'ROLLBACK_FAILED',
    `${doing} failed (${reason}), and ${from.id} did not come back either${rollbackError instanceof Error ? ` (${rollbackError.message})` : ''}. ${capitalize(subject)} is down.`,
    {
      exitCode: EXIT_ROLLBACK_FAILED,
      details: { log, backup: backup.relative, databaseRestored },
      suggestions: [
        {
          message: 'Read the error log:',
          run: errorLogCommandLine(layout),
        },
        ...(hasDatabase && !databaseRestored
          ? [
              {
                message: `The databases from before the upgrade are in ${path.join(layout.root, backup.relative)}; the rollback below restores them from there.`,
              },
            ]
          : []),
        {
          message:
            'Once the cause is fixed, finish the rollback; it restores the databases from the backup if needed:',
          run: installerCommandLine(['rollback', '--dir', layout.root], {
            registry: state.registry,
          }),
        },
        ...(kept
          ? [
              {
                message: `Or return to ${to.id}, which was kept:`,
                run: installerCommandLine(
                  [
                    'rollback',
                    '--dir',
                    layout.root,
                    '--to',
                    to.id,
                    '--no-restore',
                  ],
                  { registry: state.registry },
                ),
              },
            ]
          : []),
      ],
    },
  );
}

export async function upgrade(
  input: UpgradeInput,
  deps: CommandDeps,
): Promise<CommandOutcome> {
  const { flags } = input;
  const { reporter, pm2 } = deps;
  const root = path.resolve(deps.cwd ?? process.cwd(), flags.dir ?? '.');
  const layout = layoutOf(root);
  const run = deps.run ?? runCommand;
  const releaseLock = await acquireLock(layout.lockFile);
  try {
    // Read under the lock: a run that waited on it must see what the previous one wrote.
    const state = await readState(layout);
    assertNoPending(state, root, flags.rebuild);
    const subject = subjectOf(state);
    const template = templateOf(state);
    checkUpgradeSource(state, root, flags);
    const env = await readAppEnv(layout);
    const from = findRelease(state, state.current);
    if (!from) {
      throw new InstallerError(
        'RELEASE_MISSING',
        `installer.json names ${state.current} as the running release but holds no record of it.`,
        { exitCode: EXIT_INVALID },
      );
    }
    if (state.pending?.rebuild) {
      reporter.progress(
        `Starting the rebuild of ${from.version} again, after the one that started ${state.pending.startedAt} was interrupted`,
      );
      const orphan = state.pending.to;
      if (!findRelease(state, orphan)) {
        await rm(path.dirname(releaseDir(layout, orphan)), {
          recursive: true,
          force: true,
        });
      }
      delete state.pending;
    }

    const machineMajor = currentNodeMajor();
    const nodeChanged = from.buildTarget.nodeMajor !== machineMajor;
    const noop = (warning?: string): CommandOutcome => {
      if (warning) reporter.warn(warning);
      return {
        status: 'success-noop',
        result: {
          directory: root,
          current: from.id,
          version: from.version,
          upgraded: false,
          nodeMatches: !nodeChanged,
        },
        summary: [
          `${capitalize(subject)} is already on ${from.version} (${from.id}).`,
          ...(warning ? [`  ${warning}`] : []),
        ],
      };
    };
    const refuseDowngrade = (version: string): never => {
      throw new InstallerError(
        'DOWNGRADE',
        `${version} is older than the running ${from.version}. An older release does not know the newer migrations and would run on a schema it does not understand.`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            {
              message:
                'Go back with rollback, which restores the databases backed up before the upgrade:',
              run: installerCommandLine(
                ['rollback', '--dir', root, '--to', version],
                { registry: state.registry },
              ),
            },
          ],
        },
      );
    };

    const url = healthUrl(env);
    const service: ServiceOptions = {
      layout,
      pm2,
      name: state.name,
      healthUrl: url,
      fetchImpl: deps.fetchImpl,
    };
    checkPlatform();
    await checkPm2(pm2);
    await checkPm2Ownership(service);

    // What to switch to. A template installation names a version and builds it after the prompt, since that takes
    // minutes; an archive has to be unpacked first, because only its manifest says which release it is.
    let targetVersion: string;
    let reuse: ReleaseRecord | undefined;
    let prepared: PreparedRelease | undefined;
    let rebuildCurrent = false;
    if (template) {
      // `--rebuild` alone means the installed version: a newer one would be an upgrade, which builds for this machine anyway.
      const requested = flags.to ?? (flags.rebuild ? from.version : 'latest');
      targetVersion = state.releases.some(
        (record) => record.version === requested,
      )
        ? requested
        : await resolveTemplateVersion(
            state.registry,
            template.package,
            requested,
            deps.fetchImpl,
          );
      if (targetVersion === from.version && !flags.rebuild) {
        return noop(
          nodeChanged
            ? `${from.id} was built for Node ${from.buildTarget.nodeMajor}, but this machine runs Node ${machineMajor}; build it again for this machine with \`${installerCommand(`upgrade --dir ${shellQuote(root)} --rebuild`, { registry: state.registry })}\`.`
            : undefined,
        );
      }
      if ((compareVersions(targetVersion, from.version) ?? 0) < 0) {
        refuseDowngrade(targetVersion);
      }
      // Building the running version again, for this machine: it becomes a release of its own, switched to like any other.
      rebuildCurrent = flags.rebuild && targetVersion === from.version;
      reuse = flags.rebuild
        ? undefined
        : reusableBuild(state, layout, targetVersion);
      if (!reuse) {
        await checkPnpm(run);
        await checkFreeSpace(root);
      }
    } else {
      const archive = resolveArchivePath(
        deps.cwd ?? process.cwd(),
        flags.archive!,
      );
      reporter.progress(`Unpacking ${archive}`);
      const unpacked = await unpackRelease({
        layout,
        archive,
      });
      const discard = async () => {
        if (!unpacked.reused) {
          await rm(path.dirname(unpacked.dir), {
            recursive: true,
            force: true,
          });
        }
      };
      try {
        checkArchiveMatches(state, unpacked, env);
        checkArchiveDriver(unpacked.dir, state.dialect);
        if (unpacked.id === from.id) {
          return noop();
        }
        if ((compareVersions(unpacked.version, from.version) ?? 0) < 0) {
          refuseDowngrade(unpacked.version);
        }
      } catch (error) {
        await discard();
        throw error;
      }
      targetVersion = unpacked.version;
      reuse = unpacked.reused ? findRelease(state, unpacked.id) : undefined;
      prepared = reuse ? undefined : unpacked;
    }

    const inventory = readDatabaseInventory(layout, env);
    const unprotected = [...inventory.external, ...inventory.unresolved];
    const hosts = hostsApplications(state);
    const discardPrepared = async () => {
      if (prepared) {
        await rm(path.dirname(prepared.dir), { recursive: true, force: true });
      }
    };
    try {
      if (unprotected.length > 0 && !flags['backup-done']) {
        throw new InstallerError(
          'BACKUP_REQUIRED',
          `app-installer cannot back up the database connection${unprotected.length === 1 ? '' : 's'} ${unprotected.join(', ')}. Back ${unprotected.length === 1 ? 'it' : 'them'} up, then pass --backup-done.`,
          { exitCode: EXIT_INVALID },
        );
      }
      await confirm(
        [
          template && rebuildCurrent
            ? `Build ${from.version} again for this machine (Node ${machineMajor}) and switch ${subject} at ${root} to the new build.`
            : `Upgrade ${subject} at ${root} from ${from.id} to ${prepared?.id ?? reuse?.id ?? targetVersion}.`,
          hosts
            ? `${capitalize(subject)} and every application it hosts stop while the release switches; deployments in progress are marked failed.`
            : `${capitalize(subject)} stops while the release switches.`,
          inventory.sqlite.length > 0
            ? 'The SQLite databases and the configuration are copied to backups/ before anything is migrated.'
            : 'The configuration is copied to backups/ before anything is migrated.',
          ...(unprotected.length > 0
            ? [
                `You confirmed with --backup-done that ${unprotected.join(', ')} ${unprotected.length === 1 ? 'is' : 'are'} backed up.`,
              ]
            : []),
          ...(nodeChanged
            ? [
                `This machine runs Node ${machineMajor}, but ${from.id} was built for Node ${from.buildTarget.nodeMajor}: it cannot be rolled back to${hosts ? `, and hosted applications must be rebuilt with --node-version ${machineMajor}` : ''}.`,
              ]
            : []),
        ],
        { yes: flags.yes, json: flags.json },
      );
    } catch (error) {
      await discardPrepared();
      throw error;
    }

    // Everything up to the stop happens while the current release keeps serving.
    let to: ReleaseRecord;
    let newRecord: ReleaseRecord | undefined;
    if (reuse) {
      reporter.progress(`Reusing the ${reuse.id} release already on disk`);
      to = reuse;
    } else {
      prepared ??= await buildFromTemplate({
        layout,
        template: template!,
        version: targetVersion,
        registry: state.registry,
        drivers: state.drivers,
        keepSource: flags['keep-source'],
        reporter,
        run,
      });
      to = recordOf(prepared);
      newRecord = to;
    }
    // A release built before relocatable builds, reused or just built from an older template version, runs only at
    // the path it was built for.
    const fixedMountPath = fixedMountPathOf(to, state);
    if (fixedMountPath !== undefined) {
      try {
        assertFixedMountPath(to.id, fixedMountPath, mountPathOf(env));
      } catch (error) {
        if (newRecord) {
          await rm(path.dirname(releaseDir(layout, to.id)), {
            recursive: true,
            force: true,
          });
        }
        throw error;
      }
    }
    const dir = releaseDir(layout, to.id);
    const removeNewRelease = async () => {
      if (newRecord) {
        await rm(path.dirname(dir), { recursive: true, force: true });
      }
    };

    const cli = { releaseDir: dir, cwd: root, env, run };
    let pending: number;
    try {
      reporter.progress(
        `Checking the configuration and pending migrations with ${to.id}`,
      );
      await runAppCli(['config', 'check'], cli);
      pending = pendingTaskCount(
        await runAppCli(['db', 'apply', '--dry-run'], cli),
      );
    } catch (error) {
      await removeNewRelease();
      throw error;
    }
    reporter.progress(
      pending > 0
        ? `${to.id} will apply ${pending} migration and seed task(s)`
        : `${to.id} has no pending migrations`,
    );

    const name = backupName(from.id, to.id, new Date());
    const backupRelative = path.join('backups', name);
    state.pending = {
      action: 'upgrade',
      from: from.id,
      to: to.id,
      startedAt: new Date().toISOString(),
      ...(rebuildCurrent ? { rebuild: true } : {}),
    };
    await writeState(layout, state);

    // Downtime starts here.
    reporter.progress(`Stopping ${from.id}`);
    let backup: BackupResult;
    try {
      await stopApp(service);
      // Health stopped answering; make sure nothing else holds the port the new release has to bind.
      await checkPortFree(
        env.APP_SERVER_HOST ?? '127.0.0.1',
        Number(env.APP_SERVER_PORT ?? 13000),
      );
      reporter.progress('Backing up the databases and configuration');
      backup = await backupForUpgrade(layout, name, inventory.sqlite);
      const main = backup.databases.find(
        (database) => database.connection === inventory.defaultConnection,
      );
      if (main && main.files.length === 0) {
        throw new Error(`the SQLite database was not found at ${main.file}`);
      }
      // Recorded only now that it is complete: a recovery must never restore from a backup that was cut short.
      state.pending.backup = backup.relative;
      await writeState(layout, state);
    } catch (error) {
      // Nothing was switched: bring the current release back and report the upgrade as not done.
      await removeBackup(layout, backupRelative);
      const healthy = await startApp({
        ...service,
        timeoutMs: flags['health-timeout'] * 1000,
      }).catch(() => false);
      delete state.pending;
      await writeState(layout, state);
      await removeNewRelease();
      throw new InstallerError(
        'UPGRADE_ABORTED',
        `Upgrading to ${to.id} stopped before switching: ${error instanceof Error ? error.message : String(error)}. ${healthy ? `${from.id} is running again.` : `${from.id} did not start again.`}`,
        {
          exitCode: healthy ? EXIT_FAILED : EXIT_ROLLBACK_FAILED,
          cause: error,
          suggestions: healthy
            ? []
            : startAdvice(
                layout,
                `Start ${from.id} again once the cause is fixed:`,
              ),
        },
      );
    }

    try {
      // Marked before the link moves, so an interruption from here on is undone with a database restore.
      state.pending.switched = true;
      await writeState(layout, state);
      await switchCurrent(layout, releaseLinkTarget(to.id));
      reporter.progress('Applying database migrations');
      await runAppCli(['db', 'apply'], cli);
      assertStorageOutsideRelease(dir);
      reporter.progress(`Starting ${to.id}`);
      const healthy = await startApp({
        ...service,
        timeoutMs: flags['health-timeout'] * 1000,
      });
      if (!healthy) {
        throw new Error(
          `${url} did not become healthy (waited up to ${flags['health-timeout']}s)`,
        );
      }
    } catch (error) {
      reporter.progress(`Rolling back to ${from.id}`);
      // Awaited here rather than returned as a promise: the `finally` below awaits the lock before the caller can
      // attach a handler, and a rollback that fails first would be reported as an unhandled rejection.
      return await rollBackUpgrade({
        layout,
        state,
        service,
        from,
        to,
        rebuild: rebuildCurrent,
        pending,
        backup,
        newRecord,
        timeoutMs: flags['health-timeout'] * 1000,
        cause: error,
      });
    }

    // The new release is serving: record that first, so nothing after this can make it look unfinished.
    const at = new Date().toISOString();
    state.current = to.id;
    if (newRecord) replaceRecord(state, newRecord);
    // A release whose directory was removed by hand can never be returned to; forget it rather than prune around it.
    state.releases = state.releases.filter((record) =>
      existsSync(releaseDir(layout, record.id)),
    );
    delete state.pending;
    state.history.push({
      action: 'upgrade',
      from: from.id,
      to: to.id,
      at,
      outcome: 'completed',
      migrations: pending,
      backup: backup.relative,
      ...(rebuildCurrent ? { rebuild: true } : {}),
    });
    await writeState(layout, state);

    const pruned = releasesToPrune(
      state.releases,
      [to.id, from.id],
      flags.keep,
    );
    for (const record of pruned) {
      await rm(path.dirname(releaseDir(layout, record.id)), {
        recursive: true,
        force: true,
      });
    }
    if (pruned.length > 0) {
      state.releases = state.releases.filter(
        (record) => !pruned.some((gone) => gone.id === record.id),
      );
      await writeState(layout, state);
    }

    const notes = hosts
      ? [
          'Deployments that were in progress are marked failed; start them again in the Hub.',
          ...(nodeChanged
            ? [
                `Rebuild hosted applications with --node-version ${machineMajor} before deploying them again.`,
              ]
            : []),
        ]
      : [];
    return {
      status: 'success',
      result: {
        directory: root,
        from: from.id,
        to: to.id,
        fromVersion: from.version,
        toVersion: to.version,
        upgraded: true,
        rebuilt: rebuildCurrent,
        reused: reuse !== undefined,
        migrations: pending,
        backup: backup.relative,
        pruned: pruned.map((record) => record.id),
        notes,
      },
      summary: [
        rebuildCurrent
          ? `Rebuilt ${subject} ${to.version} for Node ${machineMajor}.`
          : `Upgraded ${subject} from ${from.version} to ${to.version}.`,
        `  Release     ${to.id}`,
        `  Migrations  ${pending}`,
        `  Backup      ${backup.relative}`,
        ...(pruned.length > 0
          ? [`  Pruned      ${pruned.map((record) => record.id).join(', ')}`]
          : []),
        ...notes.map((note) => `  ${note}`),
      ],
    };
  } finally {
    await releaseLock();
  }
}
