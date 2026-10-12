// @vitest-environment node
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type {
  NotificationService,
  NotificationSendInput,
} from '@nocobase/app-plugin-notification/server';
import {
  DatabaseInAppStore,
  type InAppMessage,
} from '@nocobase/app-plugin-notification-in-app/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createStudioInbox,
  type StudioInbox,
} from '../../server/inbox/service.js';
import { createProjectsNotices } from '../../server/inbox/projects.js';
import {
  RUN_FAILED_FINAL,
  runFailedDecision,
  runFailedKey,
  settleFailedRunCards,
} from '../../server/agents/notices.js';
import {
  reconcileFailedRunCards,
  watchFailedRunCards,
} from '../../server/agents/failed-run-cards.js';
import { decideFailedRun } from '../../server/agents/failed-runs.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let inbox: StudioInbox;
let store: DatabaseInAppStore;
let stop: (() => void | Promise<void>)[];
const errors = vi.fn();

beforeEach(async () => {
  h = await createBridgeHarness({ inApp: true });
  await h.addUser('alice');
  await h.addUser('bob');
  store = new DatabaseInAppStore(h.database);
  let next = 0;
  const notifications = {
    async send(input: NotificationSendInput<never>) {
      const notificationId = `notice-${++next}`;
      const message = (input.messages as Record<string, InAppMessage>).inbox;
      for (const userId of typeof message.to === 'string'
        ? [message.to]
        : message.to)
        await store.deliver({
          notificationId,
          deliveryId: `${notificationId}:${userId}`,
          userId,
          message,
          createdAt: new Date().toISOString(),
        });
      return {
        notificationId,
        idempotencyKey: input.idempotencyKey,
        deduplicated: false,
        status: 'completed',
        deliveries: [],
      };
    },
  } as unknown as NotificationService;
  inbox = createStudioInbox({
    database: h.database,
    notifications: () => notifications,
    inApp: () => store,
    channel: 'inbox',
    announce: () => undefined,
  });
  errors.mockClear();
  stop = [
    watchFailedRunCards(h.agents, h.projects, inbox, errors),
    settleFailedRunCards(
      () => h.projects,
      () => inbox,
      errors,
    ),
  ];
});
afterEach(async () => {
  await Promise.all(stop.map((release) => release()));
  await h.close();
  if (errors.mock.calls.length)
    throw new Error('Failed-run card reconciliation failed.', {
      cause: errors.mock.calls[0]?.[0],
    });
});

async function failedRun(issueId?: string, agentId?: string) {
  agentId ??= await h.createAgent({ maxAttempts: 1 });
  const issue = issueId
    ? await h.projects.issueQueries.detail(h.viewer('alice'), issueId)
    : await h.projects.issues.create(h.viewer('alice'), {
        title: 'Retry checkout',
      });
  const result = await h.agents.runs.enqueue({
    agentId,
    subject: { kind: 'issue', id: issue.id },
    actorUserId: 'alice',
    ownerUserId: 'alice',
    input: {
      type: 'comment',
      actor: { kind: 'user', id: 'alice', name: 'Alice' },
      text: 'Please fix it.',
      payload: { trigger: 'mention' },
    },
  });
  if (result.outcome === 'pending') throw new Error('Expected queued work.');
  const claim = await h.claimOne();
  if (claim?.run.id !== result.runId)
    throw new Error('Expected the requested run to be claimed.');
  await h.runner(RUNNER_ROUTES.fail, result.runId, {
    reason: 'toolAuth',
    detail: 'Not signed in.',
  });
  await sendCard(result.runId);
  return { runId: result.runId, issue, agentId };
}

async function sendCard(runId: string, reconcile = false) {
  const run = await h.agents.runs.get(runId);
  const issue = await h.projects.issueContext.contextFor(
    h.projects.tx.read(),
    run.subject.id,
  );
  if (!issue) throw new Error('Expected issue.');
  const notices = createProjectsNotices(
    () => inbox,
    reconcile
      ? () => reconcileFailedRunCards(h.agents, h.projects, inbox)
      : undefined,
  );
  await notices.send({
    key: runFailedKey(runId),
    kind: 'decision',
    type: RUN_FAILED_FINAL,
    userIds: ['alice', 'bob'],
    title: 'Run failed',
    body: 'What next?',
    issue: { id: issue.id, identifier: issue.identifier },
    params: {
      identifier: issue.identifier,
      runId,
      agentId: run.agentId,
      executorType: issue.executor?.type ?? '',
      executorId: issue.executor?.id ?? '',
    },
  });
}

