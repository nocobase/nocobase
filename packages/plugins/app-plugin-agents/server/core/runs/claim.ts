/**
 * Claiming: handing queued runs to a runner that fits them, within each agent's concurrency limit, one run per
 * (agent, subject, thread) at a time, through the runners' one long-poll (`routes/runners/runner.ts`), which hands
 * out jobs from the same slots. A runner fits a run when it has the agent's
 * tool enabled (on the web), installed and signed in, the agent names no runner or names it, it is shared with the
 * team or belongs to the person who woke the agent, its features cover what the run requires (worked out from the
 * payload: checkouts, directories, skills, secrets), its owner's local policy (`Runner.policy`) lets it take the
 * agent's runs on the run's subject and repositories, and it has a free slot. A working directory that is a directory
 * on one runner pins the run to that runner, one run at a time per directory. A run's variables go to the runner that
 * takes it, personal ones included, unless one of them is for team runners only (`teamRunnersOnly`): then only a team
 * runner takes the run, and the variables that asked for one are noted on it (`teamOnlyVariables`), so its wait says
 * which.
 *
 * A slot is free for a run when the runner's total has room and so does the coding tool it runs with: the tool's limit
 * (`Runner.toolSlots`, never above the total) over the runs of that tool the runner holds here, and what the runner
 * said it can still take of that tool across every application (`ClaimRequest.tools`). The run takes the first of its
 * agent's entries whose tool the runner runs and has room for, so an agent listing two tools runs with the second while
 * the first is full; a run none of whose tools has room is passed over for the runs behind it.
 *
 * Variables are checked and opened in the claim's own transaction, on its connection: which ones the assembled payload
 * gets, whether any is for team runners only, and their values, so what the runner receives is what was checked. The
 * names taken from the runner go in `workspace.passthrough`, without values.
 *
 * A claim is one transaction per run. It first writes the agent's row (`lockAgentForClaim`): on databases with row
 * locks, concurrent claims for the same agent wait there, so the concurrency count read next is current. The run is
 * then taken with a guarded update (`status = 'queued'`), so two runners can never take the same run. The payload is
 * assembled in the same transaction; if assembly fails the transaction rolls back, the run stays queued, and the
 * failure is counted (`claimFailures`) until the run fails `setupFailed`.
 *
 * Portable by design: the database layer offers no `FOR UPDATE SKIP LOCKED` or advisory locks, and the guarded update
 * plus the agent-row write give the same guarantees on every dialect (SQLite serializes writers anyway).
 *
 * Polls are the hot path: every runner walks the same candidates, so a write per candidate is a write per candidate per
 * runner per poll. Everything that rules a candidate out is read outside any transaction — identity, `fits()`, slots,
 * concurrency and comment consent — and a transaction opens only for the run about to be claimed. The agent row is
 * the only row a claim locks with a self-update, and only in that final transaction after `fits()` (or when a stale
 * identity has to be repaired first, which current work never needs). PostgreSQL runs at READ COMMITTED, where each
 * statement sees the latest committed rows, so no transaction needs no-op writes to refresh a snapshot; comment
 * consent needs no chain lock, because confirmation is final and rejection or Run as me end the chain's queued runs,
 * which the guarded update sees. A new write or lock here needs a measured reason (`tests/claim-concurrency.test.ts`
 * counts them, and the lock waits on PostgreSQL).

 */
import {
  ANNOUNCED_FAILURES,
  isProtocolSupported,
  type AgentTool,
  policyAllowsAgent,
  policyAllowsRepo,
  policyAllowsSubject,
  TIMINGS,
  type RunApp,
  type RunInput,
  type RunnerFeature,
  type RunPayload,
  type RunSkill,
  type WorkspaceDir,
} from '@nocobase/agent-protocol';
import type { DistService } from '../../distribution/index.js';
import {
  runnerLowOnDisk,
  runsEntry,
  toolLimit,
  supportsWorkspaceKey,
  type Runner,
} from '../../../shared/runners.js';
import { queueStart } from './selection.js';
import type { DatabaseConnection } from '@nocobase/db';
import { createHash } from 'node:crypto';

import type { Agent, RunnerModelEntry } from '../../../shared/agents.js';
import type { BriefLayers } from '../../../shared/briefs.js';
import type {
  Run,
  ModelSelectionWait,
  ModelWaitReason,
  RunExecutionSnapshot,
} from '../../../shared/runs.js';
import { later, type Clock } from '../../kernel/clock.js';
import { notFound } from '../../kernel/errors.js';
import type { People } from '../../kernel/people.js';
import type { IdSource } from '../../kernel/ids.js';
import { runSecretsKey, type SecretMemory } from '../../kernel/redaction.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { cleanList, covers, jsonObject } from '../../kernel/values.js';
import { findAgent, lockAgentForClaim } from '../agents/index.js';
import { joinBrief, renderBrief } from '../brief/index.js';
import { cliPackageFor } from './cli-package.js';
import { executionHistory } from './execution.js';
import type { SkillService, SkillTarget } from '../skills/index.js';
import {
  describeVariables,
  variableRefs,
  type VariableService,
  type VariableTarget,
} from '../variables/index.js';
import type { VariableRef } from '../../../shared/variables.js';
import {
  mountsFor,
  prepareExtensions,
  repoAccessFor,
  type RepoAccessRegistry,
  sessionKeyOf,
  withSections,
  type BriefSectionRegistry,
  type Prepared,
  type RunMountRegistry,
} from './extensions.js';
import {
  type ClaimContext,
  type SubjectAssembly,
  type SubjectDir,
} from './ports.js';
import { MAX_CLAIM_FAILURES, toolPolicyFor, type AgentCli } from './policy.js';
import { mintRunToken } from './run-tokens.js';
import { runsHeldByTool } from './runner-view.js';
import {
  ACTIVE,
  countActive,
  eventsRepo,
  findRunRecord,
  markDelivered,
  pendingInputs,
  type InputRecord,
  runsOfKey,
  runsRepo,
  inputsRepo,
  sessionsRepo,
  toInput,
  toExecutions,
  toRun,
  type RunRecord,
} from './run.store.js';
import { dropInputs } from './input-gate.js';
import { finishRun, type TransitionDeps } from './transitions.js';
import { queuedIdentityCurrent, refreshQueuedIdentity } from './identity.js';
import {
  currentCommentOwner,
  commentConsent,
  commentFromOwner,
  withdrawCommentRequests,
} from './comment-consent.js';
import { insertRunRequest, runRequestsRepo } from './run-requests.js';
import { consumeReset, saveBrief } from './workspace.store.js';

/** Queued runs looked at per claim, oldest first by priority. */
const CANDIDATES = 50;

export interface ClaimService {
  reconcileCommentConsent(unit: Tx, runId: string): Promise<void>;
  reconcileCommentQueue(): Promise<void>;
  /** Structured ordered-model diagnostics; machine visibility is enforced by the caller. */
  selectionWait(
    runId: string,
  ): Promise<import('../../../shared/runs.js').ModelSelectionWait | null>;
  /** Read-only capacity and compatibility for a real subject and candidate agent, as the run's actor. */
  diagnose(
    conn: DatabaseConnection,
    run: Run,
    agent: Agent,
  ): Promise<ModelSelectionWait | null>;
  /**
   * Up to `free` runs for `runner`, each with its payload; empty when nothing fits. `tools` is what the runner said it
   * can take of each coding tool it keeps a limit for (`ClaimRequest.tools`); a tool left out is bounded by `free`.
   */
  claim(
    runner: Runner,
    free: number,
    tools?: Readonly<Partial<Record<AgentTool, number>>>,
  ): Promise<RunPayload[]>;
  /** The skills a run gets, worked out the way its claim works them out. The caller checks who holds the run. */
  runSkills(runner: Runner, runId: string): Promise<RunSkill[]>;
}

