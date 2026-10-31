/**
 * The input of every `/projects` route. Bodies are strict; the services still check what depends on stored data
 * (lengths, references, permissions) and answer with their own reasons.
 */
import type { OpenAPIV3_1 } from '@nocobase/app-server/router';
import { z } from 'zod';
import { CommentMessageSchema } from '../domains/comments/comment.message.js';

import {
  BUSINESS_KEYS,
  SETTINGS_KEYS,
  type BusinessKey,
  type Permissions,
  type SettingsKey,
} from '../../shared/access.js';
import {
  ATTACHMENTS_PER_REQUEST_MAX,
  type Attachment,
  type DiscardAttachmentsRequest,
  type IssueScreenshot,
  type IssueScreenshots,
} from '../../shared/attachments.js';
import {
  REACTION_EMOJIS,
  type CommentReaction,
  type CommentReactions,
  type CommentThread,
  type CreateCommentRequest,
  type CreateCommentResult,
  type IssueComment,
  type MentionCandidate,
  type MentionRef,
  type ThreadResolution,
  type UpdateCommentRequest,
} from '../../shared/comments.js';
import { COLORS, PRIORITIES, type UserRef } from '../../shared/common.js';
import {
  INTAKE_AI_MODES,
  INTAKE_AI_STATUSES,
  type IntakeAiAvailability,
  type IntakeAiJob,
  type IntakeAiStartRequest,
} from '../../shared/intake-ai.js';
import type {
  IntakeFile,
  IntakeSplitRequest,
  IntakeSplitResult,
  IntakeTextsRequest,
  IntakeTextsResult,
} from '../../shared/intake.js';
import type {
  CreateInvitationsRequest,
  Invitation,
  InvitationResult,
} from '../../shared/invitations.js';
import {
  ISSUE_IDS_MAX,
  type Activity,
  type CreateIssueRequest,
  type Executor,
  type Issue,
  type IssueSummary,
  type IssueBoard,
  type IssueDetail,
  type IssueListItem,
  type IssueListQuery,
  type IssueSort,
  type StatusDefinition,
  type UpdateIssueRequest,
  type UpdateIssueResult,
} from '../../shared/issues.js';
import type { ExecutorCandidate } from '../../shared/kinds.js';
import type {
  CreateLabelRequest,
  Label,
  UpdateLabelRequest,
} from '../../shared/labels.js';
import type { ApiKeyActor, Me, Member } from '../../shared/members.js';
import {
  PLAN_OPS,
  PLAN_RISK_FLAGS,
  PLAN_STATUSES,
  PLAN_UNDO_OPS,
  type ActivityVia,
  type ActivityExecution,
  type CreatePlanRequest,
  type EditPlanRequest,
  type Plan,
  type PlanActionRequest,
  type PlanListQuery,
  type PlanObjectRef,
  type PlanRehearsal,
  type PlanRowCheck,
  type PlanRowInput,
  type PlanUndoPreview,
  type PlanUndoRequest,
  type PlanWake,
} from '../../shared/plans.js';
import {
  PROJECT_RESOURCE_TYPES,
  PROJECT_STATUSES,
  PROJECT_VISIBILITIES,
  type AddProjectMemberRequest,
  type CreateProjectRequest,
  type CreateProjectResourceRequest,
  type ProjectDetail,
  type ProjectListItem,
  type ProjectResource,
  type UpdateProjectRequest,
  type UpdateProjectResourceRequest,
} from '../../shared/projects.js';
import type {
  UpdateSettingsRequest,
  WorkspaceSettings,
} from '../../shared/settings.js';
import {
  SUBSCRIPTION_REASONS,
  type SubscriptionState,
} from '../../shared/subscriptions.js';
import {
  DEPENDENCY_TYPES,
  type AddDependencyRequest,
  type DependencyType,
  type IssueDependency,
  type UpdateDependencyRequest,
} from '../../shared/subtasks.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
const MAX_PAGE_TOKEN_LENGTH = 2048;

const id = z.string().min(1);
/** A query value; `''` is read as absent, as the browser's forms send it. */
const text = z
  .string()
  .optional()
  .transform((value) => (value === '' ? undefined : value));
const pageToken = z.string().min(1).max(MAX_PAGE_TOKEN_LENGTH).optional();
const pageSize = (max: number = MAX_PAGE_SIZE) =>
  z.coerce.number().int().min(1).max(max).default(DEFAULT_PAGE_SIZE);
const boolean = z.enum(['true', 'false']).optional();
const priority = z.enum(PRIORITIES);
/** `YYYY-MM-DD`; the services check that it is a real date. */
const date = z.string().nullable();
const executor = z.strictObject({ type: id, id }).nullable();

const isObject = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Path parameters

export const ProjectParams: z.ZodType<{ projectId: string }> = z.object({
  projectId: id.describe('The project identifier.'),
});
export const ProjectMemberParams: z.ZodType<{
  projectId: string;
  userId: string;
}> = z.object({
  projectId: id.describe('The project identifier.'),
  userId: id.describe('The user identifier.'),
});
export const ProjectResourceParams: z.ZodType<{
  projectId: string;
  resourceId: string;
}> = z.object({
  projectId: id.describe('The project identifier.'),
  resourceId: id.describe('The resource identifier.'),
});
export const IssueParams: z.ZodType<{ issueId: string }> = z.object({
  issueId: id.describe('The issue identifier.'),
});
export const DependencyParams: z.ZodType<{
  issueId: string;
  dependencyId: string;
}> = z.object({
  issueId: id.describe('The issue identifier.'),
  dependencyId: id.describe('The dependency identifier.'),
});
export const CommentParams: z.ZodType<{ commentId: string }> = z.object({
  commentId: id.describe('The comment identifier.'),
});
export const LabelParams: z.ZodType<{ labelId: string }> = z.object({
  labelId: id.describe('The label identifier.'),
});
export const InvitationParams: z.ZodType<{ invitationId: string }> = z.object({
  invitationId: id.describe('The invitation identifier.'),
});
export const PlanParams: z.ZodType<{ planId: string }> = z.object({
  planId: id.describe('The plan identifier.'),
});
export const IntakeFileParams: z.ZodType<{ fileId: string }> = z.object({
  fileId: id.describe('The file identifier.'),
});
export const IntakeJobParams: z.ZodType<{ jobId: string }> = z.object({
  jobId: id.describe('The job identifier.'),
});
export const AttachmentParams: z.ZodType<{ attachmentId: string }> = z.object({
  attachmentId: id.describe('The attachment identifier.'),
});

export const DiscardAttachmentsBody: z.ZodType<DiscardAttachmentsRequest> =
  z.strictObject({
    attachmentIds: z.array(id).min(1).max(ATTACHMENTS_PER_REQUEST_MAX),
  });