describe('failed-run card lifecycle over committed runs and the real inbox', () => {
  it.each(['cli', 'runRecord', 'card'] as const)(
    'settles every recipient after a %s retry and keeps its attribution',
    async (source) => {
      const { runId, issue } = await failedRun();
      expect(await inbox.waitingFor('alice')).toHaveLength(1);
      expect(
        await inbox.waitingFor('alice', { type: 'issue', id: issue.id }),
      ).toHaveLength(1);
      const nextId =
        source === 'card'
          ? (
              await decideFailedRun(
                {
                  runs: h.agents.runs,
                  projects: () => h.projects,
                  viewerOf: async (id) => h.viewer(id),
                  inbox,
                },
                'alice',
                runId,
                { action: 'retry' },
              )
            ).runId!
          : (await h.agents.runs.retry(runId, 'alice', source)).id;
      await expect
        .poll(() => inbox.waiting(runFailedDecision(runId)))
        .toBe(false);
      for (const userId of ['alice', 'bob']) {
        expect(await inbox.pending(userId)).toBe(0);
        expect(await inbox.waitingFor(userId)).toEqual([]);
        expect(
          await inbox.waitingFor(userId, { type: 'issue', id: issue.id }),
        ).toEqual([]);
        const [item] = await store.list({ userId });
        expect(
          (await inbox.notices(userId, [item!.notificationId]))[0],
        ).toMatchObject({
          outcome: 'retried',
          data: {
            retriedByUserId: 'alice',
            retriedByName: 'alice',
            retrySource: source,
            retriedRunId: nextId,
            runId,
          },
        });
      }
      expect((await h.agents.runs.detail(runId)).retriedRunId).toBe(nextId);
    },
  );

  it('settles an older card on a new run of the same agent and preserves other agents and issues', async () => {
    const first = await failedRun();
    const otherAgent = await failedRun(first.issue.id);
    const otherIssue = await failedRun();
    const next = await h.agents.runs.enqueue({
      agentId: first.agentId,
      subject: { kind: 'issue', id: first.issue.id },
      actorUserId: 'alice',
      threadScope: 'another-comment',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'alice', name: 'Alice' },
        text: 'Try the revised plan.',
      },
    });
    await expect
      .poll(() => inbox.waiting(runFailedDecision(first.runId)))
      .toBe(false);
    expect(await inbox.waiting(runFailedDecision(otherAgent.runId))).toBe(true);
    expect(await inbox.waiting(runFailedDecision(otherIssue.runId))).toBe(true);
    const items = await store.list({ userId: 'alice' });
    expect(
      await inbox.notices(
        'alice',
        items.map((item) => item.notificationId),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          decisionKey: runFailedKey(first.runId),
          outcome: 'newRun',
          data: expect.objectContaining({
            replacementRunId: next.outcome !== 'pending' ? next.runId : '',
          }),
        }),
      ]),
    );
  });

  it('reconciles legacy cards at startup and a failure notification delivered after its retry', async () => {
    await stop[0]!();
    const { runId } = await failedRun();
    const next = await h.agents.runs.retry(runId, 'alice', 'cli');
    await h.agents.runs.cancel(next.id, 'alice');
    expect(await inbox.waiting(runFailedDecision(runId))).toBe(true);
    await reconcileFailedRunCards(h.agents, h.projects, inbox);
    expect(await inbox.waiting(runFailedDecision(runId))).toBe(false);
    await sendCard(runId, true);
    expect(await inbox.waiting(runFailedDecision(runId))).toBe(false);
  });

  it.each(['reassigned', 'done', 'cancelled'])(
    'settles when the issue is %s',
    async (change) => {
      const { runId, issue } = await failedRun();
      const detail = await h.projects.issueQueries.detail(
        h.viewer('alice'),
        issue.id,
      );
      await h.projects.issues.update(h.viewer('alice'), issue.id, {
        revision: detail.revision,
        ...(change === 'reassigned'
          ? { executor: { type: 'user', id: 'bob' } }
          : { statusKey: change }),
      });
      await expect
        .poll(() => inbox.waiting(runFailedDecision(runId)))
        .toBe(false);
    },
  );
});
