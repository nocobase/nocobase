/**
 * The fields of an issue: validating a create, and turning an update into column values plus one activity per changed
 * field. The rules that depend on which field changes (who may change the owner or close the issue) are applied here.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { PRIORITIES, type Priority } from '../../../shared/common.js';
import {
  ISSUE_DESCRIPTION_MAX,
  ISSUE_TITLE_MAX,
  type CreateIssueRequest,
  type Executor,
  type Issue,
  type UpdateIssueRequest,
} from '../../../shared/issues.js';
import {
  BLOCKED_BY_ON_CREATE_MAX,
  STAGE_MAX,
} from '../../../shared/subtasks.js';
import { inProjectScope, scopeOf, type Viewer } from '../../access/viewer.js';
import { invalid } from '../../kernel/errors.js';
import type { UserDirectory } from '../../kernel/users.js';
import {
  optionalId,
  optionalText,
  requiredText,
  stringList,
  validChoice,
  validDate,
} from '../../kernel/validate.js';
import type { LabelService } from '../labels/index.js';
import { canManageProject, projectRelation } from '../projects/index.js';
import {
  requireCloser,
  requireOwnerChanger,
  requireVisible,
} from './issue.access.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { IssueValues } from './issue.store.js';
import { findIssue, parentOf } from './issue.store.js';
import {
  isTerminal,
  type StatusCatalog,
  type StatusCatalogs,
} from './ports.js';

const MAX_PARENT_DEPTH = 50;

export interface FieldDeps {
  readonly users: UserDirectory;
  readonly kinds: KindRegistry;
  readonly labels: Pick<LabelService, 'requireExisting'>;
  readonly statuses: StatusCatalogs;
}

export interface FieldContext extends FieldDeps {
  readonly conn: DatabaseConnection;
  readonly viewer: Viewer;
}

export interface Activity {
  readonly action: string;
  readonly details: Record<string, unknown>;
}

const title = (value: unknown) =>
  requiredText(value, 'title', ISSUE_TITLE_MAX, 'INVALID_TITLE');

function description(value: unknown): string {
  return optionalText(value, 'description', ISSUE_DESCRIPTION_MAX) ?? '';
}

const priority = (value: unknown): Priority =>
  validChoice(value, PRIORITIES, 'priority', 'INVALID_PRIORITY');

async function owner(ctx: FieldContext, value: unknown): Promise<string> {
  if (value === null || value === '')
    throw invalid('OWNER_REQUIRED', 'Every issue has an owner.');
  // A service account (an organization's API key) acts but owns nothing: an owner is a person who is told and decides.
  if (typeof value !== 'string' || !(await ctx.users.isPerson(ctx.conn, value)))
    throw invalid('INVALID_OWNER', 'ownerUserId is not an active person.');
  return value;
}

/** The creator owns a new issue; an API key creating one names a person instead. */
async function defaultOwner(ctx: FieldContext): Promise<string> {
  if (await ctx.users.isPerson(ctx.conn, ctx.viewer.userId))
    return ctx.viewer.userId;
  throw invalid(
    'OWNER_REQUIRED',
    'An API key owns no issues: name the person who owns this one.',
  );
}

/** `null` (nobody) or `{ type, id }` naming a principal of a kind that may execute issues (`kernel/kinds.ts`). */
async function executor(
  ctx: FieldContext,
  value: unknown,
): Promise<Executor | null> {
  if (value === null) return null;
  const input = value as Partial<Executor>;
  if (typeof input !== 'object' || typeof input.type !== 'string')
    throw invalid('INVALID_EXECUTOR', 'executor must be { type, id } or null.');
  if (typeof input.id !== 'string' || !input.id)
    throw invalid('INVALID_EXECUTOR', 'executor.id is required.');
  await ctx.kinds.requireExecutor(
    ctx.conn,
    input.type,
    input.id,
    ctx.viewer.userId,
  );
  return { type: input.type, id: input.id };
}

/**
 * A project the viewer may put an issue in, or null: one they may see, or with `create` on every record (a new issue),
 * any project.
 */
async function project(
  ctx: FieldContext,
  value: unknown,
  anyProject = false,
): Promise<string | null> {
  const id = optionalId(value, 'projectId');
  if (id === null) {
    requireProjectInScope(ctx, null);
    return null;
  }
  const relation = await projectRelation(ctx.conn, ctx.viewer, id);
  if (!relation || (!anyProject && !relation.visible))
    throw invalid('INVALID_PROJECT', 'projectId names no project you can see.');
  return id;
}

/** A viewer limited to some projects (a scoped API key) keeps every issue it writes in one of them. */
function requireProjectInScope(ctx: FieldContext, id: string | null): void {
  if (!inProjectScope(ctx.viewer, id))
    throw invalid(
      'INVALID_PROJECT',
      'This key may only put issues in the projects it is limited to.',
    );
}

