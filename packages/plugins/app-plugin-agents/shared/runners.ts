/**
 * Runners as the browser and the server's admin API exchange them.
 */
import type { QuotaLocation } from './quota.js';

import {
  AGENT_TOOLS,
  NATIVE_AGENT_TOOLS,
  isNativeTool,
  policyAllowsAgent,
  type AgentTool,
  type RunnerFeature,
  type RunnerPolicy,
  type RunStatus,
  type ToolInfo,
  type ToolLoad,
  type ToolSlots,
  type WorkspaceDecision,
  type WorkspaceCleanupResult,
} from '@nocobase/agent-protocol';

import type { RunnerModelEntry } from './agents.js';
import { normalizeModel } from './model-catalog.js';

/**
 * `team` runs anyone's work; `ownerOnly` (shown as "personal") runs only work its owner started. A runner added by its
 * owner starts personal; the owner may share it with the team, and an administrator may add one shared from the start.
 */
export const RUNNER_TRUST = ['team', 'ownerOnly'] as const;

export type RunnerTrust = (typeof RUNNER_TRUST)[number];

/**
 * `upgrade_required`: the runner is connected, but speaks a protocol this application does not serve
 * (`protocolVersion` outside `RunnerSummary.requiredProtocol`). It keeps sending heartbeats and is given no work until
 * it is upgraded; its owner is told once (the `notice` event).
 */
export const RUNNER_STATUSES = [
  'online',
  'offline',
  'revoked',
  'upgrade_required',
] as const;

export type RunnerStatus = (typeof RUNNER_STATUSES)[number];

/**
 * Optional payload support is established by capabilities, never package versions.
 * Protocol 9 runners may ignore workspace.key; only its explicit declaration is evidence.
 */
export function supportsWorkspaceKey(
  runner: Pick<Runner, 'features'>,
): boolean {
  return runner.features.includes('workspaceKey');
}

