/** Authorized, unhydrated issue relations for database-side hierarchy reports. */
import type { DatabaseConnection } from '@nocobase/db';
import type { Knex } from 'knex';
import type { Viewer } from '../../access/viewer.js';
import { scopeOf } from '../../access/viewer.js';
import type { IssueListQuery } from '../../../shared/issues.js';
import {
  FIXED_STATUSES,
  isTerminalCategory,
} from '../../../shared/statuses.js';
import { visibleProjects } from '../projects/index.js';

/** No records are materialized: consumers may aggregate or page these relations in the database. */
export interface IssueHierarchySource {
  readonly visible: {
    readonly sql: string;
    readonly parameters: readonly unknown[];
  };
  /** Visible unfinished issues blocked by dependencies or earlier stages, revealing no blocker identities. */
  readonly blocked: {
    readonly sql: string;
    readonly parameters: readonly unknown[];
  };
  readonly matching: {
    readonly sql: string;
    readonly parameters: readonly unknown[];
  };
}

export async function hierarchySource(
  conn: DatabaseConnection,
  viewer: Viewer,
  query: IssueListQuery,
): Promise<IssueHierarchySource> {
  const scope = scopeOf(viewer, 'pm.issues', 'view');
  let visible = conn.query
    .selectFrom('pmIssues')
    .where('deletedAt', 'is', null);
  if (scope === 'none' || viewer.projectIds?.length === 0)
    visible = visible.where('id', 'is', null);
  else {
    if (scope !== 'all') {
      // Use the same project predicate as visibleIssues, including team membership and key narrowing.
      const projects = await conn
        .repository<{ id: string }>('pmProjects')
        .findMany({
          filter: (f) => visibleProjects(f, viewer, scope)!,
          select: (s) => s.fields('id'),
        });
      visible = visible.where((eb) =>
        eb.or([
          eb('projectId', 'is', null),
          eb(
            'projectId',
            'in',
            projects.map((p) => p.id),
          ),
        ]),
      );
    }
    if (viewer.projectIds)
      visible = visible.where('projectId', 'in', viewer.projectIds);
  }
  let matching = visible;
  for (const field of [
    'statusKey',
    'projectId',
    'ownerUserId',
    'executorId',
  ] as const)
    if (query[field]) matching = matching.where(field, '=', query[field]);
  if (query.issueIds) matching = matching.where('id', 'in', query.issueIds);
  if (query.parentIssueId)
    matching = matching.where(
      'parentIssueId',
      query.parentIssueId === 'none' ? 'is' : '=',
      query.parentIssueId === 'none' ? null : query.parentIssueId,
    );
  if (query.involvesUserId)
    matching = matching.where((eb) =>
      eb.or([
        eb('ownerUserId', '=', query.involvesUserId),
        eb.and([
          eb('executorType', '=', 'user'),
          eb('executorId', '=', query.involvesUserId),
        ]),
      ]),
    );
  if (query.labelId)
    matching = matching.where((eb) =>
      eb.exists(
        eb
          .selectFrom('pmIssueLabels')
          .select('issueId')
          .where('issueId', '=', eb.ref('pmIssues.id'))
          .where('labelId', '=', query.labelId),
      ),
    );
  const fields = [
    'id',
    'parentIssueId as parent',
    'statusKey as status',
    'revision',
    'stage',
    'updatedAt as updated',
    'lastActivityAt as activity',
    'createdAt as created',
    'number',
    'priorityRank as priority',
  ];
  const compiled = matching
    .select([...fields, 'title', 'identifier'])
    .compile();
  const client = await conn.client<Knex>();
  const selected = client
    .select(
      fields.map((field) =>
        field.includes(' as ') ? field.split(' as ')[1] : field,
      ),
    )
    .from(
      client.raw('(?) as candidates', [
        client.raw(compiled.sql, [...compiled.parameters] as Knex.RawBinding[]),
      ]),
    );
  if (query.q?.trim()) {
    const pattern = `%${query.q
      .trim()
      .toLowerCase()
      .replace(/[\\%_]/gu, '\\$&')}%`;
    selected.whereRaw(
      "(lower(??) like ? escape '\\' or lower(??) like ? escape '\\')",
      ['title', pattern, 'identifier', pattern],
    );
  }
  const sql = selected.toSQL();
  const finished = FIXED_STATUSES.filter((s) =>
    isTerminalCategory(s.category),
  ).map((s) => s.key);
  const blocked = visible
    .where('statusKey', 'not in', finished)
    .where((eb) =>
      eb.or([
        eb.exists(
          eb
            .selectFrom('pmIssueDependencies as d')
            .select('d.issueId')
            .whereRef('d.issueId', '=', 'pmIssues.id')
            .where('d.type', '=', 'blockedBy')
            .whereRef('d.dependsOnIssueId', '<>', 'pmIssues.id')
            .where((inner) =>
              inner.exists(
                inner
                  .selectFrom('pmIssues as target')
                  .select('target.id')
                  .whereRef('target.id', '=', 'd.dependsOnIssueId')
                  .where('target.deletedAt', 'is', null)
                  .where('target.statusKey', 'not in', finished),
              ),
            ),
        ),
        eb.and([
          eb('pmIssues.stage', 'is not', null),
          eb('pmIssues.parentIssueId', 'is not', null),
          eb.exists(
            eb
              .selectFrom('pmIssues as sibling')
              .select('sibling.id')
              .whereRef('sibling.parentIssueId', '=', 'pmIssues.parentIssueId')
              .whereRef('sibling.id', '<>', 'pmIssues.id')
              .where('sibling.stage', 'is not', null)
              .whereRef('sibling.stage', '<', 'pmIssues.stage')
              .where('sibling.deletedAt', 'is', null)
              .where('sibling.statusKey', 'not in', finished),
          ),
        ]),
      ]),
    )
    .select('id')
    .compile();
  return {
    visible: visible.select(fields).compile(),
    blocked,
    matching: { sql: sql.sql, parameters: sql.bindings },
  };
}
