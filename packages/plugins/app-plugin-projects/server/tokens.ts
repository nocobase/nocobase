import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { Context } from 'hono';

import type { Permissions } from '../shared/access.js';
import type { Plan, PlanRowInput } from '../shared/plans.js';
import type { Viewer } from './access/viewer.js';
import type { Actor } from './kernel/actor.js';
import type { Projects } from './composition.js';
import type { IssueTriggers } from './domains/issues/index.js';
import type { NoticeRules } from './domains/notices/index.js';
import type { PlanHooks, PlanSourceOf } from './domains/plans/ports.js';
import type { IntakeOrganizer } from './domains/plans/intake/index.js';
import type { KindRegistry } from './kernel/kinds.js';
import type {
  StatusRuleTypes,
  WorkflowEventTypes,
  WorkflowTemplates,
} from './domains/workflows/index.js';

export type { Projects } from './composition.js';
export type {
  ExecutorDescription,
  ExecutorDirectory,
  KindRegistry,
  MentionDirectory,
  PrincipalKind,
} from './kernel/kinds.js';
export {
  collectRunAttempts,
  type IssueWorkHandler,
  type RunAttempt,
  type RunAttemptSkip,
  type WorkWithdrawal,
} from './kernel/work.js';
export { DomainError, type DomainErrorKind } from './kernel/errors.js';
export type {
  EnteredStatus,
  StatusRuleCheck,
  StatusRuleDescription,
  StatusRuleEntry,
  StatusRuleOutcome,
  StatusRuleRefusal,
  StatusRuleType,
  StatusRuleTypes,
  WorkflowEventFiring,
  WorkflowEventMove,
  WorkflowEventService,
  WorkflowEventTarget,
  WorkflowEventType,
  WorkflowEventTypes,
  WorkflowTemplate,
  WorkflowTemplateInstaller,
  WorkflowTemplateText,
  WorkflowTemplates,
} from './domains/workflows/index.js';
export type { Actor, ActorTrace, ActorVia } from './kernel/actor.js';
export type { Tx as ProjectsTx } from './kernel/tx.js';
export type { Viewer } from './access/viewer.js';
export type { ProjectAccessInfo } from './domains/projects/index.js';
export type {
  AgentBlock,
  AttentionIssue,
  AttentionList,
  CompletedIssue,
  IssueAttention,
  IssueFacts,
  IssueFlow,
  IssueReport,
  IssueReportQuery,
  IssueReports,
  ProjectProgress,
  ReturnedIssue,
  WipCount,
} from './domains/reports/index.js';
export type {
  IssueContext,
  IssueContextDirectory,
  IssueContextFile,
  IssueContextProvider,
  IssueMatches,
  IssueMatchScope,
  IssueQueries,
} from './domains/issues/index.js';
export type {
  AttachmentContent,
  AttachmentService,
} from './domains/attachments/index.js';
export type {
  CommentChange,
  IssueChange,
  IssueTriggers,
} from './domains/issues/index.js';
export type {
  CommentReader,
  CommentWriteOptions,
  CommentWriter,
} from './domains/comments/index.js';
export type {
  CreatePlanOptions,
  PlanHooks,
  PlanService,
} from './domains/plans/ports.js';
export type { ApprovalService } from './domains/approvals/index.js';
export type {
  IntakeAiService,
  IntakeDeliverer,
  IntakeOrganizer,
  OrganizerAvailability,
  OrganizerJobRef,
  OrganizerProgress,
} from './domains/plans/intake/index.js';
export type {
  NoticeRule,
  NoticeRuleContext,
  NoticeRules,
  NoticeSlot,
  PlannedNotice,
} from './domains/notices/index.js';

/** The plugin's services, bound by `ProjectsProvider`. */
export const projectsToken: ServiceToken<Projects> =
  createServiceToken<Projects>('@nocobase/app-plugin-projects/projects');

/**
 * The kinds of principal that act on issues or are named in them (`kernel/kinds.ts`). `user` and `system` are built
 * in; a plugin adds its own with `add()` in its `register()` or `boot()`, before the plugin's services are first used.
 */
export const projectsKindsToken: ServiceToken<KindRegistry> =
  createServiceToken<KindRegistry>('@nocobase/app-plugin-projects/kinds');

/**
 * What a change or a comment starts. Unbound, each change goes to the work handlers of the kinds it concerns
 * (`PrincipalKind.work`, `kernel/work.ts`), which is how an agent runtime starts work; binding it replaces that
 * altogether. Resolved on each use, so it may be bound after this plugin registers.
 */
