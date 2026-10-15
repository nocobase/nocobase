// @vitest-environment node
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { ServiceContainer } from '@nocobase/service-provider';
import StudioInboxProvider from '../../server/inbox/provider.js';
import { createDecisionReconciler } from '../../server/inbox/reconcile.js';
import {
  decisionReconcilerToken,
  studioInboxToken,
} from '../../server/inbox/token.js';
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

async function failedRun(
  issueId?: string,
  agentId?: string,
  reconcile = false,
) {
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
  await sendCard(result.runId, reconcile);
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
  it('keeps the card reassignment outcome while settling sibling cards', async () => {
    const first = await failedRun();
    const sibling = await failedRun(first.issue.id);
    await decideFailedRun(
      {
        runs: h.agents.runs,
        projects: () => h.projects,
        viewerOf: async (id) => h.viewer(id),
        inbox,
      },
      'alice',
      first.runId,
      { action: 'reassign', userId: 'bob' },
    );
    await expect
      .poll(() => inbox.waiting(runFailedDecision(sibling.runId)))
      .toBe(false);
    const items = await store.list({ userId: 'alice' });
    const notices = await inbox.notices(
      'alice',
      items.map((item) => item.notificationId),
    );
    expect(notices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          decisionKey: runFailedKey(first.runId),
          outcome: 'reassigned',
        }),
        expect.objectContaining({
          decisionKey: runFailedKey(sibling.runId),
          outcome: 'issueReassigned',
        }),
      ]),
    );
  });

  it('leaves the decision open when card reassignment fails', async () => {
    const { runId } = await failedRun();
    await expect(
      decideFailedRun(
        {
          runs: h.agents.runs,
          projects: () => h.projects,
          viewerOf: async (id) => h.viewer(id),
          inbox,
        },
        'alice',
        runId,
        { action: 'reassign', userId: 'missing-user' },
      ),
    ).rejects.toBeDefined();
    expect(await inbox.waiting(runFailedDecision(runId))).toBe(true);
  });
  it.each(['in_review', 'done', 'cancelled'])(
    'preserves failures delivered after moving to %s',
    async (statusKey) => {
      const issue = await h.projects.issues.create(h.viewer('alice'), {
        title: 'Review work',
      });
      await h.projects.issues.update(h.viewer('alice'), issue.id, {
        revision: issue.revision,
        statusKey,
        ...(statusKey === 'blocked' || statusKey === 'in_review'
          ? { needsYou: 'Please review the requested work.' }
          : {}),
      });
      const { runId } = await failedRun(issue.id, undefined, true);
      await reconcileFailedRunCards(h.agents, h.projects, inbox);
      expect(await inbox.waiting(runFailedDecision(runId))).toBe(true);
      for (const userId of ['alice', 'bob'])
        expect(
          await inbox.waitingFor(userId, { type: 'issue', id: issue.id }),
        ).toHaveLength(1);
    },
  );

  it('logs a broken card and continues to settle other cards without loading details', async () => {
    await stop[0]!();
    const first = await failedRun();
    const second = await failedRun();
    await h.agents.runs.retry(second.runId, 'alice', 'cli');
    const get = h.agents.runs.get.bind(h.agents.runs);
    const broken = new Error('Transient read failure');
    vi.spyOn(h.agents.runs, 'get').mockImplementation((id) =>
      id === first.runId ? Promise.reject(broken) : get(id),
    );
    const detail = vi.spyOn(h.agents.runs, 'detail');
    const onError = vi.fn();
    await reconcileFailedRunCards(
      h.agents,
      h.projects,
      inbox,
      undefined,
      onError,
    );
    expect(onError).toHaveBeenCalledWith(broken, runFailedKey(first.runId));
    expect(await inbox.waiting(runFailedDecision(first.runId))).toBe(true);
    expect(await inbox.waiting(runFailedDecision(second.runId))).toBe(false);
    expect(detail).not.toHaveBeenCalled();
  });

  it('boots before startup reconciliation finishes and contains its failure', async () => {
    let reject!: (error: unknown) => void;
    const pending = new Promise<never>((_, rejectPromise) => {
      reject = rejectPromise;
    });
    const container = new ServiceContainer();
    container.singleton(agentsToken, () => h.agents);
    container.singleton(projectsToken, () => h.projects);
    container.singleton(studioInboxToken, () => ({
      ...inbox,
      openDecisions: () => pending,
    }));
    container.singleton(decisionReconcilerToken, () =>
      createDecisionReconciler(
        () => h.database.connection(),
        () => inbox,
        () => undefined,
      ),
    );
    const provider = new StudioInboxProvider({
      container,
    } as unknown as Application);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await provider.boot();
      const failure = new Error('Page read failed');
      reject(failure);
      await provider.shutdown();
      expect(log).toHaveBeenCalledWith(
        'Studio could not reconcile failed-run cards at startup.',
        failure,
      );
    } finally {
      log.mockRestore();
    }
  });

  it('keeps a delivered notification when afterSend reconciliation fails', async () => {
    const { runId } = await failedRun();
    const failure = new Error('Page read failed');
    const onError = vi.fn();
    const notices = createProjectsNotices(
      () => inbox,
      () => Promise.reject(failure),
      onError,
    );
    const run = await h.agents.runs.get(runId);
    await expect(
      notices.send({
        key: 'another-card',
        kind: 'decision',
        type: RUN_FAILED_FINAL,
        userIds: ['alice'],
        title: 'Failure',
        body: 'What next?',
        issue: { id: run.subject.id, identifier: 'PM-1' },
        params: { runId },
      }),
    ).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(failure);
    expect(
      await inbox.waiting({ source: 'projects', decisionKey: 'another-card' }),
    ).toBe(true);
  });
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
