import {
  OnlineAgentUIStreams,
  type OnlineAgentRecoveryConfig,
} from './online-agent/ui-streams.js';
import { RunnerOnlineAgentAdapter } from './online-agent/runner.js';
import type { ServiceResolver } from '@nocobase/service-provider';
import type { OnlineAgentRuntime } from './online-agent/realtime.js';
import { OnlineAgentService } from './online-agent/service.js';
import { createSessionManager } from './online-agent/sessions.js';
import { languageModel } from './online/providers.js';
/**
 * The one place the plugin's services are assembled from their dependencies. The provider binds the result to
 * `agentsToken`; tests call it directly against a real database.
 *
 * Runner agents run on the runners people connect (`runners/`): one long-poll hands out their runs and the jobs of the
 * off-by-default runner build method (`jobs/`) from the runners' shared slots, and jobs open the stored variables they
 * name here. The runner and CLI tarballs the application serves are `distribution/`.
 *
 * Agents are discovered from what runners report (`agents.syncRunner`, on each registration and heartbeat): one for each
 * coding tool and model, which someone who manages agents enables. Subject kinds (what runs work on), scopes, business
 * actions, the instructions every discovered agent gets and who holds which action are added later by the application
 * that assembles the plugin (through `subjects`, `scopes`, `actions`, `agents.setDefaults`, `gate`); this plugin
 * brings the
 * `conversation` subject.
 */
import type { RunApp } from '@nocobase/agent-protocol';
import { createRunDataPurge } from './core/runs/run-data-purge.js';
import {
  createModelSelectionPolicies,
  type ModelSelectionPolicies,
} from './core/runs/selection.js';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import {
  createDistService,
  createDownloadTokenService,
  type DownloadTokenService,
  upgradeFor,
  type DistConfig,
  type DistService,
} from './distribution/index.js';
import {
  createJobKindRegistry,
  createJobService,
  type JobService,
} from './jobs/index.js';
import { systemClock, type Clock } from './kernel/clock.js';
import {
  createSealer,
  MODEL_SERVICE_KEY_SECRET_PURPOSE,
  VARIABLES_SECRET_PURPOSE,
  type AgentsSecrets,
} from './kernel/secrets.js';
import { createEventBus, type AgentsEventBus } from './kernel/events.js';
import { createIdSource } from './kernel/ids.js';
import { createPeople, type People } from './kernel/people.js';
import { createSecretMemory } from './kernel/redaction.js';
import { createScopeKinds, type ScopeKindRegistry } from './kernel/scopes.js';
import { createTxRunner, type TxRunner } from './kernel/tx.js';
import {
  createRunnerService,
  createRunnerSweeper,
  createRunnerWorkspaces,
  createSlots,
  createWorkSignal,
  type RunnerService,
  type RunnerSweeper,
  type RunnerWorkspaces,
  type Slots,
  type WorkSignal,
} from './runners/index.js';
import {
  agentViews,
  availableAgents,
  createAgentActionCatalog,
  createAgentService,
  listAgents,
  type AgentActionCatalog,
  type AgentService,
} from './core/agents/index.js';
import type { AgentView, AvailableAgent } from '../shared/agents.js';
import {
  createChatAttachments,
  createChatFileStorage,
  createChatSettingsService,
  createConversationService,
  createPageContextKinds,
  type ChatAttachmentService,
  type ChatFileStorage,
  type ChatSettingsService,
  type ConversationService,
  type ResolvedRef,
} from './core/conversations/index.js';
import { createCallerGate, type CallerGate } from './core/callers/index.js';
import {
  createModelUsageRecorder,
  createPriceService,
  createReportService,
  type PriceService,
  type ReportService,
} from './core/reports/index.js';
import {
  createSkillBlobs,
  createSkillService,
  memoryDisk,
  type SkillDisk,
  type SkillService,
} from './core/skills/index.js';
import {
  createVariableService,
  type VariableService,
} from './core/variables/index.js';
import {
  createModelGateway,
  createModelServices,
  type ModelGateway,
  type ModelServices,
} from './online/index.js';
import {
  createVectors,
  type Vectors,
  type VectorsConfig,
} from './vectors/index.js';
import {
  createBriefPreviewer,
  createBriefSectionRegistry,
  createClaimEligibility,
  createClaimService,
  createGitCredentialService,
  createRepoAccessRegistry,
  createRunMountRegistry,
  createRunnerReports,
  createRunService,
  createAvailability,
  createSubjectRegistry,
  createRunnerView,
  createSweeper,
  resolveAgentCli,
  runsHeldSnapshot,
  openCounts,
  type AgentCli,
  type Availability,
  type BriefPreviewer,
  type ClaimEligibility,
  type ClaimService,
  type GitCredentialService,
  type RunnerReports,
  type RepoAccessRegistry,
  type RunMountRegistry,
  type RunnerView,
  type RunService,
  type SubjectRegistry,
} from './core/runs/index.js';

