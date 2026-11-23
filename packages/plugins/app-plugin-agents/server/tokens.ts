export { SkillIdsSchema } from './core/skills/skill.service.js';
export { ONLINE_AGENT_CREDENTIAL } from './cli/online-credential.js';
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { BusinessKey, Scope } from '../shared/access.js';
import type { Skill, SkillScope } from '../shared/skills.js';
import type { Agents } from './composition.js';

export type { Agents } from './composition.js';
export type {
  ModelSelectionPolicies,
  ModelSelectionPolicy,
} from './core/runs/selection.js';
export type { AgentDefaults, AgentService } from './core/agents/index.js';
export { runnerAgentId } from './core/agents/index.js';
export type {
  ActionGate,
  CallerGate,
  CallerIdentity,
  CallerKind,
} from './core/callers/index.js';
export {
  AGENTS_VIEW_ACTION,
  isReadingAction,
  RUN_SELF_ACTION,
} from './core/callers/index.js';
export type {
  ConversationLinkKind,
  ConversationLinks,
  ConversationLinkTarget,
  ConversationNews,
  ConversationRef,
  ConversationWorkspaceProvider,
  ConversationRuleLines,
  ConversationRules,
  ConversationRulesContext,
  ConversationService,
  ConversationSourceKind,
  PageContextResolver,
  ResolvedRef,
} from './core/conversations/index.js';
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
} from './online/index.js';
export { commandRef } from './core/runs/ports.js';
export { RepoAccessError } from './core/runs/extensions.js';
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
  ExtensionPrepare,
  ContextProvider,
  EnqueueRequest,
  EnqueueResult,
  RunEnqueued,
  RunRequestPending,
  RunRequestFilter,
  RunRequestReassignment,
  RunRequestService,
  RequestedRun,
  MountContext,
  MountOffer,
  NewInput,
  NpmCredentialProvider,
  NpmCredentialRegistry,
  NpmCredentialRequest,
  RepoAccessContext,
  RepoAccessProvider,
  RepoAccessRegistry,
  RepoCredentialGrant,
  RepoCredentialRequest,
  RepoPrepareOptions,
  RunMountProvider,
  RunMountRegistry,
  RunService,
  SubjectAssembly,
  SubjectSample,
  SubjectBinding,
  SubjectVisibility,
  SubjectDir,
  SubjectFacts,
  SubjectRegistry,
  SubjectReports,
  SubjectWorkspaces,
  SubjectScope,
  WorkSink,
  CancelRequest,
} from './core/runs/index.js';
export type { AgentAvailability, Availability } from './core/runs/index.js';
export type { Tx } from './kernel/tx.js';
export type {
  AgentsEvent,
  AgentsEventBus,
  AgentsNotice,
} from './kernel/events.js';
export type {
  DistConfig,
  DistNpmSource,
  DistService,
} from './distribution/index.js';
export { JobSecretsNotAllowed } from './jobs/index.js';
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

/**
 * What an application keeps people from doing to skills through the admin API, read from each skill (its `metadata`
 * above all): editing (saving, restoring a version, importing over it), deleting, and attaching it to a scope's
 * default skills. Every answer is on top of the caller's own permissions, for every caller including managers; a
 * missing method allows. The application's own code changing skills through the service is not affected. Unbound,
 * nothing is refused. A refusal answers 403 `SKILL_PROTECTED`.
 */
export interface SkillPolicy {
  readonly canEdit?: (skill: Skill) => boolean | Promise<boolean>;
  readonly canDelete?: (skill: Skill) => boolean | Promise<boolean>;
  /** Only a skill newly attached to the target is asked about; one attached before stays as it is. */
  readonly canAttach?: (
    skill: Skill,
    target: { readonly scope: SkillScope; readonly scopeId: string },
  ) => boolean | Promise<boolean>;
}

export const skillPolicyToken: ServiceToken<SkillPolicy> =
  createServiceToken<SkillPolicy>('@nocobase/app-plugin-agents/skill-policy');