export interface ClaimDeps extends TransitionDeps {
  readonly selectionPolicies?: import('./selection.js').ModelSelectionPolicies;
  readonly runners?: {
    online(conn: DatabaseConnection): Promise<Runner[]>;
    all(conn: DatabaseConnection): Promise<Runner[]>;
  };
  readonly people?: Pick<People, 'names'>;
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly variables: VariableService;
  readonly skills: SkillService;
  /** Where the CLI fetches its manifest, as runners see the server. */
  readonly manifestUrl: string;
  /** Who hands out the runs. */
  readonly app: RunApp;
  /** The application CLI runs get: its name, where the runner finds it, and its credentials file. */
  readonly cli: AgentCli;
  /** The tarballs the application serves, for a `served` CLI. */
  readonly dist?: Pick<DistService, 'find'>;
  /** What a runner holds now (its slots); runs and jobs share them. */
  readonly slotsUsed: (
    conn: DatabaseConnection,
    runnerId: string,
  ) => Promise<number>;
  /** Sections the application adds to every brief's context layer. */
  readonly sections?: BriefSectionRegistry;
  /** Directories of files the application places beside the agent, for runners with the `mounts` feature. */
  readonly mounts?: RunMountRegistry;
  /** Who a run's commits name and what its checkouts push with. */
  readonly repoAccess?: RepoAccessRegistry;
  /** Remembers the secrets a claim hands out, so what the run reports is redacted of them (`kernel/redaction.ts`). */
  readonly secrets?: SecretMemory;
  readonly onClaimFailure?: (runId: string, error: unknown) => void;
}

class AssemblyError extends Error {
  public constructor(
    message: string,
    public readonly cause: unknown,
  ) {
    super(message);
    this.name = 'AssemblyError';
  }
}

/** The run does not fit this runner after all (its payload needs another runner, or a busy directory). */
class NotForThisRunner extends Error {
  public constructor() {
    super('The run does not fit this runner.');
    this.name = 'NotForThisRunner';
  }
}

/** The run gets variables only team runners may receive, and this runner is a personal one. */
class TeamRunnersOnly extends NotForThisRunner {
  public constructor(public readonly variables: readonly VariableRef[]) {
    super();
    this.name = 'TeamRunnersOnly';
  }
}

/** What a runner said it can still take of each coding tool during one claim, counted down as runs are handed out. */
interface ToolRoom {
  has(tool: AgentTool): boolean;
  take(tool: AgentTool): void;
}

function toolRoom(
  tools: Readonly<Partial<Record<AgentTool, number>>> | undefined,
): ToolRoom {
  const left = new Map<AgentTool, number>(
    Object.entries(tools ?? {}) as [AgentTool, number][],
  );
  return {
    has: (tool) => (left.get(tool) ?? Number.POSITIVE_INFINITY) > 0,
    take: (tool) => {
      const count = left.get(tool);
      if (count !== undefined) left.set(tool, count - 1);
    },
  };
}

type Attempt =
  | { readonly kind: 'claimed'; readonly payload: RunPayload }
  | { readonly kind: 'skipped' }
  /** Nothing else of this agent (`agent`) or for this runner (`runner`) can be claimed in this pass. */
  | { readonly kind: 'full'; readonly scope: 'agent' | 'runner' };

/**
 * The entry `runner` takes a run of `agent` with: the first whose tool it has enabled, installed and signed in, with
 * the entry's model among those it reports (`runsEntry`). Null when it has none of them.
 */
export function pickEntry(
  runner: Runner,
  agent: Pick<Agent, 'modelEntries'>,
): RunnerModelEntry | null {
  return agent.modelEntries.find((entry) => runsEntry(runner, entry)) ?? null;
}

/**
 * The entry `runner` takes a run of `agent` with when some of its tools are full: the first whose tool it runs and
 * `open` says has room. Null when none has.
 */
export function pickOpenEntry(
  runner: Runner,
  agent: Pick<Agent, 'modelEntries'>,
  open: (tool: AgentTool) => boolean,
): RunnerModelEntry | null {
  return (
    agent.modelEntries.find(
      (entry) => runsEntry(runner, entry) && open(entry.tool),
    ) ?? null
  );
}

/** Whether `runner` has one of `agent`'s tools and models enabled, installed, signed in and reported. */
export function hasTool(
  runner: Runner,
  agent: Pick<Agent, 'modelEntries'>,
): boolean {
  return pickEntry(runner, agent) !== null;
}

/**
 * Whether `runner` may run work of `agent` as `actorUserId` that needs `requires`, before any lock is taken and before
 * a payload is known: the agent enabled, its tool and model reported there, its owner's policy, and trust.
 */
export function fitsActor(
  runner: Runner,
  agent: Agent,
  actorUserId: string,
  requires: readonly RunnerFeature[],
): boolean {
  if (agent.status !== 'enabled' || runnerLowOnDisk(runner)) return false;
  if (
    !isProtocolSupported(runner.protocolVersion) ||
    runner.status === 'upgrade_required' ||
    runner.status === 'revoked'
  )
    return false;
  if (!covers(runner.features, requires)) return false;
  if (!hasTool(runner, agent)) return false;
  if (!policyAllowsAgent(runner.policy, agent)) return false;
  return runner.trust === 'team' || runner.ownerUserId === actorUserId;
}

/** Whether `runner` may run `run` of `agent`, before any lock is taken and before its payload is known. */
export function fits(runner: Runner, agent: Agent, run: RunRecord): boolean {
  return fitsActor(runner, agent, run.actorUserId, toRun(run).requires);
}

/** The runner features a payload needs. */
export function payloadRequires(
  dirs: readonly WorkspaceDir[],
  skills: number,
  variables: number,
  workspaceKey: boolean = false,
): RunnerFeature[] {
  return [
    ...(workspaceKey ? ['workspaceKey' as const] : []),
    ...(dirs.some((dir) => dir.kind === 'repo') ? ['checkout' as const] : []),
    ...(dirs.some((dir) => dir.kind === 'directory')
      ? ['directories' as const]
      : []),
    ...(skills > 0 ? ['skills' as const] : []),
    ...(variables > 0 ? ['secrets' as const] : []),
  ];
}

/** The working directories as a runner receives them: without what only the server uses. */
export function payloadDirs(dirs: readonly SubjectDir[]): WorkspaceDir[] {
  return dirs.map((dir): WorkspaceDir => {
    const { scopeId: _scope, runnerId: _runner, ...rest } = dir;
    return rest;
  });
}

/** Where a run's variables come from, in merge order: the subject's scopes, its directories', the agent's. */
export function variableTargets(
  agent: Pick<Agent, 'id'>,
  assembly: Pick<SubjectAssembly, 'scopes' | 'dirs'>,
): VariableTarget[] {
  return [
    ...assembly.scopes,
    ...assembly.dirs.flatMap((dir) =>
      dir.scopeId ? [{ scope: 'workdir', scopeId: dir.scopeId }] : [],
    ),
    { scope: 'agent', scopeId: agent.id },
  ];
}

/** Where a run's skills come from, the agent's first so its own win a shared slug. */
export function skillTargets(
  agent: Pick<Agent, 'id'>,
  assembly: Pick<SubjectAssembly, 'scopes' | 'dirs'>,
): SkillTarget[] {
  return [
    { scope: 'agent', scopeId: agent.id },
    ...assembly.scopes,
    ...assembly.dirs.flatMap((dir) =>
      dir.scopeId ? [{ scope: 'workdir', scopeId: dir.scopeId }] : [],
    ),
  ];
}