export interface AgentsDeps {
  readonly uiRecovery?: OnlineAgentRecoveryConfig;
  readonly measureOnlineAgent?: (phase: string, durationMs: number) => void;
  readonly resolver?: ServiceResolver;
  readonly runRetentionDays?: () => number;
  /** The first back-off of a failed run attempt (`agents.runs.retryBaseDelayMs`); 30 seconds when left out. */
  readonly retryBaseDelayMs?: number;
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  readonly idGenerator: { generateString(): string };
  /**
   * Who hands out work, as runners see it. The plugin passes `agents.app`, else the application's name; left out (tests,
   * a standalone composition), the CLI's name, else `defaultRunApp`.
   */
  readonly app?: RunApp;
  /** Where the tarballs of the runner and the CLI are, and which channel and versions to serve (`agents.dist`). */
  readonly dist?: DistConfig;
  /** The application's secrets service (`secrets.keys`); variables and model keys cannot be stored without it. */
  readonly secrets?: AgentsSecrets;
  /** The manifest URL handed to runners, as they reach the server. */
  readonly manifestUrl?: string;
  /** The application CLI a run exposes to its agent (`agents.cli`); named after `app` when left out (`resolveAgentCli`). */
  readonly cli?: Partial<AgentCli>;
  readonly clock?: Clock;
  /**
   * Where the contents of skills' files are stored: the application's drive, asked on each use. Memory when absent,
   * which only tests and a throwaway application should rely on.
   */
  readonly skillDisk?: () => SkillDisk;
  /**
   * Where the files people send in chat are stored: the file plugin's repository and Drive in an application. Without
   * it an upload answers 503 `NOT_IMPLEMENTED`.
   */
  readonly chatFiles?: ChatFileStorage;
  /** The application's public base path (`/app`, or empty), for the URLs of files sent in chat. */
  readonly basePath?: () => string;
  readonly onError?: (message: string, error: unknown) => void;
  /**
   * The vector store of vector collections (`agents.vectors`), apart from the application's database: sqlite-vec in
   * `storage/vectors.sqlite` by default.
   */
  readonly vectors?: VectorsConfig;
  /** The application's root and storage directories, which the vector store's relative paths resolve against. */
  readonly paths?: { readonly root: string; readonly storage: string };
}

