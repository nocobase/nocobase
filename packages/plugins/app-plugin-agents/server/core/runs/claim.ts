/**
 * Claiming: handing queued runs to a runner that fits them, within each agent's concurrency limit, one run per
 * (agent, subject, thread) at a time, through the runners' one long-poll (`routes/runners/runner.ts`), which hands
 * out jobs from the same slots. A runner fits a run when it has the agent's
 * tool enabled (on the web), installed and signed in, the agent names no runner or names it, it is shared with the
 * team or belongs to the person who woke the agent, its features cover what the run requires (worked out from the
 * payload: checkouts, directories, skills, secrets), its owner's local policy (`Runner.policy`) lets it take the
 * agent's runs on the run's subject and repositories, and it has a free slot. A working directory that is a directory
 * on one runner pins the run to that runner, one run at a time per directory.
 *
 * A slot is free for a run when the runner's total has room and so does the coding tool it runs with: the tool's limit
 * (`Runner.toolSlots`, never above the total) over the runs of that tool the runner holds here, and what the runner
 * said it can still take of that tool across every application (`ClaimRequest.tools`). The run takes the first of its
 * agent's entries whose tool the runner runs and has room for, so an agent listing two tools runs with the second while
 * the first is full; a run none of whose tools has room is passed over for the runs behind it.
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
 * Runners take only runner agents' runs. Online agents' runs are taken by the application itself (`claimServer`, for the
 * server executor of each instance), through the same guarded update, so two instances never take the same run: the
 * holder is the instance (`server:<instance>`), there is no per-agent or per-holder limit, and the payload is a brief,
 * the run's token and its skills (read in the run's sandbox, `online/sandbox.ts`), without directories, variables or
 * mounts.
 */
