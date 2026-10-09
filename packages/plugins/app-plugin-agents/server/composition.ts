/**
 * The one place the plugin's services are assembled from their dependencies. The provider binds the result to
 * `agentsToken`; tests call it directly against a real database.
 *
 * Runner agents run on the runners people connect (`runners/`): one long-poll hands out their runs and the jobs of the
 * off-by-default runner build method (`jobs/`) from the runners' shared slots, and jobs open the stored variables they
 * name here. The runner and CLI tarballs the application serves are `distribution/`.
 *
 * Subject kinds (what runs work on), scopes, business actions, presets and who holds which action are added later by
 * the application that assembles the plugin (through `subjects`, `scopes`, `actions`, `presets`, `gate`); this plugin
 * brings the
 * `conversation` subject.
 */
import type { RunApp } from '@nocobase/agent-protocol';
import type { DatabaseManager } from '@nocobase/db';

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
  createSlots,
  createWorkSignal,
  type RunnerService,
  type RunnerSweeper,
  type Slots,
  type WorkSignal,
} from './runners/index.js';
import {
  createAgentActionCatalog,
  createAgentService,
  type AgentActionCatalog,
  type AgentService,
} from './core/agents/index.js';
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
import {
  createConsultationService,
  type ConsultationService,
} from './core/consultations/index.js';
import {
  createPresetRegistry,
  type PresetRegistry,
} from './core/presets/index.js';
import {
  createCallerGate,
  type CallerGate,
  type CallerIdentity,
} from './core/callers/index.js';
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
  createServerExecutor,
  type ModelGateway,
  type ModelServices,
  type ServerExecutor,
  type CommandSurface,
  type OnlineSkill,
  type ServerExecutorOptions,
} from './online/index.js';
import {
  createVectors,
  type Vectors,
  type VectorsConfig,
} from './vectors/index.js';
import {
  createBriefPreviewer,
  createBriefSectionRegistry,
  createClaimService,
  createRepoAccessRegistry,
  createRunMountRegistry,
  createRunnerReports,
  createRunService,
  createAvailability,
  createSubjectRegistry,
  createRunnerView,
  createSweeper,
  resolveAgentCli,
  runsHeldBy,
  runsHeldByTool,
  openCounts,
  type AgentCli,
  type Availability,
  type BriefPreviewer,
  type ClaimService,
  type RunnerReports,
  type RepoAccessRegistry,
  type RunMountRegistry,
  type RunnerView,
  type RunService,
  type SubjectRegistry,
} from './core/runs/index.js';

export interface AgentsDeps {
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
  /** The server executor of online runs (`agents.server`): model calls per run, its holder id. */
  readonly server?: ServerExecutorOptions;
  /**
   * The vector store of vector collections (`agents.vectors`), apart from the application's database: sqlite-vec in
   * `storage/vectors.sqlite` by default.
   */
  readonly vectors?: VectorsConfig;
  /** The application's root and storage directories, which the vector store's relative paths resolve against. */
  readonly paths?: { readonly root: string; readonly storage: string };
  /**
   * An online run's commands from the application's command manifest, sent as the run (`online/cli-command.ts`);
   * undefined when there is none, and then its shell has no CLI.
   */
  readonly commandsOf?: (
    identity: CallerIdentity,
    token: string,
  ) => Promise<CommandSurface> | undefined;
}