export const projectsTriggersToken: ServiceToken<IssueTriggers> =
  createServiceToken<IssueTriggers>('@nocobase/app-plugin-projects/triggers');

/**
 * Status rule types other plugins contribute (`domains/workflows/rule-types.ts`): what entering a status does, and the
 * conditions for entering it (`canEnter`, asked by every move), beyond the built-in rules. Looked up on each use, so a
 * plugin may add its types in `boot()`.
 */
export const projectsStatusRulesToken: ServiceToken<StatusRuleTypes> =
  createServiceToken<StatusRuleTypes>(
    '@nocobase/app-plugin-projects/status-rules',
  );

/**
 * Workflow events other plugins contribute (`domains/workflows/event-types.ts`): a key such as `acme.merged` and the
 * categories of status a transition on it may leave and enter. A workflow names it on a transition's `on`; its plugin
 * fires it for a batch of issues with `projectsToken`'s `workflowEvents.fire`. Looked up on each use; add an event
 * before a template that uses it, since a template is validated when it is installed.
 */
export const projectsWorkflowEventsToken: ServiceToken<WorkflowEventTypes> =
  createServiceToken<WorkflowEventTypes>(
    '@nocobase/app-plugin-projects/workflow-events',
  );

/**
 * Workflow templates other plugins contribute (`domains/workflows/templates.ts`): each is installed once as a
 * workflow, at boot or when added later. `installed()` waits for the templates added so far.
 */
export const projectsWorkflowTemplatesToken: ServiceToken<WorkflowTemplates> =
  createServiceToken<WorkflowTemplates>(
    '@nocobase/app-plugin-projects/workflow-templates',
  );

/**
 * What hears a plan being decided (`PlanHooks`, `shared/plans.ts`): the agents plugin binds it to wake the conversation
 * that proposed the plan. Resolved on each use; unbound, decisions are only recorded.
 */
export const projectsPlanHooksToken: ServiceToken<PlanHooks> =
  createServiceToken<PlanHooks>('@nocobase/app-plugin-projects/plan-hooks');

/**
 * Who organises requirement intake with AI (`IntakeOrganizer`, `shared/intake-ai.ts`): the application binds it (the assembling application:
 * an agent run on a runner). Resolved on each use; unbound, the AI draft tab offers the rule split only.
 */
export const projectsIntakeOrganizerToken: ServiceToken<IntakeOrganizer> =
  createServiceToken<IntakeOrganizer>(
    '@nocobase/app-plugin-projects/intake-organizer',
  );

/** Where other plugins add notice rules; they join the plugin's own in each transaction (`domains/notices`). */
export const projectsNoticeRulesToken: ServiceToken<NoticeRules> =
  createServiceToken<NoticeRules>('@nocobase/app-plugin-projects/notice-rules');

/**
 * Roles as the plugin needs them. The application that assembles the plugin keeps the roles (for example, `server/
 * access`) and binds this token; the plugin never reads permission sets itself.
 */
export interface ProjectsAccess {
  /** What a signed-in user may do, decided once per request before any transaction opens. */
  permissionsOf(identity: AuthorizationIdentity): Promise<Permissions>;
  /** Gives someone who becomes a member the application's default role, once; runs in the caller's transaction. */
  admit(conn: DatabaseConnection, userId: string): Promise<void>;
  /** After commit: tells sessions and caches that the user's roles changed. */
  changed(userId: string): Promise<void>;
  /** Active users holding an administrator role, who approve where a workflow asks an administrator. */
  administrators(conn: DatabaseConnection): Promise<readonly string[]>;
  /**
   * What another user may do, for telling only those who may see an issue about it. Run after commit. Without it,
   * notices are not filtered by who may see the issue.
   */
  permissionsOfUser?(userId: string): Promise<Permissions>;
}

export const projectsAccessToken: ServiceToken<ProjectsAccess> =
  createServiceToken<ProjectsAccess>('@nocobase/app-plugin-projects/access');

/** What a notice is about: a decision someone must take, or information. */
export type ProjectNoticeKind = 'decision' | 'info';

export type ProjectNoticeType =
  | 'owner_notified'
  | 'approval_requested'
  | 'approval_decided'
  | 'approval_stale'
  | 'commented'
  | 'mentioned'
  | 'status_changed'
  | 'owner_assigned'
  | 'executor_assigned'
  | 'dependency_released'
  | 'batch_done'
  // Other plugins' types.
  | (string & {});