export interface Runner {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly os: string;
  readonly arch: string;
  readonly version: string;
  /**
   * The product it runs as and updates itself to, `nocobase-runner`; null for a runner that did not report one, which
   * is offered no update.
   */
  readonly product: string | null;
  readonly protocolVersion: number;
  readonly features: readonly RunnerFeature[];
  /** What the runner reported: version, sign-in and optional advisory model capabilities. Never edits Agent configuration. */
  readonly tools: readonly ToolInfo[];
  /**
   * The coding tools people let this runner run, chosen on the web; null offers every tool it reports. A tool left
   * out is still reported (with its version and sign-in) but never dispatched here.
   */
  readonly enabledTools: readonly AgentTool[] | null;
  readonly trust: RunnerTrust;
  readonly ownerUserId: string | null;
  readonly ownerName: string | null;
  readonly status: RunnerStatus;
  /** Its slots, shared by runs and jobs. */
  readonly slots: number;
  /**
   * How many runs of each coding tool it may hold at once, beside `slots` (`{ claude: 2, codex: 1 }`); a tool left
   * out, or every tool when null or absent, is bounded by `slots` only. Set on the web or on registration (`--slots`).
   * Optional so a runner built by other code than this plugin's server needs none; the server always sets it.
   */
  readonly toolSlots?: ToolSlots | null;
  /**
   * What it last reported per coding tool for the tools its own settings limit: how many runs of each it holds at most
   * and could take now, across every application it serves. Null or absent when it reported none (unknown: read as
   * room left).
   */
  /** Last heartbeat free slots across all applications; absent before a heartbeat. */
  readonly globalFree?: number;
  readonly draining?: 'updatePending' | 'pruning' | 'diskLow';
  readonly toolLoad?: Readonly<Partial<Record<AgentTool, ToolLoad>>> | null;
  /**
   * Its owner (or a manager of runners) lets it take jobs: builds and other steps an application configures, run
   * without a model. Off for every runner until someone turns it on; a job also needs the runner to report the job's
   * feature (`jobs.build`).
   */
  readonly acceptJobs: boolean;
  /**
   * What its owner's local policy lets it take, as it reported it (protocol 7): the agents, subjects and repositories
   * it accepts. Null when it reported none: it takes anything it is registered for. Work kinds it refuses outright are
   * missing from its `features` instead.
   */
  readonly policy: RunnerPolicy | null;
  /**
   * The names of the variables it provides to a run that asks for them by name (variables kept "from the runner"):
   * its local variables and the names its owner passes from its environment, as it last reported them. Names only.
   * Null or absent when it reported none (a runner from before they were reported: unknown).
   */
  readonly variables?: readonly string[] | null;
  /**
   * The working directories it keeps for this application and the free space on the disk holding them, as it last
   * reported them. Null or absent when it never reported any (a runner that does not report, or one that has not yet).
   */
  readonly workspaceUsage?: RunnerWorkspaceUsage | null;
  /**
   * The tools and models a run failed `modelUnavailable` with here: not offered here until the runner reports that
   * tool's models differently. Null or absent for none.
   */
  readonly unavailableModels?: readonly UnavailableModel[] | null;
  readonly quotaRevision: number;
  readonly quotaUsage?: readonly RunnerQuotaUsage[] | null;
  readonly lastSeenAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RunnerQuotaUsage {
  readonly tool: AgentTool;
  readonly window: string;
  readonly scope: 'tool' | 'provider' | 'model';
  readonly target: string;
  readonly usedPercent?: number;
  readonly resetsAt: string | null;
  readonly observedAt: string;
  /** Whether this observation exhausted its window. */
  readonly exhausted?: boolean;
}

/** Active quota blocks for a candidate; default models still obey tool blocks. */
export function quotaBlocks(
  runner: Pick<Runner, 'unavailableModels'>,
  entry: Pick<RunnerModelEntry, 'tool' | 'model'>,
  now: number,
): UnavailableModel[] {
  const model = entry.model ? normalizeModel(entry.tool, entry.model) : '';
  return (runner.unavailableModels ?? []).filter(
    (mark) =>
      mark.reason === 'toolQuota' &&
      mark.tool === entry.tool &&
      (!mark.resetsAt || Date.parse(mark.resetsAt) > now) &&
      (mark.scope === 'tool' ||
        (model !== '' &&
          (mark.scope === 'provider'
            ? model.split('/')[0] === mark.model
            : model === mark.model))),
  );
}

/** A tool and model a run failed `modelUnavailable` with on a runner (`Runner.unavailableModels`). */
export interface UnavailableModel {
  readonly reason?: 'modelUnavailable' | 'toolQuota';
  readonly scope?: 'tool' | 'provider' | 'model';
  readonly window?: string;
  readonly resetsAt?: string | null;
  readonly tool: AgentTool;
  /** Normalized (`normalizeModel`). */
  readonly model: string;
  readonly at: string;
  /** The tool's models as the runner reported them then, normalized: a different report lifts the mark. */
  readonly reported: readonly string[];
}

/** A runner's working directories, as it last reported them (`Runner.workspaceUsage`). */
export interface RunnerWorkspaceUsage {
  /** Computed from reported directory sizes; not a new runner protocol field. */
  readonly totalBytes?: number;
  readonly sizeUnknownCount?: number;
  readonly counts?: Readonly<
    Record<'all' | 'active' | 'retained' | 'ended', number>
  >;
  readonly diskMeasuredAt?: string;
  readonly intervalMs?: number;
  /** The disk holding the runner's working directories; null when it did not say. */
  readonly disk: RunnerWorkspaceDisk | null;
  /** How many it keeps for this application. */
  readonly count: number;
  /** How many of those hold work that was never pushed, and are never removed on the application's word. */
  readonly unpushedCount: number;
  /** When directories were collected; null until the first directory report. */
  readonly measuredAt: string | null;
  /** This application's, most recently used first. */
  readonly workspaces: readonly RunnerWorkspace[];
}

/** The disk holding a runner's working directories, as it reported it. */
export interface RunnerWorkspaceDisk {
  readonly freeBytes: number;
  readonly totalBytes: number;
  /** What its owner keeps free; below it, the runner removes directories that may go. Null for nothing. */
  readonly minFreeBytes: number | null;
}

/** One working directory a runner keeps for this application. */
export interface RunnerWorkspace {
  readonly subjectKey?: string;
  readonly sizeBytes?: number;
  readonly decision?: WorkspaceDecision;
  readonly cleanup?: WorkspaceCleanupResult;
  /** The last run that worked in it. */
  readonly runId?: string;
  /** Where it is on the runner. */
  readonly workDir: string;
  /** It holds changes not committed, or commits the remote task branch lacks. */
  readonly unpushed: boolean;
  readonly lastUsedAt: string;
  /** The subject its last run worked on; null when the run is unknown here. */
  readonly subjectKind: string | null;
  readonly subjectId: string | null;
  /** The subject's work is over (it may be removed), goes on, or cannot be told (null). */
  readonly settled: boolean | null;
}

/** A directory's display category; subject completion alone does not mean it can be removed. */
export function workspaceCategory(
  workspace: RunnerWorkspace,
): 'active' | 'retained' | 'ended' {
  if (workspace.settled === false) return 'active';
  if (
    workspace.settled === true &&
    !workspace.unpushed &&
    (!workspace.cleanup || workspace.cleanup.reason === 'allowed')
  )
    return 'ended';
  return 'retained';
}

/** What a runner takes work for, as the kind of work it serves names it: an agent, for agent runs. */
export interface RunnerWorkTarget {
  readonly id: string;
  readonly name: string;
}

/** One item a runner holds now: a run of the kind of work it serves, or a job. */
export interface RunnerHeldItem {
  readonly id: string;
  readonly kind: 'run' | 'job';
  /** What it is, for people: the agent of a run, a job's title or kind. */
  readonly title: string;
  readonly status: 'dispatched' | 'running';
  readonly startedAt: string | null;
  /** Where the application shows what it works on; null when nowhere, or when the viewer may not see it. */
  readonly path: string | null;
}

/** One of a runner's latest runs, for its page. */
export interface RunnerRecentRun {
  readonly subjectLabel?: string | null;
  readonly failureReason?: string | null;
  readonly id: string;
  /** The agent that ran. */
  readonly title: string;
  readonly status: RunStatus;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly createdAt: string;
  /** Where the application shows what it worked on; null when nowhere, or when the viewer may not see it. */
  readonly path: string | null;
}

/**
 * A runner in the list, with what the viewer may do with it. What identifies its machine (the host name, the tools'
 * executable paths) is shown only to its owner, the managers of runners and anyone who may wake an agent: `hostname`
 * is null and the tools carry no `path` for everyone else.
 */
export interface RunnerSummary extends Omit<
  Runner,
  'hostname' | 'quotaRevision'
> {
  readonly canSeeMachine?: boolean;
  /** Null when the viewer may not manage it. */
  readonly hostname: string | null;
  /** Runs it holds now. */
  readonly activeRuns: number;
  /** Jobs it holds now. */
  readonly activeJobs: number;
  /**
   * The runs it holds now, by the coding tool each runs with; a tool it runs nothing of is left out. Absent when
   * unknown (a summary built by other code than this plugin's server): no use per tool is shown.
   */
  readonly activeByTool?: Readonly<Partial<Record<AgentTool, number>>>;
  /**
   * What it takes work for, by what people configured and what it reported (for agent runs: the agents whose tool is
   * enabled and signed in here, that are not limited to other runners, and that its owner's policy lets in).
   */
  readonly takes: readonly RunnerWorkTarget[];
  /**
   * The viewer may change it (its name, slots, coding tools and policy): its owner, or a manager of runners once its
   * owner can no longer act (none recorded, or disabled or deleted). A manager does not change someone else's runner.
   */
  readonly canManage: boolean;
  readonly canManageTools?: boolean;
  /** The viewer may switch it between personal and team: whoever may change it (`canManage`). */
  readonly canChangeTrust: boolean;
  /** The viewer may revoke it, and delete it once revoked: its owner, or a manager of runners in an emergency. */
  readonly canRevoke: boolean;
  readonly canClearQuota: boolean;
  /** Count of the recent (at most ten) run rows, without loading their details. */
  readonly recentRunsCount: number;
  /**
   * A newer runner version the application serves for its platform, which the runner installs on its own between
   * runs; null when it is up to date or the application serves none.
   */
  readonly updateVersion: string | null;
  /** The protocols this application serves; a runner speaking another one is `upgrade_required`. */
  readonly requiredProtocol: { readonly min: number; readonly max: number };
  /**
   * The application gives runners jobs (it registered job kinds, such as an application's runner build method): only then is
   * whether a runner takes them (`acceptJobs`) worth showing.
   */
  readonly offersJobs: boolean;
}

/** The list carries totals only; fetch a single runner for directory diagnostics. */
export const RUNNER_LIST_FIELDS = {
  id: true,
  name: true,
  hostname: true,
  os: true,
  arch: true,
  version: true,
  product: true,
  tools: true,
  enabledTools: true,
  trust: true,
  ownerUserId: true,
  ownerName: true,
  status: true,
  slots: true,
  toolSlots: true,
  activeRuns: true,
  activeJobs: true,
  activeByTool: true,
  lastSeenAt: true,
  draining: true,
  canManage: true,
  canManageTools: true,
  canChangeTrust: true,
  canRevoke: true,
  takes: true,
  updateVersion: true,
} as const;

export interface RunnerListItem extends Pick<
  RunnerSummary,
  keyof typeof RUNNER_LIST_FIELDS
> {
  readonly takesCount: number;
  readonly workspaceUsage?: Omit<RunnerWorkspaceUsage, 'workspaces'> | null;
}

/** The single public runtime-list projection; schema and type use the same field set. */
export function runnerListItem(
  summary: Omit<RunnerSummary, 'recentRunsCount'>,
): RunnerListItem {
  const selected = Object.fromEntries(
    Object.keys(RUNNER_LIST_FIELDS).map((key) => [
      key,
      summary[key as keyof typeof RUNNER_LIST_FIELDS],
    ]),
  ) as Pick<RunnerSummary, keyof typeof RUNNER_LIST_FIELDS>;
  const totals = summary.workspaceUsage
    ? (({ workspaces: _rows, ...rest }) => rest)(summary.workspaceUsage)
    : null;
  return {
    ...selected,
    tools: summary.tools.map(({ kind, version, authenticated }) => ({
      kind,
      version,
      authenticated,
    })),
    takes: summary.takes.slice(0, 3),
    takesCount: summary.takes.length,
    workspaceUsage: summary.workspaceUsage ? totals : null,
  };
}

export interface RunnerWorkspacePage {
  readonly data: readonly RunnerWorkspace[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly usage: Omit<RunnerWorkspaceUsage, 'workspaces'> | null;
  };
}

/** What people change about a runner after it registered. */
export interface RunnerPatch {
  readonly name?: string;
  readonly trust?: RunnerTrust;
  readonly slots?: number;
  /** Limits per coding tool; null, or a tool left out, for none of its own (bounded by `slots`). */
  readonly toolSlots?: ToolSlots | null;
  /** null offers every tool the runner reports. */
  readonly redetectTools?: boolean;
  readonly enabledTools?: readonly AgentTool[] | null;
  readonly acceptJobs?: boolean;
}

export interface RegistrationTokenInput {
  /** `team` needs the `agents.runners` manage permission; anyone may add a personal runner. */
  readonly trust?: RunnerTrust;
  /** The coding tools the runner that registers with this token may run; omitted or null for every tool. */
  readonly enabledTools?: readonly AgentTool[] | null;
  /**
   * How many runs at once the runner that registers with this token takes (1 to 64); omitted or null leaves it to the
   * runner. A runner registered with an explicit `--slots` keeps its own number.
   */
  readonly slots?: number | null;
  /**
   * The limits per coding tool the runner that registers with this token gets; omitted or null for none. A runner
   * registered with its own limits per tool (`--slots claude=2`) keeps its own.
   */
  readonly toolSlots?: ToolSlots | null;
}

/** A one-time registration token; `token` is shown only in this answer. */
export interface RegistrationToken {
  readonly id: string;
  readonly token: string;
  readonly trust: RunnerTrust;
  readonly enabledTools: readonly AgentTool[] | null;
  readonly slots: number | null;
  /** Absent from tokens made before limits per tool, or built by other code: none. */
  readonly toolSlots?: ToolSlots | null;
  readonly expiresAt: string;
}

/** Usable token metadata; the secret and its hash are never returned by a list. */
export interface RegistrationTokenSummary extends Omit<
  RegistrationToken,
  'token'
> {
  readonly createdById: string | null;
  readonly createdAt: string;
}

/**
 * A short-lived token that lets the install script download the `acme` CLI for one platform (the one its first
 * download names) and nothing else; `token` is shown only in this answer. It registers no runner.
 */
export interface DownloadToken {
  readonly token: string;
  readonly expiresAt: string;
  /** How many tarball downloads it allows, retries included. */
  readonly maxDownloads: number;
}

/** Whether the explicit server selection permits `tool`; null API input is normalized to the four native tools. */
export function toolEnabled(
  runner: Pick<Runner, 'enabledTools'>,
  tool: AgentTool,
): boolean {
  return (runner.enabledTools ?? NATIVE_AGENT_TOOLS).includes(tool);
}

/** Whether `runner` can run `tool`'s work: it is enabled there, installed and signed in. */
export function runsTool(
  runner: Pick<Runner, 'enabledTools' | 'tools'>,
  tool: AgentTool,
): boolean {
  return (
    toolEnabled(runner, tool) &&
    runner.tools.some(
      (item) =>
        item.kind === tool &&
        item.authenticated &&
        (!item.status || item.status === 'ready'),
    )
  );
}

/**
 * The models a runner reports for `tool`, normalized and each once, when the tool is enabled there and signed in;
 * empty otherwise, and when the runner reported no models.
 */
export function reportedModels(
  runner: Pick<Runner, 'enabledTools' | 'tools'>,
  tool: AgentTool,
): string[] {
  if (!runsTool(runner, tool)) return [];
  const info = runner.tools.find(
    (item) => item.kind === tool && item.authenticated,
  );
  if (!isNativeTool(tool) && info?.modelsDetectionStatus === 'unsupported')
    return [''];
  return [
    ...new Set(
      (info?.models ?? []).map((model) => normalizeModel(tool, model.id)),
    ),
  ];
}

/**
 * Whether `runner` can run `entry`: its tool enabled, installed and signed in, and, for an entry naming a model, the
 * model among those the runner reports for the tool and not marked unavailable there (`unavailableModels`).
 */
export function runsEntry(
  runner: Pick<Runner, 'enabledTools' | 'tools' | 'unavailableModels'>,
  entry: Pick<RunnerModelEntry, 'tool' | 'model'>,
  now: number,
): boolean {
  if (
    !runsTool(runner, entry.tool) ||
    quotaBlocks(runner, entry, now).length > 0
  )
    return false;
  if (!entry.model) return true;
  const model = normalizeModel(entry.tool, entry.model);
  return (
    reportedModels(runner, entry.tool).includes(model) &&
    !(runner.unavailableModels ?? []).some(
      (mark) =>
        mark.reason !== 'toolQuota' &&
        mark.tool === entry.tool &&
        mark.model === model,
    )
  );
}

/** The job kinds a runner reports it executes (`jobs.<kind>` features). */
export function jobKindsOf(runner: Pick<Runner, 'features'>): string[] {
  return runner.features
    .filter((feature) => feature.startsWith('jobs.'))
    .map((feature) => feature.slice('jobs.'.length));
}

/** The state of one of a runner's coding tools, as a page shows it. */
export type ToolState =
  'off' | 'notInstalled' | 'signedOut' | 'signedIn' | 'checking' | 'failed';

/** Off when people turned it off here; otherwise whether the runner has it installed and signed in. */
export function toolState(
  runner: Pick<Runner, 'enabledTools' | 'tools'>,
  tool: AgentTool,
): ToolState {
  if (!toolEnabled(runner, tool)) return 'off';
  const info = runner.tools.find((item) => item.kind === tool);
  if (!info) return 'checking';
  if (
    info.status === 'notInstalled' ||
    info.status === 'checking' ||
    info.status === 'failed'
  )
    return info.status;
  return info.authenticated ? 'signedIn' : 'signedOut';
}

/** The selected or reported tools, in catalog order, including selected tools awaiting detection. */
export function listedTools(
  runner: Pick<Runner, 'tools'> & Partial<Pick<Runner, 'enabledTools'>>,
): AgentTool[] {
  return AGENT_TOOLS.filter(
    (tool) =>
      runner.tools.some((item) => item.kind === tool) ||
      (runner.enabledTools ?? []).includes(tool),
  );
}

/**
 * How a runner reads at a glance: `busy` is online with every slot taken. Revoked and upgrade-required runners take
 * no work whatever their slots say.
 */
export type RunnerActivity =
  | 'online'
  | 'busy'
  | 'low_disk'
  | 'offline'
  | 'revoked'
  | 'upgrade_required'
  | 'updatePending'
  | 'pruning';

export function runnerActivity(
  runner: Pick<
    RunnerListItem,
    | 'status'
    | 'slots'
    | 'activeRuns'
    | 'activeJobs'
    | 'workspaceUsage'
    | 'draining'
  >,
): RunnerActivity {
  if (runner.status !== 'online') return runner.status;
  if (runner.draining === 'diskLow') return 'low_disk';
  if (runner.draining) return runner.draining;
  if (runnerLowOnDisk(runner)) return 'low_disk';
  return runner.activeRuns + runner.activeJobs >= runner.slots
    ? 'busy'
    : 'online';
}

/** How many runs of `tool` the runner may hold at once: its limit for the tool, never above its total slots. */
export function toolLimit(
  runner: Pick<Runner, 'slots' | 'toolSlots'>,
  tool: AgentTool,
): number {
  const own = runner.toolSlots?.[tool];
  return own === undefined ? runner.slots : Math.min(own, runner.slots);
}

/** One coding tool's use of a runner's slots, as a page shows it. */
export interface ToolUsage {
  readonly tool: AgentTool;
  /** Runs of it the runner holds now, for this application. */
  readonly used: number;
  /** Its limit (`toolLimit`). */
  readonly limit: number;
  /** Whether the limit is its own (`toolSlots`) rather than the runner's total. */
  readonly limited: boolean;
}

/**
 * The coding tools worth showing a runner's use of, in the protocol's order: those with a limit of their own and those
 * it runs something of now. Empty for a runner without limits per tool that runs nothing.
 */
export function toolUsage(
  runner: Pick<RunnerSummary, 'slots' | 'toolSlots' | 'activeByTool'>,
): ToolUsage[] {
  return AGENT_TOOLS.flatMap((tool) => {
    const used = runner.activeByTool?.[tool] ?? 0;
    const limited = runner.toolSlots?.[tool] !== undefined;
    return limited || used > 0
      ? [{ tool, used, limit: toolLimit(runner, tool), limited }]
      : [];
  });
}

/** An agent as far as where it may run is concerned (the agents plugin's `Agent` fits). */
export interface RunnerAgentFit {
  readonly id: string;
  readonly name: string;
  /** Its coding tools and models, in order. */
  readonly modelEntries: readonly RunnerModelEntry[];
}

/**
 * Whether `runner` may take `agent`'s runs, by what it reported: one of the agent's tools and models is enabled, signed
 * in and reported here (`runsEntry`), and the owner's local policy lets it in. Whether the runner is online right now is
 * left to the caller.
 */
/** Shared by admission, availability and the page; does not affect existing leases. */
export function runnerLowOnDisk(
  runner: Pick<RunnerListItem, 'workspaceUsage'>,
): boolean {
  const disk = runner.workspaceUsage?.disk;
  return (
    disk != null &&
    disk.minFreeBytes !== null &&
    disk.freeBytes < disk.minFreeBytes
  );
}

export function runnerTakesAgent(
  runner: Pick<
    Runner,
    | 'id'
    | 'enabledTools'
    | 'tools'
    | 'policy'
    | 'unavailableModels'
    | 'workspaceUsage'
  >,
  agent: RunnerAgentFit,
  now: number,
): boolean {
  return (
    !runnerLowOnDisk(runner) &&
    agent.modelEntries.some((entry) => runsEntry(runner, entry, now)) &&
    policyAllowsAgent(runner.policy, agent)
  );
}

/** Quota information for runtimes that otherwise fit; unrelated personal machines stay private. */
export function quotaForAgent(
  runners: readonly Runner[],
  agent: RunnerAgentFit,
  actorUserId: string | undefined,
  now: number,
): QuotaLocation[] {
  return runners.flatMap((runner) => {
    if (
      !(runner.unavailableModels ?? []).some(
        (mark) =>
          mark.reason === 'toolQuota' &&
          (!mark.resetsAt || Date.parse(mark.resetsAt) > now),
      )
    )
      return [];
    if (
      runner.trust !== 'team' &&
      actorUserId !== undefined &&
      runner.ownerUserId !== actorUserId
    )
      return [];
    const compatible = {
      ...runner,
      unavailableModels: (runner.unavailableModels ?? []).filter(
        (mark) => mark.reason !== 'toolQuota',
      ),
    };
    if (!runnerTakesAgent(compatible, agent, now)) return [];
    const blocks = agent.modelEntries
      .filter((entry) => runsEntry(compatible, entry, now))
      .map((entry) => quotaBlocks(runner, entry, now));
    if (blocks.some((list) => !list.length)) return [];
    const resets = blocks.map((list) =>
      list.some((mark) => !mark.resetsAt)
        ? null
        : new Date(
            Math.max(...list.map((mark) => Date.parse(mark.resetsAt!))),
          ).toISOString(),
    );
    return [
      {
        runnerId: runner.id,
        runnerName: runner.name,
        resetsAt:
          resets.filter((reset): reset is string => reset !== null).sort()[0] ??
          null,
      },
    ];
  });
}

/** Reuse the directory snapshot already read for detail; list reads keep their small JSON projection. */
export function workspaceSummary(
  usage: RunnerWorkspaceUsage,
): RunnerWorkspaceUsage {
  const counts = { all: usage.count, active: 0, retained: 0, ended: 0 };
  let totalBytes = 0,
    sizeUnknownCount = 0;
  for (const workspace of usage.workspaces) {
    counts[workspaceCategory(workspace)]++;
    if (workspace.sizeBytes === undefined) sizeUnknownCount++;
    else totalBytes += workspace.sizeBytes;
  }
  return { ...usage, totalBytes, sizeUnknownCount, counts };
}