// Members and mentions

export interface MentionCandidatesQuery {
  readonly q?: string;
  readonly issueId?: string;
  readonly limit: number;
}

/** `GET /projects/mentionCandidates`: one short page of the `@` list, at most 20. */
export const MentionCandidatesQuery: z.ZodType<MentionCandidatesQuery> = z
  .object({
    q: text.describe('Text to search for.'),
    issueId: text.describe('The issue identifier.'),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(8)
      .describe('The maximum number of records to return.'),
  })
  .transform(({ q, issueId, pageSize: limit }) => ({
    ...(q ? { q } : {}),
    ...(issueId ? { issueId } : {}),
    limit,
  }));

export const CreateInvitationsBody: z.ZodType<CreateInvitationsRequest> =
  z.strictObject({
    emails: z.array(z.string()).describe('The email addresses to invite.'),
    projectIds: z
      .array(id)
      .optional()
      .describe('Projects the invited members may join.'),
  });

export const UpdateSettingsBody: z.ZodType<UpdateSettingsRequest> =
  z.strictObject({
    issuePrefix: z
      .string()
      .optional()
      .describe('The prefix used for new issue identifiers.'),
  });

// Labels

export const CreateLabelBody: z.ZodType<CreateLabelRequest> = z.strictObject({
  name: z.string().describe('The name to display.'),
  color: z.enum(COLORS).optional().describe('The label color.'),
});

export const UpdateLabelBody: z.ZodType<UpdateLabelRequest> = z.strictObject({
  name: z.string().optional().describe('The name to display.'),
  color: z.enum(COLORS).optional().describe('The label color.'),
});

// Projects

const projectFields = {
  description: z
    .string()
    .nullable()
    .optional()
    .describe('A description of the record.'),
  visibility: z
    .enum(PROJECT_VISIBILITIES)
    .optional()
    .describe('Who may see this project.'),
  status: z
    .enum(PROJECT_STATUSES)
    .optional()
    .describe('The status to set or filter by.'),
  priority: priority.optional().describe('The priority to assign.'),
  leadUserId: id.nullable().optional().describe('The lead user identifier.'),
  startDate: date.optional().describe('The planned start date.'),
  dueDate: date.optional().describe('The planned due date.'),
};

export const CreateProjectBody: z.ZodType<CreateProjectRequest> =
  z.strictObject({
    name: z.string().describe('The name to display.'),
    ...projectFields,
  });

export const UpdateProjectBody: z.ZodType<UpdateProjectRequest> =
  z.strictObject({
    name: z.string().optional().describe('The name to display.'),
    ...projectFields,
  });

export const AddProjectMemberBody: z.ZodType<AddProjectMemberRequest> =
  z.strictObject({ userId: id.describe('The user identifier.') });

const binding = z
  .strictObject({
    provider: id,
    connectionId: id,
    repoId: id,
    fullName: id,
  })
  .nullable();

export const CreateProjectResourceBody: z.ZodType<CreateProjectResourceRequest> =
  z.strictObject({
    type: z
      .enum(PROJECT_RESOURCE_TYPES)
      .describe('The type of relationship or record.'),
    url: z.string().nullable().optional().describe('The resource URL.'),
    defaultRef: z
      .string()
      .nullable()
      .optional()
      .describe('The default Git branch or revision.'),
    binding: binding.optional().describe('The resource binding configuration.'),
    runnerId: z
      .string()
      .nullable()
      .optional()
      .describe('The runner identifier.'),
    path: z.string().nullable().optional().describe('The path on the runner.'),
    label: z
      .string()
      .nullable()
      .optional()
      .describe('A label for this resource.'),
    initPrompt: z
      .string()
      .nullable()
      .optional()
      .describe('Instructions for initializing the project.'),
  });

export const UpdateProjectResourceBody: z.ZodType<UpdateProjectResourceRequest> =
  z.strictObject({
    url: z.string().optional().describe('The resource URL.'),
    defaultRef: z
      .string()
      .nullable()
      .optional()
      .describe('The default Git branch or revision.'),
    binding: binding.optional().describe('The resource binding configuration.'),
    runnerId: z.string().optional().describe('The runner identifier.'),
    path: z.string().optional().describe('The path on the runner.'),
    label: z
      .string()
      .nullable()
      .optional()
      .describe('A label for this resource.'),
    initPrompt: z
      .string()
      .nullable()
      .optional()
      .describe('Instructions for initializing the project.'),
    position: z
      .number()
      .int()
      .optional()
      .describe('The resource’s position in the ordered list.'),
  });

// Issues

const ORDER_FIELDS: Readonly<Record<string, IssueSort>> = {
  updatedAt: 'updated',
  createdAt: 'created',
  number: 'number',
  priority: 'priority',
};

/**
 * `orderBy`: `updatedAt`, `createdAt`, `number` or `priority`, then optionally ` asc` or ` desc` (ascending when left
 * out). The default is `updatedAt desc`.
 */
const orderBy = z
  .string()
  .regex(
    new RegExp(`^(${Object.keys(ORDER_FIELDS).join('|')})( (asc|desc))?$`, 'u'),
    'orderBy must be a field (updatedAt, createdAt, number, priority) and optionally asc or desc.',
  )
  .optional();

function sortOf(value: string | undefined): {
  sort: IssueSort;
  direction: 'asc' | 'desc';
} {
  if (!value) return { sort: 'updated', direction: 'desc' };
  const [field = 'updatedAt', direction] = value.split(' ');
  return {
    sort: ORDER_FIELDS[field] ?? 'updated',
    direction: direction === 'desc' ? 'desc' : 'asc',
  };
}

const issueFilters = {
  issueIds: z
    .string()
    .optional()
    .transform((value) =>
      value === undefined
        ? undefined
        : [
            ...new Set(
              value
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean),
            ),
          ],
    )
    .pipe(z.array(z.string().max(64)).max(ISSUE_IDS_MAX).optional())
    .meta({
      description: `Only these issues, comma-separated ids, at most ${ISSUE_IDS_MAX}; the other filters still apply.`,
    }),
  involvesUserId: text.meta({
    description:
      'Owned by this user or executed by them as a person, each issue once.',
  }),
  statusKey: text.describe('Filter by issue status key.'),
  projectId: text.describe('The project identifier.'),
  ownerUserId: text.describe('The owner user identifier.'),
  executorId: text.describe('The executor identifier.'),
  labelId: text.describe('The label identifier.'),
  /** An issue id, or `none` for top-level issues only. */
  parentIssueId: text.describe('The parent issue identifier.'),
  q: text.describe('Text to search for.'),
  deleted: boolean.describe('Whether to include deleted records.'),
  orderBy: orderBy.describe('The field and direction to sort by.'),
};

