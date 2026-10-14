/** Recover idle manager work using existing run and activity facts; no auxiliary state. */
import type { DatabaseConnection } from '@nocobase/db';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';
import type { AgentWork } from '../work.js';

export function managerIdleMinutes(value: unknown): number {
  return configuredMinutes(value, 15, 'managerIdleMinutes', true);
}
export function managerIdleSweepMinutes(value: unknown): number {
  return configuredMinutes(value, 5, 'managerIdleSweepMinutes', false);
}
function configuredMinutes(
  value: unknown,
  fallback: number,
  name: string,
  allowZero: boolean,
) {
  const minutes =
    value === undefined
      ? fallback
      : typeof value === 'number' || (typeof value === 'string' && value.trim())
        ? Number(value)
        : NaN;
  if (!Number.isFinite(minutes) || minutes < 0 || (!allowZero && minutes === 0))
    throw new Error(
      `studio.agents.${name} must be a finite ${allowZero ? 'nonnegative' : 'positive'} number.`,
    );
  return minutes;
}

/** One read for all candidates, including the absence of newer work or business activity. */
export function idleCandidates(conn: DatabaseConnection, cutoff: Date) {
  return conn.query
    .selectFrom('pmIssues as issue')
    .innerJoin('agRuns as manager', 'manager.subjectId', 'issue.id')
    .select(['issue.id', 'manager.id as managerRunId', 'manager.finishedAt'])
    .where('issue.deletedAt', 'is', null)
    .where('issue.statusKey', '=', 'in_progress')
    .where('issue.executorType', '=', 'agent')
    .where('issue.executorId', '=', PROJECT_MANAGER_ID)
    .where('manager.subjectKind', '=', 'issue')
    .where('manager.agentId', '=', PROJECT_MANAGER_ID)
    .where('manager.status', 'in', ['completed', 'failed', 'cancelled'])
    .where('manager.finishedAt', '<=', cutoff)
    .whereRef('issue.lastActivityAt', '<=', 'manager.finishedAt')
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('agRuns as active')
            .select('active.id')
            .where('active.subjectKind', '=', 'issue')
            .whereRef('active.subjectId', '=', 'issue.id')
            .where('active.status', 'in', ['queued', 'dispatched', 'running']),
        ),
      ),
    )
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('agRuns as newer')
            .select('newer.id')
            .where('newer.subjectKind', '=', 'issue')
            .whereRef('newer.subjectId', '=', 'issue.id')
            .where('newer.agentId', '=', PROJECT_MANAGER_ID)
            .where((e) =>
              e.or([
                e('newer.finishedAt', '>', e.ref('manager.finishedAt')),
                e.and([
                  e('newer.finishedAt', '=', e.ref('manager.finishedAt')),
                  e('newer.id', '>', e.ref('manager.id')),
                ]),
              ]),
            ),
        ),
      ),
    )
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('pmComments as comment')
            .select('comment.id')
            .whereRef('comment.issueId', '=', 'issue.id')
            .where((e) =>
              e.or([
                e('comment.createdAt', '>', e.ref('manager.finishedAt')),
                e('comment.editedAt', '>', e.ref('manager.finishedAt')),
              ]),
            ),
        ),
      ),
    )
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('pmActivities as activity')
            .select('activity.id')
            .whereRef('activity.issueId', '=', 'issue.id')
            .whereRef('activity.createdAt', '>', 'manager.finishedAt'),
        ),
      ),
    )
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('agRuns as event')
            .select('event.id')
            .where('event.subjectKind', '=', 'issue')
            .whereRef('event.subjectId', '=', 'issue.id')
            .where((e) =>
              e.or([
                e('event.createdAt', '>', e.ref('manager.finishedAt')),
                e('event.finishedAt', '>', e.ref('manager.finishedAt')),
              ]),
            ),
        ),
      ),
    )
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('agRunInputs as input')
            .select('input.id')
            .where((e) =>
              e.exists(
                e
                  .selectFrom('agRuns as inputRun')
                  .select('inputRun.id')
                  .whereRef('inputRun.id', '=', 'input.runId')
                  .where('inputRun.subjectKind', '=', 'issue')
                  .whereRef('inputRun.subjectId', '=', 'issue.id'),
              ),
            )
            .whereRef('input.createdAt', '>', 'manager.finishedAt'),
        ),
      ),
    );
}

export async function sweepManagerIdle(
  _agents: Pick<Agents, 'runs'>,
  projects: Pick<Projects, 'tx' | 'commentQueries'>,
  work: AgentWork,
  minutes = 15,
  now = new Date(),
): Promise<void> {
  if (!minutes) return;
  const cutoff = new Date(now.getTime() - minutes * 60_000);
  const candidates = (
    await idleCandidates(projects.tx.read(), cutoff).execute()
  ).map((row) => ({
    id: String(row.id),
    managerRunId: String(row.managerRunId),
  }));
  for (const candidate of candidates) {
    await projects.tx.run(async (tx) => {
      await tx.conn.query
        .updateTable('pmIssues')
        .set({ id: candidate.id })
        .where('id', '=', candidate.id)
        .execute();
      // A comment, claim or another sweep can win while this candidate waits for the issue lock.
      if (
        !(await idleCandidates(tx.conn, cutoff)
          .where('issue.id', '=', candidate.id)
          .where('manager.id', '=', candidate.managerRunId)
          .executeTakeFirst())
      )
        return;
      const issue = await tx.conn
        .repository<Issue>('pmIssues')
        .findOne({ filter: { id: candidate.id } });
      if (!issue) return;
      await work.managerSignal(
        tx,
        { ...issue, executor: { type: 'agent', id: PROJECT_MANAGER_ID } },
        'managerIdle',
        'The manager has been idle without newer work or activity. Re-read the current runs, dispatch thread and complete PR checks before deciding the next step.',
        { previousManagerRunId: candidate.managerRunId, idleMinutes: minutes },
      );
    });
  }
}
