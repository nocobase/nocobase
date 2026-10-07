/**
 * The operation catalogue: each operation a plan row may hold (`shared/plans.ts`), mapped onto the services the browser
 * uses, so a row is checked by exactly the rules a person's own request would be (who may see, edit, close, change the
 * owner; the workflow and its approvals; the comment and dependency rules).
 *
 * Every operation has the same three parts:
 *
 * - `problems`: the shape of `params`: required fields, the right types, no unknown field (a guessed `issueId` or
 *   `assignee` must not leave the proposer believing its change happened). Values stay the services' to judge.
 * - `baseline`: what the row's target looks like now, for the rows whose target may change between the rehearsal and
 *   the execution (an existing issue's fields, a dependency to remove). Execution compares it again.
 * - `run`: performs the row in the caller's unit of work, as the viewer, resolving `{ ref }` targets to what earlier
 *   rows created; answers what it acted on, what it created, the fields it set and its risk flags.
 */
import {
  DEPENDENCY_TYPES,
  type DependencyType,
} from '../../../shared/subtasks.js';
import type { Issue } from '../../../shared/issues.js';
import { USER_KIND } from '../../../shared/kinds.js';
import type {
  CommentCreateParams,
  DependencyParams,
  IssueCreateParams,
  IssueTarget,
  IssueUpdateParams,
  PlanBaseline,
  PlanObjectRef,
  PlanRiskFlag,
  PlanRowOp,
  ProjectCreateParams,
  RetractParams,
} from '../../../shared/plans.js';
import type { Viewer } from '../../access/viewer.js';
import { conflict, invalid, notFound } from '../../kernel/errors.js';
import type { Tx } from '../../kernel/tx.js';
import { findComment, type CommentService } from '../comments/index.js';
import {
  findIssue,
  findIssueRow,
  isTerminal,
  type IssueService,
  type StatusCatalogs,
} from '../issues/index.js';
import { findProject, type ProjectService } from '../projects/index.js';
import {
  findDependency,
  findDependencyBetween,
  type SubtaskService,
} from '../subtasks/index.js';

export interface OpServices {
  readonly issues: IssueService;
  readonly comments: CommentService;
  readonly subtasks: SubtaskService;
  readonly projects: ProjectService;
  readonly statuses: StatusCatalogs;
}

/** What earlier rows created, by their `ref`. */
export type Refs = Map<
  string,
  { readonly type: 'issue' | 'project'; readonly id: string }
>;

export interface OpContext {
  readonly tx: Tx;
  readonly viewer: Viewer;
  readonly services: OpServices;
  readonly refs: Refs;
}

export interface OpOutcome {
  readonly target: PlanObjectRef | null;
  readonly created: PlanObjectRef | null;
  readonly after: Readonly<Record<string, unknown>> | null;
  readonly flags: readonly PlanRiskFlag[];
}

export interface Problem {
  readonly field: string;
  readonly message: string;
}

export interface OpDefinition {
  /** A proposer may write it; the undo rows are written by the server only. */
  readonly proposable: boolean;
  problems(params: unknown): Problem[];
  baseline(ctx: OpContext, params: never): Promise<PlanBaseline | null>;
  run(ctx: OpContext, params: never): Promise<OpOutcome>;
  /** The issue whose final revision the row records, once run. */
  issueOf?(outcome: OpOutcome): string | null;
}

// --- Shapes -----------------------------------------------------------------------------------------------------

type Kind =
  | 'string'
  | 'nullableString'
  | 'number'
  | 'nullableNumber'
  | 'boolean'
  | 'strings'
  | 'target'
  | 'nullableTarget'
  | 'targets'
  | 'executor'
  | 'object';

interface Field {
  readonly kind: Kind;
  readonly required?: boolean;
}

type Shape = Readonly<Record<string, Field>>;

const opt = (kind: Kind): Field => ({ kind });
const req = (kind: Kind): Field => ({ kind, required: true });

const ISSUE_HINT =
  'name the issue with "issue": "<id or identifier>" or {"ref": "<ref of an earlier row>"}';
const EXECUTOR_HINT =
  'use "executor": {"type": "user" | "agent", "id": "<id>"}, or null for nobody';

