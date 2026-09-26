import { existsSync } from 'node:fs';
import { rename, rm, statfs } from 'node:fs/promises';
import path from 'node:path';
import { Flags } from '@oclif/core';
import { pendingTaskCount, runAppCli } from '../lib/app-cli.ts';
import {
  backupForUpgrade,
  backupName,
  HUB_DATABASE,
  removeBackup,
  restoreDatabase,
  type BackupResult,
} from '../lib/backup.ts';
import { confirm } from '../lib/confirm.ts';
import { switchCurrent } from '../lib/current-link.ts';
import { healthUrl, readHubEnv } from '../lib/env-file.ts';
import {
  EXIT_FAILED,
  EXIT_INVALID,
  EXIT_ROLLBACK_FAILED,
  EXIT_ROLLED_BACK,
  InstallerError,
} from '../lib/errors.ts';
import { installerCommand, shellQuote } from '../lib/invocation.ts';
import {
  layoutOf,
  releaseDir,
  releaseLinkTarget,
  replacedReleaseDir,
  stagedReleaseDir,
  type Layout,
} from '../lib/layout.ts';
import { acquireLock } from '../lib/lock.ts';
import {
  checkPlatform,
  checkPm2,
  checkPnpm,
  checkPortFree,
  checkTar,
  currentNodeMajor,
} from '../lib/prechecks.ts';
import { resolveTemplateVersion } from '../lib/registry.ts';
import { prepareRelease, verifyBuildTarget } from '../lib/release.ts';
import { runCommand } from '../lib/run-command.ts';
import {
  checkPm2Ownership,
  errorLogTail,
  startHub,
  stopHub,
  type ServiceOptions,
} from '../lib/service.ts';
import {
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
      'Hub root managed by hub-installer. Defaults to the current directory.',
  }),
  to: Flags.string({
    description:
      'Version or dist-tag to upgrade to: latest by default, or the installed version with --rebuild. A version already on disk is reused without building.',
  }),
  'backup-done': Flags.boolean({
    default: false,
    description:
      'Confirm that an external database is backed up; required for any dialect but SQLite.',
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
      'Keep the build directory with the sources and development dependencies.',
  }),
  rebuild: Flags.boolean({
    default: false,
    description:
      'Build the target again even when it is on disk, the running version included: for a machine whose Node major changed and has no newer version to upgrade to.',
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
 * The running Hub was interrupted by a previous operation that never finished; refuse to stack another on top. The one
 * operation that may follow an interrupted rebuild is the rebuild again, with `resumeRebuild`: it puts the replaced
 * release back if the swap was cut short and builds once more, which `rollback` cannot do when the release it would
 * return to was built for another Node.
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
    `${state.pending.rebuild ? 'A rebuild of' : action === 'upgrade' ? 'An upgrade from' : 'A rollback from'} ${from}${state.pending.rebuild ? '' : ` to ${to}`}, started ${startedAt}, did not finish; the Hub may be stopped or half-switched.`,
    {
      exitCode: EXIT_INVALID,
      suggestions: [
        state.pending.rebuild
          ? {
              message:
                'Run the rebuild again; it puts back what the interrupted one moved and builds once more:',
              run: installerCommand(
                `upgrade --dir ${shellQuote(root)} --rebuild`,
                { registry: state.registry },
              ),
            }
          : {
              message:
                'Recover first; an interrupted upgrade is undone and an interrupted rollback is finished:',
              run: installerCommand(`rollback --dir ${shellQuote(root)}`, {
                registry: state.registry,
              }),
            },
      ],
    },
  );
}

/**
 * Undoes what an interrupted rebuild left half done: the running version's directory is put back from where the
 * swap moved it, so the rebuild that follows finds the release it replaces. The staging directory is removed by the
 * build itself.
 */
async function restoreInterruptedRebuild(
  layout: Layout,
  version: string,
): Promise<void> {
  const release = path.dirname(releaseDir(layout, version));
  const replaced = path.dirname(replacedReleaseDir(layout, version));
  if (!existsSync(release) && existsSync(replaced)) {
    await rename(replaced, release);
  }
}

