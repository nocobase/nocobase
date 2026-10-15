// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  DatabaseInAppStore,
  type InAppMessage,
} from '@nocobase/app-plugin-notification-in-app/server';
import type {
  NotificationSendInput,
  NotificationService,
} from '@nocobase/app-plugin-notification/server';
import type { InboxSend, InboxSettleRef } from '../../server/inbox/port.js';
import {
  createStudioInbox,
  type StudioInbox,
} from '../../server/inbox/service.js';
import {
  bindDecisionCleanup,
  createDecisionReconciler,
  type DecisionReconciler,
} from '../../server/inbox/reconcile.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { connectedRepo } from '../git/helpers.js';
import {
  ensureRepo,
  findRepoById,
  findLink,
  findPullRequestById,
} from '../../server/git/store.js';
import { sendMergeCard } from '../../server/git/cards.js';

let h: BridgeHarness;
let inbox: StudioInbox;
let repair: DecisionReconciler;
let store: DatabaseInAppStore;
let announced: string[];
let release: () => void;
let next: number;
const errors = vi.fn();
let beforeSettle: ((ref: InboxSettleRef) => Promise<void>) | undefined;
let afterDelivery: ((notice: InboxSend) => void) | undefined;
let deliveryGate: ((notice: InboxSend) => Promise<void>) | undefined;

beforeEach(async () => {
  announced = [];
  next = 0;
  const notifications = new Map<string, string>();
  errors.mockClear();
  deliveryGate = undefined;
  beforeSettle = undefined;
  afterDelivery = undefined;
  h = await createBridgeHarness({
    inApp: true,
    inboxPort(database) {
      store = new DatabaseInAppStore(database);
      inbox = createStudioInbox({
        database,
        channel: 'inbox',
        inApp: () => store,
        announce: (id) => announced.push(id),
        notifications: () =>
          ({
            async send(input: NotificationSendInput<never>) {
              const key = input.idempotencyKey;
              const existing = key ? notifications.get(key) : undefined;
              if (existing)
                return {
                  notificationId: existing,
                  deliveries: [],
                  status: 'completed',
                  deduplicated: true,
                  idempotencyKey: key,
                };
              const notificationId = `n${++next}`;
              if (key) notifications.set(key, notificationId);
              const message = (input.messages as Record<string, InAppMessage>)
                .inbox!;
              const users =
                typeof message.to === 'string' ? [message.to] : message.to;
              for (const userId of users)
                await store.deliver({
                  deliveryId: `${notificationId}:${userId}`,
                  notificationId,
                  userId,
                  message,
                  createdAt: new Date().toISOString(),
                });
              return {
                notificationId,
                deliveries: [],
                status: 'completed',
                deduplicated: false,
                idempotencyKey: input.idempotencyKey,
              };
            },
          }) as unknown as NotificationService,
      });
      return {
        ...inbox,
        async send(notice) {
          await deliveryGate?.(notice);
          await inbox.send(notice);
          afterDelivery?.(notice);
        },
        async settle(ref) {
          await beforeSettle?.(ref);
          await inbox.settle(ref);
        },
      };
    },
  });
  for (const user of ['alice', 'bob']) await h.addUser(user);
  h.roles.set('alice', 'admin');
  repair = createDecisionReconciler(
    () => h.database.connection(),
    () => inbox,
    errors,
  );
  release = bindDecisionCleanup(h.projects, repair, errors);
});
afterEach(async () => {
  release();
  await h.close();
});

async function issue(statusKey = 'in_progress') {
  const created = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Clear obsolete decisions',
    statusKey: 'in_progress',
    start: false,
  });
  if (statusKey !== 'in_progress') await move(created.id, statusKey);
  return created;
}
async function move(id: string, statusKey: string) {
  const current = await h.projects.issueQueries.detail(h.viewer('alice'), id);
  return h.projects.issues.update(h.viewer('alice'), id, {
    revision: current.revision,
    statusKey,
    ...(['blocked', 'in_review'].includes(statusKey)
      ? { needsYou: 'Review this work' }
      : {}),
  });
}
async function card(
  issueId: string,
  key: string,
  options: Partial<InboxSend> = {},
) {
  await inbox.send({
    key,
    source: 'git',
    kind: 'decision',
    type: 'pr_merge_requested',
    decisionKey: key,
    userIds: ['alice', 'bob'],
    title: 'Please decide',
    body: '',
    subject: { type: 'issue', id: issueId },
    data: { pullRequestId: key, repo: 'nocobase/old-repo' },
    ...options,
  });
}
async function clear(id: string) {
  await expect.poll(() => inbox.pending('alice')).toBe(0);
  expect(await inbox.waitingFor('alice', { type: 'issue', id })).toEqual([]);
  expect(errors).not.toHaveBeenCalled();
}

