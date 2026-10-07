/**
 * The `pmIssueDependencies` collection: which issue waits for (`blockedBy`) or is linked to (`relatedTo`) which. Only
 * this file reads or writes it; issues themselves are read through `domains/issues`.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { DependencyType } from '../../../shared/subtasks.js';
import { oneOf } from '../../kernel/db.js';

const DEPENDENCIES = 'pmIssueDependencies';

export interface DependencyRecord {
  readonly id: string;
  /** The issue that waits (or refers). */
  readonly issueId: string;
  /** The issue it waits for. */
  readonly dependsOnIssueId: string;
  readonly type: DependencyType;
  readonly createdByType: string;
  readonly createdById: string | null;
  readonly createdAt: string;
}

const dependencies = (conn: DatabaseConnection) =>
  conn.repository<DependencyRecord>(DEPENDENCIES);

export async function insertDependency(
  conn: DatabaseConnection,
  values: DependencyRecord,
): Promise<void> {
  await dependencies(conn).createOne({ values });
}

export async function deleteDependency(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await dependencies(conn).deleteMany({ filter: { id } });
}

export async function findDependency(
  conn: DatabaseConnection,
  id: string,
): Promise<DependencyRecord | undefined> {
  return (await dependencies(conn).findOne({ filter: { id } })) ?? undefined;
}

/** The dependency of `issueId` on `dependsOnIssueId` of `type`, if there is one. */
export async function findDependencyBetween(
  conn: DatabaseConnection,
  issueId: string,
  dependsOnIssueId: string,
  type: DependencyType,
): Promise<DependencyRecord | undefined> {
  return (
    (await dependencies(conn).findOne({
      filter: { issueId, dependsOnIssueId, type },
    })) ?? undefined
  );
}

/** What `issueIds` depend on, oldest first. */
export async function outgoing(
  conn: DatabaseConnection,
  issueIds: readonly string[],
  type?: DependencyType,
): Promise<DependencyRecord[]> {
  if (issueIds.length === 0) return [];
  return dependencies(conn).findMany({
    filter: (f) =>
      f.and([
        oneOf(f, 'issueId', [...new Set(issueIds)]),
        ...(type ? [f.string('type').eq(type)] : []),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}

/** What depends on `issueIds`, oldest first. */
export async function incoming(
  conn: DatabaseConnection,
  issueIds: readonly string[],
  type?: DependencyType,
): Promise<DependencyRecord[]> {
  if (issueIds.length === 0) return [];
  return dependencies(conn).findMany({
    filter: (f) =>
      f.and([
        oneOf(f, 'dependsOnIssueId', [...new Set(issueIds)]),
        ...(type ? [f.string('type').eq(type)] : []),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
}
