/**
 * The one place the plugin's services are assembled from their dependencies. The provider binds the result to
 * `projectsToken`; tests call it directly against a real database.
 *
 * What a change or a comment starts (triggers) comes from `deps.triggers` when a plugin binds them, otherwise from the
 * work handlers of the registered kinds (`kernel/work.ts`). Notices are planned in each transaction (`domains/notices`).
 * The kinds of principal (`kernel/kinds.ts`) come from `projectsKindsToken`, where other plugins register theirs.
 */
import type { DatabaseManager } from '@nocobase/db';

import type { ProjectsAccess } from './tokens.js';

import {
  createActivityRecorder,
  type ActivityRecorder,
} from './kernel/activity.js';
import { createKindRegistry, type KindRegistry } from './kernel/kinds.js';
import { createDomainEventBus, type DomainEventBus } from './kernel/events.js';
import { createIdSource } from './kernel/ids.js';
import { createTxRunner, type TxRunner } from './kernel/tx.js';
import { createUserDirectory } from './kernel/users.js';
import { kindTriggers } from './kernel/work.js';
import {
  createIssueContextProvider,
  createIssueQueries,
  createIssueService,
  createProjectIssues,
  type IssueContextProvider,
  type IssueQueries,
  type IssueService,
  type IssueTriggers,
} from './domains/issues/index.js';
import {
  createCommentQueries,
  createCommentService,
  threadPage,
  type CommentQueries,
  type CommentService,
} from './domains/comments/index.js';
import {
  builtInRules,
  createNoticePlanner,
  type NoticeRules,
} from './domains/notices/index.js';
import {
  createSubscriptionService,
  type SubscriptionService,
} from './domains/subscriptions/index.js';
import {
  createInvitationService,
  type InvitationService,
  type UserInvitations,
} from './domains/invitations/index.js';
import {
  createLabelService,
  type LabelService,
} from './domains/labels/index.js';
import {
  createMemberService,
  type MemberService,
} from './domains/members/index.js';
import {
  createProjectService,
  type ProjectService,
} from './domains/projects/index.js';
import {
  createSettingsService,
  type SettingsService,
} from './domains/settings/index.js';
import {
  createStatusEventService,
  createStatusEventTypes,
  createStatusService,
  type StatusEventService,
  type StatusEventTypes,
} from './domains/statuses/index.js';
import type { StatusService } from './domains/issues/index.js';
import {
  createIssueReports,
  type IssueReports,
} from './domains/reports/index.js';
import {
  createSubtaskService,
  type SubtaskService,
} from './domains/subtasks/index.js';
import {
  createPlanEngine,
  createPlanService,
  type PlanHooks,
  type PlanService,
} from './domains/plans/index.js';
import {
  createIntakeAiService,
  createIntakeFileStore,
  createIntakeService,
  intakeFilesHook,
  intakeFilesToKeep,
  type IntakeAiService,
  type IntakeOrganizer,
  type IntakeService,
} from './domains/plans/intake/index.js';
import { noAbilities, noSettings } from '../shared/access.js';
import {
  createAttachmentService,
  createAttachmentStorage,
  type AttachmentService,
  type AttachmentStorage,
} from './domains/attachments/index.js';

export interface ProjectsDeps {
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  readonly idGenerator: { generateString(): string };
  /** The roles, kept by the application (`projectsAccessToken`). */
  readonly access: ProjectsAccess;
  /** The user management plugin's invitations. */
  readonly invitations: UserInvitations;
  /** The kinds of principal; built-in kinds only when left out. */
  readonly kinds?: KindRegistry;
  /** Status events other plugins contribute (`projectsStatusEventsToken`); none when left out. */
  readonly statusEvents?: StatusEventTypes;
  /**
   * What a change or a comment starts, asked on each use; when left out or when it answers undefined, the work handlers
   * of the registered kinds.
   */
  readonly triggers?: () => IssueTriggers | undefined;
  /** What hears plans being decided (`projectsPlanHooksToken`), asked on each use. */
  readonly planHooks?: () => PlanHooks | undefined;
  /** Who organises intake with AI (`projectsIntakeOrganizerToken`), asked on each use; none when left out. */
  readonly intakeOrganizer?: () => IntakeOrganizer | undefined;
  /** Where files' bytes go (the file plugin and Drive); without it nothing can be uploaded. */
  readonly storage?: AttachmentStorage;
  /** The application's public base path, for the files' content URLs; empty when left out. */
  readonly basePath?: () => string;
  readonly onListenerError?: (error: unknown) => void;
}