/** The right field for a guessed one. */
const GUESSES: Readonly<Record<string, string>> = {
  issueId: ISSUE_HINT,
  id: ISSUE_HINT,
  identifier: ISSUE_HINT,
  executorType: EXECUTOR_HINT,
  executorId: EXECUTOR_HINT,
  agentId: EXECUTOR_HINT,
  assignee: EXECUTOR_HINT,
  owner: 'use ownerUserId',
  ownerId: 'use ownerUserId',
  labels: 'use labelIds',
  parent: 'use parentIssueId',
  parentId: 'use parentIssueId',
  project: 'use projectId',
  blockedByIssueId: 'use dependsOn',
  dependsOnIssueId: 'use dependsOn',
  status: 'use statusKey',
  patch: 'put the changed fields under set',
  changes: 'put the changed fields under set',
  fields: 'put the changed fields under set',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function isTarget(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    typeof value.ref === 'string'
  );
}

function fits(kind: Kind, value: unknown): boolean {
  switch (kind) {
    case 'string':
      return typeof value === 'string';
    case 'nullableString':
      return value === null || typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'nullableNumber':
      return (
        value === null || (typeof value === 'number' && Number.isFinite(value))
      );
    case 'boolean':
      return typeof value === 'boolean';
    case 'strings':
      return (
        Array.isArray(value) && value.every((item) => typeof item === 'string')
      );
    case 'target':
      return isTarget(value);
    case 'nullableTarget':
      return value === null || isTarget(value);
    case 'targets':
      return Array.isArray(value) && value.every(isTarget);
    case 'executor':
      return (
        value === null ||
        (isRecord(value) &&
          typeof value.type === 'string' &&
          typeof value.id === 'string' &&
          Object.keys(value).length === 2)
      );
    case 'object':
      return isRecord(value);
  }
}

const EXPECTED: Readonly<Record<Kind, string>> = {
  string: 'a string',
  nullableString: 'a string or null',
  number: 'a number',
  nullableNumber: 'a number or null',
  boolean: 'true or false',
  strings: 'an array of strings',
  target: 'an id, an identifier or {"ref": "..."}',
  nullableTarget: 'an id, an identifier, {"ref": "..."} or null',
  targets: 'an array of ids, identifiers or {"ref": "..."}',
  executor: EXECUTOR_HINT.replace('use ', ''),
  object: 'an object',
};

function checkShape(
  shape: Shape,
  values: Record<string, unknown>,
  path: string,
): Problem[] {
  const problems: Problem[] = [];
  for (const [key, value] of Object.entries(values)) {
    const field = `${path}.${key}`;
    const spec = shape[key];
    if (!spec) {
      const hint = GUESSES[key];
      problems.push({
        field,
        message: `${field} is not a field here${hint ? `; ${hint}` : ''}.`,
      });
    } else if (value !== undefined && !fits(spec.kind, value))
      problems.push({
        field,
        message: `${field} must be ${EXPECTED[spec.kind]}.`,
      });
  }
  for (const [key, spec] of Object.entries(shape))
    if (spec.required && values[key] === undefined)
      problems.push({
        field: `${path}.${key}`,
        message: `${path}.${key} is required.`,
      });
  return problems;
}

function shapeProblems(shape: Shape, params: unknown): Problem[] {
  if (!isRecord(params))
    return [{ field: 'params', message: 'params must be an object.' }];
  return checkShape(shape, params, 'params');
}

const ISSUE_FIELDS: Shape = {
  title: opt('string'),
  description: opt('string'),
  statusKey: opt('string'),
  priority: opt('string'),
  ownerUserId: opt('string'),
  executor: opt('executor'),
  parentIssueId: opt('nullableTarget'),
  stage: opt('nullableNumber'),
  projectId: opt('nullableTarget'),
  startDate: opt('nullableString'),
  dueDate: opt('nullableString'),
  labelIds: opt('strings'),
};

const SHAPES = {
  'issue.create': {
    ...ISSUE_FIELDS,
    title: req('string'),
    blockedBy: opt('targets'),
    start: opt('boolean'),
  },
  'issue.update': {
    issue: req('target'),
    set: req('object'),
    start: opt('boolean'),
  },
  'comment.create': {
    issue: req('target'),
    content: req('string'),
    parentId: opt('nullableString'),
    attachmentIds: opt('strings'),
  },
  dependency: {
    action: req('string'),
    issue: req('target'),
    dependsOn: req('target'),
    type: opt('string'),
  },
  'project.create': {
    name: req('string'),
    description: opt('nullableString'),
    visibility: opt('string'),
    priority: opt('string'),
    leadUserId: opt('nullableString'),
    startDate: opt('nullableString'),
    dueDate: opt('nullableString'),
    workflowId: opt('nullableString'),
  },
  retract: { id: req('string') },
} satisfies Record<string, Shape>;