/** One thing to tell people, already worded in the application's default language. */
export interface ProjectNotice {
  /** Idempotency key: sending the same notice twice delivers it once. */
  readonly key: string;
  readonly kind: ProjectNoticeKind;
  readonly type: ProjectNoticeType;
  readonly userIds: readonly string[];
  readonly title: string;
  readonly body: string;
  /** An app route, such as `/issues/PM-12`. */
  readonly path: string;
  readonly issue: { readonly id: string; readonly identifier: string };
  /** The approval request a decision (or its outcome) is about. */
  readonly approvalRequestId?: string;
  /** Notices of the same group and recipient merge into one inbox item, counted. */
  readonly group?: string;
  /** Who did what the notice tells. */
  readonly actor?: {
    readonly type: string;
    readonly id: string | null;
    readonly name: string | null;
  };
  /**
   * What the title says, as values, so an inbox can word it in each reader's language: `identifier`, `status` (a
   * status key), `statusName` (its name in the workflow), for a decided request `outcome`, for a release
   * `releasedByIdentifier`, for a finished stage `stage`, and for the collaboration notices `actorName`, `excerpt`,
   * `source` (`comment` or `description`), `commentId`, `from` and `fromName`; for an owner told with a keyed
   * message (`LocalizedMessage`) `messageKey`, `messageNs` and `messageDefault`, the body being its default-language
   * wording.
   */
  readonly params?: Readonly<Record<string, string>>;
}

export type ProjectDecisionOutcome =
  'approved' | 'rejected' | 'withdrawn' | 'stale';

/**
 * Where notices go. The application that assembles the plugin may bind this token to keep its own inbox (the assembling application:
 * `server/inbox`); without it the plugin sends straight to the notification plugin's in-app channel.
 */
export interface ProjectsNotices {
  send(notice: ProjectNotice): Promise<void>;
  /** The decision `approvalRequestId` asked for is no longer pending. */
  resolve(ref: {
    readonly approvalRequestId: string;
    readonly outcome: ProjectDecisionOutcome;
  }): Promise<void>;
}

export const projectsNoticesToken: ServiceToken<ProjectsNotices> =
  createServiceToken<ProjectsNotices>('@nocobase/app-plugin-projects/notices');

/**
 * Who acts in a request when it is not simply the signed-in person: the application decides from the request's
 * credential, such as an agent's run token (for example, the agent itself, or the person via the agent in a conversation).
 * Undefined leaves the person. Resolved on each request; unbound, the person always acts.
 */
export type RequestActor = (context: Context) => Promise<Actor | undefined>;

export const projectsRequestActorToken: ServiceToken<RequestActor> =
  createServiceToken<RequestActor>(
    '@nocobase/app-plugin-projects/request-actor',
  );

/** A write the API was asked for, as the rows of an operation plan. */
export interface DelegatedWriteRequest {
  /** What the change is, in a few words: the plan's title. */
  readonly title: string;
  readonly rows: readonly PlanRowInput[];
}

/** A delegated write that was made: the plan that made it, and what the route adds to its answer's `meta`. */
export interface DelegatedWrite {
  readonly plan: Plan;
  readonly meta: Readonly<Record<string, unknown>>;
}

/**
 * Writes of a viewer acting for someone else, such as an agent in a person's conversation: the issue, comment and
 * dependency routes hand such a write to `write`, which makes it as an undoable plan of the person's within whatever
 * limits the application sets, or refuses it with a `DomainError`. The routes answer what the plan made, with `meta`
 * beside it. Resolved on each request; unbound, every write goes straight through the services.
 */
export interface DelegatedWrites {
  covers(viewer: Viewer): boolean;
  write(
    viewer: Viewer,
    request: DelegatedWriteRequest,
  ): Promise<DelegatedWrite>;
}

export const projectsDelegatedWritesToken: ServiceToken<DelegatedWrites> =
  createServiceToken<DelegatedWrites>(
    '@nocobase/app-plugin-projects/delegated-writes',
  );

export type { PlanSourceOf } from './domains/plans/ports.js';

/**
 * Where the plans a request proposes come from when the application decides it rather than the caller, such as an
 * agent in a person's conversation (`PlanSourceOf`). Resolved on each request; unbound, every caller names its own.
 */
export const projectsPlanSourceToken: ServiceToken<PlanSourceOf> =
  createServiceToken<PlanSourceOf>('@nocobase/app-plugin-projects/plan-source');

export { PLANS_USE_ACTION } from './domains/plans/index.js';
