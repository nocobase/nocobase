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

/** Prepare once per query, independent of the number of runs, and apply before pagination or aggregation. */
export async function runVisibility(
  conn: DatabaseConnection,
  subjects: SubjectRegistry,
  userId: string,
  all: boolean,
  table = 'agRuns',
): Promise<(eb: ExpressionBuilder) => Expression<SqlBool>> {
  const policies = all
    ? await Promise.all(
        subjects.list().map(async (binding) => ({
          kind: binding.kind,
          private: binding.private === true,
          predicate: binding.private
            ? null
            : await binding.visibleSubjects?.(conn, userId),
        })),
      )
    : [];
  return (eb) => {
    const involved = eb.or([
      eb(`${table}.actorUserId`, '=', userId),
      eb(`${table}.ownerUserId`, '=', userId),
    ]);
    if (!all) return involved;
    const restrictions = policies.flatMap((policy) => {
      if (!policy.private && !policy.predicate) return [];
      return [
        eb.or([
          eb(`${table}.subjectKind`, '!=', policy.kind),
          ...(policy.private
            ? []
            : [policy.predicate!(eb, `${table}.subjectId`)]),
        ]),
      ];
    });
    return restrictions.length === 0
      ? eb(`${table}.id`, 'is not', null)
      : eb.or([involved, eb.and(restrictions)]);
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