type IssueFilterInput = {
  issueIds?: string[] | undefined;
  involvesUserId?: string | undefined;
  statusKey?: string | undefined;
  projectId?: string | undefined;
  ownerUserId?: string | undefined;
  executorId?: string | undefined;
  labelId?: string | undefined;
  parentIssueId?: string | undefined;
  q?: string | undefined;
  deleted?: 'true' | 'false' | undefined;
  orderBy?: string | undefined;
};

function issueQueryOf(input: IssueFilterInput): IssueListQuery {
  const { deleted, orderBy: order, ...filters } = input;
  return {
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined),
    ),
    deleted: deleted === 'true',
    ...sortOf(order),
  };
}

/** `GET /projects/issues`: a cursor-paged list. */
export const IssueListQuerySchema: z.ZodType<IssueListQuery> = z
  .object({
    ...issueFilters,
    pageSize: pageSize().describe('The maximum number of records to return.'),
    pageToken: pageToken.describe(
      'The continuation token returned by the previous page.',
    ),
  })
  .transform(({ pageSize: limit, pageToken: cursor, ...filters }) => ({
    ...issueQueryOf(filters),
    limit,
    ...(cursor ? { cursor } : {}),
  }));

/** `GET /projects/issues/board`: the list's filters; `pageSize` issues per column. */
export const IssueBoardQuery: z.ZodType<IssueListQuery> = z
  .object({
    ...issueFilters,
    pageSize: pageSize().describe('The maximum number of records to return.'),
  })
  .transform(({ pageSize: limit, ...filters }) => ({
    ...issueQueryOf(filters),
    limit,
  }));

export const ProjectFilterQuery: z.ZodType<{ projectId: string | null }> = z
  .object({ projectId: text.describe('The project identifier.') })
  .transform(({ projectId }) => ({ projectId: projectId ?? null }));

export interface CursorQuery {
  readonly cursor?: string;
  readonly limit: number;
}

/** Older activities or comment threads of an issue. */
export const CursorPageQuery: z.ZodType<CursorQuery> = z
  .object({
    pageSize: pageSize().describe('The maximum number of records to return.'),
    pageToken: pageToken.describe(
      'The continuation token returned by the previous page.',
    ),
  })
  .transform(({ pageSize: limit, pageToken: cursor }) => ({
    limit,
    ...(cursor ? { cursor } : {}),
  }));

/** An issue's comment threads, optionally only what was written after a time. */
export const CommentThreadsQuery: z.ZodType<
  CursorQuery & { readonly since?: string }
> = z
  .object({
    pageSize: pageSize().describe('The maximum number of records to return.'),
    pageToken: pageToken.describe(
      'The continuation token returned by the previous page.',
    ),
    since: z.iso.datetime({ offset: true }).optional().meta({
      description:
        'RFC 3339. Only threads with a comment written after it, each with its root and only the replies written after it.',
    }),
  })
  .transform(({ pageSize: limit, pageToken: cursor, since }) => ({
    limit,
    ...(cursor ? { cursor } : {}),
    ...(since ? { since } : {}),
  }));

const issueFields = {
  description: z.string().optional().describe('A description of the record.'),
  statusKey: z.string().optional().describe('Filter by issue status key.'),
  priority: priority.optional().describe('The priority to assign.'),
  ownerUserId: id.optional().describe('The owner user identifier.'),
  executor: executor
    .optional()
    .describe('The executor identity, with type and id; null clears it.'),
  parentIssueId: id
    .nullable()
    .optional()
    .describe('The parent issue identifier.'),
  stage: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe('The workflow stage to assign.'),
  projectId: id.nullable().optional().describe('The project identifier.'),
  startDate: date.optional().describe('The planned start date.'),
  dueDate: date.optional().describe('The planned due date.'),
  labelIds: z.array(id).optional().describe('Label identifiers to assign.'),
};

export const CreateIssueBody: z.ZodType<CreateIssueRequest> = z.strictObject({
  title: z.string().describe('The display title.'),
  attachmentIds: z.array(id).optional().meta({
    description:
      "The caller's unattached uploads; requires attachment upload permission. Bound before work starts.",
  }),
  ...issueFields,
  blockedBy: z
    .array(id)
    .optional()
    .describe('Identifiers of issues that must finish first.'),
  projectSetup: z
    .boolean()
    .optional()
    .describe('Project setup to create when starting this issue.'),
});

/** `PATCH /issues/{issueId}`: without `revision`, the change applies to the issue as it is now. */
export type UpdateIssueInput = Omit<UpdateIssueRequest, 'revision'> & {
  readonly revision?: number;
};

export const UpdateIssueBody: z.ZodType<UpdateIssueInput> = z.strictObject({
  needsYou: z.string().nullable().optional().meta({
    description:
      'Optional decision or input for the owner. Omit to retain; null or whitespace clears it. Cleared outside blocked or in_review. Studio requires nonblank input only for authenticated project-manager direct status updates.',
  }),
  next: z.string().nullable().optional().meta({
    description:
      'The next step. Omit to retain; null or whitespace clears it. Terminal statuses clear it.',
  }),
  acceptance: z.string().nullable().optional().meta({
    description:
      "The issue's delivery report, Markdown: how it was, the agreed approach, what changed, how it was checked, open issues and details, ending with the acceptance criteria the owner checks and where. Kept across status changes; the next delivery replaces it. Omit to retain; null or whitespace clears it.",
  }),
  revision: z.number().int().optional().meta({
    description:
      'The revision the change is based on; left out, the change applies to the issue as it is now.',
  }),
  title: z.string().optional().describe('The display title.'),
  ...issueFields,
});

export const AddDependencyBody: z.ZodType<AddDependencyRequest> =
  z.strictObject({
    dependsOnIssueId: id.describe('The depends on issue identifier.'),
    type: z
      .enum(DEPENDENCY_TYPES as [DependencyType, ...DependencyType[]])
      .optional()
      .describe('The type of relationship or record.'),
  });

/** `POST /projects/issues/{issueId}/removeDependency`: the link to another issue, by that issue and the type. */
export const RemoveDependencyBody: z.ZodType<AddDependencyRequest> =
  AddDependencyBody;

export const UpdateDependencyBody: z.ZodType<UpdateDependencyRequest> =
  z.strictObject({
    type: z
      .enum(['blockedBy', 'relatedTo'])
      .describe('The type of relationship or record.'),
    expectedType: z.enum(['blockedBy', 'relatedTo']).meta({
      description:
        'The relationship type the caller read; a stale value is a conflict.',
    }),
  });

// Comments

export const CreateCommentBody: z.ZodType<CreateCommentRequest> =
  z.strictObject({
    content: z.string().describe('The Markdown content.'),
    parentId: id.nullable().optional().describe('The parent identifier.'),
    attachmentIds: z.array(id).optional(),
  });