function fingerprint(
  agent: Agent,
  entry: RunnerModelEntry,
  layers: Pick<BriefLayers, 'system' | 'agent'>,
  skills: readonly { readonly slug: string; readonly hash: string }[],
): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        entry.tool,
        entry.model,
        agent.instructions,
        layers.system,
        layers.agent,
        skills.map((skill) => [skill.slug, skill.hash]),
      ]),
    )
    .digest('hex');
}

/** The brief of a run on a subject, as the claim renders it; the preview renders it the same way. */
export interface RenderedBrief {
  readonly layers: BriefLayers;
  readonly turn: string;
  readonly prompt: string;
}

/** The brief for `assembly`, with the skills a run would get. */
export function briefOf(
  agent: Agent,
  assembly: SubjectAssembly,
  skills: readonly {
    readonly slug: string;
    readonly name: string;
    readonly description: string;
  }[],
  cli: string,
  appName: string,
): RenderedBrief {
  const rendered = renderBrief({
    agentName: agent.name,
    subject: { noun: assembly.subject.noun, key: assembly.subject.key },
    task: assembly.task,
    context: assembly.context,
    instructions: agent.instructions,
    dirs: payloadDirs(assembly.dirs),
    skills,
    cli,
    appName,
    ...(assembly.guidance ? { guidance: assembly.guidance } : {}),
  });
  const layers =
    assembly.system === undefined
      ? rendered
      : { ...rendered, system: assembly.system };
  const turn = assembly.turn.previousSummary
    ? `${assembly.turn.prompt}\n\nWhat earlier runs on this already did:\n\n${assembly.turn.previousSummary}`
    : assembly.turn.prompt;
  return { layers, turn, prompt: joinBrief(layers) };
}

/** What a claim produces: the payload, the run's requirements and directories, and the brief's fingerprint. */
interface Assembled {
  readonly payload: RunPayload;
  readonly fingerprint: string;
  readonly requires: readonly RunnerFeature[];
  readonly directoryKey: string | null;
  readonly entry: RunnerModelEntry;
  /** The repositories the runner asks credentials for on demand (`RunGit.onDemand`). */
  readonly gitOnDemand: readonly string[];
}

/** Whether `runner` asks for repository credentials on demand rather than taking them with the claim. */
export function asksCredentialsOnDemand(
  runner: Pick<Runner, 'features'>,
): boolean {
  return runner.features.includes('gitCredentials');
}

const DIRECTORY_KEY_SEPARATOR = '\n';

/** The directories a run holds on its runner, as stored in `agRuns.directoryKey`. */
function directoryKeyOf(
  runnerId: string,
  dirs: readonly WorkspaceDir[],
): string | null {
  const paths = dirs
    .filter((dir) => dir.kind === 'directory')
    .map((dir) => `${runnerId}:${dir.path}`);
  return paths.length > 0 ? paths.join(DIRECTORY_KEY_SEPARATOR) : null;
}

/** Whether another run held by the runner works in any of `key`'s directories. */
async function directoryBusy(
  conn: DatabaseConnection,
  runnerId: string,
  runId: string,
  key: string,
): Promise<boolean> {
  const wanted = new Set(key.split(DIRECTORY_KEY_SEPARATOR));
  const held = await runsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('runnerId').eq(runnerId),
        f.string('id').ne(runId),
        f.or(ACTIVE.map((status) => f.string('status').eq(status))),
      ]),
  });
  return held.some((run) =>
    (run.directoryKey ?? '')
      .split(DIRECTORY_KEY_SEPARATOR)
      .some((part) => part !== '' && wanted.has(part)),
  );
}

/** Resolve omitted subject input in the claim transaction, keeping it in the audit history. */
async function settleClaimInputs(
  conn: DatabaseConnection,
  pending: readonly InputRecord[],
  effective: readonly RunInput[],
  now: string,
): Promise<void> {
  const ids = new Set(effective.map((input) => input.id));
  await dropInputs(
    conn,
    pending.filter((input) => !ids.has(input.id)).map((input) => input.id),
    now,
  );
  await markDelivered(
    conn,
    pending.filter((input) => ids.has(input.id)),
    now,
  );
}