// --- Targets ----------------------------------------------------------------------------------------------------

type Target = IssueTarget;

function fromRef(
  ctx: OpContext,
  target: { readonly ref: string },
  type: 'issue' | 'project',
): string {
  const found = ctx.refs.get(target.ref);
  if (!found || found.type !== type)
    throw invalid(
      'INVALID_REF',
      `ref ${target.ref} names no earlier row that created ${type === 'issue' ? 'an issue' : 'a project'}.`,
    );
  return found.id;
}

/** An issue target as an id or identifier the services take. */
function issueTarget(ctx: OpContext, target: Target): string {
  return typeof target === 'string' ? target : fromRef(ctx, target, 'issue');
}

function nullableIssueTarget(
  ctx: OpContext,
  target: Target | null | undefined,
): string | null | undefined {
  return target === null || target === undefined
    ? target
    : issueTarget(ctx, target);
}

function nullableProjectTarget(
  ctx: OpContext,
  target: Target | null | undefined,
): string | null | undefined {
  if (target === null || target === undefined) return target;
  return typeof target === 'string' ? target : fromRef(ctx, target, 'project');
}

/** The issue a target names, or 404. */
async function existingIssue(ctx: OpContext, target: Target): Promise<Issue> {
  const issue = await findIssue(ctx.tx.conn, issueTarget(ctx, target));
  if (!issue || issue.deletedAt) throw notFound('Issue');
  return issue;
}

export function issueRef(issue: Issue): PlanObjectRef {
  return {
    type: 'issue',
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
  };
}

// --- Issue fields -----------------------------------------------------------------------------------------------

/** The current value of each of `fields`, as a baseline compares them. */
export async function issueFields(
  ctx: Pick<OpContext, 'tx'>,
  issue: Issue,
  fields: readonly string[],
): Promise<Record<string, unknown>> {
  const labels = fields.includes('labelIds')
    ? ((await findIssueRow(ctx.tx.conn, issue.id))?.labels ?? [])
        .map((label) => label.id)
        .sort()
    : [];
  const record = issue as unknown as Record<string, unknown>;
  return Object.fromEntries(
    fields.map((field) => {
      if (field === 'labelIds') return [field, labels];
      if (field === 'executor')
        return [
          field,
          issue.executor
            ? { type: issue.executor.type, id: issue.executor.id }
            : null,
        ];
      return [field, record[field] ?? null];
    }),
  );
}

async function isFinal(ctx: OpContext, issue: Issue): Promise<boolean> {
  const catalog = await ctx.services.statuses.forProject(
    ctx.tx.conn,
    issue.projectId,
  );
  return isTerminal(catalog, issue.statusKey);
}

const otherKind = (issue: Issue) =>
  issue.executor !== null && issue.executor.type !== USER_KIND;

// --- The operations ---------------------------------------------------------------------------------------------

const issueCreate: OpDefinition = {
  proposable: true,
  problems: (params) => shapeProblems(SHAPES['issue.create'], params),
  baseline: () => Promise.resolve(null),
  async run(ctx, params: IssueCreateParams) {
    const { projectId, parentIssueId, blockedBy, ...rest } = params;
    const project = nullableProjectTarget(ctx, projectId);
    const parent = nullableIssueTarget(ctx, parentIssueId);
    const issue = await ctx.services.issues.create(ctx.viewer, {
      ...rest,
      ...(project === undefined ? {} : { projectId: project }),
      ...(parent === undefined ? {} : { parentIssueId: parent }),
      ...(blockedBy
        ? { blockedBy: blockedBy.map((target) => issueTarget(ctx, target)) }
        : {}),
    });
    const flags: PlanRiskFlag[] = [];
    if (issue.ownerUserId !== ctx.viewer.userId) flags.push('ownerChange');
    if (otherKind(issue)) flags.push('agentExecutor');
    return {
      target: issueRef(issue),
      created: issueRef(issue),
      after: null,
      flags,
    };
  },
  issueOf: (outcome) => outcome.created?.id ?? null,
};