export const UpdateCommentBody: z.ZodType<UpdateCommentRequest> =
  z.strictObject({ content: z.string().describe('The Markdown content.') });

export const ReactionBody: z.ZodType<{ emoji: string }> = z.strictObject({
  emoji: z
    .enum(REACTION_EMOJIS)
    .describe('The emoji reaction to add or remove.'),
});

// Plans and intake

/** A row's `params` are checked per operation by the plan engine, which reports each row's problems (`PLAN_INVALID`). */
const planRow = z
  .custom<PlanRowInput>(
    (value) =>
      isObject(value) &&
      (PLAN_OPS as readonly unknown[]).includes((value as { op?: unknown }).op),
    `A row must be an object with op one of ${PLAN_OPS.join(', ')}.`,
  )
  .meta({
    description:
      'A row shaped as `ProjectsPlanRowInput`: `{ op, params, ref? }`, `op` one of `issue.create`, `issue.update`, `comment.create`, `dependency` and `project.create`.',
  });

const planBody = z.strictObject({
  title: z.string().describe('The display title.'),
  description: z.string().optional().describe('A description of the record.'),
  source: z
    .strictObject({
      kind: z.string().min(1),
      key: z.string().nullable().optional(),
      issueId: id.nullable().optional(),
      // Opaque JSON the proposer gets back untouched (`PlanSource.data`).
      data: z.unknown().optional(),
    })
    .describe('The source context associated with this record.'),
  proposer: z
    .strictObject({
      agentId: id,
      runId: id.nullable().optional(),
      conversationId: id.nullable().optional(),
    })
    .nullable()
    .optional(),
  deciderUserId: id.optional().describe('The decider user identifier.'),
  rows: z
    .array(planRow)
    .describe('The operations in the plan, in execution order.'),
});

export const CreatePlanBody: z.ZodType<CreatePlanRequest> = planBody;

export const EditPlanBody: z.ZodType<EditPlanRequest> = z.strictObject({
  revision: z
    .number()
    .int()
    .describe('The revision last read; reject if the record has changed.'),
  title: z.string().optional().describe('The display title.'),
  description: z.string().optional().describe('A description of the record.'),
  rows: z
    .array(
      z.strictObject({
        id,
        // Replaces the row's params, checked by the plan engine as on creation.
        params: z.unknown().optional(),
        remove: z.boolean().optional(),
      }),
    )
    .describe('The operations in the plan, in execution order.'),
});

export const PlanActionBody: z.ZodType<PlanActionRequest> = z.strictObject({
  revision: z
    .number()
    .int()
    .describe('The revision last read; reject if the record has changed.'),
});

export const PlanUndoBody: z.ZodType<PlanUndoRequest> = z.strictObject({
  dryRun: z
    .boolean()
    .optional()
    .describe('Preview the changes without applying them.'),
});

/** `GET /projects/plans`: a cursor-paged list, newest first. */
export const PlanListQuerySchema: z.ZodType<PlanListQuery> = z
  .object({
    status: z
      .enum(['open', ...PLAN_STATUSES])
      .optional()
      .describe('The status to set or filter by.'),
    sourceKind: text.describe('The kind of source to filter by.'),
    sourceKey: text.describe('The source identifier to filter by.'),
    issueId: text.describe('The issue identifier.'),
    pageSize: pageSize(50).describe('The maximum number of records to return.'),
    pageToken: pageToken.describe(
      'The continuation token returned by the previous page.',
    ),
  })
  .transform(({ pageSize: limit, pageToken: cursor, ...filters }) => ({
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined),
    ),
    limit,
    ...(cursor ? { cursor } : {}),
  }));

export const IntakeSplitBody: z.ZodType<IntakeSplitRequest> = z.strictObject({
  text: z.string().optional().describe('The source text to process.'),
  fileIds: z.array(id).optional(),
  projectId: id.nullable().optional().describe('The project identifier.'),
});

export const IntakeTextsBody: z.ZodType<IntakeTextsRequest> = z.strictObject({
  fileIds: z.array(id),
});

export const IntakeAiStartBody: z.ZodType<IntakeAiStartRequest> =
  z.strictObject({
    mode: z.enum(INTAKE_AI_MODES).describe('The processing mode to use.'),
    text: z.string().optional().describe('The source text to process.'),
    fileIds: z.array(id).optional(),
    projectId: id.nullable().optional().describe('The project identifier.'),
    planId: id.nullable().optional().describe('The plan identifier.'),
    instruction: z
      .string()
      .optional()
      .describe('Instructions for organizing the source text.'),
    issueId: id.optional().describe('The issue identifier.'),
  });

export const IssueAttachmentsQuery: z.ZodType<{
  comments?: 'true' | 'false';
}> = z.object({
  comments: z.enum(['true', 'false']).optional().meta({
    description: 'Whether the issue’s comments’ files follow its own.',
  }),
});

export const AttachmentContentQuery: z.ZodType<{ download: boolean }> = z
  .object({ download: boolean })
  .transform(({ download }) => ({ download: download === 'true' }));

// ---------------------------------------------------------------------------------------------------------------------
// Responses: what the handlers answer, annotated with the services' view types so the document cannot drift from them.
// ---------------------------------------------------------------------------------------------------------------------

const dateTime = z.string().meta({ format: 'date-time' });
/** `YYYY-MM-DD`. */
const day = z.string().meta({ format: 'date' });
const statusCategory = z.enum(['unstarted', 'started', 'done', 'closed']);
const color = z.enum(COLORS);
const record = z.record(z.string(), z.unknown());
const i18nKey = z.object({ key: z.string(), ns: z.string() });

const UserRefSchema: z.ZodType<UserRef> = z
  .object({ id: z.string(), name: z.string() })
  .meta({ ref: 'ProjectsUserRef' });

export const StatusDefinitionSchema: z.ZodType<StatusDefinition> = z
  .object({
    key: z.string(),
    name: z.string(),
    category: statusCategory,
    color,
  })
  .meta({ ref: 'ProjectsStatusDefinition' });

const ExecutorSchema: z.ZodType<Executor> = z
  .object({
    type: z.string().meta({ description: 'A kind’s key, such as `user`.' }),
    id: z.string(),
  })
  .meta({ ref: 'ProjectsExecutor' });

export const LabelSchema: z.ZodType<Label> = z
  .object({ id: z.string(), name: z.string(), color })
  .meta({ ref: 'ProjectsLabel' });

// Members

const scope = z.union([
  z.literal('all'),
  z.literal('none'),
  z.object({ users: z.array(z.string()) }),
]);