it.each([
  ['in_progress', 'done'],
  ['in_progress', 'cancelled'],
  ['in_review', 'done'],
  ['in_review', 'cancelled'],
])(
  'clears old IDs, unlinked and migrated PRs for read and unread recipients from %s to %s',
  async (from, status) => {
    const task = await issue(from);
    for (let i = 0; i < 10; i++) await card(task.id, `old-${i}`);
    const waiting = await inbox.waitingFor('alice');
    for (const { item } of waiting.slice(0, 5))
      await store.update({ id: item.id, userId: 'alice', action: 'read' });
    await card(task.id, 'news', {
      kind: 'info',
      decisionKey: null,
      type: 'news',
    });
    announced = [];
    await move(task.id, status);
    await clear(task.id);
    expect(await inbox.pending('bob')).toBe(0);
    expect(await inbox.unreadNotifications('alice')).toBe(1);
    expect(new Set(announced)).toEqual(new Set(['alice', 'bob']));
    expect((await inbox.notices('alice', ['n1']))[0]?.outcome).toBe(
      'withdrawn',
    );
    announced = [];
    await repair.issue(task.id);
    expect(announced).toEqual([]);
  },
);

it('previews whole decisions across recipients, pages stably, rechecks and can rerun after failures', async () => {
  const task = await issue('done');
  const other = await issue();
  await card(task.id, 'a');
  await card(task.id, 'b');
  await card(other.id, 'other');
  await card(task.id, 'app', {
    source: 'releases',
    subject: { type: 'app', id: task.id },
  });
  const preview = await repair.page({ pageSize: 1 });
  expect(preview.data).toMatchObject([
    { decisionKey: 'a', count: 2, outcome: 'withdrawn' },
  ]);
  expect(await inbox.pending('alice')).toBe(4);
  expect(preview.meta.nextPageToken).toBeDefined();
  const second = await repair.page({
    pageSize: 1,
    pageToken: preview.meta.nextPageToken,
  });
  expect(second.data.map((row) => row.decisionKey)).toEqual(['b']);
  const resolve = vi
    .spyOn(inbox, 'resolve')
    .mockRejectedValueOnce(new Error('Test delivery failure'));
  expect((await repair.page({ execute: true })).meta.failed).toBe(1);
  expect(errors).toHaveBeenCalledOnce();
  resolve.mockRestore();
  errors.mockClear();
  await repair.page({ execute: true });
  expect(await inbox.pending('alice')).toBe(2);
  expect((await repair.page({ execute: true })).data).toEqual([]);
  // A preview grants no authority over an issue which was subsequently reopened.
  await card(task.id, 'reopen');
  await repair.page();
  await move(task.id, 'in_progress');
  expect((await repair.page({ execute: true })).data).toEqual([]);
  expect(await inbox.waiting({ source: 'git', decisionKey: 'reopen' })).toBe(
    true,
  );
});

it('preserves a known merged result during automatic completion and clears siblings with obsolete IDs', async () => {
  const task = await issue('in_review');
  const repo = await connectedRepo(h, 'acme/studio');
  h.github.addPull('acme/studio', {
    number: 1,
    head: { ref: 'feature', sha: 'head' },
  });
  const linked = await h.git.link(
    h.viewer('alice'),
    task.id,
    'https://github.com/acme/studio/pull/1',
    { type: 'user', id: 'alice' },
  );
  const conn = h.database.connection();
  const duplicateRepo = await ensureRepo(
    conn,
    'https://api.github.com',
    'acme/Studio',
  );
  const stored = await conn
    .repository('studioPullRequests')
    .findOne({ filter: { id: linked.pullRequest.id } });
  await conn.repository('studioPullRequests').createOne({
    values: {
      ...stored,
      id: 'old-duplicate',
      repoId: duplicateRepo.id,
      state: 'merged',
    },
  });
  await card(task.id, 'duplicate-identity', {
    data: { pullRequestId: 'old-duplicate', repo: 'acme/Studio' },
  });
  await card(task.id, 'historical');
  expect(await inbox.pending('alice')).toBe(3);
  h.github.merge('acme/studio', 1, 'alice');
  await h.git.pollRepo((await findRepoById(h.projects.tx.read(), repo.id))!);
  await clear(task.id);
  const notices = await inbox.notices('alice', ['n1', 'n2', 'n3']);
  expect(
    notices.find(
      (notice) => notice.data?.pullRequestId === linked.pullRequest.id,
    )?.outcome,
  ).toBe('merged');
  expect(
    notices.find((notice) => notice.decisionKey === 'historical')?.outcome,
  ).toBe('withdrawn');
  expect(
    notices.find((notice) => notice.decisionKey === 'duplicate-identity')
      ?.outcome,
  ).toBe('merged');
  await repair.issue(task.id);
  expect((await inbox.notices('alice', ['n1']))[0]?.outcome).toBe('merged');
});

