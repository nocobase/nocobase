import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { BusinessKey, Scope } from '../shared/access.js';
import type { Agents } from './composition.js';

export type { Agents } from './composition.js';
export type { AgentService } from './core/agents/index.js';
export type {
  ActionGate,
  CallerGate,
  CallerIdentity,
  CallerKind,
} from './core/callers/index.js';
export {
  AGENTS_VIEW_ACTION,
  isConsultation,
  isReadingAction,
  RUN_SELF_ACTION,
} from './core/callers/index.js';
export type {
  ConsultationRules,
  ConsultationService,
} from './core/consultations/index.js';
export type {
  ConversationNews,
  ConversationRef,
  ConversationRuleLines,
  ConversationRules,
  ConversationRulesContext,
  ConversationService,
  ConversationSourceKind,
  PageContextResolver,
  ResolvedRef,
} from './core/conversations/index.js';
export type {
  AgentPresetDefinition,
  PresetRegistry,
} from './core/presets/index.js';
export type {
  ModelUsageEntry,
  ModelUsageRecorder,
  ReportCaller,
  ReportRange,
  ReportService,
} from './core/reports/index.js';
export type {
  EmbedRequest,
  EmbedResult,
  GenerateRequest,
  ModelEndpoint,
  RerankRequest,
  RerankResult,
  ModelMessage,
  ModelErrorCode,
  ModelEvent,
  ModelRequest,
  ModelToolCall,
  ModelToolSpec,
  ModelUsage,
  ModelGateway,
  ModelServices,
  ServerExecutor,
} from './online/index.js';
export { commandRef, dialectOf } from './core/runs/ports.js';
export {
  executionForViewer,
  runForViewer,
  type RunMachineViewer,
} from './core/runs/execution-view.js';
export {
  RUN_CREDENTIAL,
  runIdentityOf,
  type RunCredentialData,
} from './cli/run-credential.js';
export type {
  ScopeAccess,
  ScopeKind,
  ScopeKindRegistry,
} from './kernel/scopes.js';
export type {
  BriefPreviewer,
  BriefSectionProvider,
  BriefSectionRegistry,
  ClaimContext,
  CommandDialect,
  ExtensionPrepare,
  ContextProvider,
  EnqueueRequest,
  EnqueueResult,
  MountContext,
  MountOffer,
  NewInput,
  RepoAccessContext,
  RepoAccessProvider,
  RepoAccessRegistry,
  RunMountProvider,
  RunMountRegistry,
  RunService,
  SubjectAssembly,
  SubjectSample,
  SubjectBinding,
  SubjectDir,
  SubjectFacts,
  SubjectRegistry,
  SubjectReports,
  SubjectScope,
  WorkSink,
} from './core/runs/index.js';
export type { AgentAvailability, Availability } from './core/runs/index.js';
export type { Tx } from './kernel/tx.js';
export type {
  AgentsEvent,
  AgentsEventBus,
  RunnerNotice,
} from './kernel/events.js';
export type { DistConfig, DistService } from './distribution/index.js';
export type {
  BuildJobSpecInput,
  EnqueueJobInput,
  JobChange,
  JobEnvInput,
  JobKindRegistration,
  JobPrepareContext,
  JobRepoInput,
  JobSecretSource,
  JobService,
  JobSpecInput,
  JobSpecInputs,
  RegisteredJobKind,
  SecretRef,
} from './jobs/index.js';
export type {
  RunnerEnv,
  RunnerService,
  RunnerSweeper,
  Slots,
  SweepReport,
  WorkSignal,
} from './runners/index.js';
export type { PeopleSource } from './kernel/people.js';
export type {
  Embedder,
  VectorAvailability,
  VectorCollection,
  VectorCollectionSpec,
  VectorCollectionStatus,
  VectorFilter,
  VectorIndexInfo,
  VectorItem,
  VectorItemState,
  VectorMatch,
  VectorMetadata,
  VectorMetric,
  VectorProblem,
  Vectors,
  VectorsConfig,
  VectorsStatus,
  VectorSourceItem,
  VectorStore,
  VectorStoreContext,
  VectorStoreInfo,
  VectorStoreRegistry,
  VectorStoreType,
  VectorUnavailableCode,
} from './vectors/index.js';

export type { AgentsConfig } from './providers/agents.js';

/** The plugin's services, bound by `AgentsProvider`. */
export const agentsToken: ServiceToken<Agents> = createServiceToken<Agents>(
  '@nocobase/app-plugin-agents/agents',
);

/**
 * How far a caller's business actions reach (`BUSINESS_ACTIONS` in `shared/access.ts`), from the roles the application
 * keeps. Resolved on each request, so it may be bound after this plugin registers. Unbound, every level is `none` and
 * only managing agents (the `agents.agents` settings item) lets anyone change agents and skills.
 */
export interface AgentsAccess {
  /** The level of `key` for the caller, decided before any transaction opens. */
  scopeOf(identity: AuthorizationIdentity, key: BusinessKey): Promise<Scope>;
}

export const agentsAccessToken: ServiceToken<AgentsAccess> =
  createServiceToken<AgentsAccess>('@nocobase/app-plugin-agents/access');
