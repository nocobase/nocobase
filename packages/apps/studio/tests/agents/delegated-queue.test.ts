// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import {
  delegationTimeout,
  managerDelegation,
} from '../../server/agents/delegated-queue.js';
import {
  drainRunReports,
  stageRunReport,
} from '../../server/agents/run-report.js';
import { issueProgress } from '../../server/agents/manager/progress.js';
import { commentGuardId } from '../../server/agents/comment-guard.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  await h.close();
});
const alice = () => h.viewer('alice');
const manager = () => ({
  ...alice(),
  actor: { type: 'agent', id: PROJECT_MANAGER_ID },
});
async function dispatch(person = false) {
  const worker = await h.createAgent({ name: 'Worker' });
  const issue = await h.projects.issues.create(alice(), {
    title: 'Delegation timeout',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    start: false,
  });
  const { comment } = await h.projects.comments.create(
    person ? alice() : manager(),
    issue.id,
    { content: `[@Worker](mention://agent/${worker}) implement this step` },
  );
  const run = (
    await h.agents.runs.openOn(
      h.database.connection(),
      { kind: 'issue', id: issue.id },
      worker,
    )
  )[0]!;
  return { worker, issue, comment, run };
}
async function age(runId: string) {
  await h.database
    .connection()
    .query.updateTable('agRuns')
    .set({ queueEnteredAt: new Date(Date.now() - 600_001).toISOString() })
    .where('id', '=', runId)
    .execute();
}
const rows = (issueId: string) =>
  h.projects.commentQueries.list(h.database.connection(), issueId);
const pending = (id: string) =>
  h.database
    .connection()
    .repository<{
      status: string;
      attempts: number;
      lastError: string | null;
      payload: unknown;
    }>('studioRunReports')
    .findOne({ filter: { id } });

