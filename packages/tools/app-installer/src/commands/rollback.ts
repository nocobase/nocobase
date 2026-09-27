import { existsSync } from 'node:fs';
import path from 'node:path';
import { Flags } from '@oclif/core';
import { backupHasDatabase, restoreDatabase } from '../lib/backup.ts';
import { confirm } from '../lib/confirm.ts';
import { switchCurrent } from '../lib/current-link.ts';
import { healthUrl, mountPathOf, readAppEnv } from '../lib/env-file.ts';
import { assertFixedMountPath } from '../lib/mount-path.ts';
import {
  EXIT_FAILED,
  EXIT_INVALID,
  EXIT_ROLLBACK_FAILED,
  InstallerError,
} from '../lib/errors.ts';
import { layoutOf, releaseDir, releaseLinkTarget } from '../lib/layout.ts';
import { installerCommand, shellQuote } from '../lib/invocation.ts';
import { acquireLock } from '../lib/lock.ts';
import { checkPlatform, checkPm2, currentNodeMajor } from '../lib/prechecks.ts';
import {
  checkPm2Ownership,
  errorLogTail,
  startApp,
  stopApp,
  type ServiceOptions,
} from '../lib/service.ts';
import {
  capitalize,
  hostsApplications,
  nodeRebuildAdvice,
  subjectOf,
} from '../lib/source.ts';
import {
  fixedMountPathOf,
  readState,
  resolveReleaseRef,
  writeState,
  type HistoryEntry,
  type InstallerState,
} from '../lib/state.ts';
import type { CommandDeps, CommandOutcome } from './install.ts';