export interface Agents {
  readonly onlineAgent: OnlineAgentRuntime;
  readonly events: AgentsEventBus;
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly agents: AgentService;
  /**
   * Per agent, whether it could start work now (an online runner with its tool and model, installed and signed in,
   * among the runners it may use and whose owner's policy lets it), and how many of its runs have not finished.
   */
  readonly availability: Availability;
  /**
   * The agents a person may give work to, read on `conn` (the roster a project manager picks from): enabled agents
   * discovered from runners and reported recently, each with whether a runner would take the person's work now.
   */
  readonly roster: (
    conn: DatabaseConnection,
    userId: string,
  ) => Promise<AvailableAgent[]>;
  /** Every agent as the Agent page shows it to a person, read on `conn`. */
  readonly views: (
    conn: DatabaseConnection,
    userId: string,
    options: { readonly canEdit: boolean },
  ) => Promise<AgentView[]>;
  /**
   * Whether a runner would actually take an agent's work done as a person, by the claim's rules: trust, features and
   * whether it may receive the work's variables. For deciding before a run exists; call it outside a transaction.
   */
  readonly eligibility: ClaimEligibility;
  /** Who runners register with: the application's id and name. */
  readonly app: RunApp;
  /** The application's CLI (`agents.cli`, resolved): what runs talk to it with and what the install script installs. */
  readonly cli: AgentCli;
  /** The runners people connect (each a runtime): registration, keys, heartbeats, what people change about one. */
  readonly runners: RunnerService;
  /** Which agents each runner may run and which runs one holds, for the runtimes pages. */
  readonly runnerView: RunnerView;
  /**
   * The working directories runners report: which may go because their subject's work is over, and the disk they
   * take, kept for the runtimes pages.
   */
  readonly workspaces: RunnerWorkspaces;
  /**
   * Jobs: deterministic steps runners execute without a model (a build), of the kinds the application registers; used
   * by the off-by-default runner build method.
   */
  readonly jobs: JobService;
  /** A runner's slots, shared by its runs and its jobs. */
  readonly slots: Slots;
  /** Wakes long-polling runners; notified whenever work may have arrived. */
  readonly signal: WorkSignal;
  /** The runner and CLI tarballs the application serves. */
  readonly dist: DistService;
  /** Short-lived tokens that let the install script download the CLI for one platform. */
  readonly downloadTokens: DownloadTokenService;
  readonly runs: RunService;
  readonly claims: ClaimService;
  readonly selectionPolicies: ModelSelectionPolicies;
  readonly reports: RunnerReports;
  /** Repository credentials a runner asks for while it holds a run (`RepoAccessProvider.issue`). */
  readonly gitCredentials: GitCredentialService;
  /** Marks silent runners offline, then takes back and ends the runs and jobs nobody will finish. */
  readonly sweeper: RunnerSweeper;
  readonly purgeRunData: () => Promise<number>;
  /** Variables of agents, working directories and the scopes the application registers. */
  readonly variables: VariableService;
  /** The skill library and where skills are attached. */
  readonly skills: SkillService;
  /**
   * What a run of an agent on a subject would be told now, and the sections the application adds to every brief
   * (`briefs.sections`).
   */
  readonly briefs: BriefPreviewer;
  /**
   * Directories of files the application places beside the agent: offered per run at claim to runners with the
   * `mounts` feature, served while the runner holds the run.
   */
  readonly mounts: RunMountRegistry;
  /** Who a run's commits name and the short-lived credentials its checkouts push with, as the application gives them. */
  readonly repoAccess: RepoAccessRegistry;
  /** Names of people, from the directory the application plugs in. */
  readonly people: People;
  /**
   * The scopes variables and default skills are kept in besides an agent's own: `workdir`, and the ones the
   * application registers, with who may see and change what is kept there.
   */
  readonly scopes: ScopeKindRegistry;
  /** Where the domain a run works on plugs in its context and hears how runs end. */
  readonly subjects: SubjectRegistry;
  /** Which business actions each caller holds, as the application says (`gate.set`). */
  readonly gate: CallerGate;
  /** The business actions an agent may be configured with, as the application offers them. */
  readonly actions: AgentActionCatalog;
  /** What runs used and cost (`usage`), and how they went (`runFigures`), for the application's reports. */
  readonly reporting: ReportService;
  /** The model prices reports estimate costs from. */
  readonly prices: PriceService;
  /** People's conversations with agents: the `conversation` subject kind of runs. */
  readonly conversations: ConversationService;
  /** The files people send with chat messages: uploads, reading them, and purging those never sent. */
  readonly chatAttachments: ChatAttachmentService;
  /** The system default chat agent, and each person's default and "always confirm". */
  readonly chat: ChatSettingsService;
  /**
   * The model services the application calls models of (`agModelServices`), and the gateway that calls them for its
   * embedding, rerank and utility text calls (`embed`, `rerank`, `generate`), such as a knowledge base's search.
   */
  readonly models: {
    readonly services: ModelServices;
    readonly gateway: ModelGateway;
  };
  /**
   * Vector collections the application keeps (`collection(spec)`), embedded with the model services' embedding models
   * through a queue, over a pluggable vector store (`stores`; pgvector by default). The provider starts the queue's
   * worker at boot.
   */
  readonly vectors: Vectors;
}