export function createClaimService(deps: ClaimDeps): ClaimService {
  const { tx, clock } = deps;

  /** Database reads only; used by the actual claim and ordered-model diagnostics. */
  async function assemblyCompatibility(
    conn: DatabaseConnection,
    run: Run,
    agent: Agent,
    runner: Runner,
    assembly: SubjectAssembly,
  ): Promise<'ready' | 'incompatible' | 'restricted'> {
    if (
      !isProtocolSupported(runner.protocolVersion) ||
      (assembly.workspaceKey && !supportsWorkspaceKey(runner))
    )
      return 'incompatible';
    const skills = await deps.skills.forRun(
      conn,
      skillTargets(agent, assembly),
      run.id,
    );
    const targets = variableTargets(agent, assembly);
    const names = await deps.variables.namesOf(conn, targets);
    if (
      !covers(runner.features, [
        ...run.requires,
        ...payloadRequires(
          payloadDirs(assembly.dirs),
          skills.length,
          names.length,
          Boolean(assembly.workspaceKey),
        ),
      ])
    )
      return 'incompatible';
    if (
      !fitsActor(runner, agent, run.actorUserId, run.requires) ||
      !policyAllowsSubject(runner.policy, assembly.subject.key) ||
      assembly.dirs.some(
        (dir) =>
          (dir.kind === 'repo' && !policyAllowsRepo(runner.policy, dir.url)) ||
          (dir.kind === 'directory' && dir.runnerId !== runner.id),
      )
    )
      return 'restricted';
    if (
      runner.trust !== 'team' &&
      (await deps.variables.teamOnly(conn, targets)).length > 0
    )
      return 'restricted';
    return 'ready';
  }

  async function selectionFacts(
    conn: DatabaseConnection,
    run: Run,
    agent: Agent,
    requirePolicy = true,
    trust?: 'team' | 'personal',
  ): Promise<ModelSelectionWait | null> {
    const policy = await deps.selectionPolicies?.forRun(conn, run);
    if ((requirePolicy && !policy) || !deps.runners) return null;
    const now = clock.now();
    const start = queueStart(run);
    const registered = (await deps.runners.all(conn)).filter(
      (runner) =>
        !trust ||
        (trust === 'team' ? runner.trust === 'team' : runner.trust !== 'team'),
    );
    const binding = deps.subjects.get(run.subject.kind);
    if (!binding)
      throw new Error(`No context provider for ${run.subject.kind}.`);
    const inputs = (await pendingInputs(conn, run.id)).map(toInput);
    const active = await countActive(conn, 'agentId', agent.id);
    const sameWork =
      (
        await runsOfKey(
          conn,
          {
            agentId: agent.id,
            subjectKind: run.subject.kind,
            subjectId: run.subject.id,
            threadScope: run.threadScope,
          },
          ACTIVE,
        )
      ).length > 0;
    const entries: ModelSelectionWait['entries'][number][] = [];
    for (const entry of agent.modelEntries) {
      const single = { ...agent, modelEntries: [entry] };
      const candidates = registered.filter(
        (runner) => runner.status !== 'revoked',
      );
      const connected = candidates.filter(
        (runner) =>
          (runner.status === 'online' ||
            runner.status === 'upgrade_required') &&
          runner.lastSeenAt !== null &&
          new Date(runner.lastSeenAt).getTime() + TIMINGS.offlineAfterMs >
            now.getTime(),
      );
      const installed = connected.filter((runner) =>
        runner.tools.some((tool) => tool.kind === entry.tool),
      );
      const usable = installed.filter((runner) => runsEntry(runner, entry));
      const online = usable.filter(
        (runner) =>
          runner.trust === 'team' || runner.ownerUserId === run.actorUserId,
      );
      const compatible: Runner[] = [];
      const loads: ModelSelectionWait['entries'][number]['runners'][number][] =
        [];
      let unknown = false;
      let incompatible = false;
      let ready = false;
      let directoryBlocked = false;
      for (const runner of online) {
        if (
          !isProtocolSupported(runner.protocolVersion) ||
          runner.status === 'upgrade_required'
        ) {
          incompatible = true;
          loads.push({
            name: runner.name,
            ownerUserId: runner.ownerUserId,
            reason: 'incompatible',
            lastSeenAt: runner.lastSeenAt,
          });
          continue;
        }
        const assembly = await binding.context
          .assemble(conn, {
            run: run,
            agent,
            runner,
            inputs,
            cli: deps.cli.name,
            appName: deps.app.name,
          })
          .catch(() => null);
        if (!assembly) {
          unknown = true;
          loads.push({
            name: runner.name,
            ownerUserId: runner.ownerUserId,
            reason: 'unknown',
            lastSeenAt: runner.lastSeenAt,
          });
          continue;
        }
        const reason = await assemblyCompatibility(
          conn,
          run,
          single,
          runner,
          assembly,
        );
        if (reason !== 'ready') {
          incompatible ||= reason === 'incompatible';
          loads.push({
            name: runner.name,
            ownerUserId: runner.ownerUserId,
            reason,
            lastSeenAt: runner.lastSeenAt,
          });
          continue;
        }
        const requiredVariables = await deps.variables.passthroughOf(
          conn,
          variableTargets(single, assembly),
        );
        if (requiredVariables.length > 0 && runner.variables == null) {
          unknown = true;
          continue;
        }
        if (requiredVariables.some((name) => !runner.variables?.includes(name)))
          continue;
        compatible.push(runner);
        const byTool = await runsHeldByTool(conn, runner.id);
        const used = await deps.slotsUsed(conn, runner.id);
        const directory = directoryKeyOf(runner.id, payloadDirs(assembly.dirs));
        const blockedDirectory =
          directory !== null &&
          (await directoryBusy(conn, runner.id, run.id, directory));
        directoryBlocked ||= blockedDirectory;
        const hasRoom =
          !runner.draining &&
          (runner.globalFree ?? 1) > 0 &&
          used < runner.slots &&
          (byTool[entry.tool] ?? 0) < toolLimit(runner, entry.tool) &&
          (runner.toolLoad?.[entry.tool]?.free ?? 1) > 0 &&
          !blockedDirectory;
        ready ||= hasRoom && runner.globalFree !== undefined;
        if (hasRoom && runner.globalFree === undefined) unknown = true;
        loads.push({
          name: runner.name,
          ownerUserId: runner.ownerUserId,
          reason: hasRoom
            ? runner.globalFree === undefined
              ? 'unknown'
              : 'ready'
            : runner.draining
              ? runner.draining
              : blockedDirectory
                ? 'restricted'
                : 'busy',
          lastSeenAt: runner.lastSeenAt,
          used,
          limit: runner.slots,
          toolUsed: byTool[entry.tool] ?? 0,
          toolLimit: toolLimit(runner, entry.tool),
          reportedFree: runner.toolLoad?.[entry.tool]?.free,
          reportedTotalFree: runner.globalFree,
        });
      }
      let reason: ModelWaitReason = compatible.length
        ? ready
          ? 'ready'
          : 'busy'
        : online.length
          ? incompatible
            ? 'incompatible'
            : 'restricted'
          : usable.length
            ? 'noSharedRunner'
            : installed.length
              ? 'toolUnavailable'
              : connected.length
                ? 'toolNotInstalled'
                : 'offline';
      if (directoryBlocked && !ready) reason = 'restricted';
      if (
        !ready &&
        compatible.length > 0 &&
        loads.every(
          (runner) =>
            runner.reason === 'updatePending' || runner.reason === 'pruning',
        )
      )
        reason = loads.some((runner) => runner.reason === 'updatePending')
          ? 'updatePending'
          : 'pruning';
      if (
        unknown &&
        !ready &&
        !loads.some((runner) => runner.reason === 'busy')
      )
        reason = 'unknown';
      if (compatible.length && sameWork) reason = 'sameWorkActive';
      else if (compatible.length && active >= agent.maxConcurrentRuns)
        reason = 'concurrencyFull';
      else if (start > now.getTime()) reason = 'delayed';
      entries.push({
        tool: entry.tool,
        model: entry.model,
        reason,
        compatibleCount: compatible.length,
        blockers: [
          ...(unknown ? ['unknown' as const] : []),
          ...new Set(
            loads
              .map((runner) => runner.reason)
              .filter(
                (reason): reason is ModelWaitReason =>
                  reason !== undefined && reason !== 'ready',
              ),
          ),
        ],
        runners: loads,
      });
    }
    return {
      queueEnteredAt: new Date(start).toISOString(),
      fallbackAfterSeconds: policy?.fallbackAfterSeconds ?? 0,
      sampledAt: now.toISOString(),
      entries,
    };
  }

  async function assemble(
    { conn }: Tx,
    run: RunRecord,
    agent: Agent,
    runner: Runner,
    inputs: readonly RunInput[],
    leaseExpiresAt: string,
    prepared: Prepared,
    entry: RunnerModelEntry,
  ): Promise<Assembled> {
    const binding = deps.subjects.get(run.subjectKind);
    if (!binding)
      throw new Error(
        `No context provider is registered for subjects of kind "${run.subjectKind}".`,
      );
    const view: Run = toRun(run);
    const claim: ClaimContext = {
      run: view,
      agent,
      runner,
      inputs,
      cli: deps.cli.name,
      appName: deps.app.name,
    };
    const assembly = await binding.context.assemble(
      conn,
      claim,
      prepared.get('subject'),
    );
    // workspace.key is required for coordinating runs; old runners must not silently ignore it.
    if (
      (await assemblyCompatibility(
        conn,
        toRun(run),
        agent,
        runner,
        assembly,
      )) === 'incompatible'
    )
      throw new NotForThisRunner();
    inputs = assembly.inputs ?? inputs;
    const effectiveClaim = { ...claim, inputs };
    // Its owner's local policy keeps this runner off the subject, or off one of the repositories: another runner takes
    // the run.
    if (
      !policyAllowsSubject(runner.policy, assembly.subject.key) ||
      assembly.dirs.some(
        (dir) =>
          dir.kind === 'repo' && !policyAllowsRepo(runner.policy, dir.url),
      )
    )
      throw new NotForThisRunner();
    // A directory on another runner: that runner takes the run.
    if (
      assembly.dirs.some(
        (dir) => dir.kind === 'directory' && dir.runnerId !== runner.id,
      )
    )
      throw new NotForThisRunner();
    const dirs = payloadDirs(assembly.dirs);
    const directoryKey = directoryKeyOf(runner.id, dirs);
    if (
      directoryKey !== null &&
      (await directoryBusy(conn, runner.id, run.id, directoryKey))
    )
      throw new NotForThisRunner();

    const skills = await deps.skills.forRun(
      conn,
      skillTargets(agent, assembly),
      run.id,
    );
    const variables = variableTargets(agent, assembly);
    const names = await deps.variables.namesOf(conn, variables);
    const requires = cleanList([
      ...view.requires,
      ...payloadRequires(
        dirs,
        skills.length,
        names.length,
        Boolean(assembly.workspaceKey),
      ),
    ]) as RunnerFeature[];
    if (!covers(runner.features, requires)) throw new NotForThisRunner();
    // A variable for team runners only keeps a personal runner off the run.
    if (names.length > 0 && runner.trust !== 'team') {
      const teamOnly = await deps.variables.teamOnly(conn, variables);
      if (teamOnly.length > 0) throw new TeamRunnersOnly(teamOnly);
    }
    const env =
      names.length > 0
        ? await deps.variables.forRun(conn, variables, {
            runId: run.id,
            runnerId: runner.id,
          })
        : [];
    // Variables taken from the runner: names only. A runner that does not provide one fails the run while preparing
    // it, saying how to provide it; runners are not chosen by them.
    const passthrough = await deps.variables.passthroughOf(conn, variables);
    const nowText = clock.now().toISOString();
    const clean = await consumeReset(
      conn,
      { kind: run.subjectKind, id: run.subjectId },
      run.id,
      nowText,
    );

    const session = await sessionsRepo(conn).findOne({
      filter: {
        agentId: run.agentId,
        runnerId: runner.id,
        subjectKind: run.subjectKind,
        subjectId: run.subjectId,
        threadScope: run.threadScope,
      },
    });
    const token = await mintRunToken(conn, deps, run, runner.id);
    const git = await repoAccessFor(
      conn,
      deps.repoAccess,
      {
        claim,
        repos: dirs.filter(
          (dir): dir is Extract<WorkspaceDir, { kind: 'repo' }> =>
            dir.kind === 'repo',
        ),
        onDemand: asksCredentialsOnDemand(runner),
      },
      prepared,
    );
    deps.secrets?.remember(runSecretsKey(run.id), [
      ...env.map((variable) => variable.value),
      token.value,
      ...(git?.credentials ?? []).map((credential) => credential.password),
    ]);
    const last = await eventsRepo(conn).findOne({
      filter: { runId: run.id },
      sort: (sort) => sort.field('seq').desc(),
    });
    const brief = briefOf(
      agent,
      await withSections(
        conn,
        deps.sections,
        effectiveClaim,
        assembly,
        prepared,
      ),
      skills,
      deps.cli.name,
      deps.app.name,
    );
    const briefFingerprint = fingerprint(agent, entry, brief.layers, skills);
    const resume =
      !run.freshSession &&
      !clean &&
      session &&
      !session.poisoned &&
      session.fingerprint === briefFingerprint;
    // Mounts only for a runner that places them; their hashes stay out of the fingerprint, and a resumed session
    // hears what changed in them in its turn instead.
    const { mounts, resumeNotes } = runner.features.includes('mounts')
      ? await mountsFor(
          conn,
          deps.mounts,
          {
            claim: effectiveClaim,
            assembly,
            session: resume ? 'resume' : 'fresh',
            sessionKey: sessionKeyOf(view),
          },
          prepared,
        )
      : { mounts: [], resumeNotes: [] };
    const sessionNote = resume ? assembly.turn.resumed : assembly.turn.fresh;
    const turn = [
      brief.turn,
      ...(toExecutions(run.executionHistory).find(
        (execution) => execution.attempt === Number(run.attempt) - 1,
      )?.failureReason === 'runnerUpgrade'
        ? [
            'The previous attempt was interrupted by a runner upgrade. Continue from the current state.',
          ]
        : []),
      ...resumeNotes,
      ...(sessionNote ? [sessionNote] : []),
    ].join('\n\n');
    await saveBrief(conn, () => deps.ids.next(), {
      runId: run.id,
      attempt: Number(run.attempt),
      layers: brief.layers,
      turn,
      prompt: brief.prompt,
      createdAt: nowText,
    });
    const payload: RunPayload = {
      run: {
        id: run.id,
        attempt: Number(run.attempt),
        maxAttempts: Number(run.maxAttempts),
        priority: Number(run.priority),
        createdAt: run.createdAt,
        leaseExpiresAt,
        requires,
        firstSeq: (last ? Number(last.seq) : 0) + 1,
        acceptedFailures: Object.keys(ANNOUNCED_FAILURES),
      },
      app: deps.app,
      subject: {
        key: assembly.subject.key,
        ...(assembly.subject.title ? { title: assembly.subject.title } : {}),
        url: assembly.subject.url,
      },
      tool: {
        kind: entry.tool,
        ...(entry.model ? { model: entry.model } : {}),
        ...(entry.effort ? { effort: entry.effort } : {}),
        policy: toolPolicyFor(agent.toolPolicy),
      },
      prompt: {
        system: brief.prompt,
        turn,
        session: resume ? 'resume' : 'fresh',
        ...(resume ? { resumeSessionId: session.sessionId } : {}),
      },
      inputs,
      workspace: {
        sessionScope: run.threadScope,
        dirs,
        env,
        ...(passthrough.length > 0 ? { passthrough } : {}),
        ...(clean ? { clean: true } : {}),
        ...(assembly.workspaceKey ? { key: assembly.workspaceKey } : {}),
        ...(assembly.readOnly ? { readOnly: true } : {}),
        ...(git ? { git } : {}),
      },
      skills,
      ...(mounts.length > 0 ? { mounts } : {}),
      cli: {
        name: deps.cli.name,
        package: await cliPackageFor(
          deps.cli.name,
          deps.cli.package,
          deps.dist,
          runner,
        ),
        credential: {
          file: deps.cli.credentialFile,
          content: {
            token: token.value,
            runId: run.id,
            manifestUrl: deps.manifestUrl,
            expiresAt: token.expiresAt,
          },
        },
      },
      agent: { id: agent.id, name: agent.name },
    };
    return {
      payload,
      fingerprint: briefFingerprint,
      requires,
      directoryKey,
      entry,
      gitOnDemand: git?.onDemand ?? [],
    };
  }

  /**
   * Notes on a queued run which of its variables kept a personal runner off it, and tells its actor and owner the first
   * time; nothing when that is what it says already.
   */
  async function noteTeamOnly(
    candidate: RunRecord,
    variables: readonly VariableRef[],
  ): Promise<void> {
    const same = (value: unknown) =>
      JSON.stringify(variableRefs(value)) === JSON.stringify(variables);
    if (same(candidate.teamOnlyVariables)) return;
    await tx.run(async (unit) => {
      const run = await findRunRecord(unit.conn, candidate.id);
      if (!run || run.status !== 'queued' || same(run.teamOnlyVariables))
        return;
      await runsRepo(unit.conn).updateMany({
        filter: (f) =>
          f.and([f.string('id').eq(run.id), f.string('status').eq('queued')]),
        values: { teamOnlyVariables: variables.map((each) => ({ ...each })) },
      });
      unit.emit({ type: 'run.changed', runId: run.id, status: 'queued' });
      if (variableRefs(run.teamOnlyVariables).length === 0)
        unit.emit({
          type: 'notice',
          notice: {
            key: `run-secrets:${run.id}`,
            type: 'run_secrets_not_allowed',
            userIds: [
              ...new Set(
                [run.actorUserId, run.ownerUserId].filter((id): id is string =>
                  Boolean(id),
                ),
              ),
            ],
            subject: { kind: 'run', id: run.id, label: run.id },
            title: 'A run waits for a team runtime',
            body: `Some of its variables are for team runtimes only: ${describeVariables(variables)}.`,
            params: {
              runId: run.id,
              agentId: run.agentId,
              variables: describeVariables(variables),
            },
          },
        });
    });
  }

  type ConsentPlan =
    | { readonly kind: 'none' }
    | { readonly kind: 'refresh'; readonly run: RunRecord }
    | { readonly kind: 'withdraw'; readonly rootId: string }
    | {
        readonly kind: 'cancel';
        readonly run: RunRecord;
        readonly detail: string;
      }
    | {
        readonly kind: 'request';
        readonly run: RunRecord;
        readonly root: RunRecord;
        readonly input: InputRecord;
      };

  /** What reconciling a comment run would change, read without writing: most runs need nothing. */
  async function planCommentConsent(
    conn: DatabaseConnection,
    runId: string,
  ): Promise<ConsentPlan> {
    const none = { kind: 'none' } as const;
    const run = await findRunRecord(conn, runId);
    if (!run?.commentRootRunId) return none;
    const root = await findRunRecord(conn, run.commentRootRunId);
    if (!root) return none;
    if (run.status !== 'queued') {
      const pending = await runRequestsRepo(conn).findMany({
        filter: {
          commentRootRunId: root.id,
          commentRunId: run.id,
          purpose: 'personalRunner',
          status: 'pending',
        },
        limit: 1,
      });
      return pending.length > 0 ? { kind: 'withdraw', rootId: root.id } : none;
    }
    if (!(await queuedIdentityCurrent(conn, deps, run)))
      return { kind: 'refresh', run };
    if (!(await currentCommentOwner(conn, deps.subjects, root)))
      return {
        kind: 'cancel',
        run,
        detail: 'The comment belongs to an earlier owner assignment.',
      };
    if (
      root.commentExecution === 'requester' ||
      run.actorUserId !== root.ownerUserId
    )
      return none;
    const { decision } = await commentConsent(conn, root);
    if (decision === 'confirmed' || decision === 'pending') return none;
    if (await commentFromOwner(conn, root)) return none;
    if (decision === 'rejected')
      return {
        kind: 'cancel',
        run,
        detail: 'The comment personal runner authorization is no longer valid.',
      };
    const agent = await findAgent(conn, run.agentId);
    if (!agent) return none;
    const team = await selectionFacts(conn, toRun(run), agent, false, 'team');
    if (
      !team ||
      team.entries.some(
        (e) =>
          e.compatibleCount > 0 ||
          e.reason === 'unknown' ||
          e.blockers?.includes('unknown'),
      )
    )
      return none;
    const personal = await selectionFacts(
      conn,
      toRun(run),
      agent,
      false,
      'personal',
    );
    if (!personal?.entries.some((e) => e.compatibleCount > 0)) return none;
    const sourceInputs = await inputsRepo(conn).findMany({
      filter: { runId: root.id },
      sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
    });
    const input =
      sourceInputs.find(
        (input) =>
          input.type === 'comment' &&
          jsonObject(input.payload).commentSourceSnapshot === true,
      ) ?? sourceInputs.find((input) => input.type === 'comment');
    return input ? { kind: 'request', run, root, input } : none;
  }

  /**
   * Brings a comment run's consent up to date. It takes no lock of its own: callers that may create a request hold
   * the run's agent row (enqueue, retry and the sweeper do), which serializes the duplicate check in insertRunRequest
   * with every other enqueue and claim of that agent. Everything else is a guarded update.
   */
  async function reconcileCommentConsent(
    unit: Tx,
    runId: string,
  ): Promise<void> {
    let plan = await planCommentConsent(unit.conn, runId);
    if (plan.kind === 'refresh') {
      if (!(await refreshQueuedIdentity(unit, deps, plan.run))) return;
      plan = await planCommentConsent(unit.conn, runId);
    }
    switch (plan.kind) {
      case 'withdraw':
        await withdrawCommentRequests(
          unit,
          plan.rootId,
          clock.now().toISOString(),
          runId,
        );
        return;
      case 'cancel':
        await finishRun(unit, deps, plan.run, {
          status: 'cancelled',
          reason: null,
          detail: plan.detail,
        });
        return;
      case 'request': {
        const { run, root, input } = plan;
        await insertRunRequest(unit, deps, {
          purpose: 'personalRunner',
          commentRootRunId: root.id,
          commentRunId: run.id,
          commentOwnerKey: root.commentOwnerKey ?? null,
          agentId: run.agentId,
          subject: toRun(run).subject,
          threadScope: run.threadScope,
          // The plan only asks for runs acting as the chain's owner.
          responsibleUserId: run.actorUserId,
          requestedByUserId: root.requestedByUserId ?? root.actorUserId,
          ownerUserId: run.actorUserId,
          priority: Number(run.priority),
          requires: toRun(run).requires,
          fireAt: run.availableAt,
          maxAttempts: Number(run.maxAttempts),
          input: toInput(input),
        });
        return;
      }
      default:
        return;
    }
  }

  /**
   * Whether this runner may take this candidate under comment consent, read outside any transaction. Immutable facts
   * settle most candidates without a query: no comment chain, work run as the commenter, or work not run as the
   * chain's owner. The rest read the chain's requests once. A decision never needs a lock: confirmation is final,
   * and rejection or Run as me end the chain's queued runs, which the claim's guarded `status = 'queued'` update sees.
   */
  async function commentConsentFor(
    conn: DatabaseConnection,
    runner: Runner,
    run: RunRecord,
  ): Promise<{
    readonly allowed: boolean;
    readonly confirmedByUserId: string | null;
  }> {
    const allowed = { allowed: true, confirmedByUserId: null } as const;
    const refused = { allowed: false, confirmedByUserId: null } as const;
    if (!run.commentRootRunId || run.commentExecution === 'requester')
      return allowed;
    const root = await findRunRecord(conn, run.commentRootRunId);
    if (!root || root.commentRootRunId !== root.id) return refused;
    if (
      root.commentExecution === 'requester' ||
      run.actorUserId !== root.ownerUserId
    )
      return allowed;
    const { decision, confirmation } = await commentConsent(conn, root);
    if (decision === 'rejected') return refused;
    if (decision === 'confirmed')
      return {
        allowed: true,
        confirmedByUserId: confirmation?.settledById ?? null,
      };
    if (runner.trust === 'team') return allowed;
    return (await commentFromOwner(conn, root)) ? allowed : refused;
  }

  /** Withdraws the request a team claim made obsolete, writing only when one is pending. */
  async function withdrawIfPending(rootId: string, runId: string) {
    try {
      const pending = await runRequestsRepo(tx.read()).findMany({
        filter: {
          commentRootRunId: rootId,
          commentRunId: runId,
          purpose: 'personalRunner',
          status: 'pending',
        },
        limit: 1,
      });
      if (pending.length > 0)
        await tx.run((unit) =>
          withdrawCommentRequests(
            unit,
            rootId,
            clock.now().toISOString(),
            runId,
          ),
        );
    } catch (error) {
      deps.onClaimFailure?.(runId, error);
    }
  }

  async function admit(
    unit: Tx,
    run: RunRecord,
    agent: Agent,
    runner: Runner | null,
    inputs: readonly RunInput[],
    prepared?: unknown,
  ): Promise<boolean> {
    const rejection = await deps.subjects.get(run.subjectKind)?.context.admit?.(
      unit.conn,
      {
        run: toRun(run),
        agent,
        runner,
        inputs,
        cli: deps.cli.name,
        appName: deps.app.name,
      },
      prepared,
    );
    if (!rejection) return true;
    await finishRun(unit, deps, run, {
      status: 'cancelled',
      reason: null,
      detail: `${rejection.reason}${rejection.detail ? `: ${rejection.detail}` : ''}`,
    });
    return false;
  }

  async function attempt(
    runner: Runner,
    agent: Agent,
    candidate: RunRecord,
    reported: ToolRoom,
  ): Promise<Attempt> {
    const conn = tx.read();
    // Rules that do not depend on who the run acts as come first, and settle the rest of the pass: an agent at its
    // limit is checked once per poll, not once per queued run.
    if ((await deps.slotsUsed(conn, runner.id)) >= runner.slots)
      return { kind: 'full', scope: 'runner' };
    if (
      (await countActive(conn, 'agentId', agent.id)) >= agent.maxConcurrentRuns
    )
      return { kind: 'full', scope: 'agent' };
    // Repair pre-upgrade queued work before even checking personal runner ownership. Reading first keeps a poll over
    // current work free of transactions and row locks; only work whose identity changed is written.
    if (
      deps.subjects.get(candidate.subjectKind)?.actsAs &&
      !(await queuedIdentityCurrent(conn, deps, candidate))
    ) {
      const current = await tx.run(async (unit) => {
        await lockAgentForClaim(unit.conn, agent.id, clock.now().toISOString());
        const run = await findRunRecord(unit.conn, candidate.id);
        return run?.status === 'queued'
          ? refreshQueuedIdentity(unit, deps, run)
          : null;
      });
      if (!current) return { kind: 'skipped' };
      candidate = current;
    }
    // Avoid assembling or asking authorization when a cheap claim rule already rules this work out.
    if (
      !fits(runner, agent, candidate) ||
      (await runsOfKey(conn, candidate, ACTIVE)).length > 0
    )
      return { kind: 'skipped' };
    const consent = await commentConsentFor(conn, runner, candidate);
    if (!consent.allowed) return { kind: 'skipped' };
    // Before the transaction: on SQLite it holds the only connection, so the providers read what else they need now.
    const prepared = new Map(
      await prepareExtensions(
        toRun(candidate),
        deps.sections,
        deps.mounts,
        (error) => deps.onClaimFailure?.(candidate.id, error),
        deps.repoAccess,
        { onDemand: asksCredentialsOnDemand(runner) },
      ),
    );
    const subjectContext = deps.subjects.get(candidate.subjectKind)?.context;
    if (subjectContext?.prepare) {
      try {
        prepared.set('subject', await subjectContext.prepare(toRun(candidate)));
      } catch (error) {
        deps.onClaimFailure?.(candidate.id, error);
      }
    }
    let taken: RunPayload | null;
    try {
      taken = await tx.run(async (unit): Promise<RunPayload | null> => {
        const { conn } = unit;
        const now = clock.now();
        const nowText = now.toISOString();
        await lockAgentForClaim(conn, agent.id, nowText);
        const queuedRun = await findRunRecord(conn, candidate.id);
        if (!queuedRun || queuedRun.status !== 'queued') return null;
        const identity = await refreshQueuedIdentity(unit, deps, queuedRun);
        // Providers were prepared for the candidate's identity outside this transaction.
        if (!identity || identity.actorUserId !== candidate.actorUserId)
          return null;
        if (
          (await countActive(conn, 'agentId', agent.id)) >=
          agent.maxConcurrentRuns
        )
          return null;
        // Slots are shared with the jobs the runner holds.
        if ((await deps.slotsUsed(conn, runner.id)) >= runner.slots)
          return null;
        // The first of the agent's tools with room, by its limit here and by what the runner said it can take.
        const byTool = await runsHeldByTool(conn, runner.id);
        const current = await findRunRecord(conn, candidate.id);
        if (
          !current ||
          current.status !== 'queued' ||
          (current.availableAt &&
            new Date(current.availableAt).getTime() > now.getTime())
        )
          return null;
        const entry = pickOpenEntry(
          runner,
          agent,
          (tool) =>
            (byTool[tool] ?? 0) < toolLimit(runner, tool) && reported.has(tool),
        );
        if (!entry) return null;
        const busy = await runsOfKey(conn, candidate, ACTIVE);
        if (busy.length > 0) return null;

        const leaseExpiresAt = later(now, TIMINGS.leaseMs);
        const claimed = await runsRepo(conn).updateMany({
          filter: (f) =>
            f.and([
              f.string('id').eq(candidate.id),
              f.string('status').eq('queued'),
              f.string('actorUserId').eq(candidate.actorUserId),
            ]),
          values: {
            status: 'dispatched',
            failureReason: null,
            failureDetail: null,
            runnerId: runner.id,
            // Brief providers observe this reservation inside the claim transaction.
            // Replace a previous attempt's tool before computing the roster.
            tool: entry.tool,
            leaseExpiresAt,
            dispatchedAt: nowText,
            lastActivityAt: nowText,
            availableAt: null,
            updatedAt: nowText,
            ...(consent.confirmedByUserId
              ? { confirmedByUserId: consent.confirmedByUserId }
              : {}),
          },
        });
        if (claimed.updatedCount !== 1) return null;
        const run = (await findRunRecord(conn, candidate.id))!;
        const pending = (await pendingInputs(conn, run.id)).filter(
          (input) =>
            !run.commentRootRunId ||
            input.type !== 'comment' ||
            jsonObject(input.payload).commentRootRunId === run.commentRootRunId,
        );
        let assembled: Assembled;
        let selectionSnapshot: RunExecutionSnapshot['selection'];
        try {
          if (
            !(await admit(
              unit,
              run,
              agent,
              runner,
              pending.map(toInput),
              prepared.get('subject'),
            ))
          )
            return null;
          // Admission must precede preflight assembly: a missing or obsolete
          // subject is cancelled normally, rather than counted as setup failure.
          const selection = await selectionFacts(conn, toRun(current), agent);
          const elapsed = Math.max(
            0,
            (now.getTime() - queueStart(toRun(current))) / 1000,
          );
          const preferredAvailable =
            (selection?.entries[0]?.compatibleCount ?? 0) > 0 ||
            selection?.entries[0]?.reason === 'unknown' ||
            selection?.entries[0]?.blockers?.includes('unknown') === true;
          const chosenIndex = agent.modelEntries.indexOf(entry);
          if (selection && chosenIndex > 0) {
            // Throw to roll back the provisional dispatch; the original run keeps
            // waiting for its first choice without consuming an attempt or token.
            if (preferredAvailable && elapsed < selection.fallbackAfterSeconds)
              throw new NotForThisRunner();
            selectionSnapshot = {
              reason: preferredAvailable
                ? 'preferredQueued'
                : 'preferredUnavailable',
              preferredTool: agent.modelEntries[0].tool,
              preferredModel: agent.modelEntries[0].model,
              queueEnteredAt: selection.queueEnteredAt,
              waitedSeconds: elapsed,
            };
          }
          assembled = await assemble(
            unit,
            run,
            agent,
            runner,
            pending.map(toInput),
            leaseExpiresAt,
            prepared,
            entry,
          );
        } catch (error) {
          if (error instanceof NotForThisRunner) throw error;
          throw new AssemblyError(
            error instanceof Error ? error.message : String(error),
            error,
          );
        }
        await settleClaimInputs(
          conn,
          pending,
          assembled.payload.inputs,
          nowText,
        );
        await runsRepo(conn).updateMany({
          filter: { id: run.id },
          values: {
            payloadFingerprint: assembled.fingerprint,
            requires: [...assembled.requires],
            directoryKey: assembled.directoryKey,
            tool: assembled.entry.tool,
            executionHistory: executionHistory(run, {
              ...(selectionSnapshot ? { selection: selectionSnapshot } : {}),
              attempt: Number(run.attempt),
              runnerId: runner.id,
              runnerName: runner.name,
              runnerOwnerUserId: runner.ownerUserId,
              runnerOwnerName: runner.ownerUserId
                ? ((await deps.people?.names(conn, [runner.ownerUserId]))?.get(
                    runner.ownerUserId,
                  ) ?? runner.ownerName)
                : null,
              runnerTrust: runner.trust,
              tool: assembled.entry.tool,
              toolVersion:
                runner.tools.find((tool) => tool.kind === assembled.entry.tool)
                  ?.version ?? null,
              modelService: null,
              model: assembled.entry.model,
              actualModels: [],
              effort: assembled.entry.effort ?? null,
              dispatchedAt: nowText,
              finishedAt: null,
              failureReason: null,
            }),
            modelService: null,
            model: assembled.entry.model,
            effort: assembled.entry.effort ?? null,
            teamOnlyVariables: null,
            gitCredentialUrls:
              assembled.gitOnDemand.length > 0
                ? [...assembled.gitOnDemand]
                : null,
          },
        });
        unit.emit({ type: 'run.changed', runId: run.id, status: 'dispatched' });
        if (variableRefs(candidate.teamOnlyVariables).length > 0)
          unit.emit({
            type: 'notice.cleared',
            notice: {
              type: 'run_secrets_not_allowed',
              subject: { kind: 'run', id: run.id, label: run.id },
            },
          });
        return assembled.payload;
      });
    } catch (error) {
      await discardRepoAccess(candidate, prepared);
      if (error instanceof TeamRunnersOnly) {
        await noteTeamOnly(candidate, error.variables);
        return { kind: 'skipped' };
      }
      throw error;
    }
    if (!taken) {
      await discardRepoAccess(candidate, prepared);
      return { kind: 'skipped' };
    }
    // After the claim commits, never inside it: decisions settle the request before touching runs, so a claim that
    // held its run while waiting for the request could deadlock with them. A request left pending by a crash here is
    // withdrawn by the next reconciliation, and confirming it finds the run no longer waiting.
    if (candidate.commentRootRunId && runner.trust === 'team')
      await withdrawIfPending(candidate.commentRootRunId, candidate.id);
    return { kind: 'claimed', payload: taken };
  }

  async function discardRepoAccess(
    run: RunRecord,
    prepared: Prepared,
  ): Promise<void> {
    for (const provider of deps.repoAccess?.list() ?? []) {
      try {
        await provider.discard?.(
          toRun(run),
          prepared.get(`repo:${provider.key}`),
        );
      } catch (error) {
        deps.onClaimFailure?.(run.id, error);
      }
    }
  }

  /** Counts a failed assembly; the run fails once it has failed too often. */
  async function recordFailure(runId: string, error: AssemblyError) {
    deps.onClaimFailure?.(runId, error.cause);
    await tx.run(async (unit) => {
      const run = await findRunRecord(unit.conn, runId);
      if (!run || run.status !== 'queued') return;
      const failures = Number(run.claimFailures) + 1;
      if (failures >= MAX_CLAIM_FAILURES) {
        await finishRun(unit, deps, run, {
          status: 'failed',
          reason: 'setupFailed',
          detail: error.message,
        });
        return;
      }
      await runsRepo(unit.conn).updateMany({
        filter: { id: runId },
        values: {
          claimFailures: failures,
          failureReason: 'setupFailed',
          failureDetail: error.message.slice(0, 10_000),
        },
      });
    });
  }

  /** Queued runs that may be claimed now, in claim order. */
  async function candidates(): Promise<RunRecord[]> {
    const now = clock.now();
    return runsRepo(tx.read()).findMany({
      filter: (f) =>
        f.and([
          f.string('status').eq('queued'),
          f.or([
            f.date('availableAt').empty(),
            f.date('availableAt').notAfter(now),
          ]),
        ]),
      sort: (sort) => [
        sort.field('priority').asc(),
        sort.field('createdAt').asc(),
        sort.field('id').asc(),
      ],
      limit: CANDIDATES,
    });
  }

  async function claimOne(
    runner: Runner,
    seen: Set<string>,
    reported: ToolRoom,
  ): Promise<RunPayload | null> {
    if (runner.draining) return null;
    const conn = tx.read();
    const queued = await candidates();
    const agents = new Map<string, Agent | null>();
    const full = new Set<string>();
    for (const candidate of queued) {
      if (seen.has(candidate.id) || full.has(candidate.agentId)) continue;
      seen.add(candidate.id);
      if (!agents.has(candidate.agentId))
        agents.set(candidate.agentId, await findAgent(conn, candidate.agentId));
      const agent = agents.get(candidate.agentId);
      if (
        !agent ||
        (!deps.subjects.get(candidate.subjectKind)?.actsAs &&
          !fits(runner, agent, candidate))
      )
        continue;
      // None of its tools has room on the runner's side: the runs behind it may still fit.
      if (!pickOpenEntry(runner, agent, (tool) => reported.has(tool))) continue;
      try {
        const result = await attempt(runner, agent, candidate, reported);
        if (result.kind === 'claimed') return result.payload;
        if (result.kind === 'full') {
          if (result.scope === 'runner') return null;
          // Seen candidates are passed over for good in this claim; unvisited ones stay eligible for the next pass.
          seen.delete(candidate.id);
          full.add(candidate.agentId);
        }
      } catch (error) {
        // Rolled back: the run stays queued for a runner it fits.
        if (error instanceof NotForThisRunner) continue;
        if (!(error instanceof AssemblyError)) throw error;
        await recordFailure(candidate.id, error);
      }
    }
    return null;
  }

  return {
    reconcileCommentConsent,
    async reconcileCommentQueue() {
      const conn = tx.read();
      const queued = await runsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('queued'),
            f.string('commentRootRunId').notEmpty(),
          ]),
        sort: (s) => [s.field('createdAt').asc()],
        limit: 100,
      });
      const pending = await runRequestsRepo(conn).findMany({
        filter: { purpose: 'personalRunner', status: 'pending' },
        limit: 100,
      });
      for (const id of new Set([
        ...queued.map((run) => run.id),
        ...pending
          .map((request) => request.commentRunId)
          .filter((id): id is string => Boolean(id)),
      ])) {
        // Read first: a sweep over settled chains opens no transaction at all.
        const plan = await planCommentConsent(conn, id);
        if (plan.kind === 'none') continue;
        await tx.run(async (unit) => {
          if (plan.kind === 'request' || plan.kind === 'refresh')
            await lockAgentForClaim(
              unit.conn,
              plan.run.agentId,
              clock.now().toISOString(),
            );
          await reconcileCommentConsent(unit, id);
        });
      }
    },
    diagnose: (conn, run, agent) => selectionFacts(conn, run, agent, false),
    async selectionWait(runId) {
      const conn = tx.read();
      const run = await findRunRecord(conn, runId);
      if (!run || run.status !== 'queued') return null;
      const agent = await findAgent(conn, run.agentId);
      return agent ? selectionFacts(conn, toRun(run), agent, false) : null;
    },
    async claim(runner, free, tools) {
      if (runner.status !== 'online' || runnerLowOnDisk(runner)) return [];
      if ((await deps.slotsUsed(tx.read(), runner.id)) >= runner.slots)
        return [];
      const payloads: RunPayload[] = [];
      const seen = new Set<string>();
      const limit = Math.min(free, runner.slots);
      const reported = toolRoom(tools);
      while (payloads.length < limit) {
        const payload = await claimOne(runner, seen, reported);
        if (!payload) break;
        payloads.push(payload);
        reported.take(payload.tool.kind);
      }
      return payloads;
    },

    async runSkills(runner, runId) {
      const conn = tx.read();
      const run = await findRunRecord(conn, runId);
      if (!run) throw notFound('Run');
      const agent = await findAgent(conn, run.agentId);
      const binding = deps.subjects.get(run.subjectKind);
      if (!agent || !binding) return [];
      const assembly = await binding.context.assemble(
        conn,
        {
          run: toRun(run),
          agent,
          runner,
          inputs: [],
          cli: deps.cli.name,
          appName: deps.app.name,
        },
        await binding.context.prepare?.(toRun(run)),
      );
      return deps.skills.forRun(conn, skillTargets(agent, assembly), run.id);
    },
  };
}
