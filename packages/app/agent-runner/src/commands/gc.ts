import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand } from '../lib/command.ts';
import { readConnections, readSettings, runnerClient } from '../lib/config.ts';
import { formatSize, parseAge } from '../lib/size.ts';
import { RUNNER_ROUTES, WorkspacesResponseSchema } from '../protocol/index.ts';
import {
  applyStatuses,
  planRemovals,
  removePlanned,
  scanWorkspaces,
  workspacesRequest,
  type WorkspaceFilters,
  type WorkspaceStatus,
} from '../core/workspaces.ts';

interface GcWorkspace {
  workDir: string;
  app: string;
  subject: string;
  lastRunId: string | null;
  sizeBytes: number;
  status: WorkspaceStatus;
  unpushed: boolean;
  inUse: boolean;
  lastUsedAt: string;
  /** What this command does, or would do, with it. */
  action: 'remove' | 'keep';
  /** Why: its work is over, over the limit, picked by the filters; or kept because a run holds it or it has unpushed work. */
  reason: string | null;
  /** With `--apply`: whether it was removed. */
  removed?: boolean;
}

interface GcResult {
  applied: boolean;
  totalBytes: number;
  limitBytes: number | null;
  /** What is left once the removals are done (with `--apply`) or would be. */
  remainingBytes: number;
  /** Applications that could not say which work is over, with why. */
  unreachable: { app: string; error: string }[];
  workspaces: GcWorkspace[];
}

export default class Gc extends RunnerCommand {
  static override summary: string =
    'List the working directories, and remove the ones that may go.';
  static override description: string =
    'Lists every working directory with its size, application, subject, whether the application says its work is ' +
    'over, whether it holds unpushed work (changes not committed, or commits the remote lacks), and when it was last ' +
    'used. Without filters, the directories whose work is over may go, and then, while the total is over the ' +
    'workspace limit, pushed ones least recently used. With filters, the directories every filter matches. Nothing ' +
    'is removed without --apply, a directory a run holds never is, and one with unpushed work only with --force.';
  static override examples: string[] = [
    '<%= config.bin %> gc',
    '<%= config.bin %> gc --apply',
    '<%= config.bin %> gc --older-than 14d --apply',
    '<%= config.bin %> gc --subject PM-81 --apply --force',
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
      description: 'Pick the directories of this subject (PM-81).',
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
    const entries = await scanWorkspaces(this.paths);
    const unreachable: GcResult['unreachable'] = [];
    for (const connection of await readConnections(this.paths)) {
      const key = connection.registration.key;
      if (!entries.some((entry) => entry.appKey === key)) continue;
      try {
        const response = await runnerClient(connection).post(
          RUNNER_ROUTES.workspaces,
          workspacesRequest(entries, key, settings.workspaceLimit),
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
    const plan = planRemovals(entries, {
      filters,
      force,
      ...(settings.workspaceLimit === undefined
        ? {}
        : { limitBytes: settings.workspaceLimit }),
    });
    const decided = new Map<
      string,
      { action: 'remove' | 'keep'; reason: string }
    >();
    for (const { entry, reason } of plan.remove)
      decided.set(entry.workDir, { action: 'remove', reason });
    for (const { entry, reason } of plan.kept)
      decided.set(entry.workDir, { action: 'keep', reason });
    const removed = new Map<string, boolean>();
    let remainingBytes = plan.remainingBytes;
    if (apply)
      for (const { entry } of plan.remove) {
        const kept = await removePlanned(entry, { force });
        removed.set(entry.workDir, kept === undefined);
        if (kept !== undefined) {
          remainingBytes += entry.sizeBytes;
          decided.set(entry.workDir, { action: 'keep', reason: kept });
        }
      }
    const workspaces: GcWorkspace[] = entries
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .map((entry) => ({
        workDir: entry.workDir,
        app: entry.appKey,
        subject: entry.subjectKey,
        lastRunId: entry.lastRunId ?? null,
        sizeBytes: entry.sizeBytes,
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
          formatSize(item.sizeBytes).padStart(9),
          item.app,
          item.subject,
          item.status,
          item.unpushed ? 'unpushed' : 'pushed',
          item.inUse ? 'in use' : `used ${item.lastUsedAt}`,
          item.action === 'remove'
            ? apply
              ? `removed (${item.reason})`
              : `would remove (${item.reason})`
            : item.reason === null
              ? ''
              : `kept (${item.reason})`,
        ]
          .filter((part) => part !== '')
          .join('  '),
      );
    for (const item of unreachable)
      this.log(`${item.app}: could not ask which work is over: ${item.error}`);
    this.log(
      `Total ${formatSize(plan.totalBytes)}${settings.workspaceLimit === undefined ? '' : ` of ${formatSize(settings.workspaceLimit)} allowed`}; ${apply ? 'left' : 'would leave'} ${formatSize(remainingBytes)}.${apply ? '' : ' Nothing was removed; add --apply.'}`,
    );
    return {
      applied: apply,
      totalBytes: plan.totalBytes,
      limitBytes: settings.workspaceLimit ?? null,
      remainingBytes,
      unreachable,
      workspaces,
    };
  }
}
