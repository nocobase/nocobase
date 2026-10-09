import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand } from '../lib/command.ts';
import {
  minFreeDisk,
  readConnections,
  readSettings,
  runnerClient,
} from '../lib/config.ts';
import {
  formatFreeSpace,
  formatSize,
  minFreeBytes,
  parseAge,
} from '../lib/size.ts';
import { RUNNER_ROUTES, WorkspacesResponseSchema } from '../protocol/index.ts';
import {
  applyStatuses,
  lowOnDisk,
  planRemovals,
  readDisk,
  relieveDiskPressure,
  removePlanned,
  scanWorkspaces,
  workspaceDisk,
  workspacesRequest,
  type WorkspaceFilters,
  type WorkspaceStatus,
} from '../core/workspaces.ts';

interface GcWorkspace {
  workDir: string;
  app: string;
  subject: string;
  lastRunId: string | null;
  status: WorkspaceStatus;
  unpushed: boolean;
  inUse: boolean;
  lastUsedAt: string;
  /**
   * What this command does, or would do, with it: `removeWhileLow` while the disk is low, removed in order until enough
   * is free.
   */
  action: 'remove' | 'removeWhileLow' | 'keep';
  /** Why: its work is over, the disk is low, picked by the filters; or kept because a run holds it or it has unpushed work. */
  reason: string | null;
  /** With `--apply`: whether it was removed. */
  removed?: boolean;
}

interface GcResult {
  applied: boolean;
  /** The disk holding the working directories; null when the file system cannot say. */
  disk: { freeBytes: number; totalBytes: number } | null;
  /** What the runner keeps free on it (`min-free-disk`); null for nothing. */
  minFreeBytes: number | null;
  /** Less than that is free, once the removals are done (with `--apply`) or now. */
  low: boolean;
  /** Applications that could not say which work is over, with why. */
  unreachable: { app: string; error: string }[];
  workspaces: GcWorkspace[];
}

export default class Gc extends RunnerCommand {
  static override summary: string =
    'List the working directories, and remove the ones that may go.';
  static override description: string =
    'Lists every working directory with its application, subject, whether the application says its work is over, ' +
    'whether it holds unpushed work (changes not committed, or commits the remote lacks), and when it was last used, ' +
    'with the free space on the disk holding them and what the runner keeps free (min-free-disk). Without filters, the ' +
    'directories whose work is over may go, and then, while less than that is free, pushed ones least recently used. ' +
    'With filters, the directories every filter matches. Nothing is removed without --apply, a directory a run holds ' +
    'never is, and one with unpushed work only with --force.';
  static override examples: string[] = [
    '<%= config.bin %> gc',
    '<%= config.bin %> gc --apply',
    '<%= config.bin %> gc --older-than 14d --apply',
    '<%= config.bin %> gc --subject TASK-42 --apply --force',
  ];
  static override flags: {
    apply: Interfaces.BooleanFlag<boolean>;
    ended: Interfaces.BooleanFlag<boolean>;
    'older-than': Interfaces.OptionFlag<string | undefined>;
    subject: Interfaces.OptionFlag<string | undefined>;
    force: Interfaces.BooleanFlag<boolean>;
  } = {
    apply: Flags.boolean({
      description:
        'Remove what the rules or filters pick; without it, only show it.',
    }),
    ended: Flags.boolean({
      description:
        'Pick the directories whose work the application says is over.',
    }),
    'older-than': Flags.string({
      description:
        'Pick the directories not used for this long (14d, 12h, 30m).',
    }),
    subject: Flags.string({
      description: 'Pick the directories of this subject (TASK-42).',
    }),
    force: Flags.boolean({
      description: 'Also remove picked directories with unpushed work.',
    }),
  };