describe('manager delegated queue timeout', () => {
  it('keeps the exact 600 second boundary and immutable source when inputs are appended', async () => {
    const { run, worker, issue } = await dispatch();
    const rule = delegationTimeout(h.agents);
    const entered = Date.parse(run.queueEnteredAt!);
    expect(
      await rule(h.database.connection(), run, new Date(entered + 599_999)),
    ).toBeNull();
    expect(
      await rule(h.database.connection(), run, new Date(entered + 600_000)),
    ).toMatchObject({ reason: 'delegatedQueueTimeout' });
    await h.projects.comments.create(manager(), issue.id, {
      content: `[@Worker](mention://agent/${worker}) additional context`,
    });
    const allInputs = (await h.agents.runs.detail(run.id)).inputs;
    const later = allInputs.at(-1)!;
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({
        createdAt: new Date(Date.parse(run.createdAt) - 1000).toISOString(),
      })
      .where('id', '=', later.id)
      .execute();
    const appended = await h.agents.runs.get(run.id);
    expect(appended.queueEnteredAt).toBe(run.queueEnteredAt);
    expect((await h.agents.runs.detail(run.id)).inputs).toHaveLength(2);
    expect(
      await managerDelegation(h.database.connection(), appended),
    ).not.toBeNull();
    await h.manager.update('alice', { delegationQueueTimeoutSeconds: 1200 });
    expect(
      await rule(
        h.database.connection(),
        appended,
        new Date(entered + 600_000),
      ),
    ).toBeNull();
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ availableAt: new Date(entered + 600_000).toISOString() })
      .where('id', '=', run.id)
      .execute();
    expect(
      await rule(
        h.database.connection(),
        await h.agents.runs.get(run.id),
        new Date(entered + 1_799_999),
      ),
    ).toBeNull();
  });
  it('does not adopt a human-created run when a manager mention joins it', async () => {
    const { run, worker, issue } = await dispatch(true);
    await h.projects.comments.create(manager(), issue.id, {
      content: `[@Worker](mention://agent/${worker}) more context`,
    });
    const appended = (await h.agents.runs.detail(run.id)).inputs.at(-1)!;
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({
        createdAt: new Date(Date.parse(run.createdAt) - 1000).toISOString(),
      })
      .where('id', '=', appended.id)
      .execute();
    await age(run.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
    expect(await pending(run.id)).toBeUndefined();
  });
  it('withdraws offline work without polling and reports once in the original thread as its agent', async () => {
    const { run, worker, issue, comment } = await dispatch();
    await h.database
      .connection()
      .query.updateTable('agRunners')
      .set({ status: 'offline' })
      .allowAllRows()
      .execute();
    await age(run.id);
    await Promise.all([h.agents.sweeper.sweep(), h.agents.sweeper.sweep()]);
    await vi.waitFor(async () =>
      expect((await pending(run.id))?.status).toBe('done'),
    );
    await Promise.all([
      drainRunReports(h.agents, h.projects),
      drainRunReports(h.agents, h.projects),
    ]);
    expect(await h.agents.runs.get(run.id)).toMatchObject({
      status: 'cancelled',
      failureReason: 'delegatedQueueTimeout',
      executions: [],
    });
    const reply = (await rows(issue.id)).filter((c) => c.authorId === worker);
    expect(reply).toHaveLength(1);
    expect(reply[0]).toMatchObject({
      authorType: 'agent',
      parentId: comment.id,
    });
    expect(reply[0]!.content).toContain('runners are offline');
    expect(reply[0]!.content).not.toContain('mention://');
    const woken = (
      await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        PROJECT_MANAGER_ID,
      )
    )[0]!;
    expect(woken.actorUserId).toBe('alice');
  });
  it('retains a failed delivery and retries it with its stored cause after a restarted dispatcher', async () => {
    const { run, worker, issue } = await dispatch();
    const post = vi
      .spyOn(h.projects.comments, 'post')
      .mockRejectedValue(new Error('Temporary delivery interruption'));
    await age(run.id);
    await h.agents.sweeper.sweep();
    await vi.waitFor(async () =>
      expect((await pending(run.id))?.attempts).toBe(1),
    );
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
    const snapshot = (await pending(run.id))!.payload;
    post.mockRestore();
    // A fresh dispatcher has no event history; it discovers the durable row alone.
    await drainRunReports(h.agents, h.projects, new Date(Date.now() + 60_000));
    expect(await pending(run.id)).toMatchObject({
      status: 'done',
      payload: snapshot,
      lastError: null,
    });
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(1);
  });
  it('rolls back the withdrawal when report registration fails, and never reports success', async () => {
    const { run, worker, issue } = await dispatch();
    await age(run.id);
    const binding = h.agents.subjects.get('issue')!;
    const original = binding.sink!.onRunFinished!;
    binding.sink!.onRunFinished = async (tx, ended) => {
      await original(tx, ended);
      throw new Error('Failed committing pending report');
    };
    await expect(h.agents.sweeper.sweep()).rejects.toThrow('Failed committing');
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
    expect(await pending(run.id)).toBeUndefined();
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
  });
  it('serializes withdrawal with claim so only one succeeds', async () => {
    const { run, worker, issue } = await dispatch();
    await age(run.id);
    const [claimed] = await Promise.all([
      h.claimOne(),
      h.agents.sweeper.sweep(),
    ]);
    const current = await h.agents.runs.get(run.id);
    const payloads = claimed ? [claimed] : [];
    if (current.status === 'cancelled') {
      expect(
        (
          await h.runner(RUNNER_ROUTES.complete, run.id, {
            summary: 'Late output',
            handledInputIds: [],
          })
        ).status,
      ).toBeGreaterThanOrEqual(400);
      expect(
        payloads.some((p: { run: { id: string } }) => p.run.id === run.id),
      ).toBe(false);
      await vi.waitFor(async () =>
        expect((await pending(run.id))?.status).toBe('done'),
      );
      expect(
        (await rows(issue.id)).filter((c) => c.authorId === worker),
      ).toHaveLength(1);
    } else {
      expect(current.status).toBe('dispatched');
      expect(await pending(run.id)).toBeUndefined();
    }
  });
  it('retains the manager input and shows manual continuation when commentRunLimit is reached', async () => {
    const { run, issue } = await dispatch();
    await h.manager.update('alice', { commentRunLimit: 1 });
    // One actual prior completed comment-triggered run reaches the existing quota.
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ status: 'completed', startedAt: new Date().toISOString() })
      .where('id', '=', run.id)
      .execute();
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({ deliveredAt: new Date().toISOString() })
      .where('runId', '=', run.id)
      .execute();
    const worker = await h.createAgent({ name: 'Second' });
    await h.projects.comments.create(manager(), issue.id, {
      content: `[@Second](mention://agent/${worker}) next step`,
    });
    // The existing guard held this mention. Resume explicitly to create a second delegation, preserving the first count.
    const guard = await h.database
      .connection()
      .repository<{ pendingToken: string; ruleConfig: unknown }>(
        'studioStageRunGuards',
      )
      .findOne({ filter: { id: commentGuardId(issue.id) } });
    expect(guard?.pendingToken).toBeTruthy();
    // Register a timeout report for the first run to exercise the same protected automatic reply path.
    const ended = {
      ...run,
      status: 'cancelled' as const,
      failureReason: 'delegatedQueueTimeout' as const,
      failureDetail: 'Queued too long; withdrawn.',
    };
    await h.projects.tx.run(async (tx) => stageRunReport(tx.conn, ended));
    await drainRunReports(h.agents, h.projects);
    expect((await pending(run.id))?.status).toBe('done');
    expect(
      await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        PROJECT_MANAGER_ID,
      ),
    ).toHaveLength(0);
    const held = await h.database
      .connection()
      .repository<{ pendingToken: string; ruleConfig: unknown }>(
        'studioStageRunGuards',
      )
      .findOne({ filter: { id: commentGuardId(issue.id) } });
    expect(held?.pendingToken).toBeTruthy();
    expect(JSON.stringify(held?.ruleConfig)).toContain('Queued too long');
    expect(
      (
        await issueProgress(
          { agents: h.agents, projects: h.projects },
          h.database.connection(),
          issue,
        )
      ).state,
    ).toBe('waitingForContinuation');
    const resumed = await h.request(
      'POST',
      `/issueCommentRuns/${issue.id}/continue`,
      { user: 'alice', body: { token: held!.pendingToken } },
    );
    expect(resumed.status).toBe(200);
    const managerRun = (
      await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        PROJECT_MANAGER_ID,
      )
    )[0]!;
    expect(
      (await h.agents.runs.detail(managerRun.id)).inputs.some((input) =>
        input.text.includes('Queued too long'),
      ),
    ).toBe(true);
  });
  it('leaves already claimed work alone and rejects late runner output after a withdrawal', async () => {
    const { run } = await dispatch();
    await age(run.id);
    const payload = await h.claimOne();
    expect(payload.run.id).toBe(run.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run.id)).status).toBe('dispatched');
    expect(await pending(run.id)).toBeUndefined();
  });
  it('falls back to the issue root when the dispatch comment was deleted', async () => {
    const { run, worker, issue, comment } = await dispatch();
    await h.database
      .connection()
      .query.updateTable('pmComments')
      .set({ deletedAt: new Date().toISOString() })
      .where('id', '=', comment.id)
      .execute();
    await age(run.id);
    await h.agents.sweeper.sweep();
    await vi.waitFor(async () =>
      expect((await pending(run.id))?.status).toBe('done'),
    );
    const reply = (await rows(issue.id)).find((c) => c.authorId === worker)!;
    expect(reply.parentId).toBeNull();
    expect(reply.content).toContain(comment.id);
  });
  it('keeps permission-blocked delivery pending until the acting user regains access', async () => {
    const { run, worker, issue } = await dispatch();
    h.roles.set('alice', 'guest');
    await age(run.id);
    await h.agents.sweeper.sweep();
    await vi.waitFor(async () =>
      expect((await pending(run.id))?.attempts).toBeGreaterThanOrEqual(1),
    );
    expect((await pending(run.id))?.lastError).toBeTruthy();
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
    h.roles.set('alice', 'admin');
    await drainRunReports(
      h.agents,
      h.projects,
      new Date(Date.now() + 3_600_000),
    );
    expect((await pending(run.id))?.status).toBe('done');
  });
  it('keeps provenance-unknown historical records queued', async () => {
    const { run } = await dispatch();
    const input = (await h.agents.runs.detail(run.id)).inputs[0]!;
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({ payload: { trigger: 'mention', byAgent: true } })
      .where('id', '=', input.id)
      .execute();
    await age(run.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
  });
});
