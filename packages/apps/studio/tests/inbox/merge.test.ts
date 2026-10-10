// @vitest-environment node
/**
 * Merging information of one group into one inbox item per user: the newer notice replaces the user's previous item
 * of the group (deleted from the in-app plugin) and counts on from it, read or not; a user who deleted the previous
 * item starts again from one; decisions never merge.
 */
import path from 'node:path';
import { createRequire } from 'node:module';

import type {
  NotificationSendInput,
  NotificationService,
} from '@nocobase/app-plugin-notification/server';
import {
  DatabaseInAppStore,
  type InAppMessage,
} from '@nocobase/app-plugin-notification-in-app/server';
import type { ProjectNotice } from '@nocobase/app-plugin-projects/server/tokens';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { ProjectsNotices } from '@nocobase/app-plugin-projects/server/tokens';

import { createProjectsNotices } from '../../server/inbox/projects.js';
import {
  createStudioInbox,
  type StudioInbox,
} from '../../server/inbox/service.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const IN_APP_ROOT = path.dirname(
  createRequire(import.meta.url).resolve(
    '@nocobase/app-plugin-notification-in-app/package.json',
  ),
);

let databases: ProvisionedTestDatabases;
let testDatabase: TestDatabase;
let database: DatabaseManager;
let store: DatabaseInAppStore;
let inbox: StudioInbox;
let projects: ProjectsNotices;
let next = 0;