/** The application work comes from when nothing names it: the CLI's name, else a neutral one. */
export function defaultRunApp(cli?: Partial<AgentCli>): RunApp {
  const id = cli?.name ?? 'app';
  return { id, name: id };
}

export function createAgents(deps: AgentsDeps): Agents {
  const onError =
    deps.onError ??
    ((message: string, error: unknown) => console.error(message, error));
  const events = createEventBus((error) =>
    onError('Agents event listener failed.', error),
  );
  const tx = createTxRunner(deps.database, events);
  const ids = createIdSource(deps.idGenerator);
  const clock = deps.clock ?? systemClock;
  const subjects = createSubjectRegistry();
  const signal = createWorkSignal();
  const transitions = {
    clock,
    subjects,
    ...(deps.retryBaseDelayMs === undefined
      ? {}
      : { retryBaseDelayMs: deps.retryBaseDelayMs }),
  };
  const app = deps.app ?? defaultRunApp(deps.cli);
  const cli = resolveAgentCli(deps.cli, app);

  const people = createPeople();
  const dist = createDistService(deps.dist);
  const slots = createSlots(runsHeldSnapshot);
  const runners = createRunnerService({
    tx,
    ids,
    clock,
    app,
    people,
    latestRunner: async (runner) =>
      (await upgradeFor(dist, runner))?.latestVersion ?? null,
    // Every tool and model a runner reports becomes an agent, pending until someone enables it.
    onReport: (unit, runner) => agents.syncRunner(unit, runner),
  });
  const jobs = createJobService({
    tx,
    ids,
    clock,
    events,
    kinds: createJobKindRegistry(),
    app,
    slotsUsed: (conn, runnerId) => slots.used(conn, runnerId),
    onError,
  });
  const modelServices = createModelServices({
    tx,
    clock,
    box: createSealer(deps.secrets, MODEL_SERVICE_KEY_SECRET_PURPOSE),
  });
  // Embeddings, reranking and utility texts the application asks for are recorded apart from runs (`agModelUsage`).
  const gateway = createModelGateway(modelServices, {
    usage: createModelUsageRecorder({ tx, ids, clock }),
    onError,
  });
  const vectors = createVectors({
    tx,
    ids,
    clock,
    embed: (request) => gateway.embed(request),
    dimensionsOf: async (ref) => {
      try {
        return (await modelServices.endpointFor(ref, 'embedding')).dimensions;
      } catch {
        return null;
      }
    },
    ...(deps.vectors ? { config: deps.vectors } : {}),
    ...(deps.paths ? { paths: deps.paths } : {}),
    onError,
  });
  const actions = createAgentActionCatalog();
  const scopes = createScopeKinds();
  const variables = createVariableService({
    tx,
    ids,
    clock,
    box: createSealer(deps.secrets, VARIABLES_SECRET_PURPOSE),
    people,
    cli: cli.name,
    // An agent's variables are part of its configuration: their changes go into its history, without values.
    onChange: (conn, target, change) =>
      target.scope === 'agent'
        ? agents.noteVariable(conn, target.scopeId, change)
        : Promise.resolve(),
  });
  const fallbackDisk = deps.skillDisk ? undefined : memoryDisk();
  const skills = createSkillService({
    tx,
    ids,
    clock,
    people,
    blobs: createSkillBlobs({
      tx,
      clock,
      disk: deps.skillDisk ?? (() => fallbackDisk!),
    }),
  });
  const agents: AgentService = createAgentService({
    tx,
    ids,
    clock,
    people,
    owned: {
      withdrawQueued: async (unit, agentId, byUserId) => {
        await runs.withdrawQueued(
          { agentId, byUserId, detail: 'The agent was disabled.' },
          unit,
        );
      },
    },
  });
  const eligibility = createClaimEligibility({
    runners,
    variables,
  });
  const availability = createAvailability({
    runners,
    eligibility,
    openRuns: openCounts,
  });
  const runs = createRunService({
    reconcileCommentConsent: (unit, runId) =>
      claims.reconcileCommentConsent(unit, runId),
    diagnose: (conn, run, agent) => claims.diagnose(conn, run, agent),
    ...transitions,
    tx,
    ids,
    agents,
    cliName: cli.name,
    appName: app.name,
    runners: {
      all: (conn) => runners.all(conn),
      find: (conn, id) => runners.find(conn, id),
      jobsByRunner: (conn) => slots.jobsByRunner(conn),
    },
    eligibility,
    people,
  });
  const sections = createBriefSectionRegistry();
  const mounts = createRunMountRegistry();
  const repoAccess = createRepoAccessRegistry();
  // The secrets claims hand out, so what runners report is redacted of them before it is stored.
  const secrets = createSecretMemory();
  const selectionPolicies = createModelSelectionPolicies();
  const claims = createClaimService({
    selectionPolicies,
    runners,
    people,
    sections,
    mounts,
    repoAccess,
    dist,
    slotsUsed: (conn, runnerId) => slots.used(conn, runnerId),
    slotsHeld: (conn, runnerId) => slots.held(conn, runnerId),
    ...transitions,
    tx,
    ids,
    variables,
    skills,
    manifestUrl: deps.manifestUrl ?? '/api/cli/manifest',
    app,
    cli,
    secrets,
    onClaimFailure: (runId, error) =>
      onError(`Agents could not assemble run ${runId}.`, error),
  });
  const reports = createRunnerReports({
    ...transitions,
    tx,
    ids,
    secrets,
    cliName: cli.name,
    appName: app.name,
    onModelUnavailable: (unit, runnerId, tool, model) =>
      runners.markModelUnavailable(unit, runnerId, tool, model),
  });
  const gitCredentials = createGitCredentialService({
    tx,
    clock,
    reports,
    repoAccess,
    secrets,
    onError,
  });
  const sweeper = createRunnerSweeper({
    clock,
    runners,
    runs: createSweeper({
      ...transitions,
      tx,
      ids,
      runners,
      reconcileCommentQueue: () => claims.reconcileCommentQueue(),
    }),
    jobs,
    requests: runs.requests,
  });
  // Jobs open the stored variables they name here.
  jobs.provideSecrets({
    open: (conn, refs, delivery) => variables.forJob(conn, refs, delivery),
  });
  const chat = createChatSettingsService({ tx, clock, agents });
  const basePath = deps.basePath ?? (() => '');
  const chatAttachments = createChatAttachments({
    tx,
    basePath,
    now: () => clock.now(),
    storage:
      deps.chatFiles ??
      createChatFileStorage({
        uploader: () => null,
        disks: () => null,
        disk: () => 'local',
      }),
  });
  const conversations = createConversationService({
    measure: deps.measureOnlineAgent,
    tx,
    ids,
    clock,
    agents,
    runners,
    eligibility,
    runs,
    people,
    settings: chat,
    nativeAvailable: async () =>
      Boolean((await modelServices.catalog().catch(() => null))?.defaultModel),
    nativeActive: (id, persistedRunning) =>
      onlineAgent.producerAvailable(id, persistedRunning),
    contextKinds: createPageContextKinds(),
    attachments: chatAttachments.links,
    basePath,
  });
  const uiStreams = new OnlineAgentUIStreams({
    tx,
    measure: deps.measureOnlineAgent,
    recovery: deps.uiRecovery,
    onError: (error) => onError('OnlineAgent UI recovery failed.', error),
  });
  const runnerOnlineAgent = new RunnerOnlineAgentAdapter({
    measure: deps.measureOnlineAgent,
    tx,
    conversations,
    streams: uiStreams,
    now: () => clock.now().toISOString(),
    basePath,
    onError: (error) =>
      onError('Runner OnlineAgent synchronization failed.', error),
  });
  const onlineAgent = new OnlineAgentService({
    runner: runnerOnlineAgent,
    uiStreams,
    chatAgents: (userId) => conversations.chatAgents(userId),
    sessions: createSessionManager({
      contextKinds: conversations.contextKinds,
      tx,
      ids,
      attachments: chatAttachments.links,
      files: chatAttachments.service,
      basePath,
      now: () => clock.now().toISOString(),
    }),
    ids,
    resolver: deps.resolver,
    model: async (ref, sessionId) =>
      languageModel(
        await modelServices.connectionFor(ref),
        ref.model,
        sessionId,
      ),
    defaultModel: async () =>
      (await modelServices.catalog()).defaultModel ?? null,
    onError: (error) =>
      onError('OnlineAgent execution or finalization failed.', error),
  });
  subjects.register(conversations.binding);
  registerCoreContextKinds(conversations, agents, runs);
  const gate = createCallerGate();

  events.on('run.queued', () => signal.notify());
  events.on('run.requeued', () => signal.notify());
  events.on('agent.changed', () => signal.notify());
  events.on('job.queued', () => signal.notify());
  events.on('runner.changed', () => signal.notify());
  // The agent's text in a conversation becomes messages as the runner reports it; the run's end and reading the
  // messages catch up on anything missed here.
  events.on('run.events', (event) => {
    if (runnerOnlineAgent.notify(event.runId)) return;
    conversations
      .syncRun(event.runId)
      .catch((error: unknown) =>
        onError(
          `Agents could not record the replies of run ${event.runId}.`,
          error,
        ),
      );
  });
  // The panel shows whether the agent is working: tell the owner when a conversation's run changes.
  events.on('run.changed', (event) => {
    runnerOnlineAgent.notify(event.runId);
    runs
      .get(event.runId)
      .then(async (run) => {
        const conversation = await conversations.homeOf(tx.read(), run);
        if (conversation)
          events.emit({
            type: 'conversation.changed',
            conversationId: conversation.id,
            userId: conversation.userId,
          });
      })
      .catch(() => undefined);
  });

  return {
    purgeRunData: createRunDataPurge({
      tx,
      retentionDays: deps.runRetentionDays ?? (() => 14),
    }),
    events,
    tx,
    clock,
    agents,
    availability,
    roster: async (conn, userId) =>
      availableAgents(conn, await agents.listActive(conn), {
        availability,
        userId,
        now: clock.now(),
      }),
    views: async (conn, userId, options) =>
      agentViews(
        conn,
        (await listAgents(conn)).filter((agent) => agent.source === 'runner'),
        { availability, userId, canEdit: options.canEdit, now: clock.now() },
      ),
    eligibility,
    app,
    cli,
    runners,
    runnerView: createRunnerView({ agents, subjects, tx }),
    workspaces: createRunnerWorkspaces({ tx, clock, subjects }),
    jobs,
    slots,
    signal,
    dist,
    downloadTokens: createDownloadTokenService({
      tx,
      ids,
      clock,
      product: cli.name,
    }),
    runs,
    claims,
    selectionPolicies,
    reports,
    gitCredentials,
    sweeper,
    variables,
    skills,
    briefs: createBriefPreviewer({
      tx,
      clock,
      subjects,
      skills,
      cliName: cli.name,
      appName: app.name,
      sections,
    }),
    mounts,
    repoAccess,
    people,
    scopes,
    subjects,
    gate,
    actions,
    reporting: createReportService({ tx, clock, people, subjects }),
    prices: createPriceService({ tx, ids, clock }),
    conversations,
    chatAttachments: chatAttachments.service,
    chat,
    onlineAgent,
    models: {
      services: modelServices,
      gateway,
    },
    vectors,
  };
}

/** The page context kinds this plugin knows: agents the person may wake, and runs they started or own. */
function registerCoreContextKinds(
  conversations: ConversationService,
  agents: AgentService,
  runs: RunService,
): void {
  conversations.contextKinds.register('agent', async (conn, userId, ids) => {
    const found = new Map<string, ResolvedRef>();
    for (const id of ids) {
      const agent = await agents.find(conn, id);
      if (agent && agents.mayInvoke(agent, userId))
        found.set(id, { title: agent.name, key: null, url: null });
    }
    return found;
  });
  conversations.contextKinds.register('run', async (conn, userId, ids) => {
    const found = new Map<string, ResolvedRef>();
    for (const id of ids) {
      const run = await runs.get(id).catch(() => null);
      if (run && (run.actorUserId === userId || run.ownerUserId === userId)) {
        const agent = await agents.find(conn, run.agentId);
        found.set(id, {
          title: `${agent?.name ?? run.agentId} on ${run.subject.kind} ${run.subject.id}`,
          key: null,
          url: null,
        });
      }
    }
    return found;
  });
}