export interface Projects {
  /** Application-owned issue events, recorded in the transaction that caused them. */
  readonly activity: ActivityRecorder;
  readonly events: DomainEventBus;
  readonly tx: TxRunner;
  readonly members: MemberService;
  readonly invitations: InvitationService;
  readonly settings: SettingsService;
  readonly labels: LabelService;
  /** The fixed statuses (`shared/statuses.ts`) and where each kind may move an issue. */
  readonly statuses: StatusService;
  readonly projects: ProjectService;
  readonly issues: IssueService;
  readonly issueQueries: IssueQueries;
  /** An issue as an executor of another kind needs it, read on the caller's connection. */
  readonly issueContext: IssueContextProvider;
  readonly comments: CommentService;
  readonly commentQueries: CommentQueries;
  readonly subscriptions: SubscriptionService;
  /** Files on issues and comments (`shared/attachments.ts`). */
  readonly attachments: AttachmentService;
  /** Where files' bytes go; the intake stores its files through it too. */
  readonly storage: AttachmentStorage;
  /** Where other plugins add notice rules (`projectsNoticeRulesToken`). */
  readonly noticeRules: NoticeRules;
  readonly subtasks: SubtaskService;
  /** Operation plans (`shared/plans.ts`). */
  readonly plans: PlanService;
  /** Requirement intake: files, their text and the rule split (`shared/intake.ts`). */
  readonly intake: IntakeService;
  /** Requirement intake with AI, through the bound organiser (`shared/intake-ai.ts`). */
  readonly intakeAi: IntakeAiService;
  readonly kinds: KindRegistry;
  /** Contributed status events: their registry, and firing one for a batch of issues. */
  readonly statusEvents: StatusEventService;
  /** The issue side of the reports: counts over a date range, limited to what a viewer sees. */
  readonly reports: IssueReports;
}

