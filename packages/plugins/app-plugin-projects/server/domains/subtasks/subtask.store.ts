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

/** The predicate is part of the UPDATE, so a stale transaction cannot overwrite a changed or removed link. */
export async function updateDependency(
  conn: DatabaseConnection,
  before: DependencyRecord,
  values: Pick<DependencyRecord, 'issueId' | 'dependsOnIssueId' | 'type'>,
): Promise<boolean> {
  const { updatedCount } = await dependencies(conn).updateMany({
    filter: {
      id: before.id,
      issueId: before.issueId,
      dependsOnIssueId: before.dependsOnIssueId,
      type: before.type,
    },
    values: {
      issueId: values.issueId,
      dependsOnIssueId: values.dependsOnIssueId,
      type: values.type,
    },
  });
  return updatedCount === 1;
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

/**
 * Every `blockedBy` link whose issue waited for is live and not in one of `finishedKeys`, of any issue: one query, for
 * telling which of many issues wait without a query per issue.
 */
export async function unfinishedBlockedBy(
  conn: DatabaseConnection,
  finishedKeys: readonly string[],
  issueIds?: readonly string[],
): Promise<DependencyRecord[]> {
  return dependencies(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('type').eq('blockedBy'),
        ...(issueIds ? [oneOf(f, 'issueId', issueIds)] : []),
        f
          .relation('dependsOn')
          .some((target) =>
            target.and([
              target.date('deletedAt').empty(),
              ...finishedKeys.map((key) => target.string('statusKey').ne(key)),
            ]),
          ),
      ]),
  });
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
