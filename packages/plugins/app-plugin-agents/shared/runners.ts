/**
 * Runners as the browser and the server's admin API exchange them.
 */
import {
  AGENT_TOOLS,
  policyAllowsAgent,
  type AgentTool,
  type RunnerFeature,
  type RunnerPolicy,
  type RunStatus,
  type ToolInfo,
} from '@nocobase/agent-protocol';

import { entryTools, type AgentModelEntry } from './agents.js';

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
  /** What the runner reported: each coding tool with its version and whether it is signed in. */
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
  readonly lastSeenAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
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
 * executable paths) is shown only to those who may manage it (`canManage`): `hostname` is null and the tools carry no
 * `path` for everyone else.
 */
export interface RunnerSummary extends Omit<Runner, 'hostname'> {
  /** Null when the viewer may not manage it. */
  readonly hostname: string | null;
  /** Runs it holds now. */
  readonly activeRuns: number;
  /** Jobs it holds now. */
  readonly activeJobs: number;
  /**
   * What it takes work for, by what people configured and what it reported (for agent runs: the agents whose tool is
   * enabled and signed in here, that are not limited to other runners, and that its owner's policy lets in).
   */
  readonly takes: readonly RunnerWorkTarget[];
  /** The viewer may rename it, change its slots, revoke and delete it. */
  readonly canManage: boolean;
  /** The viewer may switch it between personal and team: its owner, or a manager of runners. */
  readonly canChangeTrust: boolean;
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

/** What people change about a runner after it registered. */
export interface RunnerPatch {
  readonly name?: string;
  readonly trust?: RunnerTrust;
  readonly slots?: number;
  /** null offers every tool the runner reports. */
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
}

/** A one-time registration token; `token` is shown only in this answer. */
export interface RegistrationToken {
  readonly id: string;
  readonly token: string;
  readonly trust: RunnerTrust;
  readonly enabledTools: readonly AgentTool[] | null;
  readonly slots: number | null;
  readonly expiresAt: string;
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

/** Whether people let `runner` run `tool` (whether it is installed and signed in is another matter). */
export function toolEnabled(
  runner: Pick<Runner, 'enabledTools'>,
  tool: AgentTool,
): boolean {
  return runner.enabledTools === null || runner.enabledTools.includes(tool);
}

/** Whether `runner` can run `tool`'s work: it is enabled there, installed and signed in. */
export function runsTool(
  runner: Pick<Runner, 'enabledTools' | 'tools'>,
  tool: AgentTool,
): boolean {
  return (
    toolEnabled(runner, tool) &&
    runner.tools.some((item) => item.kind === tool && item.authenticated)
  );
}

/** The job kinds a runner reports it executes (`jobs.<kind>` features). */
export function jobKindsOf(runner: Pick<Runner, 'features'>): string[] {
  return runner.features
    .filter((feature) => feature.startsWith('jobs.'))
    .map((feature) => feature.slice('jobs.'.length));
}

/** The state of one of a runner's coding tools, as a page shows it. */
export type ToolState = 'off' | 'notInstalled' | 'signedOut' | 'signedIn';

/** Off when people turned it off here; otherwise whether the runner has it installed and signed in. */
export function toolState(
  runner: Pick<Runner, 'enabledTools' | 'tools'>,
  tool: AgentTool,
): ToolState {
  if (!toolEnabled(runner, tool)) return 'off';
  const info = runner.tools.find((item) => item.kind === tool);
  if (!info) return 'notInstalled';
  return info.authenticated ? 'signedIn' : 'signedOut';
}

/**
 * The tools a runner lists, in the protocol's order: exactly the tools it reported. A runner reports only the tools it
 * has installed, so a tool it did not report is not listed, even when `enabledTools` names it (turning one tool off
 * from "every tool" stores every other tool the protocol knows).
 */
export function listedTools(runner: Pick<Runner, 'tools'>): AgentTool[] {
  return AGENT_TOOLS.filter((tool) =>
    runner.tools.some((item) => item.kind === tool),
  );
}

/**
 * How a runner reads at a glance: `busy` is online with every slot taken. Revoked and upgrade-required runners take
 * no work whatever their slots say.
 */
export type RunnerActivity =
  'online' | 'busy' | 'offline' | 'revoked' | 'upgrade_required';

export function runnerActivity(
  runner: Pick<RunnerSummary, 'status' | 'slots' | 'activeRuns' | 'activeJobs'>,
): RunnerActivity {
  if (runner.status !== 'online') return runner.status;
  return runner.activeRuns + runner.activeJobs >= runner.slots
    ? 'busy'
    : 'online';
}

/** An agent as far as where it may run is concerned (the agents plugin's `Agent` fits). */
export interface RunnerAgentFit {
  readonly id: string;
  readonly name: string;
  /** Runner agents list their coding tools; online agents' entries name none, and never run on a runner. */
  readonly modelEntries: readonly AgentModelEntry[];
  /** The runners it is limited to; empty for any runner that fits. */
  readonly runnerIds: readonly string[];
}

/**
 * Whether `runner` may take `agent`'s runs, by what people configured and what it reported: the agent is not limited
 * to other runners, one of its tools is enabled, installed and signed in here, and the owner's local policy lets it in. Whether
 * the runner is online right now is left to the caller.
 */
export function runnerTakesAgent(
  runner: Pick<Runner, 'id' | 'enabledTools' | 'tools' | 'policy'>,
  agent: RunnerAgentFit,
): boolean {
  if (agent.runnerIds.length > 0 && !agent.runnerIds.includes(runner.id))
    return false;
  return (
    entryTools(agent).some((tool) => runsTool(runner, tool)) &&
    policyAllowsAgent(runner.policy, agent)
  );
}