type IssueUpdate = IssueUpdateParams;

const issueUpdate: OpDefinition = {
  proposable: true,
  problems(params) {
    const problems = shapeProblems(SHAPES['issue.update'], params);
    if (problems.length > 0) return problems;
    const { set } = params as { readonly set: Record<string, unknown> };
    if (Object.keys(set).length === 0)
      return [
        {
          field: 'params.set',
          message: 'params.set names no field to change.',
        },
      ];
    return checkShape(ISSUE_FIELDS, set, 'params.set');
  },
  async baseline(ctx, params: IssueUpdate) {
    // An issue an earlier row creates has no state to compare yet.
    if (typeof params.issue !== 'string') return null;
    const issue = await findIssue(ctx.tx.conn, params.issue);
    if (!issue || issue.deletedAt) return null;
    return {
      target: issueRef(issue),
      fields: await issueFields(ctx, issue, Object.keys(params.set)),
    };
  },
  async run(ctx, params: IssueUpdate) {
    const before = await existingIssue(ctx, params.issue);
    const { parentIssueId, projectId, ...rest } = params.set;
    const parent = nullableIssueTarget(ctx, parentIssueId);
    const project = nullableProjectTarget(ctx, projectId);
    const after = await ctx.services.issues.update(ctx.viewer, before.id, {
      ...rest,
      ...(parent === undefined ? {} : { parentIssueId: parent }),
      ...(project === undefined ? {} : { projectId: project }),
      ...(params.start === undefined ? {} : { start: params.start }),
      revision: before.revision,
    });
    if (after.pendingApproval)
      throw conflict(
        'APPROVAL_REQUIRED',
        'This status change needs an approval; a plan cannot ask for one. Ask for it on the issue page.',
        { issueId: before.id },
      );
    const flags: PlanRiskFlag[] = [];
    if (after.statusKey !== before.statusKey && (await isFinal(ctx, after)))
      flags.push('finalStatus');
    if (after.ownerUserId !== before.ownerUserId) flags.push('ownerChange');
    if (
      otherKind(after) &&
      (after.executor?.type !== before.executor?.type ||
        after.executor?.id !== before.executor?.id)
    )
      flags.push('agentExecutor');
    return {
      target: issueRef(after),
      created: null,
      after: await issueFields(ctx, after, Object.keys(params.set)),
      flags,
    };
  },
  issueOf: (outcome) => outcome.target?.id ?? null,
};

type CommentCreate = CommentCreateParams;

const commentCreate: OpDefinition = {
  proposable: true,
  problems: (params) => shapeProblems(SHAPES['comment.create'], params),
  baseline: () => Promise.resolve(null),
  async run(ctx, params: CommentCreate) {
    const issue = await existingIssue(ctx, params.issue);
    const { comment } = await ctx.services.comments.create(
      ctx.viewer,
      issue.id,
      {
        content: params.content,
        ...(params.parentId === undefined ? {} : { parentId: params.parentId }),
        ...(params.attachmentIds && params.attachmentIds.length > 0
          ? { attachmentIds: params.attachmentIds }
          : {}),
      },
    );
    return {
      target: issueRef(issue),
      created: { type: 'comment', id: comment.id },
      after: null,
      flags: [],
    };
  },
};

type Dependency = DependencyParams;

function dependencyProblems(params: unknown): Problem[] {
  const problems = shapeProblems(SHAPES.dependency, params);
  if (problems.length > 0) return problems;
  const { action, type } = params as Record<string, unknown>;
  if (action !== 'add' && action !== 'remove')
    problems.push({
      field: 'params.action',
      message: 'params.action must be add or remove.',
    });
  if (type !== undefined && !DEPENDENCY_TYPES.includes(type as DependencyType))
    problems.push({
      field: 'params.type',
      message: `params.type must be one of ${DEPENDENCY_TYPES.join(', ')}.`,
    });
  return problems;
}