export function createProjects(deps: ProjectsDeps): Projects {
  const events = createDomainEventBus({
    onListenerError: (error) => deps.onListenerError?.(error),
  });
  const tx = createTxRunner(deps.database, events);
  const ids = createIdSource(deps.idGenerator);
  const users = createUserDirectory();
  const activity = createActivityRecorder(ids);
  const kinds = deps.kinds ?? createKindRegistry(users);
  const eventTypes = deps.statusEvents ?? createStatusEventTypes();

  const settings = createSettingsService({ tx });
  const labels = createLabelService({ tx, ids });
  const statuses = createStatusService({
    kinds,
    events: eventTypes,
    activity,
  });
  const defaultTriggers = kindTriggers(kinds, {
    activity,
    blockers: (conn, issue) => subtasks.blockersOf(conn, issue),
  });
  const triggers = (): IssueTriggers => deps.triggers?.() ?? defaultTriggers;
  const subscriptions = createSubscriptionService({ tx, ids, users });
  const storage =
    deps.storage ??
    createAttachmentStorage({
      uploader: () => null,
      disks: () => null,
      disk: () => 'local',
    });
  const attachments = createAttachmentService({
    tx,
    activity,
    kinds,
    storage,
    basePath: deps.basePath ?? (() => ''),
    keep: intakeFilesToKeep,
  });
  const comments = createCommentService({
    tx,
    ids,
    activity,
    kinds,
    triggers,
    attachments: () => attachments.links,
  });
  const commentQueries = createCommentQueries({
    tx,
    kinds,
    attachments: () => attachments.links,
  });
  const issueContext = createIssueContextProvider({
    kinds,
    statuses,
    extras: () => ({
      attachments: (conn, viewer, issue) =>
        attachments.links.ofIssue(conn, viewer, issue),
    }),
    comments: (conn, issueId) => commentQueries.list(conn, issueId),
  });
  const notices = createNoticePlanner({
    subscriptions,
    kinds,
    rules: [builtInRules()],
  });
  tx.beforeCommit((unit, events) => notices.plan(unit, events));
  const issues: IssueService = createIssueService({
    tx,
    ids,
    activity,
    settings,
    users,
    kinds,
    labels,
    statuses,
    triggers,
    relations: () => subtasks.relations,
  });
  const subtasks: SubtaskService = createSubtaskService({
    tx,
    ids,
    activity,
    kinds,
    statuses,
    triggers,
  });
  const projectIssues = createProjectIssues({ activity, statuses });
  const projects = createProjectService({
    tx,
    ids,
    users,
    issues: () => projectIssues,
  });
  const plans = createPlanService({
    tx,
    ids,
    kinds,
    users,
    engine: createPlanEngine({
      tx,
      kinds,
      services: { issues, comments, subtasks, projects, statuses },
      onError: (error) => console.error('A plan row failed.', error),
    }),
    hooks: () => deps.planHooks?.(),
    onExecuted: {
      intake: intakeFilesHook({ links: attachments.links, activity }),
    },
    ...(deps.access.permissionsOfUser
      ? {
          permissionsOfUser: (userId: string) =>
            (
              deps.access.permissionsOfUser as NonNullable<
                ProjectsAccess['permissionsOfUser']
              >
            )(userId),
        }
      : {}),
  });
  const issueQueries = createIssueQueries({
    tx,
    users,
    kinds,
    statuses,
    extras: () => ({
      threads: (conn, issue, viewer) =>
        threadPage(conn, kinds, issue.id, {}, attachments.links, viewer),
      attachments: (conn, viewer, issue) =>
        attachments.links.ofIssue(conn, viewer, issue),
      subscribers: (conn, issue) => subscriptions.subscribers(conn, issue.id),
      relations: (conn, viewer, issue) =>
        subtasks.extras.relations(conn, viewer, issue),
      listCounts: (conn, issues, readableIds) =>
        subtasks.extras.listCounts(conn, issues, readableIds),
    }),
  });
  const intakeFiles = createIntakeFileStore({
    conn: () => tx.read(),
    storage,
  });
  const intake = createIntakeService({
    plans,
    labels: () => labels.list(),
    files: intakeFiles,
  });
  const intakeAi = createIntakeAiService({
    tx,
    ids,
    kinds,
    plans,
    projects,
    issueQueries,
    labels: () => labels.list(),
    files: intakeFiles,
    viewerOf: async (userId) => ({
      userId,
      actor: { type: 'user', id: userId },
      permissions: (await deps.access.permissionsOfUser?.(userId)) ?? {
        scopes: noAbilities(),
        settings: noSettings(),
      },
    }),
    organizer: () => deps.intakeOrganizer?.(),
  });
  const members = createMemberService({
    tx,
    ids,
    users,
    roles: deps.access,
    kinds,
  });
  return {
    activity,
    events,
    tx,
    settings,
    labels,
    statuses,
    members,
    invitations: createInvitationService({
      tx,
      ids,
      members,
      invitations: deps.invitations,
    }),
    projects,
    issues,
    issueQueries,
    issueContext,
    comments,
    commentQueries,
    subscriptions,
    attachments: attachments.service,
    storage,
    noticeRules: { add: (rule) => notices.add(rule) },
    subtasks,
    plans,
    intake,
    intakeAi,
    kinds,
    statusEvents: createStatusEventService({
      tx,
      types: eventTypes,
      issues: () => issues,
    }),
    reports: createIssueReports({ tx }),
  };
}