async function resolveTarget(
  state: InstallerState,
  requested: string,
  deps: CommandDeps,
): Promise<string> {
  if (state.releases.some((record) => record.version === requested)) {
    return requested;
  }
  return resolveTemplateVersion(state.registry, requested, deps.fetchImpl);
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
    kept.add(record.version);
  }
  return releases.filter((record) => !kept.has(record.version));
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

function replaceRecord(state: InstallerState, record: ReleaseRecord): void {
  state.releases = [
    ...state.releases.filter((entry) => entry.version !== record.version),
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

interface RollbackContext {
  layout: Layout;
  state: InstallerState;
  service: ServiceOptions;
  from: string;
  to: string;
  pending: number;
  backup: BackupResult;
  /** Set when this upgrade built the release rather than reusing one already recorded. */
  newRecord: ReleaseRecord | undefined;
  /** A rebuild: the directory holding the release the rebuilt one replaced, to put back. */
  replaced?: string;
  timeoutMs: number;
  cause: unknown;
}

/**
 * Undoes an upgrade that failed after the switch: the new release is stopped, `current` goes back, the database is
 * restored when the new release may have migrated it, and the previous release is started again. Always throws: exit 3
 * when the previous release is healthy again, exit 4 when it is not.
 *
 * When the previous release does not come back, the operation stays pending and the new release stays on disk and on
 * record: it may be the only one that can run, as when the machine's Node major changed, and `rollback` recovers from
 * the pending state. A rebuild is the exception: the release it replaced is put back on disk and stays on record, since
 * the rebuilt one is reproduced by running the rebuild again.
 */
async function rollBackUpgrade(context: RollbackContext): Promise<never> {
  const { layout, state, service, from, to, backup } = context;
  const reason =
    context.cause instanceof Error
      ? context.cause.message
      : String(context.cause);
  await service.pm2.remove(service.name).catch(() => undefined);
  const log = await errorLogTail(layout);

  let databaseRestored = false;
  let healthy = false;
  let rollbackError: unknown;
  try {
    if (context.replaced) {
      await rm(path.dirname(releaseDir(layout, to)), {
        recursive: true,
        force: true,
      });
      await rename(context.replaced, path.dirname(releaseDir(layout, to)));
    }
    await switchCurrent(layout, releaseLinkTarget(from));
    if (context.pending > 0 && backup.databaseFiles.length > 0) {
      await restoreDatabase(layout, backup.relative);
      databaseRestored = true;
    }
    healthy = await startHub({ ...service, timeoutMs: context.timeoutMs });
  } catch (error) {
    rollbackError = error;
  }

  const kept = context.newRecord !== undefined && !context.replaced;
  if (healthy) {
    if (kept) {
      await rm(path.dirname(releaseDir(layout, to)), {
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
    from,
    to,
    at: new Date().toISOString(),
    outcome: 'rolled-back',
    migrations: context.pending,
    backup: backup.relative,
    databaseRestored,
    ...(context.replaced ? { rebuild: true } : {}),
  });
  await writeState(layout, state);

  const externalDatabaseNote =
    context.pending > 0 && backup.databaseFiles.length === 0
      ? ` ${to} may already have migrated the external database; restore it from your own backup if ${from} misbehaves.`
      : '';
  if (healthy) {
    throw new InstallerError(
      'UPGRADE_ROLLED_BACK',
      `${context.replaced ? `Rebuilding ${to}` : `Upgrading to ${to}`} failed (${reason}). ${from}${context.replaced ? ' as it was before' : ''} is running again${databaseRestored ? ' on the database restored from the backup' : ''}.${externalDatabaseNote}`,
      {
        exitCode: EXIT_ROLLED_BACK,
        details: { log, backup: backup.relative, databaseRestored },
        suggestions: [
          {
            message: 'The failed release logged:',
            run: `tail -n 100 ${shellQuote(path.join(layout.logsDir, 'hub.err.log'))}`,
          },
        ],
      },
    );
  }
  throw new InstallerError(
    'ROLLBACK_FAILED',
    `${context.replaced ? `Rebuilding ${to}` : `Upgrading to ${to}`} failed (${reason}), and ${from}${context.replaced ? ' as it was before' : ''} did not come back either${rollbackError instanceof Error ? ` (${rollbackError.message})` : ''}. The Hub is down.`,
    {
      exitCode: EXIT_ROLLBACK_FAILED,
      details: { log, backup: backup.relative, databaseRestored },
      suggestions: [
        {
          message: 'Read the error log:',
          run: `tail -n 100 ${shellQuote(path.join(layout.logsDir, 'hub.err.log'))}`,
        },
        ...(backup.databaseFiles.length > 0 && !databaseRestored
          ? [
              {
                message: `The database from before the upgrade is in ${path.join(layout.root, backup.relative)}; it belongs in ${path.dirname(path.join(layout.storageDir, HUB_DATABASE))}, and the rollback below restores it from there.`,
              },
            ]
          : []),
        {
          message:
            'Once the cause is fixed, finish the rollback; it restores the database from the backup if needed:',
          run: installerCommand(`rollback --dir ${shellQuote(layout.root)}`, {
            registry: state.registry,
          }),
        },
        ...(kept
          ? [
              {
                message: `Or return to ${to}, which was kept:`,
                run: installerCommand(
                  `rollback --dir ${shellQuote(layout.root)} --to ${to} --no-restore`,
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
    const env = await readHubEnv(layout);
    const from = state.current;
    if (state.pending?.rebuild) {
      reporter.progress(
        `Finishing the rebuild of ${from} that started ${state.pending.startedAt}`,
      );
      await restoreInterruptedRebuild(layout, from);
    }
    // `--rebuild` alone means the installed version: a newer one would be an upgrade, which builds for this machine anyway.
    const to = await resolveTarget(
      state,
      flags.to ?? (flags.rebuild ? from : 'latest'),
      deps,
    );
    const machineMajor = currentNodeMajor();
    const fromRecord = state.releases.find((record) => record.version === from);
    const nodeChanged =
      fromRecord !== undefined &&
      fromRecord.buildTarget.nodeMajor !== machineMajor;
    // Building the running version again, for this machine: the one case where `to` may equal `from`.
    const rebuildCurrent = flags.rebuild && to === from;
    if (to === from && !flags.rebuild) {
      const rebuildCommand = installerCommand(
        `upgrade --dir ${shellQuote(root)} --rebuild`,
        { registry: state.registry },
      );
      if (nodeChanged) {
        reporter.warn(
          `${from} was built for Node ${fromRecord?.buildTarget.nodeMajor}, but this machine runs Node ${machineMajor}; build it again for this machine with \`${rebuildCommand}\`.`,
        );
      }
      return {
        status: 'success-noop',
        result: {
          directory: root,
          current: from,
          upgraded: false,
          nodeMatches: !nodeChanged,
        },
        summary: [
          `The Hub is already on ${from}.`,
          ...(nodeChanged
            ? [`  Rebuild it for Node ${machineMajor}: ${rebuildCommand}`]
            : []),
        ],
      };
    }
    if ((compareVersions(to, from) ?? 0) < 0) {
      throw new InstallerError(
        'DOWNGRADE',
        `${to} is older than the running ${from}. An older release does not know the newer migrations and would run on a schema it does not understand.`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            {
              message:
                'Go back with rollback, which restores the database backed up before the upgrade:',
              run: installerCommand(
                `rollback --dir ${shellQuote(root)} --to ${to}`,
                {
                  registry: state.registry,
                },
              ),
            },
          ],
        },
      );
    }

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
    const known = state.releases.find((record) => record.version === to);
    const onDisk = existsSync(releaseDir(layout, to));
    const reuse =
      !flags.rebuild && known !== undefined && onDisk && fitsMachine(known);
    if (!reuse) {
      await checkPnpm(run);
      await checkTar(run);
      await checkFreeSpace(root);
    }
    const sqlite = state.dialect === 'sqlite';
    if (!sqlite && !flags['backup-done']) {
      throw new InstallerError(
        'BACKUP_REQUIRED',
        `The Hub runs on ${state.dialect}, which hub-installer cannot back up. Back the database up, then pass --backup-done.`,
        { exitCode: EXIT_INVALID },
      );
    }
    await confirm(
      [
        rebuildCurrent
          ? `Build ${from} again for this machine (Node ${machineMajor}) and replace the release the Hub at ${root} runs.`
          : `Upgrade the Hub at ${root} from ${from} to ${to}.`,
        'The Hub and every application it hosts stop while the release switches; deployments in progress are marked failed.',
        sqlite
          ? 'The Hub database and configuration are copied to backups/ before anything is migrated.'
          : 'You confirmed with --backup-done that the external database is backed up.',
        ...(nodeChanged
          ? [
              rebuildCurrent
                ? `${from} was built for Node ${fromRecord?.buildTarget.nodeMajor}; the release it replaces cannot run here, and hosted applications must be rebuilt with --node-version ${machineMajor}.`
                : `This machine runs Node ${machineMajor}, but ${from} was built for Node ${fromRecord?.buildTarget.nodeMajor}: ${from} cannot be rolled back to, and hosted applications must be rebuilt with --node-version ${machineMajor}.`,
            ]
          : []),
      ],
      { yes: flags.yes, json: flags.json },
    );

    // Everything up to the stop happens while the current release keeps serving.
    let newRecord: ReleaseRecord | undefined;
    let dir: string;
    if (reuse) {
      reporter.progress(`Reusing the ${to} release already on disk`);
      dir = releaseDir(layout, to);
    } else {
      if (rebuildCurrent) {
        reporter.progress(
          `Building ${to} again for this machine, beside the release the Hub runs`,
        );
      } else if (known && onDisk) {
        reporter.progress(
          flags.rebuild
            ? `Building the ${to} release again, as asked`
            : `The ${to} release on disk was built for another platform or Node major; building it again`,
        );
      }
      // The running version is built beside itself and swapped in during the downtime; any other directory the build
      // would reuse is either a leftover of an interrupted build or one that cannot run here.
      const targetDir = rebuildCurrent
        ? stagedReleaseDir(layout, to)
        : releaseDir(layout, to);
      await rm(path.dirname(targetDir), { recursive: true, force: true });
      const prepared = await prepareRelease({
        layout,
        version: to,
        registry: state.registry,
        drivers: state.drivers,
        keepSource: flags['keep-source'],
        reporter,
        run,
        targetDir,
      });
      dir = prepared.dir;
      newRecord = {
        version: to,
        installedAt: new Date().toISOString(),
        buildTarget: prepared.buildTarget,
      };
    }
    const removeNewRelease = async () => {
      if (newRecord) {
        await rm(path.dirname(dir), { recursive: true, force: true });
      }
    };

    const cli = { releaseDir: dir, cwd: root, env, run };
    let pending: number;
    try {
      reporter.progress(
        `Checking the configuration and pending migrations with ${to}`,
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
        ? `${to} will apply ${pending} migration and seed task(s)`
        : `${to} has no pending migrations`,
    );

    const name = backupName(from, to, new Date());
    const backupRelative = path.join('backups', name);
    state.pending = {
      action: 'upgrade',
      from,
      to,
      startedAt: new Date().toISOString(),
      ...(rebuildCurrent ? { rebuild: true } : {}),
    };
    await writeState(layout, state);

    // Downtime starts here.
    reporter.progress(`Stopping ${from}`);
    let backup: BackupResult;
    try {
      await stopHub(service);
      // Health stopped answering; make sure nothing else holds the port the new release has to bind.
      await checkPortFree(
        env.APP_SERVER_HOST ?? '127.0.0.1',
        Number(env.APP_SERVER_PORT ?? 13000),
      );
      reporter.progress('Backing up the Hub database and configuration');
      backup = await backupForUpgrade(layout, name, sqlite);
      if (
        sqlite &&
        !backup.databaseFiles.includes(path.basename(HUB_DATABASE))
      ) {
        throw new Error(
          `the SQLite database was not found at ${path.join(layout.storageDir, HUB_DATABASE)}`,
        );
      }
      // Recorded only now that it is complete: a recovery must never restore from a backup that was cut short.
      state.pending.backup = backup.relative;
      await writeState(layout, state);
    } catch (error) {
      // Nothing was switched: bring the current release back and report the upgrade as not done.
      await removeBackup(layout, backupRelative);
      const healthy = await startHub({
        ...service,
        timeoutMs: flags['health-timeout'] * 1000,
      }).catch(() => false);
      delete state.pending;
      await writeState(layout, state);
      await removeNewRelease();
      throw new InstallerError(
        'UPGRADE_ABORTED',
        `Upgrading to ${to} stopped before switching: ${error instanceof Error ? error.message : String(error)}. ${healthy ? `${from} is running again.` : `${from} did not start again.`}`,
        {
          exitCode: healthy ? EXIT_FAILED : EXIT_ROLLBACK_FAILED,
          cause: error,
          suggestions: healthy
            ? []
            : [
                {
                  message: `Start ${from} again once the cause is fixed:`,
                  run: `pm2 start ${shellQuote(layout.ecosystemFile)} && pm2 save`,
                },
              ],
        },
      );
    }

    let replaced: string | undefined;
    try {
      // Marked before the link moves, so an interruption from here on is undone with a database restore.
      state.pending.switched = true;
      await writeState(layout, state);
      if (rebuildCurrent) {
        // The rebuilt release takes the running one's directory; the old one waits beside it until the new one is
        // healthy, so a failed start can put it back. `current` keeps its target, so the link needs no change.
        const replacedDir = path.dirname(replacedReleaseDir(layout, to));
        await rm(replacedDir, { recursive: true, force: true });
        await rename(path.dirname(releaseDir(layout, to)), replacedDir);
        replaced = replacedDir;
        await rename(path.dirname(dir), path.dirname(releaseDir(layout, to)));
        dir = releaseDir(layout, to);
        cli.releaseDir = dir;
      }
      await switchCurrent(layout, releaseLinkTarget(to));
      reporter.progress('Applying database migrations');
      await runAppCli(['db', 'apply'], cli);
      reporter.progress(`Starting ${to}`);
      const healthy = await startHub({
        ...service,
        timeoutMs: flags['health-timeout'] * 1000,
      });
      if (!healthy) {
        throw new Error(
          `${url} did not become healthy (waited up to ${flags['health-timeout']}s)`,
        );
      }
    } catch (error) {
      reporter.progress(
        rebuildCurrent
          ? `Putting ${from} back as it was`
          : `Rolling back to ${from}`,
      );
      return rollBackUpgrade({
        layout,
        state,
        service,
        from,
        to,
        pending,
        backup,
        newRecord,
        replaced,
        timeoutMs: flags['health-timeout'] * 1000,
        cause: error,
      });
    }

    // The new release is serving: record that first, so nothing after this can make it look unfinished.
    const at = new Date().toISOString();
    state.current = to;
    if (newRecord) replaceRecord(state, newRecord);
    delete state.pending;
    state.history.push({
      action: 'upgrade',
      from,
      to,
      at,
      outcome: 'completed',
      migrations: pending,
      backup: backup.relative,
      ...(rebuildCurrent ? { rebuild: true } : {}),
    });
    await writeState(layout, state);
    if (replaced) {
      await rm(replaced, { recursive: true, force: true });
    }

    const pruned = releasesToPrune(state.releases, [to, from], flags.keep);
    for (const record of pruned) {
      await rm(path.dirname(releaseDir(layout, record.version)), {
        recursive: true,
        force: true,
      });
    }
    if (pruned.length > 0) {
      state.releases = state.releases.filter(
        (record) => !pruned.some((gone) => gone.version === record.version),
      );
      await writeState(layout, state);
    }

    const notes = [
      'Deployments that were in progress are marked failed; start them again in the Hub.',
      ...(nodeChanged
        ? [
            `Rebuild hosted applications with --node-version ${machineMajor} before deploying them again.`,
          ]
        : []),
    ];
    return {
      status: 'success',
      result: {
        directory: root,
        from,
        to,
        upgraded: true,
        rebuilt: rebuildCurrent,
        reused: reuse,
        migrations: pending,
        backup: backup.relative,
        pruned: pruned.map((record) => record.version),
        notes,
      },
      summary: [
        rebuildCurrent
          ? `Rebuilt the Hub ${to} for Node ${machineMajor}.`
          : `Upgraded the Hub from ${from} to ${to}.`,
        `  Migrations  ${pending}`,
        `  Backup      ${backup.relative}`,
        ...(pruned.length > 0
          ? [
              `  Pruned      ${pruned.map((record) => record.version).join(', ')}`,
            ]
          : []),
        ...notes.map((note) => `  ${note}`),
      ],
    };
  } finally {
    await releaseLock();
  }
}