import {
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
import { runsTool, toolLimit, type Runner } from '../../../shared/runners.js';
import type { DatabaseConnection } from '@nocobase/db';
import { createHash } from 'node:crypto';

import {
  onlineEntriesOrDefault,
  runnerEntries,
  sameEntry,
  type Agent,
  type OnlineModelEntry,
  type RunnerModelEntry,
} from '../../../shared/agents.js';
import type { BriefLayers } from '../../../shared/briefs.js';
import type { ModelRef } from '../../../shared/models.js';
import type { Run } from '../../../shared/runs.js';
import { later, type Clock } from '../../kernel/clock.js';
import { notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import { runSecretsKey, type SecretMemory } from '../../kernel/redaction.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { cleanList, covers } from '../../kernel/values.js';
import { findAgent, lockAgentForClaim } from '../agents/index.js';
import {
  consultSection,
  type ConsultationService,
  type ConsultTarget,
} from '../consultations/index.js';
import {
  joinBrief,
  onlineSkillsSection,
  renderBrief,
  type BriefSkill,
} from '../brief/index.js';
import { cliPackageFor } from './cli-package.js';
import type { SkillService, SkillTarget } from '../skills/index.js';
import type { VariableService, VariableTarget } from '../variables/index.js';
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
  dialectOf,
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
  runsOfKey,
  runsRepo,
  sessionsRepo,
  toInput,
  toRun,
  type RunRecord,
} from './run.store.js';
import { finishRun, type TransitionDeps } from './transitions.js';
import { consumeReset, saveBrief } from './workspace.store.js';

/** Queued runs looked at per claim, oldest first by priority. */
const CANDIDATES = 50;

/** Who holds the online runs an application instance takes: `server:<instance>`. */
export interface ServerHolder {
  readonly id: string;
}

/** An online run as the server executor takes it: what to tell the model, and the run's token for its commands. */
export interface ServerClaim {
  readonly runId: string;
  readonly attempt: number;
  readonly agent: Agent;
  readonly run: Run;
  /** The entry of the agent's list the run uses; null when the agent lists none. */
  readonly model: OnlineModelEntry | null;
  /** The brief's layers joined, the system prompt. */
  readonly system: string;
  /** The turn's first part; the run's inputs follow it. */
  readonly turn: string;
  readonly inputs: readonly RunInput[];
  /** The run token: the run's identity for its commands, valid while this holder holds the run. */
  readonly token: string;
  /** The run's skills, the agent's and its subject's scopes', each at its latest version. */
  readonly skills: readonly RunSkill[];
  readonly leaseExpiresAt: string;
  /** The next event's `seq`. */
  readonly firstSeq: number;
  /** The agents it may consult (`ask_agent`), which its system prompt lists; none when it may consult nobody. */
  readonly consultable: readonly ConsultTarget[];
  /** A consultation (`Run.parentRunId`): how many runs asked before it; 0 for every other run. */
  readonly depth: number;
}

/** Whether a run holder id is an application instance's (an online run's), not a runner's. */
export function isServerHolder(runnerId: string | null): boolean {
  return runnerId !== null && runnerId.startsWith('server:');
}

export interface ClaimService {
  /**
   * Up to `free` runs for `runner`, each with its payload; empty when nothing fits. `tools` is what the runner said it
   * can take of each coding tool it keeps a limit for (`ClaimRequest.tools`); a tool left out is bounded by `free`.
   */
  claim(
    runner: Runner,
    free: number,
    tools?: Readonly<Partial<Record<AgentTool, number>>>,
  ): Promise<RunPayload[]>;
  /**
   * Up to `limit` online runs for an application instance; empty when there are none to take. Consultations are never
   * among them: the holder of the run that asks takes each at once (`claimChild`).
   */
  claimServer(holder: ServerHolder, limit: number): Promise<ServerClaim[]>;
  /** A queued consultation, for the holder of the run that asked it, which runs it within the asking tool call. */
  claimChild(holder: ServerHolder, runId: string): Promise<ServerClaim>;
  /** The skills a run gets, worked out the way its claim works them out. The caller checks who holds the run. */
  runSkills(runner: Runner, runId: string): Promise<RunSkill[]>;
}

export interface ClaimDeps extends TransitionDeps {
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
  /** Skills every online run gets besides its own, such as the CLI's (`online.skills`). */
  readonly onlineSkills?: () => readonly BriefSkill[];
  /** The agents an online run may consult, and how deep in a consultation it is (`consultations`); none without. */
  readonly consultations?: Pick<ConsultationService, 'targets' | 'chain'>;
  readonly onClaimFailure?: (runId: string, error: unknown) => void;
  /** The system default chat model, which an online agent that lists no model runs with; none without it. */
  readonly defaultModel?: (
    conn: DatabaseConnection,
  ) => Promise<ModelRef | null>;
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
  | { readonly kind: 'skipped' };

/**
 * The entry `runner` takes a run of `agent` with: the first whose tool it has enabled, installed and signed in. Null
 * when it has none of them, and always for an online agent, which has no tool.
 */
export function pickEntry(
  runner: Runner,
  agent: Pick<Agent, 'modelEntries'>,
): RunnerModelEntry | null {
  return (
    runnerEntries(agent).find((entry) => runsTool(runner, entry.tool)) ?? null
  );
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
    runnerEntries(agent).find(
      (entry) => runsTool(runner, entry.tool) && open(entry.tool),
    ) ?? null
  );
}

/** Whether `runner` has one of `agent`'s tools enabled, installed and signed in; never for an online agent. */
export function hasTool(
  runner: Runner,
  agent: Pick<Agent, 'modelEntries'>,
): boolean {
  return pickEntry(runner, agent) !== null;
}

/**
 * The entry an online run uses: the one its subject asks for while the agent lists it, else the agent's first; for an
 * agent that lists none, the system default chat model (`fallback`).
 */
export function onlineEntryOf(
  agent: Pick<Agent, 'type' | 'modelEntries'>,
  wanted?: OnlineModelEntry,
  fallback: ModelRef | null = null,
): OnlineModelEntry | null {
  const entries = onlineEntriesOrDefault(agent, fallback);
  return (
    (wanted && entries.find((entry) => sameEntry(entry, wanted))) ??
    entries[0] ??
    null
  );
}

/** Whether `runner` may run `run` of `agent`, before any lock is taken and before its payload is known. */
export function fits(runner: Runner, agent: Agent, run: RunRecord): boolean {
  return serves(runner, agent, run.actorUserId, toRun(run).requires);
}

/**
 * Whether `runner` may run work of `agent` run as `actorUserId` that needs `requires`: what `fits` asks of a queued
 * run, asked before there is one (work someone wants run as themselves).
 */
export function serves(
  runner: Runner,
  agent: Agent,
  actorUserId: string,
  requires: readonly RunnerFeature[],
): boolean {
  if (agent.archivedAt || agent.type !== 'runner') return false;
  if (!covers(runner.features, requires)) return false;
  if (!hasTool(runner, agent)) return false;
  if (!policyAllowsAgent(runner.policy, agent)) return false;
  if (agent.runnerIds.length > 0 && !agent.runnerIds.includes(runner.id))
    return false;
  return runner.trust === 'team' || runner.ownerUserId === actorUserId;
}

/** The runner features a payload needs. */
export function payloadRequires(
  dirs: readonly WorkspaceDir[],
  skills: number,
  variables: number,
): RunnerFeature[] {
  return [
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
    dialect: dialectOf(agent),
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

export function createClaimService(deps: ClaimDeps): ClaimService {
  const { tx, clock } = deps;

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
      dialect: 'cli',
    };
    const assembly = await binding.context.assemble(conn, claim);
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
      ...payloadRequires(dirs, skills.length, names.length),
    ]) as RunnerFeature[];
    if (!covers(runner.features, requires)) throw new NotForThisRunner();
    const env =
      names.length > 0
        ? await deps.variables.forRun(conn, variables, {
            runId: run.id,
            runnerId: runner.id,
          })
        : [];
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
      await withSections(conn, deps.sections, claim, assembly, prepared),
      skills,
      deps.cli.name,
      deps.app.name,
    );
    const briefFingerprint = fingerprint(agent, entry, brief.layers, skills);
    const resume =
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
            claim,
            assembly,
            session: resume ? 'resume' : 'fresh',
            sessionKey: sessionKeyOf(view),
          },
          prepared,
        )
      : { mounts: [], resumeNotes: [] };
    const turn = [brief.turn, ...resumeNotes].join('\n\n');
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
        dirs,
        env,
        ...(clean ? { clean: true } : {}),
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
    };
  }

  async function attempt(
    runner: Runner,
    agent: Agent,
    candidate: RunRecord,
    reported: ToolRoom,
  ): Promise<Attempt> {
    // Before the transaction: on SQLite it holds the only connection, so the providers read what else they need now.
    const prepared = await prepareExtensions(
      toRun(candidate),
      deps.sections,
      deps.mounts,
      (error) => deps.onClaimFailure?.(candidate.id, error),
      deps.repoAccess,
    );
    return tx.run(async (unit) => {
      const { conn } = unit;
      const now = clock.now();
      const nowText = now.toISOString();
      await lockAgentForClaim(conn, agent.id, nowText);
      if (
        (await countActive(conn, 'agentId', agent.id)) >=
        agent.maxConcurrentRuns
      )
        return { kind: 'skipped' };
      // Slots are shared with the jobs the runner holds.
      if ((await deps.slotsUsed(conn, runner.id)) >= runner.slots)
        return { kind: 'skipped' };
      // The first of the agent's tools with room, by its limit here and by what the runner said it can take.
      const byTool = await runsHeldByTool(conn, runner.id);
      const entry = pickOpenEntry(
        runner,
        agent,
        (tool) =>
          (byTool[tool] ?? 0) < toolLimit(runner, tool) && reported.has(tool),
      );
      if (!entry) return { kind: 'skipped' };
      const busy = await runsOfKey(conn, candidate, ACTIVE);
      if (busy.length > 0) return { kind: 'skipped' };

      const leaseExpiresAt = later(now, TIMINGS.leaseMs);
      const taken = await runsRepo(conn).updateMany({
        filter: (f) =>
          f.and([
            f.string('id').eq(candidate.id),
            f.string('status').eq('queued'),
          ]),
        values: {
          status: 'dispatched',
          runnerId: runner.id,
          leaseExpiresAt,
          dispatchedAt: nowText,
          lastActivityAt: nowText,
          availableAt: null,
          updatedAt: nowText,
        },
      });
      if (taken.updatedCount !== 1) return { kind: 'skipped' };
      const run = (await findRunRecord(conn, candidate.id))!;
      const pending = await pendingInputs(conn, run.id);
      let assembled: Assembled;
      try {
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
      await markDelivered(conn, pending, nowText);
      await runsRepo(conn).updateMany({
        filter: { id: run.id },
        values: {
          payloadFingerprint: assembled.fingerprint,
          requires: [...assembled.requires],
          directoryKey: assembled.directoryKey,
          tool: assembled.entry.tool,
          modelService: null,
          model: assembled.entry.model,
          effort: assembled.entry.effort ?? null,
        },
      });
      unit.emit({ type: 'run.changed', runId: run.id, status: 'dispatched' });
      return { kind: 'claimed', payload: assembled.payload };
    });
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
          failureDetail: error.message.slice(0, 10_000),
        },
      });
    });
  }

  /** Queued runs of agents of `type` that may be claimed now, in claim order. */
  async function candidatesOf(type: 'online' | 'runner'): Promise<RunRecord[]> {
    const now = clock.now();
    return runsRepo(tx.read()).findMany({
      filter: (f) =>
        f.and([
          f.string('status').eq('queued'),
          f.string('agentType').eq(type),
          // A consultation is taken by the holder of the run that asked it, never from the queue.
          f.string('parentRunId').empty(),
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

  /** Takes an online run for `holder` in one transaction, or skips it when another holder or run got there first. */
  async function attemptServer(
    holder: ServerHolder,
    agent: Agent,
    candidate: RunRecord,
  ): Promise<ServerClaim | null> {
    const prepared = await prepareExtensions(
      toRun(candidate),
      deps.sections,
      undefined,
      (error) => deps.onClaimFailure?.(candidate.id, error),
    );
    return tx.run(async (unit) => {
      const { conn } = unit;
      const now = clock.now();
      const nowText = now.toISOString();
      // Serializes claims and enqueues of this agent, so one key never has two runs held.
      await lockAgentForClaim(conn, agent.id, nowText);
      if ((await runsOfKey(conn, candidate, ACTIVE)).length > 0) return null;
      const leaseExpiresAt = later(now, TIMINGS.leaseMs);
      const taken = await runsRepo(conn).updateMany({
        filter: (f) =>
          f.and([
            f.string('id').eq(candidate.id),
            f.string('status').eq('queued'),
          ]),
        values: {
          status: 'dispatched',
          runnerId: holder.id,
          leaseExpiresAt,
          dispatchedAt: nowText,
          lastActivityAt: nowText,
          availableAt: null,
          updatedAt: nowText,
        },
      });
      if (taken.updatedCount !== 1) return null;
      const run = (await findRunRecord(conn, candidate.id))!;
      const pending = await pendingInputs(conn, run.id);
      const inputs = pending.map(toInput);
      let claimed: ServerClaim;
      try {
        claimed = await assembleServer(
          unit,
          run,
          agent,
          holder,
          inputs,
          leaseExpiresAt,
          prepared,
        );
      } catch (error) {
        throw new AssemblyError(
          error instanceof Error ? error.message : String(error),
          error,
        );
      }
      await markDelivered(conn, pending, nowText);
      await runsRepo(conn).updateMany({
        filter: { id: run.id },
        values: {
          tool: null,
          modelService: claimed.model?.modelService ?? null,
          model: claimed.model?.model ?? null,
          effort: claimed.model?.effort ?? null,
        },
      });
      unit.emit({ type: 'run.changed', runId: run.id, status: 'dispatched' });
      return {
        ...claimed,
        run: {
          ...claimed.run,
          tool: null,
          modelService: claimed.model?.modelService ?? null,
          model: claimed.model?.model ?? null,
          effort: claimed.model?.effort ?? null,
        },
      };
    });
  }

  async function assembleServer(
    { conn }: Tx,
    run: RunRecord,
    agent: Agent,
    holder: ServerHolder,
    inputs: readonly RunInput[],
    leaseExpiresAt: string,
    prepared: Prepared,
  ): Promise<ServerClaim> {
    const binding = deps.subjects.get(run.subjectKind);
    if (!binding)
      throw new Error(
        `No context provider is registered for subjects of kind "${run.subjectKind}".`,
      );
    const view = toRun(run);
    const claim: ClaimContext = {
      run: view,
      agent,
      runner: null,
      inputs,
      cli: deps.cli.name,
      appName: deps.app.name,
      dialect: 'tools',
    };
    const assembly = await binding.context.assemble(conn, claim);
    if (assembly.dirs.length > 0)
      throw new Error(
        'An online agent has no working directory, and this work needs one.',
      );
    const skills = await deps.skills.forRun(
      conn,
      skillTargets(agent, assembly),
      run.id,
    );
    const own = new Set(skills.map((skill) => skill.slug));
    const rendered = briefOf(
      agent,
      await withSections(conn, deps.sections, claim, assembly, prepared),
      [],
      deps.cli.name,
      deps.app.name,
    );
    // The skills an online run reads through its tools, and the agents it may consult, whatever system layer its
    // subject gives it.
    const consultable =
      (await deps.consultations?.targets(conn, run, agent)) ?? [];
    const depth = run.parentRunId
      ? ((await deps.consultations?.chain(conn, run))?.length ?? 1) - 1
      : 0;
    const section = [
      ...onlineSkillsSection([
        ...skills,
        ...(deps.onlineSkills?.() ?? []).filter(
          (skill) => !own.has(skill.slug),
        ),
      ]),
      ...(consultable.length > 0 ? ['', ...consultSection(consultable)] : []),
    ];
    const layers =
      section.length > 0
        ? {
            ...rendered.layers,
            system: [rendered.layers.system, '', ...section].join('\n'),
          }
        : rendered.layers;
    const brief = { ...rendered, layers, prompt: joinBrief(layers) };
    const token = await mintRunToken(conn, deps, run, holder.id);
    deps.secrets?.remember(runSecretsKey(run.id), [token.value]);
    const last = await eventsRepo(conn).findOne({
      filter: { runId: run.id },
      sort: (sort) => sort.field('seq').desc(),
    });
    await saveBrief(conn, () => deps.ids.next(), {
      runId: run.id,
      attempt: Number(run.attempt),
      layers: brief.layers,
      turn: brief.turn,
      prompt: brief.prompt,
      createdAt: clock.now().toISOString(),
    });
    return {
      runId: run.id,
      attempt: Number(run.attempt),
      agent,
      run: view,
      model: onlineEntryOf(
        agent,
        assembly.model,
        (await deps.defaultModel?.(conn)) ?? null,
      ),
      system: brief.prompt,
      turn: brief.turn,
      inputs,
      token: token.value,
      skills,
      leaseExpiresAt,
      firstSeq: (last ? Number(last.seq) : 0) + 1,
      consultable,
      depth,
    };
  }

  async function claimOne(
    runner: Runner,
    seen: Set<string>,
    reported: ToolRoom,
  ): Promise<RunPayload | null> {
    const conn = tx.read();
    const candidates = await candidatesOf('runner');
    const agents = new Map<string, Agent | null>();
    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      if (!agents.has(candidate.agentId))
        agents.set(candidate.agentId, await findAgent(conn, candidate.agentId));
      const agent = agents.get(candidate.agentId);
      if (!agent || !fits(runner, agent, candidate)) continue;
      // None of its tools has room on the runner's side: the runs behind it may still fit.
      if (!pickOpenEntry(runner, agent, (tool) => reported.has(tool))) continue;
      try {
        const result = await attempt(runner, agent, candidate, reported);
        if (result.kind === 'claimed') return result.payload;
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
    async claim(runner, free, tools) {
      if (runner.status !== 'online') return [];
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

    async claimServer(holder, limit) {
      const claimed: ServerClaim[] = [];
      const conn = tx.read();
      const agents = new Map<string, Agent | null>();
      for (const candidate of await candidatesOf('online')) {
        if (claimed.length >= limit) break;
        if (!agents.has(candidate.agentId))
          agents.set(
            candidate.agentId,
            await findAgent(conn, candidate.agentId),
          );
        const agent = agents.get(candidate.agentId);
        if (!agent || agent.archivedAt || agent.type !== 'online') continue;
        try {
          const taken = await attemptServer(holder, agent, candidate);
          if (taken) claimed.push(taken);
        } catch (error) {
          if (!(error instanceof AssemblyError)) throw error;
          await recordFailure(candidate.id, error);
        }
      }
      return claimed;
    },

    async claimChild(holder, runId) {
      const conn = tx.read();
      const candidate = await findRunRecord(conn, runId);
      if (!candidate?.parentRunId || candidate.status !== 'queued')
        throw notFound('Run');
      const parent = await findRunRecord(conn, candidate.parentRunId);
      if (parent?.runnerId !== holder.id) throw notFound('Run');
      const agent = await findAgent(conn, candidate.agentId);
      if (!agent || agent.archivedAt || agent.type !== 'online')
        throw notFound('Agent');
      try {
        const taken = await attemptServer(holder, agent, candidate);
        if (!taken) throw notFound('Run');
        return taken;
      } catch (error) {
        if (!(error instanceof AssemblyError)) throw error;
        // One attempt: a consultation that cannot be assembled fails at once.
        await tx.run(async (unit) => {
          const run = await findRunRecord(unit.conn, runId);
          if (run)
            await finishRun(unit, deps, run, {
              status: 'failed',
              reason: 'setupFailed',
              detail: error.message,
            });
        });
        throw error;
      }
    },

    async runSkills(runner, runId) {
      const conn = tx.read();
      const run = await findRunRecord(conn, runId);
      if (!run) throw notFound('Run');
      const agent = await findAgent(conn, run.agentId);
      const binding = deps.subjects.get(run.subjectKind);
      if (!agent || !binding) return [];
      const assembly = await binding.context.assemble(conn, {
        run: toRun(run),
        agent,
        runner,
        inputs: [],
        cli: deps.cli.name,
        appName: deps.app.name,
        dialect: dialectOf(agent),
      });
      return deps.skills.forRun(conn, skillTargets(agent, assembly), run.id);
    },
  };
}