it('keeps withdrawn history and restores one fresh decision on relink or the next review', async () => {
  const task = await issue('in_review');
  await connectedRepo(h, 'acme/studio');
  h.github.addPull('acme/studio', { number: 2 });
  const linked = await h.git.link(
    h.viewer('alice'),
    task.id,
    'https://github.com/acme/studio/pull/2',
    { type: 'user', id: 'alice' },
  );
  const beforeUnlink = await h.projects.issueQueries.detail(
    h.viewer('alice'),
    task.id,
  );
  await h.git.unlink(h.viewer('alice'), task.id, linked.pullRequest.id);
  expect(await inbox.pending('alice')).toBe(0);
  await h.git.link(
    h.viewer('alice'),
    task.id,
    'https://github.com/acme/studio/pull/2',
    { type: 'user', id: 'alice' },
  );
  expect(await inbox.pending('alice')).toBe(1);
  const fresh = await inbox.waitingFor('alice', { type: 'issue', id: task.id });
  expect(fresh).toHaveLength(1);
  expect(fresh[0]!.notice.notificationId).not.toBe('n1');
  expect((await inbox.notices('alice', ['n1']))[0]).toMatchObject({
    outcome: 'withdrawn',
    resolvedAt: expect.any(String),
  });
  // Linking again and replaying delivery must reuse the current decision.
  await h.git.link(
    h.viewer('alice'),
    task.id,
    'https://github.com/acme/studio/pull/2',
    { type: 'user', id: 'alice' },
  );
  const current = await h.projects.issueQueries.detail(
    h.viewer('alice'),
    task.id,
  );
  expect(current.revision).toBe(beforeUnlink.revision);
  const conn = h.database.connection();
  const link = (await findLink(conn, task.id, linked.pullRequest.id))!;
  await sendMergeCard(
    inbox,
    {
      id: task.id,
      identifier: task.identifier,
      title: task.title,
      ownerUserId: 'alice',
      revision: current.revision,
    },
    (await findPullRequestById(conn, linked.pullRequest.id))!,
    link.id,
  );
  expect(await inbox.pending('alice')).toBe(1);
  expect(
    await inbox.waitingFor('alice', { type: 'issue', id: task.id }),
  ).toEqual(fresh);
  await move(task.id, 'in_progress');
  await clear(task.id);
  await move(task.id, 'in_review');
  await expect.poll(() => inbox.pending('alice')).toBe(1);
  expect((await inbox.notices('alice', ['n1']))[0]?.resolvedAt).not.toBeNull();
});

it('preserves a merged result when delivery finishes during terminal cleanup of an old identity', async () => {
  const task = await issue('in_review');
  const repo = await connectedRepo(h, 'acme/studio');
  h.github.addPull('acme/studio', { number: 3 });
  await card(task.id, 'historical-before-delivery');
  // Exercise the Git listener alone to control the interval between its snapshot and settlement.
  release();
  release = () => undefined;
  let inspected!: () => void;
  let delivered!: () => void;
  const snapshot = new Promise<void>((resolve) => {
    inspected = resolve;
  });
  const delivery = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  beforeSettle = async () => {
    inspected();
    await delivery;
  };
  afterDelivery = (notice) => {
    if (notice.type === 'pr_merge_requested') delivered();
  };
  deliveryGate = async (notice) => {
    if (notice.type !== 'pr_merge_requested') return;
    h.github.merge('acme/studio', 3, 'alice');
    await h.git.pollRepo((await findRepoById(h.projects.tx.read(), repo.id))!);
    await snapshot;
  };
  await h.git.link(
    h.viewer('alice'),
    task.id,
    'https://github.com/acme/studio/pull/3',
    { type: 'user', id: 'alice' },
  );
  await clear(task.id);
  const notices = await inbox.notices('alice', ['n1', 'n2']);
  expect(
    notices.find(
      (notice) => notice.decisionKey === 'historical-before-delivery',
    )?.outcome,
  ).toBe('withdrawn');
  expect(
    notices.find(
      (notice) => notice.data?.pullRequestId !== 'historical-before-delivery',
    )?.outcome,
  ).toBe('merged');
});