const dependency: OpDefinition = {
  proposable: true,
  problems: dependencyProblems,
  async baseline(ctx, params: Dependency) {
    // Only a removal can find its link changed; both ends must exist already.
    if (
      params.action !== 'remove' ||
      typeof params.issue !== 'string' ||
      typeof params.dependsOn !== 'string'
    )
      return null;
    const issue = await findIssue(ctx.tx.conn, params.issue);
    const other = await findIssue(ctx.tx.conn, params.dependsOn);
    if (!issue || !other) return null;
    const link = await findDependencyBetween(
      ctx.tx.conn,
      issue.id,
      other.id,
      params.type ?? 'blockedBy',
    );
    if (!link) return null;
    return {
      target: { type: 'dependency', id: link.id },
      fields: { exists: true },
    };
  },
  async run(ctx, params: Dependency) {
    const issue = await existingIssue(ctx, params.issue);
    const other = await existingIssue(ctx, params.dependsOn);
    const type = params.type ?? 'blockedBy';
    const link = {
      issueId: issue.id,
      dependsOnIssueId: other.id,
      type,
    };
    if (params.action === 'add') {
      const added = await ctx.services.subtasks.addDependency(
        ctx.viewer,
        issue.id,
        { dependsOnIssueId: other.id, type },
      );
      return {
        target: issueRef(issue),
        created: { type: 'dependency', id: added.dependencyId },
        after: { exists: true, ...link },
        flags: [],
      };
    }
    await ctx.services.subtasks.removeDependencyTo(
      ctx.viewer,
      issue.id,
      other.id,
      type,
    );
    return {
      target: issueRef(issue),
      created: null,
      after: { exists: false, ...link },
      flags: [],
    };
  },
};

type ProjectCreate = ProjectCreateParams;

const projectCreate: OpDefinition = {
  proposable: true,
  problems: (params) => shapeProblems(SHAPES['project.create'], params),
  baseline: () => Promise.resolve(null),
  async run(ctx, params: ProjectCreate) {
    const project = await ctx.services.projects.create(ctx.viewer, params);
    const ref: PlanObjectRef = {
      type: 'project',
      id: project.id,
      title: project.name,
    };
    return {
      target: ref,
      created: ref,
      after: { updatedAt: new Date(project.updatedAt).toISOString() },
      flags: ['createsProject'],
    };
  },
};

type Retract = RetractParams;

const issueRetract: OpDefinition = {
  proposable: false,
  problems: (params) => shapeProblems(SHAPES.retract, params),
  baseline: () => Promise.resolve(null),
  async run(ctx, params: Retract) {
    const issue = await existingIssue(ctx, params.id);
    await ctx.services.issues.retract(ctx.viewer, issue.id);
    return { target: issueRef(issue), created: null, after: null, flags: [] };
  },
};

const commentRetract: OpDefinition = {
  proposable: false,
  problems: (params) => shapeProblems(SHAPES.retract, params),
  baseline: () => Promise.resolve(null),
  async run(ctx, params: Retract) {
    const comment = await findComment(ctx.tx.conn, params.id);
    if (!comment || comment.deletedAt) throw notFound('Comment');
    await ctx.services.comments.remove(ctx.viewer, comment.id);
    const issue = await findIssue(ctx.tx.conn, comment.issueId);
    return {
      target: issue ? issueRef(issue) : { type: 'comment', id: comment.id },
      created: null,
      after: null,
      flags: [],
    };
  },
};

const projectRetract: OpDefinition = {
  proposable: false,
  problems: (params) => shapeProblems(SHAPES.retract, params),
  baseline: () => Promise.resolve(null),
  async run(ctx, params: Retract) {
    const project = await findProject(ctx.tx.conn, params.id);
    if (!project) throw notFound('Project');
    await ctx.services.projects.retract(ctx.viewer, project.id);
    return {
      target: { type: 'project', id: project.id, title: project.name },
      created: null,
      after: null,
      flags: [],
    };
  },
};

export const OPERATIONS: Readonly<Record<PlanRowOp, OpDefinition>> = {
  'issue.create': issueCreate,
  'issue.update': issueUpdate,
  'comment.create': commentCreate,
  dependency,
  'project.create': projectCreate,
  'issue.retract': issueRetract,
  'comment.retract': commentRetract,
  'project.retract': projectRetract,
};

/** Whether a dependency still links the two issues as a row left it. */
export async function dependencyExists(
  tx: Tx,
  link: {
    readonly id?: string | null;
    readonly issueId: string;
    readonly dependsOnIssueId: string;
    readonly type: DependencyType;
  },
): Promise<boolean> {
  if (link.id && (await findDependency(tx.conn, link.id))) return true;
  return !!(await findDependencyBetween(
    tx.conn,
    link.issueId,
    link.dependsOnIssueId,
    link.type,
  ));
}