const PermissionsSchema: z.ZodType<Permissions> = z
  .object({
    scopes: z.record(
      z.enum(
        BUSINESS_KEYS.map(({ key }) => key) as [BusinessKey, ...BusinessKey[]],
      ),
      scope,
    ),
    settings: z.record(
      z.enum(
        SETTINGS_KEYS.map(({ key }) => key) as [SettingsKey, ...SettingsKey[]],
      ),
      z.boolean(),
    ),
  })
  .meta({
    ref: 'ProjectsPermissions',
    description:
      'Each business action’s reach (`all`, `none` or the records related to `users`) and each settings capability.',
  });

export const MeSchema: z.ZodType<Me> = z.object({
  userId: z.string(),
  name: z.string(),
  permissions: PermissionsSchema,
  kinds: z.array(
    z.object({
      key: z.string(),
      title: z.union([z.string(), i18nKey]).nullable(),
      executor: z.boolean(),
      mentionable: z.boolean(),
    }),
  ),
});

export const MemberSchema: z.ZodType<Member> = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().nullable(),
});

export const ApiKeyActorSchema: z.ZodType<ApiKeyActor> = z.object({
  id: z.string(),
  name: z.string(),
  disabled: z.boolean(),
});

const NameTextSchema = z.object({ key: z.string(), ns: z.string() });

export const ExecutorCandidateSchema: z.ZodType<ExecutorCandidate> = z.object({
  type: z.string(),
  id: z.string(),
  name: z.string(),
  nameText: NameTextSchema.optional(),
  online: z.boolean().optional(),
  busy: z.number().int().optional(),
  isDefault: z.boolean().optional().meta({
    description:
      'A new issue gets this executor when it names none, so a form preselects it.',
  }),
});

export const MentionCandidateSchema: z.ZodType<MentionCandidate> = z.object({
  kind: z.string(),
  id: z.string(),
  name: z.string(),
  nameText: NameTextSchema.optional(),
  hint: z.string().optional(),
});

/** `{ total }`: a bounded list, answered whole. */
export const BoundedListMeta: z.ZodType<{ total: number }> = z
  .object({ total: z.number().int() })
  .meta({ ref: 'ProjectsBoundedListMeta' });

/** `{ nextPageToken? }`: absent on the last page. */
export const CursorListMeta: z.ZodType<{ nextPageToken?: string }> = z
  .object({ nextPageToken: z.string().optional() })
  .meta({ ref: 'ProjectsCursorListMeta' });

/** An empty `meta`: the `@` list is one short page. */
export const EmptyListMeta: z.ZodType<Record<string, never>> = z.object({});

// Invitations and settings

export const InvitationSchema: z.ZodType<Invitation> = z.object({
  id: z.string(),
  email: z.string(),
  status: z.enum(['pending', 'expired', 'accepted', 'revoked']),
  projects: z.array(z.object({ id: z.string(), name: z.string() })),
  invitedBy: z.object({ userId: z.string(), name: z.string() }),
  expiresAt: dateTime,
  sentAt: dateTime.nullable(),
  createdAt: dateTime,
});

export const ResendInvitationQuery: z.ZodObject<
  {
    sendEmail: z.ZodOptional<z.ZodEnum<{ true: 'true'; false: 'false' }>>;
  },
  z.core.$strip
> = z.object({
  sendEmail: z.enum(['true', 'false']).optional().meta({
    description:
      'Defaults to true. Set false to generate a new link without sending email. The previous link stops working.',
  }),
});

export const InvitationResultSchema: z.ZodType<InvitationResult> = z
  .object({
    email: z.string(),
    outcome: z.enum(['invited', 'added', 'alreadyMember']),
    emailSent: z.boolean().optional(),
    inviteUrl: z.string().optional().meta({
      description:
        'The new shareable invitation link, returned to an authorized original inviter using an unscoped person credential, regardless of email delivery.',
    }),
  })
  .meta({ ref: 'ProjectsInvitationResult' });

export const InvitationResultsSchema: z.ZodType<{
  results: InvitationResult[];
}> = z.object({ results: z.array(InvitationResultSchema) });

export const WorkspaceSettingsSchema: z.ZodType<WorkspaceSettings> = z.object({
  issuePrefix: z.string(),
});

// Attachments and comments

export const IssueScreenshotSchema: z.ZodType<IssueScreenshot> = z
  .object({
    id: z.string(),
    filename: z.string(),
    ext: z.string(),
    mimeType: z.string(),
    size: z.number().int(),
    contentUrl: z.string(),
    downloadUrl: z.string(),
    comment: z.object({
      id: z.string(),
      createdAt: dateTime,
      author: z.object({
        type: z.string(),
        id: z.string(),
        name: z.string().nullable(),
      }),
    }),
  })
  .meta({ ref: 'ProjectsIssueScreenshot' });

export const IssueScreenshotsMeta: z.ZodType<IssueScreenshots['meta']> =
  z.object({
    limit: z.number().int(),
    truncated: z.boolean().meta({
      description:
        'More images exist. All counts describe only the returned batch.',
    }),
  });

export const AttachmentSchema: z.ZodType<Attachment> = z
  .object({
    id: z.string(),
    filename: z.string(),
    ext: z.string(),
    mimeType: z.string(),
    size: z.number().int(),
    issueId: z.string().nullable(),
    commentId: z.string().nullable(),
    uploader: z.object({
      type: z.string(),
      id: z.string(),
      name: z.string().nullable(),
    }),
    createdAt: dateTime,
    contentUrl: z.string().meta({
      description:
        'The content route: a safe image inline, anything else as a download.',
    }),
    downloadUrl: z.string(),
    previewable: z.boolean(),
    canDelete: z.boolean(),
  })
  .meta({ ref: 'ProjectsAttachment' });

const CommentReactionSchema: z.ZodType<CommentReaction> = z
  .object({
    emoji: z.enum(REACTION_EMOJIS),
    count: z.number().int(),
    userIds: z.array(z.string()),
  })
  .meta({ ref: 'ProjectsCommentReaction' });

const MentionRefSchema: z.ZodType<MentionRef> = z.object({
  kind: z.string(),
  id: z.string(),
});

const ActivityExecutionSchema: z.ZodType<ActivityExecution> = z
  .object({
    attempt: z.number().int(),
    runnerId: z.string(),
    runnerName: z.string().nullable().optional(),
    runnerOwnerUserId: z.string().nullable().optional(),
    runnerOwnerName: z.string().nullable().optional(),
    runnerTrust: z.enum(['team', 'ownerOnly']).nullable().optional(),
    machineHidden: z.boolean().optional(),
    tool: z.string().nullable().optional(),
    toolVersion: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    actualModels: z.array(z.string()).optional(),
    effort: z.string().nullable().optional(),
    actualEffort: z.string().nullable().optional(),
    actualEffortSource: z.string().nullable().optional(),
    actualEffortAt: dateTime.nullable().optional(),
  })
  .meta({ ref: 'ProjectsActivityExecution' });