/** Delivers each message to the in-app store at once, as the in-app channel would. */
function notifications(): NotificationService {
  return {
    async send(input: NotificationSendInput<never>) {
      const notificationId = `n${(next += 1)}`;
      const message = (input.messages as Record<string, InAppMessage>).inbox;
      const to = typeof message.to === 'string' ? [message.to] : message.to;
      for (const userId of to)
        await store.deliver({
          deliveryId: `${notificationId}:${userId}`,
          notificationId,
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
}

const commented = (key: string, userIds: string[]): ProjectNotice => ({
  key,
  kind: 'info',
  type: 'commented',
  userIds,
  title: 'Ann commented on PM-1',
  body: key,
  path: '/issues/PM-1',
  issue: { id: 'i1', identifier: 'PM-1' },
  group: 'commented:i1',
  actor: { type: 'user', id: 'ann', name: 'Ann' },
  params: { identifier: 'PM-1', actorName: 'Ann' },
});

async function items(userId: string) {
  return store.list({ userId });
}

beforeAll(async () => {
  databases = await provisionTestDatabases();
});
afterAll(() => databases.drop());

beforeEach(async () => {
  testDatabase = await databases.open({
    migrations: (
      [
        [path.join(ROOT, 'database/main/migrations'), 'studio'],
        [
          path.join(IN_APP_ROOT, 'database/migrations'),
          '@nocobase/app-plugin-notification-in-app',
        ],
      ] as const
    ).map(([directory, packageName]) => ({ directory, packageName })),
  });
  database = testDatabase.database;
  store = new DatabaseInAppStore(database);
  next = 0;
  inbox = createStudioInbox({
    database,
    notifications,
    inApp: () => store,
    channel: 'inbox',
    announce: () => undefined,
  });
  projects = createProjectsNotices(() => inbox);
});
afterEach(() => testDatabase.destroy());

describe('merging notices', () => {
  it('counts unread notifications across pages, excluding decisions and other recipients, and follows reads and deletion', async () => {
    for (let i = 0; i < 25; i += 1)
      await inbox.send({
        key: `news:${i}`,
        source: 'news',
        kind: 'info',
        type: 'news',
        userIds: ['bob'],
        title: 'News',
        body: '',
      });
    await projects.send({
      ...commented('request', ['bob']),
      kind: 'decision',
      type: 'approval_requested',
      approvalRequestId: 'r1',
    });
    await projects.resolve({ approvalRequestId: 'r1', outcome: 'approved' });
    // No Studio metadata: still a notification, even when another recipient has a decision for that notification.
    const unknown = await store.deliver({
      deliveryId: 'external:bob',
      notificationId: 'n26',
      userId: 'cat',
      message: { body: 'External' },
      createdAt: new Date().toISOString(),
    });
    expect(await inbox.unreadNotifications('bob')).toBe(25);
    expect(await inbox.unreadNotifications('cat')).toBe(1);
    expect(await inbox.unreadNotifications('nobody')).toBe(0);
    const first = (await items('bob')).find(
      (item) => item.notificationId !== 'n26',
    )!;
    await store.update({ id: first.id, userId: 'bob', action: 'read' });
    expect(await inbox.unreadNotifications('bob')).toBe(24);
    await store.update({ id: first.id, userId: 'bob', action: 'unread' });
    expect(await inbox.unreadNotifications('bob')).toBe(25);
    await store.update({ id: first.id, userId: 'bob', action: 'delete' });
    expect(await inbox.unreadNotifications('bob')).toBe(24);
    await store.update({ id: unknown.id, userId: 'cat', action: 'delete' });
    expect(await inbox.unreadNotifications('cat')).toBe(0);
  });

  it('replaces the previous item of the group and counts on, read or not', async () => {
    await projects.send(commented('c1', ['bob', 'cat']));
    const [first] = await items('bob');
    await store.update({ id: first.id, userId: 'bob', action: 'read' });
    await projects.send(commented('c2', ['bob']));
    await projects.send(commented('c3', ['bob']));

    const left = await items('bob');
    expect(left.map((item) => item.body)).toEqual(['c3']);
    expect(left[0].readAt ?? null).toBeNull();
    expect(await inbox.notices('bob', ['n3'])).toMatchObject([
      { type: 'commented', count: 3 },
    ]);
    // Someone not sent the later notices keeps their own item.
    expect((await items('cat')).map((item) => item.body)).toEqual(['c1']);
  });

  it('starts again from one once the user deleted the previous item', async () => {
    await projects.send(commented('c1', ['bob']));
    const [first] = await items('bob');
    await store.update({ id: first.id, userId: 'bob', action: 'delete' });
    await projects.send(commented('c2', ['bob']));
    expect(await inbox.notices('bob', ['n2'])).toMatchObject([{ count: 1 }]);
  });

  it('never merges decisions', async () => {
    const decision = (key: string): ProjectNotice => ({
      ...commented(key, ['bob']),
      kind: 'decision',
      type: 'approval_requested',
      approvalRequestId: key,
    });
    await projects.send(decision('r1'));
    await projects.send(decision('r2'));
    expect(await items('bob')).toHaveLength(2);
    expect(await inbox.pending('bob')).toBe(2);
  });

  it('does not merge a notice sent again into itself', async () => {
    const same = {
      send: (input: NotificationSendInput<never>) =>
        Promise.resolve({
          notificationId: 'same',
          idempotencyKey: input.idempotencyKey,
          deduplicated: true,
          status: 'completed',
          deliveries: [],
        }),
    } as unknown as NotificationService;
    inbox = createStudioInbox({
      database,
      notifications: () => same,
      inApp: () => store,
      channel: 'inbox',
      announce: () => undefined,
    });
    await projects.send(commented('c1', ['bob']));
    await projects.send(commented('c1', ['bob']));
    expect(await inbox.notices('bob', ['same'])).toMatchObject([{ count: 1 }]);
  });
});

describe('waiting decisions and settling', () => {
  const decision = (
    key: string,
    issueId: string,
    userIds: string[] = ['bob'],
  ): ProjectNotice => ({
    ...commented(key, userIds),
    kind: 'decision',
    type: 'approval_requested',
    issue: { id: issueId, identifier: `PM-${issueId}` },
    approvalRequestId: key,
  });

  it('lists every decision still waiting with its item, newest first, or those about one subject', async () => {
    await projects.send(decision('r1', '1'));
    await projects.send(commented('c1', ['bob']));
    await projects.send(decision('r2', '2'));
    await projects.send(decision('r3', '1'));
    await projects.resolve({ approvalRequestId: 'r3', outcome: 'approved' });
    const waiting = await inbox.waitingFor('bob');
    expect(waiting.map(({ notice }) => notice.decisionKey)).toEqual([
      'r2',
      'r1',
    ]);
    expect(waiting[0]?.item).toMatchObject({
      notificationId: 'n3',
      title: 'Ann commented on PM-1',
      target: { type: 'route', path: '/issues/PM-1' },
    });
    expect(
      (await inbox.waitingFor('bob', { type: 'issue', id: '1' })).map(
        ({ notice }) => notice.decisionKey,
      ),
    ).toEqual(['r1']);
    // An item the user deleted is not listed; another user's never are.
    await store.update({
      id: waiting[0]?.item.id ?? '',
      userId: 'bob',
      action: 'delete',
    });
    expect(
      (await inbox.waitingFor('bob')).map(({ notice }) => notice.decisionKey),
    ).toEqual(['r1']);
    expect(await inbox.waitingFor('cat')).toEqual([]);
  });

  it('settles what a source no longer needs about a subject: of some types, for some people', async () => {
    await projects.send(decision('r1', '1', ['bob', 'cat']));
    await projects.send(commented('c1', ['bob']));
    await projects.send(decision('r2', '2'));
    await inbox.settle({
      source: 'projects',
      subject: { type: 'issue', id: '1' },
      types: ['approval_requested'],
      userIds: ['bob'],
      outcome: 'answered',
    });
    expect(await inbox.notices('bob', ['n1'])).toMatchObject([
      { resolvedAt: expect.any(String), outcome: 'answered' },
    ]);
    expect(await inbox.notices('cat', ['n1'])).toMatchObject([
      { resolvedAt: null },
    ]);
    // Information settles too; another subject's items are left alone.
    await inbox.settle({
      source: 'projects',
      subject: { type: 'issue', id: 'i1' },
      outcome: 'gone',
    });
    expect(await inbox.notices('bob', ['n2', 'n3'])).toMatchObject([
      { notificationId: 'n2', outcome: 'gone' },
      { notificationId: 'n3', resolvedAt: null },
    ]);
    expect(await inbox.pending('bob')).toBe(1);
  });
});