export const ROLLBACK_FLAGS = {
  dir: Flags.string({
    description:
      'Installation root managed by app-installer. Defaults to the current directory.',
  }),
  to: Flags.string({
    description:
      'Release to return to, by id or version (the newest build of it). Defaults to the one the last upgrade came from.',
  }),
  restore: Flags.boolean({
    allowNo: true,
    default: true,
    description:
      'Restore the SQLite databases backed up before the upgrade, when that upgrade migrated them.',
  }),
  'health-timeout': Flags.integer({
    default: 180,
    min: 1,
    description: 'Seconds to wait for the release to answer its health check.',
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

export interface RollbackInput {
  flags: {
    dir?: string;
    to?: string;
    restore: boolean;
    'health-timeout': number;
    yes: boolean;
    json: boolean;
  };
}

function lastUpgrade(
  history: readonly HistoryEntry[],
  matches: (entry: HistoryEntry) => boolean,
): HistoryEntry | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (
      entry.action === 'upgrade' &&
      entry.outcome !== 'rolled-back' &&
      matches(entry)
    ) {
      return entry;
    }
  }
  return undefined;
}

/**
 * The id of the release to return to: the interrupted operation's origin, else where the last completed upgrade came
 * from.
 */
export function defaultRollbackTarget(
  state: InstallerState,
): string | undefined {
  // An interrupted upgrade is undone; an interrupted rollback is finished.
  if (state.pending) {
    return state.pending.action === 'upgrade'
      ? state.pending.from
      : state.pending.to;
  }
  return lastUpgrade(state.history, (entry) => entry.to === state.current)
    ?.from;
}

/**
 * The backup that holds the databases as they were on `target`, and whether they need restoring: only when the upgrade
 * away from `target` applied migrations.
 *
 * An interrupted upgrade may have migrated once it moved `current`, and how far it got is unknown, so it counts as
 * migrated from then on; before that it had only stopped the application. An interrupted rollback restores what it set
 * out to.
 */
export function backupFor(
  state: InstallerState,
  target: string,
): { backup?: string; migrated: boolean } {
  const pending = state.pending;
  if (pending?.action === 'upgrade' && pending.from === target) {
    return { backup: pending.backup, migrated: pending.switched === true };
  }
  if (pending?.action === 'rollback' && pending.to === target) {
    return {
      backup: pending.restoreFrom,
      migrated: pending.restoreFrom !== undefined,
    };
  }
  const upgrade = lastUpgrade(
    state.history,
    (entry) => entry.from === target && entry.to === state.current,
  );
  return {
    backup: upgrade?.backup,
    migrated: (upgrade?.migrations ?? 0) > 0,
  };
}

export async function rollback(
  input: RollbackInput,
  deps: CommandDeps,
): Promise<CommandOutcome> {
  const { flags } = input;
  const { reporter, pm2 } = deps;
  const root = path.resolve(deps.cwd ?? process.cwd(), flags.dir ?? '.');
  const layout = layoutOf(root);
  const releaseLock = await acquireLock(layout.lockFile);
  try {
    // Read under the lock: a run that waited on it must see what the previous one wrote.
    const state = await readState(layout);
    checkPlatform();
    const subject = subjectOf(state);
    const from = state.current;
    const interrupted = state.pending;
    const requested = flags.to ?? defaultRollbackTarget(state);
    if (requested === undefined) {
      throw new InstallerError(
        'NOTHING_TO_ROLL_BACK',
        `No upgrade led to ${from}, so there is no earlier release to return to.`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            { message: 'Name a release on disk with --to; status lists them.' },
          ],
        },
      );
    }
    const record = resolveReleaseRef(state, requested);
    const target = record?.id ?? requested;
    if (target === from && !interrupted) {
      return {
        status: 'success-noop',
        result: { directory: root, current: from, rolledBack: false },
        summary: [`${capitalize(subject)} is already on ${from}.`],
      };
    }
    if (!record || !existsSync(releaseDir(layout, record.id))) {
      throw new InstallerError(
        'RELEASE_MISSING',
        `${requested} is not on disk; only releases app-installer kept can be returned to.`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [{ message: 'status lists the releases on disk.' }],
        },
      );
    }
    const machineMajor = currentNodeMajor();
    if (record.buildTarget.nodeMajor !== machineMajor) {
      throw new InstallerError(
        'NODE_MISMATCH',
        `${target} was built for Node ${record.buildTarget.nodeMajor}, but this machine runs Node ${machineMajor}; its native modules would not load.`,
        {
          exitCode: EXIT_INVALID,
          suggestions: nodeRebuildAdvice(state, root),
        },
      );
    }
    const env = await readAppEnv(layout);
    // A release built before relocatable builds runs only at the path it was built for, which app.env may have moved
    // away from since.
    const fixedMountPath = fixedMountPathOf(record, state);
    if (fixedMountPath !== undefined) {
      assertFixedMountPath(target, fixedMountPath, mountPathOf(env));
    }
    const service: ServiceOptions = {
      layout,
      pm2,
      name: state.name,
      healthUrl: healthUrl(env),
      fetchImpl: deps.fetchImpl,
    };
    await checkPm2(pm2);
    await checkPm2Ownership(service);

    // Restore only from a backup that actually holds the database: an external database is never in one, and an
    // upgrade interrupted before its copy finished never records one.
    const { backup, migrated } = backupFor(state, target);
    const restoreFrom =
      flags.restore &&
      migrated &&
      backup !== undefined &&
      backupHasDatabase(layout, backup)
        ? backup
        : undefined;
    if (flags.restore && migrated && restoreFrom === undefined) {
      reporter.warn(
        `The databases may have been migrated past ${target}, and app-installer holds no copy of them from before (an external database, or a backup that was cut short). Restore them from your own backup if ${target} misbehaves.`,
      );
    }
    await confirm(
      [
        `Roll ${subject} at ${root} back from ${from} to ${target}.`,
        hostsApplications(state)
          ? `${capitalize(subject)} and every application it hosts stop while the release switches.`
          : `${capitalize(subject)} stops while the release switches.`,
        restoreFrom
          ? `The SQLite databases are restored from ${restoreFrom}: whatever was written since that upgrade is lost.`
          : 'The databases are left as they are; rolling back does not undo migrations.',
      ],
      { yes: flags.yes, json: flags.json },
    );

    state.pending = {
      action: 'rollback',
      from,
      to: target,
      startedAt: new Date().toISOString(),
      ...(restoreFrom ? { restoreFrom } : {}),
    };
    await writeState(layout, state);

    reporter.progress(`Stopping ${from}`);
    try {
      await stopApp(service);
    } catch (error) {
      // Nothing was restored or switched: put back what was pending before this run, if anything.
      if (interrupted) state.pending = interrupted;
      else delete state.pending;
      await writeState(layout, state);
      throw new InstallerError(
        'ROLLBACK_ABORTED',
        `Stopping ${from} failed: ${error instanceof Error ? error.message : String(error)}. Nothing was restored or switched.`,
        { exitCode: EXIT_FAILED, cause: error },
      );
    }

    let restored = false;
    let switched = false;
    let healthy = false;
    let failure: unknown;
    try {
      if (restoreFrom) {
        reporter.progress(`Restoring the databases from ${restoreFrom}`);
        await restoreDatabase(layout, restoreFrom);
        restored = true;
      }
      await switchCurrent(layout, releaseLinkTarget(target));
      switched = true;
      // The link and installer.json agree from here, whatever happens next.
      state.current = target;
      await writeState(layout, state);
      reporter.progress(`Starting ${target}`);
      healthy = await startApp({
        ...service,
        timeoutMs: flags['health-timeout'] * 1000,
      });
    } catch (error) {
      failure = error;
    }

    if (!healthy) {
      // The rollback stays pending, so running it again retries it — restore included — once the cause is fixed.
      await writeState(layout, state);
      const reason = failure instanceof Error ? ` (${failure.message})` : '';
      throw new InstallerError(
        'ROLLBACK_FAILED',
        switched
          ? `${target} did not come back${reason}. ${capitalize(subject)} is down.`
          : `${restoreFrom && !restored ? 'Restoring the databases' : 'Switching to ' + target} failed${reason}; ${subject} is stopped and still on ${from}.`,
        {
          exitCode: EXIT_ROLLBACK_FAILED,
          details: {
            log: await errorLogTail(layout),
            databaseRestored: restored,
          },
          suggestions: [
            {
              message: 'Read the error log:',
              run: `tail -n 100 ${shellQuote(layout.errorLog)}`,
            },
            {
              message: 'Once the cause is fixed, run the rollback again:',
              run: installerCommand(`rollback --dir ${shellQuote(root)}`, {
                registry: state.registry,
              }),
            },
            ...(switched
              ? [
                  {
                    message: `Or go back to ${from}:`,
                    run: installerCommand(
                      `rollback --dir ${shellQuote(root)} --to ${from} --no-restore`,
                      { registry: state.registry },
                    ),
                  },
                ]
              : []),
          ],
        },
      );
    }

    delete state.pending;
    state.history.push({
      action: 'rollback',
      from,
      to: target,
      at: new Date().toISOString(),
      databaseRestored: restored,
    });
    await writeState(layout, state);
    return {
      status: 'success',
      result: {
        directory: root,
        from,
        to: target,
        rolledBack: true,
        recovered: interrupted ? interrupted.action : null,
        databaseRestored: restored,
        backup: restoreFrom ?? null,
      },
      summary: [
        interrupted
          ? `Recovered from the interrupted ${interrupted.action} (${interrupted.from} to ${interrupted.to}); ${subject} runs ${target}.`
          : `Rolled ${subject} back from ${from} to ${target}.`,
        restored
          ? `  Databases restored from ${restoreFrom}`
          : '  Databases left as they were',
      ],
    };
  } finally {
    await releaseLock();
  }
}