const ActivityViaSchema: z.ZodType<ActivityVia> = z
  .object({
    type: z.enum(['cli', 'api_key', 'agent', 'plan']),
    agentId: z.string().optional(),
    agentName: z.string().nullable().optional(),
    runId: z.string().optional(),
    execution: ActivityExecutionSchema.optional(),
    conversationId: z.string().optional(),
    planId: z.string().optional(),
  })
  .meta({ ref: 'ProjectsActivityVia' });

export const IssueCommentSchema: z.ZodType<IssueComment> = z
  .object({
    id: z.string(),
    issueId: z.string(),
    authorType: z.string(),
    authorId: z.string().nullable(),
    authorName: z.string().nullable(),
    kind: z.string(),
    content: z.string().meta({ description: 'Markdown; empty once deleted.' }),
    note: z.boolean(),
    parentId: z.string().nullable(),
    rootId: z.string(),
    via: z.enum(['cli', 'api_key', 'agent']).nullable(),
    source: ActivityViaSchema.nullable().optional(),
    message: CommentMessageSchema.optional(),
    createdAt: dateTime,
    editedAt: dateTime.nullable(),
    deleted: z.boolean(),
    reactions: z.array(CommentReactionSchema),
    resolvedAt: dateTime.nullable(),
    resolvedById: z.string().nullable(),
    resolvedByName: z.string().nullable(),
    attachments: z.array(AttachmentSchema),
  })
  .meta({ ref: 'ProjectsIssueComment' });

export const CommentThreadSchema: z.ZodType<CommentThread> = z
  .object({
    root: IssueCommentSchema,
    replies: z.array(IssueCommentSchema),
  })
  .meta({ ref: 'ProjectsCommentThread' });

export const CreateCommentResultSchema: z.ZodType<CreateCommentResult> =
  z.object({
    comment: IssueCommentSchema,
    triggered: z.array(MentionRefSchema).meta({
      description:
        'Whom the comment started work for; empty without a plugin that does.',
    }),
  });

export const CommentReactionsSchema: z.ZodType<CommentReactions> = z.object({
  reactions: z.array(CommentReactionSchema),
});

export const ThreadResolutionSchema: z.ZodType<ThreadResolution> = z.object({
  commentId: z.string(),
  resolvedAt: dateTime.nullable(),
  resolvedById: z.string().nullable(),
});

export const SubscriptionStateSchema: z.ZodType<SubscriptionState> = z.object({
  subscribed: z.boolean(),
});

// Issues

export const ActivitySchema: z.ZodType<Activity> = z
  .object({
    id: z.string(),
    actorType: z.string(),
    actorId: z.string().nullable(),
    actorName: z.string().nullable(),
    action: z.string(),
    details: record,
    via: ActivityViaSchema.nullable(),
    createdAt: dateTime,
  })
  .meta({ ref: 'ProjectsActivity' });

const issueShape = {
  id: z.string(),
  number: z.number().int(),
  identifier: z
    .string()
    .meta({ description: '`PREFIX-number`, such as `PM-1`.' }),
  title: z.string(),
  description: z.string().meta({ description: 'Markdown.' }),
  statusKey: z.string(),
  needsYou: z.string().nullable().meta({
    description:
      'The decision or input required from the owner; null outside Blocked and In review, or on historical issues.',
  }),
  acceptance: z.string().nullable().meta({
    description:
      "The issue's delivery report, Markdown, ending with the acceptance criteria; kept across status changes until the next delivery replaces it, null when none was written.",
  }),
  next: z.string().nullable().meta({
    description:
      'The next step; null when none is recorded or the issue is Done or Cancelled.',
  }),
  priority: z.enum(PRIORITIES),
  ownerUserId: z.string(),
  executor: ExecutorSchema.nullable(),
  parentIssueId: z.string().nullable(),
  stage: z.number().int().nullable(),
  projectId: z.string().nullable(),
  startDate: day.nullable(),
  dueDate: day.nullable(),
  revision: z.number().int().meta({
    description:
      'Increases with every change; a write names the revision it read.',
  }),
  createdById: z.string().nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
  lastActivityAt: dateTime,
  deletedAt: dateTime.nullable(),
};

export const IssueSummariesQuery: z.ZodType<
  { refs: string[] },
  { refs: string }
> = z.object({
  refs: z
    .string()
    .max(6500)
    .transform((value) => value.split(',').map((ref) => ref.trim()))
    .pipe(z.array(z.string().min(1).max(64)).min(1).max(100))
    .meta({
      description:
        'Comma-separated issue IDs or identifiers, at most 100. Missing or invisible issues are omitted.',
    }),
});

export const IssueSummarySchema: z.ZodType<IssueSummary> = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  statusKey: z.string(),
});

export const IssueSchema: z.ZodType<Issue> = z
  .object(issueShape)
  .meta({ ref: 'ProjectsIssue' });

const issueListItemShape = {
  ...issueShape,
  owner: UserRefSchema.nullable(),
  executorName: z.string().nullable(),
  project: z
    .object({
      id: z.string(),
      name: z.string(),
      leadUserId: z.string().nullable(),
    })
    .nullable(),
  labels: z.array(LabelSchema),
  subtaskCount: z.number().int(),
  blockedCount: z.number().int(),
};

export const IssueListItemSchema: z.ZodType<IssueListItem> = z
  .object(issueListItemShape)
  .meta({ ref: 'ProjectsIssueListItem' });

export const IssueDependencySchema: z.ZodType<IssueDependency> = z
  .object({
    dependencyId: z.string(),
    issueId: z.string(),
    identifier: z.string(),
    title: z.string(),
    status: StatusDefinitionSchema,
    type: z.enum(['blockedBy', 'relatedTo']),
  })
  .meta({ ref: 'ProjectsIssueDependency' });

export const IssueDetailSchema: z.ZodType<IssueDetail> = z.object({
  progress: z.record(z.string(), z.unknown()).nullable().optional(),
  ...issueListItemShape,
  parent: z
    .object({ id: z.string(), identifier: z.string(), title: z.string() })
    .nullable(),
  statuses: z.array(StatusDefinitionSchema),
  activities: z.array(ActivitySchema),
  activitiesNextCursor: z.string().nullable(),
  threads: z.array(CommentThreadSchema),
  threadsNextCursor: z.string().nullable(),
  subscribers: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      reason: z.enum(SUBSCRIPTION_REASONS),
    }),
  ),
  attachments: z.array(AttachmentSchema),
  subtasks: z.array(
    z.object({
      id: z.string(),
      identifier: z.string(),
      title: z.string(),
      status: StatusDefinitionSchema,
      stage: z.number().int().nullable(),
      executor: ExecutorSchema.nullable(),
      executorName: z.string().nullable(),
      blockedCount: z.number().int(),
      terminal: z.boolean(),
    }),
  ),
  blockedBy: z.array(IssueDependencySchema),
  blocks: z.array(IssueDependencySchema),
  relatedTo: z.array(IssueDependencySchema),
  blockers: z.array(
    z.object({
      issueId: z.string(),
      identifier: z.string(),
      title: z.string(),
      status: StatusDefinitionSchema,
      reason: z.enum(['dependency', 'stage']),
    }),
  ),
  hiddenBlockerCount: z.number().int(),
});

