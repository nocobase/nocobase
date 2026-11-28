/** SQL projections of the same permission-scoped usage relation. Only the run-count query deduplicates run IDs. */
import type { DatabaseConnection, SelectQuery } from '@nocobase/db';
import type { Knex } from 'knex';

import { ONLINE_TOOL, type UsageGroupBy } from '../../../shared/reports.js';
import { runVisibility, subjectBounds } from '../runs/access.js';
import type { SubjectRegistry } from '../runs/ports.js';
import type { ReportCaller, ReportRange } from './report.service.js';

export interface UsageFilter {
  readonly agentId?: string | null;
  readonly userId?: string | null;
  readonly subject?: { readonly kind: string; readonly id: string } | null;
}

interface UsageScope {
  readonly base: SelectQuery;
  readonly hasBounds: boolean;
  online(included: boolean): SelectQuery;
  namedSubjects(query: SelectQuery): SelectQuery;
  withInside(query: SelectQuery, alias: string): SelectQuery;
}

export async function usageScope(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  caller: ReportCaller,
  range: ReportRange,
  filter: UsageFilter,
): Promise<UsageScope> {
  const bounds = await subjectBounds(conn, subjects, caller.userId);
  const visibility = await runVisibility(
    conn,
    subjects,
    caller.userId,
    caller.allRuns,
    'run',
    bounds,
  );
  // compile() does not resolve the field metadata that execute() uses to encode instants.
  const instant = (value: Date) => {
    if (conn.dialect === 'sqlite') return value.toISOString();
    if (conn.dialect === 'mysql' || conn.dialect === 'oceanbase')
      return value.toISOString().replace('T', ' ').replace(/Z$/u, '');
    return value;
  };
  let base = conn.query
    .selectFrom('agRunUsage as usage')
    .innerJoin('agRuns as run', 'run.id', 'usage.runId')
    .where('usage.createdAt', '>=', instant(range.start))
    .where('usage.createdAt', '<', instant(range.end))
    .where(visibility);
  if (filter.agentId) base = base.where('run.agentId', '=', filter.agentId);
  if (filter.userId) base = base.where('run.actorUserId', '=', filter.userId);
  if (filter.subject)
    base = base
      .where('run.subjectKind', '=', filter.subject.kind)
      .where('run.subjectId', '=', filter.subject.id);
  return {
    base,
    online(included: boolean) {
      return included
        ? base
        : base
            .where('run.agentType', '!=', ONLINE_TOOL)
            .where('usage.tool', '!=', ONLINE_TOOL);
    },
    namedSubjects(query: SelectQuery) {
      if (!bounds) return query;
      const privateKinds = subjects
        .list()
        .filter((binding) => binding.private)
        .map((binding) => binding.kind);
      return query.where((eb) =>
        eb.or([
          bounds(eb, 'run'),
          ...(privateKinds.length
            ? [eb('run.subjectKind', 'in', privateKinds)]
            : []),
        ]),
      );
    },
    withInside(query: SelectQuery, alias: string) {
      if (!bounds) return query;
      return query
        .leftJoin('agRuns as scopeRun', (join) =>
          join
            .onRef('scopeRun.id', '=', 'run.id')
            .on((eb) => eb.not(eb.not(bounds(eb, 'run')))),
        )
        .select(`scopeRun.id as ${alias}`);
    },
    hasBounds: bounds !== null,
  };
}

export interface SubjectBucket {
  readonly subject_kind?: string;
  readonly subject_id?: string;
  readonly inside?: boolean | number;
}

export interface SourceBucket {
  readonly tool: string;
  readonly model_service: string | null;
  readonly model: string | null;
}

export interface TokenBucket extends SubjectBucket, SourceBucket {
  readonly dimension?: string | null;
  readonly utc_day?: string;
  readonly input_tokens: string | number;
  readonly output_tokens: string | number;
  readonly cache_read_tokens: string | number;
  readonly cache_write_tokens: string | number;
  readonly reasoning_tokens: string | number;
}

export interface RunBucket extends SubjectBucket {
  readonly dimension?: string | null;
  readonly utc_day?: string;
  readonly runs: string | number;
  readonly duration: string | number | null;
  readonly unpriced_runs: string | number | null;
}

