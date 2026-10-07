/**
 * Who may see and manage a project (the `pm.projects` business actions of `shared/access.ts`).
 *
 * - See: every project, none, or for a set of users (`Scope`) the public ones and private ones a user of the set leads
 *   or joined.
 * - Manage (edit it, its members and resources): every project, none, or the ones a user of the set leads.
 * - Delete: only `all`.
 *
 * A project the viewer may not see is 404, so its existence does not leak. Other domains reach these rules through
 * `ProjectAccess` (`index.ts`), never by reading the project tables.
 */
import type {
  DatabaseConnection,
  FilterBuilder,
  FilterNode,
  RepositoryFilter,
} from '@nocobase/db';

import { reaches, type Scope } from '../../../shared/access.js';
import { inProjectScope, scopeOf, type Viewer } from '../../access/viewer.js';
import { oneOf } from '../../kernel/db.js';
import { forbidden, notFound } from '../../kernel/errors.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import {
  findProject,
  hasMember,
  type ProjectRecord,
  type ProjectWithLead,
} from './project.store.js';

/**
 * The projects visible at `scope`, as a filter on `pmProjects`; null when every project is visible. `none` matches
 * nothing.
 */
export function visibleProjects(
  f: FilterBuilder,
  viewer: Viewer,
  scope: Scope = scopeOf(viewer, 'pm.projects', 'view'),
): FilterNode | null {
  const visible = byScope(f, scope);
  if (!viewer.projectIds) return visible;
  // A scoped key limited to some projects reaches only those.
  const limited =
    viewer.projectIds.length === 0
      ? f.string('id').eq('\u0000none')
      : f.or(viewer.projectIds.map((id) => f.string('id').eq(id)));
  return visible === null ? limited : f.and([visible, limited]);
}

function byScope(f: FilterBuilder, scope: Scope): FilterNode | null {
  if (scope === 'all') return null;
  if (scope === 'none') return f.string('id').eq('\u0000none');
  return f.or([
    f.string('visibility').ne('members'),
    oneOf(f, 'leadUserId', scope.users),
    f
      .relation('members')
      .some((member) => oneOf(member, 'userId', scope.users)),
  ]);
}

/** `visibleProjects` as a whole filter; undefined when every project is visible. */
export function visibleProjectsFilter(
  viewer: Viewer,
): RepositoryFilter<ProjectRecord> | undefined {
  const scope = scopeOf(viewer, 'pm.projects', 'view');
  if (scope === 'all' && !viewer.projectIds) return undefined;
  return (f) => visibleProjects(f, viewer, scope) as FilterNode;
}

export interface ProjectRelation {
  readonly project: ProjectWithLead;
  readonly visible: boolean;
}

/**
 * The project as the viewer sees it at `scope`, or null when it does not exist. A project outside the viewer's key
 * scope does not exist for them either.
 */
export async function relationTo(
  conn: DatabaseConnection,
  viewer: Viewer,
  projectId: string,
  scope: Scope = scopeOf(viewer, 'pm.projects', 'view'),
): Promise<ProjectRelation | null> {
  if (!inProjectScope(viewer, projectId)) return null;
  const project = await findProject(conn, projectId);
  if (!project) return null;
  return { project, visible: await relates(conn, project, scope) };
}

/** Whether `scope` reaches the project for seeing it: public, or led or joined by a user of the set. */
async function relates(
  conn: DatabaseConnection,
  project: ProjectWithLead,
  scope: Scope,
): Promise<boolean> {
  if (scope === 'all') return true;
  if (scope === 'none') return false;
  return (
    project.visibility === 'everyone' ||
    reaches(scope, project.leadUserId) ||
    (await hasMember(conn, project.id, scope.users))
  );
}

/** Whether the viewer manages the project: every one, or one a user of their set leads. */
export function canManage(viewer: Viewer, relation: ProjectRelation): boolean {
  return reaches(
    scopeOf(viewer, 'pm.projects', 'manage'),
    relation.project.leadUserId,
  );
}

/** The viewer's relation to the project; 404 unless they may see it. */
export async function requireVisible(
  conn: DatabaseConnection,
  viewer: Viewer,
  id: string,
): Promise<ProjectRelation> {
  const relation = await relationTo(conn, viewer, id);
  if (!relation?.visible) throw notFound('Project');
  return relation;
}

/** Runs `fn` in a transaction, once the viewer is known to manage the project. */
export function managed<T>(
  tx: TxRunner,
  viewer: Viewer,
  id: string,
  fn: (tx: Tx, relation: ProjectRelation) => Promise<T>,
): Promise<T> {
  return tx.run(async (unit) => {
    const relation = await requireVisible(unit.conn, viewer, id);
    if (!canManage(viewer, relation))
      throw forbidden(
        'Only the project lead or an administrator may change this project.',
      );
    return fn(unit, relation);
  });
}