export const UpdateIssueResultSchema: z.ZodType<UpdateIssueResult> = z.object({
  issue: IssueSchema,
});

export const IssueBoardSchema: z.ZodType<IssueBoard> = z.object({
  columns: z.array(
    z.object({
      status: StatusDefinitionSchema,
      issues: z.array(IssueListItemSchema),
      nextCursor: z.string().nullable().meta({
        description: 'The `pageToken` of the column’s next page.',
      }),
    }),
  ),
});

// Projects

const projectShape = {
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  visibility: z.enum(PROJECT_VISIBILITIES),
  status: z.enum(PROJECT_STATUSES),
  priority: z.enum(PRIORITIES),
  leadUserId: z.string().nullable(),
  startDate: day.nullable(),
  dueDate: day.nullable(),
  setupIssueId: z.string().nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
  lead: UserRefSchema.nullable(),
  memberCount: z.number().int(),
  issueCounts: z.object({
    total: z.number().int(),
    done: z.number().int(),
    byStatus: z.record(z.string(), z.number().int()),
  }),
};

export const ProjectListItemSchema: z.ZodType<ProjectListItem> = z
  .object(projectShape)
  .meta({ ref: 'ProjectsProjectListItem' });

export const ProjectResourceSchema: z.ZodType<ProjectResource> = z
  .object({
    id: z.string(),
    projectId: z.string(),
    type: z.enum(PROJECT_RESOURCE_TYPES),
    url: z.string().nullable(),
    defaultRef: z.string().nullable(),
    binding: z
      .object({
        provider: z.string(),
        connectionId: z.string(),
        repoId: z.string(),
        fullName: z.string(),
      })
      .nullable(),
    runnerId: z.string().nullable(),
    path: z.string().nullable(),
    label: z.string().nullable(),
    initPrompt: z.string().nullable(),
    position: z.number().int(),
  })
  .meta({ ref: 'ProjectsProjectResource' });

export const ProjectDetailSchema: z.ZodType<ProjectDetail> = z
  .object({
    ...projectShape,
    members: z.array(UserRefSchema),
    resources: z.array(ProjectResourceSchema),
  })
  .meta({ ref: 'ProjectsProjectDetail' });

export const ProjectMemberSchema: z.ZodType<UserRef | null> =
  UserRefSchema.nullable();

// Plans

const issueTarget = z.union([z.string(), z.object({ ref: z.string() })]).meta({
  ref: 'ProjectsPlanIssueTarget',
  description:
    'An issue id or identifier, or `{ ref }`: the issue an earlier row created.',
});
const projectTarget = z
  .union([z.string(), z.object({ ref: z.string() })])
  .meta({
    ref: 'ProjectsPlanProjectTarget',
    description:
      'A project id, or `{ ref }`: the project an earlier row created.',
  });

const issueFieldChanges = {
  description: z.string().optional(),
  statusKey: z.string().optional(),
  priority: priority.optional(),
  ownerUserId: z.string().optional(),
  executor: ExecutorSchema.nullable().optional(),
  parentIssueId: issueTarget.nullable().optional(),
  stage: z.number().int().nullable().optional(),
  projectId: projectTarget.nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
};

const PlanRowInputSchema: z.ZodType<PlanRowInput> = z
  .discriminatedUnion('op', [
    z.object({
      op: z.literal('issue.create'),
      ref: z
        .string()
        .optional()
        .describe('A local reference name for this plan row.'),
      params: z.object({
        title: z.string(),
        ...issueFieldChanges,
        blockedBy: z.array(issueTarget).optional(),
      }),
    }),
    z.object({
      op: z.literal('issue.update'),
      ref: z
        .string()
        .optional()
        .describe('A local reference name for this plan row.'),
      params: z.object({
        issue: issueTarget,
        set: z.object({
          title: z.string().optional(),
          ...issueFieldChanges,
          needsYou: z.string().nullable().optional(),
          next: z.string().nullable().optional(),
        }),
      }),
    }),
    z.object({
      op: z.literal('comment.create'),
      ref: z
        .string()
        .optional()
        .describe('A local reference name for this plan row.'),
      params: z.object({
        issue: issueTarget,
        content: z.string(),
        parentId: z.string().nullable().optional(),
        attachmentIds: z.array(z.string()).optional(),
      }),
    }),
    z.object({
      op: z.literal('dependency'),
      ref: z
        .string()
        .optional()
        .describe('A local reference name for this plan row.'),
      params: z.object({
        action: z.enum(['add', 'remove']),
        issue: issueTarget,
        dependsOn: issueTarget,
        type: z.enum(['blockedBy', 'relatedTo']).optional(),
      }),
    }),
    z.object({
      op: z.literal('project.create'),
      ref: z
        .string()
        .optional()
        .describe('A local reference name for this plan row.'),
      params: z.object({
        name: z.string(),
        description: z.string().nullable().optional(),
        visibility: z.enum(PROJECT_VISIBILITIES).optional(),
        priority: priority.optional(),
        leadUserId: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        dueDate: z.string().nullable().optional(),
      }),
    }),
  ])
  .meta({ ref: 'ProjectsPlanRowInput' });

const planSource = z.object({
  kind: z.string(),
  key: z.string().nullable().optional(),
  issueId: z.string().nullable().optional(),
  data: z.unknown().optional().meta({
    description: 'Opaque JSON the proposer gets back untouched.',
  }),
});

const planProposer = z.object({
  agentId: z.string(),
  runId: z.string().nullable().optional(),
  conversationId: z.string().nullable().optional(),
});

const CreatePlanRequestSchema: z.ZodType<CreatePlanRequest> = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    source: planSource,
    proposer: planProposer.nullable().optional(),
    deciderUserId: z.string().optional(),
    rows: z.array(PlanRowInputSchema),
  })
  .meta({ ref: 'ProjectsCreatePlanRequest' });

const PlanObjectRefSchema: z.ZodType<PlanObjectRef> = z
  .object({
    type: z.enum(['issue', 'project', 'comment', 'dependency']),
    id: z.string().nullable(),
    identifier: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
  })
  .meta({ ref: 'ProjectsPlanObjectRef' });