const sourceColumns = ['tool', 'model_service', 'model'] as const;
const tokenColumns = [
  'input_tokens',
  'output_tokens',
  'cache_read_tokens',
  'cache_write_tokens',
  'reasoning_tokens',
];
const usageColumns = [
  'usage.tool as tool',
  'usage.modelService as model_service',
  'usage.model as model',
];
const dimensionColumns = {
  agent: 'run.agentId',
  person: 'run.actorUserId',
  model: 'usage.model',
  tool: 'usage.tool',
  type: 'run.agentType',
} as const;

type Dimension = UsageGroupBy | null;
export type SubjectProjection = 'none' | 'legacy' | 'shown';

export function createUsageQueries(
  client: Knex,
  dialect: string,
  scope: UsageScope,
  online: boolean,
  legacyKinds: readonly string[],
) {
  const mysql = dialect === 'mysql' || dialect === 'oceanbase';
  const sqlite = dialect === 'sqlite';
  const day = mysql
    ? "date_format(??, '%Y-%m-%d')"
    : sqlite
      ? "strftime('%Y-%m-%d', ??)"
      : "to_char(?? at time zone 'UTC', 'YYYY-MM-DD')";
  const duration = mysql
    ? 'greatest(0, coalesce(timestampdiff(microsecond, ??, ??) div 1000, 0))'
    : sqlite
      ? 'max(0, coalesce(round((julianday(??) - julianday(??)) * 86400000), 0))'
      : 'greatest(0, coalesce(extract(epoch from (?? - ??)) * 1000, 0))';
  // Default MySQL collations can merge distinct JS strings (including model IDs that differ only in case).
  const exact = (column: string) =>
    mysql ? client.raw('cast(?? as binary)', [column]) : client.ref(column);
  const scoped = scope.online(online);

  function projected(
    query: SelectQuery,
    projection: SubjectProjection,
    groupBy: Dimension,
    byDay: boolean,
  ) {
    if (projection !== 'none')
      query = query.select([
        'run.subjectKind as raw_subject_kind',
        'run.subjectId as raw_subject_id',
      ]);
    if (projection === 'shown') query = scope.withInside(query, 'inside_id');

    const column =
      groupBy && groupBy in dimensionColumns
        ? dimensionColumns[groupBy as keyof typeof dimensionColumns]
        : null;
    if (column) query = query.select(`${column} as dimension_value`);
    const dated = byDay || groupBy === 'day';
    if (dated) query = query.select('usage.createdAt as usage_at');
    const { sql, parameters } = query.compile();
    const rows = client.from(
      client.raw('(?) as scoped_usage', [
        client.raw(sql, parameters as Knex.RawBinding[]),
      ]),
    );
    const keys: string[] = [];
    if (column) {
      rows.select(
        groupBy === 'model'
          ? client.raw("coalesce(??, '') as dimension", [
              exact('dimension_value'),
            ])
          : client.raw('?? as dimension', [exact('dimension_value')]),
      );
      keys.push('dimension');
    }
    if (dated) {
      rows.select(client.raw(`${day} as utc_day`, ['usage_at']));
      keys.push('utc_day');
    }
    if (projection !== 'none') {
      if (projection === 'legacy') {
        const values = legacyKinds.map(() => '?').join(', ');
        for (const field of ['subject_kind', 'subject_id']) {
          rows.select(
            client.raw(`case when ?? in (${values}) then ?? end as ??`, [
              exact('raw_subject_kind'),
              ...legacyKinds,
              exact(`raw_${field}`),
              field,
            ]),
          );
        }
      } else {
        rows.select(
          ['subject_kind', 'subject_id'].map((field) =>
            client.raw('?? as ??', [exact(`raw_${field}`), field]),
          ),
        );
        if (scope.hasBounds) {
          rows.select(client.raw('?? is not null as inside', ['inside_id']));
          keys.push('inside');
        }
      }
      keys.push('subject_kind', 'subject_id');
    }
    return { rows, keys };
  }

  // Knex binds the entire JSON relation as one parameter, including NULLs and arbitrary model names.
  function unpricedSources(unpriced: readonly SourceBucket[]) {
    const input = JSON.stringify(unpriced);
    if (mysql)
      return client.raw(
        `json_table(?, '$[*]' columns (
        tool varchar(16) path '$.tool',
        model_service varchar(64) path '$.model_service',
        model varchar(200) path '$.model'
      )) as unpriced`,
        [input],
      );
    if (sqlite)
      return client.raw(
        `(select json_extract(value, '$.tool') as tool,
        json_extract(value, '$.model_service') as model_service,
        json_extract(value, '$.model') as model from json_each(?)) as unpriced`,
        [input],
      );
    return client.raw(
      'jsonb_to_recordset(cast(? as jsonb)) as unpriced(tool text, model_service text, model text)',
      [input],
    );
  }

  return {
    async tokens(
      projection: SubjectProjection,
      groupBy: Dimension,
      byDay: boolean,
    ): Promise<TokenBucket[]> {
      const { rows, keys } = projected(
        scoped.select([
          ...usageColumns,
          'usage.id as usage_id',
          'usage.inputTokens as input_tokens',
          'usage.outputTokens as output_tokens',
          'usage.cacheReadTokens as cache_read_tokens',
          'usage.cacheWriteTokens as cache_write_tokens',
          'usage.reasoningTokens as reasoning_tokens',
        ]),
        projection,
        groupBy,
        byDay,
      );
      for (const column of tokenColumns) rows.sum({ [column]: column });
      return rows
        .select(
          sourceColumns.map((column) =>
            client.raw('?? as ??', [exact(column), column]),
          ),
        )
        .min({ first_id: 'usage_id' })
        .groupBy([...keys, ...sourceColumns.map(exact)])
        .orderBy('first_id');
    },

    async runs(
      projection: SubjectProjection,
      groupBy: Dimension,
      unpriced: readonly SourceBucket[],
      allUnpriced: boolean,
    ): Promise<RunBucket[]> {
      const { rows, keys } = projected(
        scoped.select([
          'run.id as run_id',
          'run.startedAt as started_at',
          'run.finishedAt as finished_at',
          ...(unpriced.length && !allUnpriced ? usageColumns : []),
        ]),
        projection,
        groupBy,
        false,
      );
      // One intermediate row per run and dimension, entirely inside SQL. The same run can be
      // fully priced for one model/day/tool and partially priced for a different group or the total.
      rows
        .select('run_id')
        .max({
          duration: client.raw(
            duration,
            mysql
              ? ['started_at', 'finished_at']
              : ['finished_at', 'started_at'],
          ),
        })
        .groupBy([...keys, 'run_id']);
      if (unpriced.length > 0 && !allUnpriced) {
        const nullSafeEqual = mysql
          ? '<=>'
          : sqlite
            ? 'is'
            : 'is not distinct from';
        rows.leftJoin(unpricedSources(unpriced), (join) => {
          join.on(
            client.raw('?? = ??', [
              exact('scoped_usage.tool'),
              exact('unpriced.tool'),
            ]),
          );
          for (const column of ['model_service', 'model'])
            join.andOn(
              client.raw(`?? ${nullSafeEqual} ??`, [
                exact(`scoped_usage.${column}`),
                exact(`unpriced.${column}`),
              ]),
            );
        });
        rows.max({
          unpriced: client.raw('case when ?? is null then 0 else 1 end', [
            'unpriced.tool',
          ]),
        });
      } else
        rows.select(
          client.raw(allUnpriced ? '1 as unpriced' : '0 as unpriced'),
        );
      const totals = client
        .from(rows.as('usage_runs'))
        .count({ runs: '*' })
        .sum({ duration: 'duration' })
        .sum({ unpriced_runs: 'unpriced' });
      if (keys.length) totals.select(keys).groupBy(keys);
      return totals;
    },

    async firstDays(): Promise<
      (SubjectBucket & { readonly utc_day: string })[]
    > {
      const { rows, keys } = projected(
        scope.base.select('usage.createdAt as first_at'),
        'shown',
        null,
        false,
      );
      // Group first in SQL by the outer projection, which includes the naming bound.
      return rows
        .select(client.raw(`min(${day}) as utc_day`, ['first_at']))
        .groupBy(keys);
    },
  };
}
