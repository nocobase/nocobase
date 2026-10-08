/**
 * Who may see and change an issue (the `pm.issues` business actions of `shared/access.ts`).
 *
 * Each action reaches every issue, none, or the issues related to a user of the viewer's set (`Scope`):
 *
 * | Action          | an issue related to a user                                       |
 * | --------------- | ---------------------------------------------------------------- |
 * | view            | without a project, or in a project the set may see               |
 * | create          | the same: without a project, or into a project the set sees      |
 * | edit            | the same issues; every change to an issue needs it               |
 * | comment         | the same issues: comment, reply, resolve threads                 |
 * | moderate-comments | delete others' comments on issues a user of the set owns or whose project they lead |
 * | close           | issues a user of the set owns, or in a project they lead         |
 * | change-owner    | the same                                                         |
 * | delete, restore | never: only `all`                                                |
 *
 * An issue the viewer may not see is 404. Deleted issues are invisible except to those who may delete issues.
 */
import type {
  DatabaseConnection,
  FilterBuilder,
  FilterNode,
} from '@nocobase/db';

import { reaches } from '../../../shared/access.js';
import type { Issue } from '../../../shared/issues.js';
import {
  inProjectScope,
  requireAction,
  scopeOf,
  type Viewer,
} from '../../access/viewer.js';
import { forbidden, notFound } from '../../kernel/errors.js';
import { projectRelation, visibleProjects } from '../projects/index.js';
import { findIssue } from './issue.store.js';

/** The live issues the viewer may see, as a filter on `pmIssues`. */
export function visibleIssues(f: FilterBuilder, viewer: Viewer): FilterNode {
  const visible = byScope(f, viewer);
  if (!viewer.projectIds) return visible;
  // A scoped key limited to some projects sees only their issues, and none without a project.
  // `id` is never null, so `eq(null)` matches nothing without a placeholder value, which PostgreSQL may refuse.
  return f.and([
    visible,
    viewer.projectIds.length === 0
      ? f.string('id').eq(null)
      : f.or(viewer.projectIds.map((id) => f.string('projectId').eq(id))),
  ]);
}

function byScope(f: FilterBuilder, viewer: Viewer): FilterNode {
  const live = f.date('deletedAt').empty();
  const scope = scopeOf(viewer, 'pm.issues', 'view');
  if (scope === 'all') return live;
  if (scope === 'none') return f.string('id').eq(null);
  const projects = visibleProjects(f, viewer, scope);
  return f.and([
    live,
    f.or([
      f.string('projectId').eq(null),
      f
        .relation('project')
        .some((project) =>
          projects === null ? project.string('id').ne(null) : projects,
        ),
    ]),
  ]);
}

/** Deleted issues, for those who may delete issues. */
export function deletedIssues(f: FilterBuilder, viewer: Viewer): FilterNode {
  requireDeleter(viewer);
  const deleted = f.date('deletedAt').notEmpty();
  if (!viewer.projectIds) return deleted;
  return f.and([
    deleted,
    viewer.projectIds.length === 0
      ? f.string('id').eq(null)
      : f.or(viewer.projectIds.map((id) => f.string('projectId').eq(id))),
  ]);
}

/** Whether someone with these permissions may see the issue: the viewer, or a person a notice would go to. */
export async function issueVisibleTo(
  conn: DatabaseConnection,
  viewer: Pick<Viewer, 'userId' | 'permissions'>,
  issue: Issue,
): Promise<boolean> {
  return canSee(
    conn,
    { ...viewer, actor: { type: 'user', id: viewer.userId } },
    issue,
  );
}

/** Whether the viewer may see the issue: it is live, and in no project or one they may see. */
export async function canSee(
  conn: DatabaseConnection,
  viewer: Viewer,
  issue: Issue,
): Promise<boolean> {
  if (issue.deletedAt) return false;
  if (!inProjectScope(viewer, issue.projectId)) return false;
  const scope = scopeOf(viewer, 'pm.issues', 'view');
  if (scope === 'all' || scope === 'none') return scope === 'all';
  if (!issue.projectId) return true;
  return (
    (await projectRelation(conn, viewer, issue.projectId, scope))?.visible ??
    false
  );
}

/** The issue, 404 unless it exists and the viewer may see it. */
export async function requireVisible(
  conn: DatabaseConnection,
  viewer: Viewer,
  idOrKey: string,
): Promise<Issue> {
  const issue = await findIssue(conn, idOrKey);
  if (!issue || !(await canSee(conn, viewer, issue))) throw notFound('Issue');
  return issue;
}

/** Creating an issue: `related` is checked on its project (`issue.fields.ts`). */
export function requireCreator(viewer: Viewer): void {
  requireAction(viewer, 'pm.issues', 'create', 'You may not create issues.');
}

export function requireEditor(viewer: Viewer): void {
  requireAction(viewer, 'pm.issues', 'edit', 'You may not change issues.');
}

export function requireDeleter(viewer: Viewer): void {
  if (scopeOf(viewer, 'pm.issues', 'delete') !== 'all')
    throw forbidden('Only an administrator may delete issues.');
}

/** The actions whose issues are related to the users who own them or lead their project. */
export type ManagedAction = 'close' | 'change-owner' | 'moderate-comments';

/** `all`, or a user of the viewer's set owns the issue or leads its project. */
export async function managesIssue(
  conn: DatabaseConnection,
  viewer: Viewer,
  issue: Issue,
  action: ManagedAction,
): Promise<boolean> {
  if (!inProjectScope(viewer, issue.projectId)) return false;
  const scope = scopeOf(viewer, 'pm.issues', action);
  if (scope === 'all' || scope === 'none') return scope === 'all';
  if (reaches(scope, issue.ownerUserId)) return true;
  if (!issue.projectId) return false;
  const relation = await projectRelation(conn, viewer, issue.projectId);
  return reaches(scope, relation?.project.leadUserId);
}

export async function requireCloser(
  conn: DatabaseConnection,
  viewer: Viewer,
  issue: Issue,
): Promise<void> {
  if (!(await managesIssue(conn, viewer, issue, 'close')))
    throw forbidden(
      'Only the owner, the project lead or an administrator may close an issue.',
    );
}

export async function requireOwnerChanger(
  conn: DatabaseConnection,
  viewer: Viewer,
  issue: Issue,
): Promise<void> {
  if (!(await managesIssue(conn, viewer, issue, 'change-owner')))
    throw forbidden(
      'Only the owner, the project lead or an administrator may change the owner.',
    );
}
