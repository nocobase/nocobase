/** Persistent idle epochs are derived from external progress, never the fallback's own manager loop. */
import { createHash } from 'node:crypto';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';
import { pullRequestsOfIssue, findRepoById } from '../../git/store.js';
import { checksFingerprint } from '../../git/flow.js';
import type { AgentWork } from '../work.js';
import { managerDelegation } from '../delegated-queue.js';
import { nextLineOf } from './texts.js';

export function managerIdleMinutes(value: unknown): number {
  const minutes =
    value === undefined
      ? 15
      : typeof value === 'number' || (typeof value === 'string' && value.trim())
        ? Number(value)
        : NaN;
  if (!Number.isFinite(minutes) || minutes < 0)
    throw new Error(
      'studio.agents.managerIdleMinutes must be a finite nonnegative number.',
    );
  return minutes;
}

export function waitingKind(
  line: string | null,
): { agent: boolean; checks: boolean } | null {
  if (
    !line ||
    !/wait|等待|等候|待.+(?:结束|完成|通过)/iu.test(line) ||
    /human|person|owner|负责人|人工|维护者|权限|决定|提供环境/iu.test(line)
  )
    return null;
  const checks = /\bCI\b|checks?|检查/iu.test(line);
  const agent = /agent|worker|runner|运行|实现|评审|回复|结束/iu.test(line);
  return agent || checks ? { agent, checks } : null;
}

interface IdleState {
  id: string;
  epoch: string;
  lastAt: string;
  wokenEpoch: string | null;
}
type IssueRow = Issue & {
  executorType: string | null;
  executorId: string | null;
  deletedAt: unknown;
};

export async function sweepManagerIdle(
  agents: Pick<Agents, 'runs'>,
  projects: Pick<Projects, 'tx' | 'commentQueries'>,
  work: AgentWork,
  minutes = 15,
  now = new Date(),
): Promise<void> {
  if (!minutes) return;
  const rows = await projects.tx
    .read()
    .repository<IssueRow>('pmIssues')
    .findMany({
      filter: (f) =>
        f.and([
          f.string('statusKey').eq('in_progress'),
          f.string('executorType').eq('agent'),
          f.string('executorId').eq(PROJECT_MANAGER_ID),
          f.date('deletedAt').empty(),
        ]),
    });
  for (const candidate of rows)
    await projects.tx.run(async (tx) => {
      // Lock before checking active runs and committing the epoch plus input. Duplicate sweepers wait here.
      await tx.conn.query
        .updateTable('pmIssues')
        .set({ id: candidate.id })
        .where('id', '=', candidate.id)
        .execute();
      const issue = await tx.conn
        .repository<IssueRow>('pmIssues')
        .findOne({ filter: { id: candidate.id } });
      if (
        !issue ||
        issue.deletedAt ||
        issue.statusKey !== 'in_progress' ||
        issue.executorType !== 'agent' ||
        issue.executorId !== PROJECT_MANAGER_ID
      )
        return;
      if (
        (await agents.runs.openOn(tx.conn, { kind: 'issue', id: issue.id }))
          .length
      )
        return;
      const comments = (
        await projects.commentQueries.list(tx.conn, issue.id)
      ).filter((c) => !c.deleted);
      const latest = comments
        .filter(
          (c) => c.authorId === PROJECT_MANAGER_ID && c.authorType === 'agent',
        )
        .at(-1);
      const waiting = waitingKind(latest ? nextLineOf(latest.content) : null);
      if (!waiting) return;
      const workers = await tx.conn
        .repository<{
          id: string;
          subjectKind: string;
          subjectId: string;
          agentId: string;
          status: string;
          createdAt: string;
          finishedAt: string | null;
        }>('agRuns')
        .findMany({ filter: { subjectKind: 'issue', subjectId: issue.id } });
      const delegated = [];
      for (const run of workers.filter(
        (r) => r.agentId !== PROJECT_MANAGER_ID,
      )) {
        const detail = await agents.runs.identityInputs(tx.conn, run.id);
        if (detail && (await managerDelegation(tx.conn, detail.run)))
          delegated.push(run);
      }
      const prs = await pullRequestsOfIssue(tx.conn, issue.id);
      if (!(
        (waiting.agent && delegated.length) ||
        (waiting.checks && prs.some(({ pr }) => pr.state === 'open'))
      ))
        return;
      const prProgress = await Promise.all(
        prs.map(async ({ pr }) => [
          pr.id,
          pr.state,
          checksFingerprint(
            pr,
            (await findRepoById(tx.conn, pr.repoId))?.referenceChecks ?? [],
          ),
        ]),
      );
      const external = comments.filter(
        (c) => c.authorId !== PROJECT_MANAGER_ID || c.authorType !== 'agent',
      );
      const epoch = createHash('sha256')
        .update(
          JSON.stringify([
            issue.revision,
            issue.projectId,
            issue.title,
            issue.statusKey,
            issue.ownerUserId,
            issue.executorId,
            issue.priority,
            external.map((c) => [c.id, c.editedAt]),
            delegated.map((r) => [r.id, r.status, r.finishedAt]).sort(),
            prProgress.sort(),
          ]),
        )
        .digest('hex');
      const states = tx.conn.repository<IdleState>('studioManagerIdle');
      let state = await states.findOne({ filter: { id: issue.id } });
      if (!state || state.epoch !== epoch) {
        // A first observation uses the latest genuine activity. Later changed snapshots begin a new idle period now.
        const times = [
          issue.createdAt,
          issue.lastActivityAt,
          latest?.createdAt,
          ...external.map((c) => c.editedAt ?? c.createdAt),
          ...delegated.map((r) => r.finishedAt ?? r.createdAt),
        ]
          .filter(Boolean)
          .map((t) => new Date(t!).getTime());
        const lastAt = state
          ? now.toISOString()
          : new Date(Math.max(...times)).toISOString();
        await states.upsertOne({
          filter: { id: issue.id },
          create: { id: issue.id, epoch, lastAt, wokenEpoch: null },
          update: { epoch, lastAt },
        });
        state = {
          id: issue.id,
          epoch,
          lastAt,
          wokenEpoch: state?.wokenEpoch ?? null,
        };
      }
      if (
        state.wokenEpoch === epoch ||
        now.getTime() - new Date(state.lastAt).getTime() < minutes * 60_000
      )
        return;
      const attempt = await work.managerSignal(
        tx,
        { ...issue, executor: { type: 'agent', id: PROJECT_MANAGER_ID } },
        'managerIdle',
        'The issue has been idle while waiting for an agent or checks. Re-read runs, the dispatch thread and the complete PR check set, then decide the next step. Do not blindly reassign work.',
        { epoch, idleMinutes: minutes },
      );
      if (attempt.started)
        await states.updateMany({
          filter: { id: issue.id, epoch },
          values: { wokenEpoch: epoch },
        });
    });
}