/** A parent the viewer may see that is neither the issue itself nor one of its descendants. */
async function parent(
  ctx: FieldContext,
  value: unknown,
  issueId: string | null,
): Promise<Issue | null> {
  const id = optionalId(value, 'parentIssueId');
  if (id === null) return null;
  const found = await requireVisible(ctx.conn, ctx.viewer, id).catch(
    () => null,
  );
  if (!found)
    throw invalid(
      'INVALID_PARENT',
      'parentIssueId names no issue you can see.',
    );
  let cursor: string | null = found.id;
  for (let depth = 0; cursor && depth < MAX_PARENT_DEPTH; depth += 1) {
    if (cursor === issueId)
      throw invalid('INVALID_PARENT', 'An issue cannot be its own ancestor.');
    cursor = await parentOf(ctx.conn, cursor);
  }
  return found;
}

/** A stage, 0 to `STAGE_MAX`, or null; only an issue with a parent has one. */
function stage(value: unknown, parentIssueId: string | null): number | null {
  if (value === null) return null;
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > STAGE_MAX
  )
    throw invalid(
      'INVALID_STAGE',
      `stage is a whole number from 0 to ${STAGE_MAX}, or null.`,
    );
  if (!parentIssueId)
    throw invalid('INVALID_STAGE', 'Only a sub-issue has a stage.');
  return value;
}

function blockedBy(value: unknown): string[] {
  const list = stringList(value, 'blockedBy');
  if (list.length > BLOCKED_BY_ON_CREATE_MAX)
    throw invalid(
      'INVALID_DEPENDENCY',
      `At most ${BLOCKED_BY_ON_CREATE_MAX} issues in blockedBy.`,
    );
  return list;
}

function status(catalog: StatusCatalog, value: unknown): string {
  if (typeof value !== 'string' || !catalog.category(value))
    throw invalid(
      'INVALID_STATUS',
      'statusKey is not a status of this workflow.',
    );
  return value;
}

async function labelIds(ctx: FieldContext, value: unknown): Promise<string[]> {
  return ctx.labels.requireExisting(ctx.conn, stringList(value, 'labelIds'));
}

/** The values of a new issue. */
export interface NewIssue {
  readonly title: string;
  readonly description: string;
  readonly statusKey: string;
  readonly priority: Priority;
  readonly ownerUserId: string;
  readonly executor: Executor | null;
  readonly parentIssueId: string | null;
  readonly stage: number | null;
  readonly projectId: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly labelIds: readonly string[];
  /** Issues it waits for, by id or identifier, checked when they are linked (`domains/subtasks`). */
  readonly blockedBy: readonly string[];
  /** It sets its project up (`Project.setupIssueId`). */
  readonly projectSetup: boolean;
}

export async function resolveCreate(
  ctx: FieldContext,
  input: CreateIssueRequest,
): Promise<NewIssue> {
  const parentIssue =
    input.parentIssueId === undefined
      ? null
      : await parent(ctx, input.parentIssueId, null);
  const projectId =
    input.projectId === undefined
      ? (parentIssue?.projectId ?? null)
      : await project(
          ctx,
          input.projectId,
          scopeOf(ctx.viewer, 'pm.issues', 'create') === 'all',
        );
  requireProjectInScope(ctx, projectId);
  const catalog = await ctx.statuses.forProject(ctx.conn, projectId);
  const statusKey =
    input.statusKey === undefined
      ? catalog.initialStatus
      : status(catalog, input.statusKey);
  if (isTerminal(catalog, statusKey))
    throw invalid(
      'INVALID_STATUS',
      'An issue cannot be created done or closed.',
    );
  const setup = await setupOf(ctx, projectId);
  const projectSetup = input.projectSetup === true;
  if (projectSetup) {
    const relation = projectId
      ? await projectRelation(ctx.conn, ctx.viewer, projectId)
      : null;
    if (!relation || !canManageProject(ctx.viewer, relation))
      throw invalid(
        'INVALID_PROJECT_SETUP',
        'Only someone who manages the project gives it a setup issue.',
      );
    if (setup)
      throw invalid(
        'INVALID_PROJECT_SETUP',
        'The project is still being set up by another issue.',
      );
  }
  const named = input.blockedBy === undefined ? [] : blockedBy(input.blockedBy);
  return {
    title: title(input.title),
    description: description(input.description),
    statusKey,
    priority: input.priority === undefined ? 'none' : priority(input.priority),
    ownerUserId:
      input.ownerUserId === undefined
        ? await defaultOwner(ctx)
        : await owner(ctx, input.ownerUserId),
    executor:
      input.executor === undefined ? null : await executor(ctx, input.executor),
    parentIssueId: parentIssue?.id ?? null,
    stage:
      input.stage === undefined
        ? null
        : stage(input.stage, parentIssue?.id ?? null),
    projectId,
    startDate: validDate(input.startDate ?? null, 'startDate'),
    dueDate: validDate(input.dueDate ?? null, 'dueDate'),
    labelIds:
      input.labelIds === undefined ? [] : await labelIds(ctx, input.labelIds),
    // While the project is being set up, a new issue waits for its setup (not a sub-issue of the setup itself).
    blockedBy:
      setup && setup.id !== parentIssue?.id ? [...named, setup.id] : named,
    projectSetup,
  };
}