const PlanWakeSchema: z.ZodType<PlanWake> = z
  .object({
    kind: z.string(),
    principalId: z.string(),
    name: z.string().nullable(),
    subjectId: z.string(),
    triggerType: z.string(),
    started: z.boolean(),
    skipped: z.string().optional(),
    runId: z.string().optional(),
  })
  .meta({ ref: 'ProjectsPlanWake' });

const PlanRowCheckSchema: z.ZodType<PlanRowCheck> = z
  .object({
    ok: z.boolean(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: record.optional(),
      })
      .nullable(),
    target: PlanObjectRefSchema.nullable(),
    wakes: z.array(PlanWakeSchema),
    flags: z.array(z.enum(PLAN_RISK_FLAGS)),
    baseline: z
      .object({ target: PlanObjectRefSchema, fields: record })
      .nullable(),
  })
  .meta({ ref: 'ProjectsPlanRowCheck' });

export const PlanRehearsalSchema: z.ZodType<PlanRehearsal> = z
  .object({ ok: z.boolean(), rows: z.array(PlanRowCheckSchema) })
  .meta({ ref: 'ProjectsPlanRehearsal' });

const planRowOp = z.enum([...PLAN_OPS, ...PLAN_UNDO_OPS]);

const planUndoSkip = z.object({
  rowId: z.string(),
  position: z.number().int(),
  reason: z.enum(['changed', 'gone', 'notReversible']),
  message: z.string(),
});

export const PlanSchema: z.ZodType<Plan> = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(PLAN_STATUSES),
    voidReason: z.enum(['person', 'superseded']).nullable(),
    source: planSource,
    proposer: planProposer.nullable(),
    proposerName: z.string().nullable(),
    deciderUserId: z.string(),
    deciderName: z.string().nullable(),
    createdBy: z.object({ type: z.string(), id: z.string().nullable() }),
    revision: z.number().int(),
    rows: z.array(
      z.object({
        id: z.string(),
        position: z.number().int(),
        op: planRowOp,
        ref: z.string().nullable(),
        params: z.unknown().meta({
          description:
            'The operation’s parameters, as the proposer wrote them.',
        }),
        check: PlanRowCheckSchema.nullable(),
        result: z
          .object({
            target: PlanObjectRefSchema.nullable(),
            created: PlanObjectRefSchema.nullable(),
            after: record.nullable(),
            revision: z.number().int().nullable(),
            wakes: z.array(PlanWakeSchema),
          })
          .nullable(),
      }),
    ),
    failure: z
      .object({
        code: z.string(),
        message: z.string(),
        rowId: z.string().nullable(),
        details: record.optional(),
      })
      .nullable(),
    expiresAt: dateTime,
    rehearsedAt: dateTime,
    executedAt: dateTime.nullable(),
    executedById: z.string().nullable(),
    undoableUntil: dateTime.nullable(),
    skipped: z.array(planUndoSkip),
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .meta({ ref: 'ProjectsPlan' });

export const PlanUndoPreviewSchema: z.ZodType<PlanUndoPreview> = z.object({
  planId: z.string(),
  revert: z.array(
    z.object({
      rowId: z.string(),
      position: z.number().int(),
      op: planRowOp,
      target: PlanObjectRefSchema.nullable(),
      restore: record.nullable(),
    }),
  ),
  skipped: z.array(planUndoSkip),
});

export const PlanUndoResultSchema: z.ZodType<Plan | PlanUndoPreview> = z
  .union([PlanSchema, PlanUndoPreviewSchema])
  .meta({
    description:
      'With `dryRun: true`, what undoing would do (`planId`, `revert`, `skipped`); otherwise the plan, undone.',
  });

// Intake

export const IntakeFileSchema: z.ZodType<IntakeFile> = z.object({
  id: z.string(),
  filename: z.string(),
  ext: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  createdAt: dateTime,
});

const intakeFileRead = z.object({
  fileId: z.string(),
  filename: z.string(),
  state: z.enum([
    'read',
    'truncated',
    'empty',
    'image',
    'unsupported',
    'legacy',
    'failed',
    'skipped',
  ]),
  chars: z.number().int(),
});

export const IntakeSplitResultSchema: z.ZodType<IntakeSplitResult> = z.object({
  plan: PlanSchema.nullable().meta({
    description:
      'The stored draft plan; null when a row failed its rehearsal (see `rehearsal`).',
  }),
  request: CreatePlanRequestSchema,
  rehearsal: PlanRehearsalSchema.nullable(),
  files: z.array(intakeFileRead),
  unknownLabels: z.array(z.string()),
  dropped: z.number().int(),
});

export const IntakeTextsResultSchema: z.ZodType<IntakeTextsResult> = z.object({
  documents: z.array(
    z.object({ fileId: z.string(), filename: z.string(), text: z.string() }),
  ),
  files: z.array(intakeFileRead),
});

export const IntakeAiAvailabilitySchema: z.ZodType<IntakeAiAvailability> =
  z.object({
    available: z.boolean(),
    reason: z.string().nullable(),
    by: z.string().nullable(),
    waits: z.boolean(),
  });

export const IntakeAiJobSchema: z.ZodType<IntakeAiJob> = z
  .object({
    id: z.string(),
    mode: z.enum(INTAKE_AI_MODES),
    status: z.enum(INTAKE_AI_STATUSES),
    instruction: z.string().nullable(),
    basePlanId: z.string().nullable(),
    issue: z
      .object({ id: z.string(), identifier: z.string(), title: z.string() })
      .nullable(),
    planId: z.string().nullable(),
    changes: z
      .object({
        rows: z.record(z.string(), z.enum(['added', 'changed'])),
        removed: z.array(z.string()),
      })
      .nullable(),
    unknownLabels: z.array(z.string()),
    dropped: z.number().int(),
    error: z.object({ code: z.string(), message: z.string() }).nullable(),
    progress: z
      .object({
        phase: z.enum(['queued', 'working']),
        by: z.string().nullable(),
        waitReason: z.string().nullable(),
        waitParams: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.array(z.string())]),
          )
          .nullable()
          .optional(),
        activity: z.string().nullable(),
        since: dateTime.nullable(),
      })
      .nullable(),
    createdAt: dateTime,
    finishedAt: dateTime.nullable(),
  })
  .meta({ ref: 'ProjectsIntakeAiJob' });

/** A multipart body holding one `file`; validated by the handler, documented here. */
export const singleFileBody: OpenAPIV3_1.RequestBodyObject = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'The file to upload.',
          },
        },
      },
    },
  },
};

/** Context supplied by the session bridge, never an authentication credential. */
export const IssueSessionHeader: z.ZodType<{ 'x-nb-agent-session'?: string }> =
  z.object({
    'x-nb-agent-session': z.string().min(1).max(200).optional(),
  });
