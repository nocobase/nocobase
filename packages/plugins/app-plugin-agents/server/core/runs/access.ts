import type {
  DatabaseConnection,
  Expression,
  ExpressionBuilder,
  SqlBool,
} from '@nocobase/db';
import type { SubjectRegistry } from './ports.js';
import type { Run } from '../../../shared/runs.js';

export function involvesRun(run: Run, userId: string): boolean {
  return run.actorUserId === userId || run.ownerUserId === userId;
}

/** Private subjects belong only to the people involved, regardless of global grants. */
export async function mayAccessRun(
  run: Run,
  userId: string,
  privateSubject: boolean,
  hasPermission: () => Promise<boolean>,
  subjectVisible: () => Promise<boolean> = async () => true,
): Promise<boolean> {
  if (involvesRun(run, userId)) return true;
  return !privateSubject && (await hasPermission()) && (await subjectVisible());
}

/**
 * What a reader may see of each subject kind now, prepared once per query: a kind that bounds who sees its subjects
 * (`visibleSubjects`) keeps its runs inside that bound, a private kind keeps none (its runs are only their own people's).
 * Null when nothing is bounded.
 */
export type SubjectBounds = (
  eb: ExpressionBuilder,
  table: string,
) => Expression<SqlBool>;

export async function subjectBounds(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  userId: string,
): Promise<SubjectBounds | null> {
  const policies = await Promise.all(
    subjects.list().map(async (binding) => ({
      kind: binding.kind,
      private: binding.private === true,
      predicate: binding.private
        ? null
        : await binding.visibleSubjects?.(conn, userId),
    })),
  );
  const bounded = policies.filter(
    (policy) => policy.private || policy.predicate,
  );
  if (bounded.length === 0) return null;
  return (eb, table) =>
    eb.and(
      bounded.map((policy) =>
        eb.or([
          eb(`${table}.subjectKind`, '!=', policy.kind),
          ...(policy.private
            ? []
            : [policy.predicate!(eb, `${table}.subjectId`)]),
        ]),
      ),
    );
}

/**
 * Prepare once per query, independent of the number of runs, and apply before pagination or aggregation. `bounds`, when
 * the caller already prepared them, are used instead of reading them again.
 */
export async function runVisibility(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  userId: string,
  all: boolean,
  table = 'agRuns',
  bounds?: SubjectBounds | null,
): Promise<(eb: ExpressionBuilder) => Expression<SqlBool>> {
  const bound = all
    ? bounds !== undefined
      ? bounds
      : await subjectBounds(conn, subjects, userId)
    : null;
  return (eb) => {
    const involved = eb.or([
      eb(`${table}.actorUserId`, '=', userId),
      eb(`${table}.ownerUserId`, '=', userId),
    ]);
    if (!all) return involved;
    return bound
      ? eb.or([involved, bound(eb, table)])
      : eb(`${table}.id`, 'is not', null);
  };
}

/** Single-record check uses exactly the same database predicate as lists and realtime. */
export async function subjectVisibleForRun(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  run: Run,
  userId: string,
): Promise<boolean> {
  const predicate = await subjects
    .get(run.subject.kind)
    ?.visibleSubjects?.(conn, userId);
  if (!predicate) return true;
  return !!(await conn.query
    .selectFrom('agRuns')
    .select('id')
    .where('id', '=', run.id)
    .where((eb) => predicate(eb, 'agRuns.subjectId'))
    .executeTakeFirst());
}