export interface Agents {
  readonly events: AgentsEventBus;
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly agents: AgentService;
  /**
   * Per agent, whether it could start work now (a runner agent: an online runner with its tool enabled, installed and
   * signed in, among the runners it may use and whose owner's policy lets it; an online agent: its model service offers
   * its model), and how many of its runs have not finished.
   */
  readonly availability: Availability;
  /** Who runners register with: the application's id and name. */
  readonly app: RunApp;
  /** The application's CLI (`agents.cli`, resolved): what runs talk to it with and what the install script installs. */
  readonly cli: AgentCli;
  /** The runners people connect (each a runtime): registration, keys, heartbeats, what people change about one. */
  readonly runners: RunnerService;
  /** Which agents each runner may run and which runs one holds, for the runtimes pages. */
  readonly runnerView: RunnerView;
  /**
   * Jobs: deterministic steps runners execute without a model (a build), of the kinds the application registers; used
   * by the off-by-default runner build method.
   */
  readonly jobs: JobService;
  /** A runner's slots, shared by its runs and its jobs. */
  readonly slots: Slots;
  /** Wakes long-polling runners (and the online executor); notified whenever work may have arrived. */
  readonly signal: WorkSignal;
  /** The runner and CLI tarballs the application serves. */
  readonly dist: DistService;
  /** Short-lived tokens that let the install script download the CLI for one platform. */
  readonly downloadTokens: DownloadTokenService;
  readonly runs: RunService;
  readonly claims: ClaimService;
  readonly reports: RunnerReports;
  /** Marks silent runners offline, then takes back and ends the runs and jobs nobody will finish. */
  readonly sweeper: RunnerSweeper;
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
  /**
   * Online agents consulting each other (`ask_agent`): the `consultation` subject kind of runs, and where the
   * application adds rules to a consulted agent's brief (`rules.provide`).
   */
  readonly consultations: ConsultationService;
  /** The system default chat agent, and each person's default and "always confirm". */
  readonly chat: ChatSettingsService;
  /** Roles a new agent can start from, as the application registers them. */
  readonly presets: PresetRegistry;
  /**
   * Online agents, run by the application itself: the model services they call (`agModelServices`), the gateway that
   * calls their models (and the application's embedding, rerank and utility text calls: `embed`, `rerank`,
   * `generate`), and this instance's executor, which the provider starts at boot.
   */
  readonly online: {
    readonly services: ModelServices;
    readonly gateway: ModelGateway;
    readonly executor: ServerExecutor;
    /** Skills every online run gets besides its own, such as the CLI's: `register` one, a release removes it. */
    readonly skills: {
      register(skill: OnlineSkill): () => void;
      list(): readonly OnlineSkill[];
    };
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
  const transitions = { clock, subjects };
  const app = deps.app ?? defaultRunApp(deps.cli);
  const cli = resolveAgentCli(deps.cli, app);

  const people = createPeople();
  const dist = createDistService(deps.dist);
  const slots = createSlots(runsHeldBy, runsHeldByTool);
  const runners = createRunnerService({
    tx,
    ids,
    clock,
    app,
    people,
    latestRunner: async (runner) =>
      (await upgradeFor(dist, runner))?.latestVersion ?? null,
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
    models: () => gateway.catalog(),
    actionTypes: (key) =>
      actions.list().find((option) => option.key === key)?.types,
    owned: {
      openRuns: async (conn, agentId) =>
        (await openCounts(conn, [agentId])).get(agentId) ?? 0,
      clearVariables: (conn, agentId) =>
        variables.clear(conn, { scope: 'agent', scopeId: agentId }),
      withdrawQueued: async (unit, agentId, byUserId) => {
        await runs.withdrawQueued(
          { agentId, byUserId, detail: 'The agent was archived.' },
          unit,
        );
      },
    },
  });
  const availability = createAvailability({
    runners,
    openRuns: openCounts,
    models: gateway,
  });
  const runs = createRunService({
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
  });
  const sections = createBriefSectionRegistry();
  const mounts = createRunMountRegistry();
  const repoAccess = createRepoAccessRegistry();
  // The secrets claims hand out, so what runners report is redacted of them before it is stored.
  const secrets = createSecretMemory();
  const consultations = createConsultationService({
    tx,
    runs,
    mayInvoke: (agent, userId) => agents.mayInvoke(agent, userId),
    people,
  });
  subjects.register(consultations.binding);
  const builtInSkills = new Map<string, OnlineSkill>();
  const onlineSkills = {
    register(skill: OnlineSkill) {
      builtInSkills.set(skill.slug, skill);
      return () => {
        if (builtInSkills.get(skill.slug) === skill)
          builtInSkills.delete(skill.slug);
      };
    },
    list: () => [...builtInSkills.values()],
  };
  const claims = createClaimService({
    sections,
    mounts,
    repoAccess,
    dist,
    slotsUsed: (conn, runnerId) => slots.used(conn, runnerId),
    ...transitions,
    tx,
    ids,
    variables,
    skills,
    manifestUrl: deps.manifestUrl ?? '/api/cli/manifest',
    app,
    cli,
    secrets,
    onlineSkills: onlineSkills.list,
    consultations,
    onClaimFailure: (runId, error) =>
      onError(`Agents could not assemble run ${runId}.`, error),
    defaultModel: async (conn) =>
      (await modelServices.defaults(conn)).effectiveChat,
  });
  const reports = createRunnerReports({ ...transitions, tx, ids, secrets });
  const sweeper = createRunnerSweeper({
    clock,
    runners,
    runs: createSweeper({ ...transitions, tx, ids, runners }),
    jobs,
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
    tx,
    ids,
    clock,
    agents,
    runners,
    runs,
    people,
    settings: chat,
    contextKinds: createPageContextKinds(),
    models: gateway,
    attachments: chatAttachments.links,
    basePath,
  });
  subjects.register(conversations.binding);
  registerCoreContextKinds(conversations, agents, runs);
  const gate = createCallerGate();

  const executor = createServerExecutor(
    {
      clock,
      claims,
      reports,
      runs,
      conversations,
      consultations,
      images: (conversationId, ids, maxBytes) =>
        chatAttachments.service.images(conversationId, ids, maxBytes),
      commands: (identity, token) =>
        deps.commandsOf?.(identity, token) ?? Promise.resolve(undefined),
      skill: async (skill) => {
        const snapshot = await skills.snapshot(skill.slug, skill.hash);
        return {
          ...snapshot,
          name: skill.name,
          description: skill.description,
        };
      },
      builtInSkills: onlineSkills.list,
      gateway,
      signal,
      onError,
    },
    deps.server,
  );

  events.on('run.queued', () => signal.notify());
  events.on('run.requeued', () => signal.notify());
  events.on('agent.changed', () => signal.notify());
  events.on('job.queued', () => signal.notify());
  events.on('runner.changed', () => signal.notify());
  // The agent's text in a conversation becomes messages as the runner reports it; the run's end and reading the
  // messages catch up on anything missed here.
  events.on('run.events', (event) => {
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
    runs
      .get(event.runId)
      .then(async (run) => {
        // A consultation's changes show on the card of the conversation that asked it.
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
    events,
    tx,
    clock,
    agents,
    availability,
    app,
    cli,
    runners,
    runnerView: createRunnerView({ agents, subjects, tx }),
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
    reports,
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
    scopes: createScopeKinds(),
    subjects,
    gate,
    actions,
    reporting: createReportService({ tx, clock, people, subjects }),
    prices: createPriceService({ tx, ids, clock }),
    conversations,
    chatAttachments: chatAttachments.service,
    consultations,
    chat,
    presets: createPresetRegistry(() => actions.keys()),
    online: {
      services: modelServices,
      gateway,
      executor,
      skills: onlineSkills,
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