/** The project's setup issue while it is unfinished, or null. */
async function setupOf(
  ctx: FieldContext,
  projectId: string | null,
): Promise<Issue | null> {
  if (!projectId) return null;
  const relation = await projectRelation(ctx.conn, ctx.viewer, projectId);
  const id = relation?.project.setupIssueId;
  if (!id) return null;
  const issue = await findIssue(ctx.conn, id);
  if (!issue || issue.deletedAt) return null;
  const catalog = await ctx.statuses.forProject(ctx.conn, issue.projectId);
  return isTerminal(catalog, issue.statusKey) ? null : issue;
}

export interface Changes {
  readonly values: IssueValues;
  readonly activities: Activity[];
  /** The new label set, when the request replaces it. */
  readonly labelIds?: string[];
  /** A status change: it goes through the workflow (`issue.status.ts`) before anything is written. */
  readonly status?: { readonly to: string; readonly catalog: StatusCatalog };
  /** The parent or the stage changes: once written, the issues waiting for each other are checked again. */
  readonly placed: boolean;
}

/** Column values and activities for an update; enforces the rules of the fields it changes. */
export async function resolveUpdate(
  ctx: FieldContext,
  before: Issue,
  patch: UpdateIssueRequest,
): Promise<Changes> {
  const values: { -readonly [K in keyof IssueValues]: IssueValues[K] } = {};
  const activities: Activity[] = [];
  const change = <K extends keyof IssueValues & keyof Issue>(
    field: K,
    action: string,
    value: Issue[K],
  ) => {
    if (before[field] === value) return;
    values[field] = value;
    activities.push({ action, details: { from: before[field], to: value } });
  };

  if (patch.title !== undefined)
    change('title', 'title_changed', title(patch.title));
  if (patch.description !== undefined) {
    const text = description(patch.description);
    if (text !== before.description) {
      values.description = text;
      activities.push({ action: 'description_changed', details: {} });
    }
  }
  if (patch.priority !== undefined)
    change('priority', 'priority_changed', priority(patch.priority));
  if (patch.startDate !== undefined)
    change(
      'startDate',
      'start_date_changed',
      validDate(patch.startDate, 'startDate'),
    );
  if (patch.dueDate !== undefined)
    change('dueDate', 'due_date_changed', validDate(patch.dueDate, 'dueDate'));
  if (patch.parentIssueId !== undefined)
    change(
      'parentIssueId',
      'parent_changed',
      (await parent(ctx, patch.parentIssueId, before.id))?.id ?? null,
    );
  const parentIssueId =
    values.parentIssueId === undefined
      ? before.parentIssueId
      : values.parentIssueId;
  if (patch.stage !== undefined)
    change('stage', 'stage_changed', stage(patch.stage, parentIssueId));
  // Without a parent there are no siblings to order against.
  if (values.parentIssueId === null && values.stage === undefined)
    change('stage', 'stage_changed', null);

  const projectId =
    patch.projectId === undefined
      ? before.projectId
      : await project(ctx, patch.projectId);
  change('projectId', 'project_changed', projectId);
  const catalog = await ctx.statuses.forProject(ctx.conn, projectId);
  let statusChange: Changes['status'];
  if (patch.statusKey !== undefined) {
    const target = status(catalog, patch.statusKey);
    if (target !== before.statusKey) {
      if (isTerminal(catalog, target))
        await requireCloser(ctx.conn, ctx.viewer, before);
      change('statusKey', 'status_changed', target);
      statusChange = { to: target, catalog };
    }
  } else if (!catalog.category(before.statusKey)) {
    throw invalid(
      'STATUS_REQUIRED',
      `The new project has no status ${before.statusKey}; choose one with statusKey.`,
    );
  }

  if (patch.ownerUserId !== undefined) {
    const next = await owner(ctx, patch.ownerUserId);
    if (next !== before.ownerUserId) {
      await requireOwnerChanger(ctx.conn, ctx.viewer, before);
      change('ownerUserId', 'owner_changed', next);
    }
  }
  let next = before.executor;
  if (patch.executor !== undefined) next = await executor(ctx, patch.executor);
  // A new owner who may not give work to the executor's kind cannot keep it as executor.
  const ownerUserId = values.ownerUserId ?? before.ownerUserId;
  const keep = next ? ctx.kinds.get(next.type)?.executor : undefined;
  const dropped =
    next !== null &&
    values.ownerUserId !== undefined &&
    !(await keep?.canKeep(ctx.conn, next.id, ownerUserId));
  if (dropped) next = null;
  if (
    next?.type !== before.executor?.type ||
    next?.id !== before.executor?.id
  ) {
    values.executorType = next?.type ?? null;
    values.executorId = next?.id ?? null;
    activities.push({
      action: 'executor_changed',
      details: {
        from: before.executor,
        to: next,
        ...(dropped ? { reason: 'ownerCannotKeep' } : {}),
      },
    });
  }

  return {
    values,
    activities,
    ...(patch.labelIds === undefined
      ? {}
      : { labelIds: await labelIds(ctx, patch.labelIds) }),
    ...(statusChange ? { status: statusChange } : {}),
    placed: values.parentIssueId !== undefined || values.stage !== undefined,
  };
}