  async run(): Promise<GcResult> {
    const { flags } = await this.parse(Gc);
    const apply = flags.apply === true;
    const force = flags.force === true;
    const settings = await readSettings(this.paths);
    const threshold = minFreeDisk(settings);
    const entries = await scanWorkspaces(this.paths);
    const before = await readDisk(this.paths.workRoot);
    const disk =
      before === undefined ? undefined : workspaceDisk(before, threshold);
    const unreachable: GcResult['unreachable'] = [];
    for (const connection of await readConnections(this.paths)) {
      const key = connection.registration.key;
      if (!entries.some((entry) => entry.appKey === key)) continue;
      try {
        const response = await runnerClient(connection).post(
          RUNNER_ROUTES.workspaces,
          workspacesRequest(entries, key, disk),
          WorkspacesResponseSchema,
          { timeoutMs: 60_000 },
        );
        applyStatuses(entries, key, response);
      } catch (error) {
        unreachable.push({
          app: key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const filters: WorkspaceFilters = {
      ...(flags.ended ? { ended: true } : {}),
      ...(flags['older-than'] === undefined
        ? {}
        : { olderThanMs: parseAge(flags['older-than'], '--older-than') }),
      ...(flags.subject === undefined ? {} : { subject: flags.subject }),
    };
    const plan = planRemovals(entries, { filters, force });
    const decided = new Map<
      string,
      { action: GcWorkspace['action']; reason: string }
    >();
    for (const { entry, reason } of plan.remove)
      decided.set(entry.workDir, { action: 'remove', reason });
    for (const { entry, reason } of plan.kept)
      decided.set(entry.workDir, { action: 'keep', reason });
    const removed = new Map<string, boolean>();
    let after = before;
    if (apply) {
      for (const { entry } of plan.remove) {
        const kept = await removePlanned(this.paths, entry, { force });
        removed.set(entry.workDir, kept === undefined);
        if (kept !== undefined)
          decided.set(entry.workDir, { action: 'keep', reason: kept });
      }
      const relieved = await relieveDiskPressure(this.paths, plan.spare, {
        threshold,
      });
      for (const entry of relieved.removed) {
        removed.set(entry.workDir, true);
        decided.set(entry.workDir, { action: 'remove', reason: 'lowDisk' });
      }
      for (const item of relieved.kept)
        decided.set(item.workDir, { action: 'keep', reason: item.reason });
      after = relieved.disk;
    } else if (lowOnDisk(before, threshold))
      for (const entry of plan.spare)
        decided.set(entry.workDir, {
          action: 'removeWhileLow',
          reason: 'lowDisk',
        });
    const workspaces: GcWorkspace[] = entries
      .sort((a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt))
      .map((entry) => ({
        workDir: entry.workDir,
        app: entry.appKey,
        subject: entry.subjectKey,
        lastRunId: entry.lastRunId ?? null,
        status: entry.status,
        unpushed: entry.unpushed,
        inUse: entry.inUse,
        lastUsedAt: entry.lastUsedAt,
        action: decided.get(entry.workDir)?.action ?? 'keep',
        reason: decided.get(entry.workDir)?.reason ?? null,
        ...(removed.has(entry.workDir)
          ? { removed: removed.get(entry.workDir) }
          : {}),
      }));
    for (const item of workspaces)
      this.log(
        [
          item.app,
          item.subject,
          item.status,
          item.unpushed ? 'unpushed' : 'pushed',
          item.inUse ? 'in use' : `used ${item.lastUsedAt}`,
          item.action === 'remove'
            ? apply
              ? `removed (${item.reason})`
              : `would remove (${item.reason})`
            : item.action === 'removeWhileLow'
              ? 'would remove while the disk is low'
              : item.reason === null
                ? ''
                : `kept (${item.reason})`,
        ]
          .filter((part) => part !== '')
          .join('  '),
      );
    for (const item of unreachable)
      this.log(`${item.app}: could not ask which work is over: ${item.error}`);
    const low = lowOnDisk(after, threshold);
    const keep =
      threshold === null
        ? 'no free space is kept (min-free-disk off)'
        : `${formatFreeSpace(threshold)} is kept free (min-free-disk)`;
    this.log(
      after === undefined
        ? `The free space on the disk is unknown; ${keep}.${apply ? '' : ' Nothing was removed; add --apply.'}`
        : `${formatSize(after.freeBytes)} free of ${formatSize(after.totalBytes)}; ${keep}${low ? ', and less than that is free' : ''}.${apply ? '' : ' Nothing was removed; add --apply.'}`,
    );
    return {
      applied: apply,
      disk:
        after === undefined
          ? null
          : { freeBytes: after.freeBytes, totalBytes: after.totalBytes },
      minFreeBytes:
        after === undefined || threshold === null
          ? null
          : minFreeBytes(threshold, after.totalBytes),
      low,
      unreachable,
      workspaces,
    };
  }
}