it('settles old task questions but preserves a new failed review after completion', async () => {
  const task = await issue();
  await card(task.id, 'blocked', { source: 'projects', type: 'agent_blocked' });
  await card(task.id, 'failed', {
    source: 'projects',
    type: 'run_failed_final',
  });
  await move(task.id, 'done');
  await clear(task.id);
  await card(task.id, 'new-review', {
    source: 'projects',
    type: 'run_failed_final',
  });
  await repair.issue(task.id);
  expect(
    await inbox.waiting({ source: 'projects', decisionKey: 'new-review' }),
  ).toBe(true);
  expect(
    (await inbox.notices('alice', ['n1', 'n2'])).map(
      (notice) => notice.outcome,
    ),
  ).toEqual(['unblocked', 'issueMoved']);
});

it('protects preview and execution with management permission before validating input', async () => {
  const task = await issue('done');
  await card(task.id, 'history');
  expect(
    (await h.request('POST', '/inbox/reconcile', { body: {} })).status,
  ).toBe(401);
  expect(
    (
      await h.request('POST', '/inbox/reconcile', {
        user: 'bob',
        body: { execute: 'invalid' },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await h.request('POST', '/inbox/reconcile', {
        user: 'alice',
        body: { execute: 'invalid' },
      })
    ).status,
  ).toBe(400);
  const preview = await h.request('POST', '/inbox/reconcile', {
    user: 'alice',
    body: {},
  });
  expect(preview.status).toBe(200);
  expect(preview.body).toMatchObject({
    data: [{ count: 2, outcome: 'withdrawn' }],
    meta: { execute: false },
  });
  expect(await inbox.pending('alice')).toBe(1);
  const result = await h.request('POST', '/inbox/reconcile', {
    user: 'alice',
    body: { execute: true },
  });
  expect(result.status).toBe(200);
  expect(await inbox.pending('alice')).toBe(0);
});

it('measures bounded preview and compensation work on a page of ten historical decisions', async () => {
  const task = await issue('done');
  for (let index = 0; index < 10; index++)
    await card(task.id, `history-${index}`);
  await card(task.id, 'information', { kind: 'info', decisionKey: null });
  const client = await h.database.connection().client<import('knex').Knex>();
  await repair.page();
  const statements: string[] = [];
  const scope = new AsyncLocalStorage<boolean>();
  const listener = (query: { sql: string }) => {
    if (scope.getStore()) statements.push(query.sql);
  };
  client.on('query', listener);
  const started = performance.now();
  try {
    const preview = await scope.run(true, () => repair.page());
    const previewMs = performance.now() - started;
    expect(preview.data).toHaveLength(10);
    expect(preview.data.reduce((count, row) => count + row.count, 0)).toBe(20);
    const previewQueries = statements.length;
    expect(statements.filter((sql) => !/^select /iu.test(sql))).toEqual([]);
    statements.length = 0;
    const beforeExecute = performance.now();
    await scope.run(true, () => repair.page({ execute: true }));
    const executionMs = performance.now() - beforeExecute;
    const writes = statements.filter((sql) => sql.startsWith('update ')).length;
    const executionQueries = statements.length;
    expect(writes).toBe(10);
    statements.length = 0;
    await scope.run(true, () => repair.page({ execute: true }));
    expect(statements.filter((sql) => sql.startsWith('update '))).toEqual([]);
    process.stderr.write(
      'Decision reconciliation measurement ' +
        JSON.stringify({
          decisions: 10,
          recipients: 20,
          previewQueries,
          previewMs,
          executionQueries,
          executionMs,
          writes,
          emptyRerunQueries: statements.length,
        }) +
        '\n',
    );
    expect(previewQueries).toBeGreaterThan(0);
    expect(previewQueries).toBeLessThanOrEqual(3);
    expect(executionQueries).toBeLessThanOrEqual(25);
    expect(statements).toHaveLength(1);
    expect(await inbox.pending('alice')).toBe(0);
    expect(await inbox.unreadNotifications('alice')).toBe(1);
  } finally {
    client.removeListener('query', listener);
  }
});

it('uses existing handoff, request and run records to preserve new decisions without changing their lifecycle', async () => {
  const task = await issue('done');
  const conn = h.database.connection();
  const agentId = await h.createAgent();
  await conn.query
    .updateTable('pmActivities')
    .set({ createdAt: new Date('2026-01-01T00:00:00.000Z') })
    .where('issueId', '=', task.id)
    .where('action', '=', 'status_changed')
    .execute();
  for (const [id, createdAt] of [
    ['old-run', '2020-01-01T00:00:00.000Z'],
    ['new-run', '2027-01-01T00:00:00.000Z'],
    ['steered-run', '2020-01-01T00:00:00.000Z'],
  ]) {
    await conn.repository('agRuns').createOne({
      values: {
        id,
        agentId,
        subjectKind: 'issue',
        subjectId: task.id,
        threadScope: 'root',
        actorUserId: 'alice',
        status: 'failed',
        createdAt,
        updatedAt: createdAt,
      },
    });
    await card(task.id, id!, {
      source: 'projects',
      type: 'run_failed_final',
      data: { runId: id! },
    });
  }
  await conn.repository('agRuns').createOne({
    values: {
      id: 'retry-of-old',
      agentId,
      subjectKind: 'issue',
      subjectId: task.id,
      threadScope: 'root',
      actorUserId: 'alice',
      status: 'completed',
      retryOfRunId: 'old-run',
      createdAt: '2027-01-01T00:00:00.000Z',
      updatedAt: '2027-01-01T00:00:00.000Z',
    },
  });
  await conn.repository('agRunInputs').createOne({
    values: {
      id: 'review-comment',
      runId: 'steered-run',
      type: 'comment',
      actorKind: 'user',
      actorId: 'alice',
      actorName: 'Alice',
      text: 'Please review the completed work',
      createdAt: '2027-01-01T00:00:00.000Z',
    },
  });
  for (const [id, createdAt, status] of [
    ['old-request', '2020-01-01T00:00:00.000Z', 'pending'],
    ['new-request', '2027-01-01T00:00:00.000Z', 'pending'],
    ['confirmed-request', '2027-01-01T00:00:00.000Z', 'confirmed'],
  ]) {
    await conn.repository('agRunRequests').createOne({
      values: {
        id,
        agentId,
        subjectKind: 'issue',
        subjectId: task.id,
        threadScope: 'root',
        responsibleUserId: 'alice',
        requestedByUserId: 'bob',
        inputType: 'comment',
        inputActorKind: 'user',
        inputActorId: 'bob',
        inputActorName: 'Bob',
        inputText: 'Review',
        status,
        expiresAt: '2028-01-01T00:00:00.000Z',
        createdAt,
        updatedAt: createdAt,
      },
    });
    await card(task.id, id!, {
      source: 'runners',
      type: 'personal_runner_consent',
      data: { requestId: id! },
    });
  }
  await conn.repository('studioIssueOwnerHandoffs').createOne({
    values: {
      issueId: task.id,
      waiting: true,
      ownerUserId: 'alice',
      previousOwnerUserId: 'bob',
      transferredByUserId: 'bob',
      notificationKey: 'current',
      transferredAt: '2027-01-01T00:00:00.000Z',
      rejectedAt: null,
    },
  });
  await card(task.id, 'handoff-old', {
    source: 'projects',
    type: 'owner_handoff',
    data: { notificationKey: 'old' },
  });
  await card(task.id, 'handoff-current', {
    source: 'projects',
    type: 'owner_handoff',
    data: { notificationKey: 'current' },
  });
  await card(task.id, 'reassigned', {
    source: 'projects',
    type: 'run_failed_final',
    data: { runId: 'new-run', executorType: 'agent', executorId: agentId },
  });
  const preview = await repair.page();
  expect(preview.data.map((row) => [row.decisionKey, row.outcome])).toEqual(
    expect.arrayContaining([
      ['old-run', 'retried'],
      ['reassigned', 'issueReassigned'],
      ['old-request', 'withdrawn'],
      ['confirmed-request', 'confirmed'],
      ['handoff-old', 'withdrawn'],
    ]),
  );
  expect(preview.data).toHaveLength(5);
  await repair.page({ execute: true });
  expect(
    (await inbox.waitingFor('alice'))
      .map(({ notice }) => notice.decisionKey)
      .sort(),
  ).toEqual(['handoff-current', 'new-request', 'new-run', 'steered-run']);
  expect(
    await conn
      .repository('agRunRequests')
      .findOne({ filter: { id: 'old-request' } }),
  ).toMatchObject({ status: 'pending' });
  expect(
    await conn.repository('agRuns').findOne({ filter: { id: 'old-run' } }),
  ).toMatchObject({ status: 'failed' });
  expect(errors).not.toHaveBeenCalled();
});
