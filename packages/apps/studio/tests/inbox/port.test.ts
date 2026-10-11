// @vitest-environment node
/**
 * Studio's inbox port, as any contributor uses it: a notice about nothing in particular, a decision keyed by the
 * contributor and settled with its own outcome, what the port refuses, and release management's deployment requests
 * coming in (`server/releases/inbox.ts`).
 */
import path from 'node:path';

import type {
  NotificationSendInput,
  NotificationService,
} from '@nocobase/app-plugin-notification/server';
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

import type { ReleasesEventListener } from '@nocobase/app-plugin-releases/server/tokens';

import {
  bindReleasesInbox,
  requestNotice,
} from '../../server/releases/inbox.js';
import { InboxNoticeError, type InboxSend } from '../../server/inbox/port.js';
import {
  createStudioInbox,
  type StudioInbox,
} from '../../server/inbox/service.js';

const ROOT = path.resolve(import.meta.dirname, '../..');

let databases: ProvisionedTestDatabases;
let testDatabase: TestDatabase;
let database: DatabaseManager;
let inbox: StudioInbox;
let sent: NotificationSendInput<never>[];
let announced: string[];
let next = 0;

const notifications = {
  send(input: NotificationSendInput<never>) {
    sent.push(input);
    return Promise.resolve({
      notificationId: `n${(next += 1)}`,
      idempotencyKey: input.idempotencyKey,
      deduplicated: false,
      status: 'pending',
      deliveries: [],
    });
  },
} as unknown as NotificationService;

const decision = (
  source: string,
  decisionKey: string,
  userIds: string[],
): InboxSend => ({
  key: `${source}:${decisionKey}`,
  source,
  kind: 'decision',
  type: 'review_requested',
  userIds,
  title: 'Review requested',
  body: '',
  decisionKey,
});

beforeAll(async () => {
  databases = await provisionTestDatabases();
});
afterAll(() => databases.drop());

beforeEach(async () => {
  testDatabase = await databases.open({
    migrations: [
      {
        directory: path.join(ROOT, 'database/main/migrations'),
        packageName: 'studio',
      },
    ],
  });
  database = testDatabase.database;
  sent = [];
  announced = [];
  next = 0;
  inbox = createStudioInbox({
    database,
    notifications: () => notifications,
    channel: 'inbox',
    announce: (userId) => announced.push(userId),
    now: () => new Date('2026-10-01T08:00:00.000Z'),
  });
});
afterEach(() => testDatabase.destroy());

describe('the inbox port', () => {
  it('takes a notice about nothing in particular, with structured data and no route', async () => {
    await inbox.send({
      key: 'billing:quota:1',
      source: 'billing',
      kind: 'info',
      type: 'quota_reached',
      userIds: ['ann'],
      title: 'Quota reached',
      body: 'Runs are paused until next month.',
      data: {
        used: 1200,
        limit: 1000,
        projects: [{ name: 'Studio', runs: 900 }],
        paused: true,
      },
    });
    expect(sent[0]?.messages).toEqual({
      inbox: {
        to: ['ann'],
        title: 'Quota reached',
        body: 'Runs are paused until next month.',
      },
    });
    expect(await inbox.notices('ann', ['n1'])).toEqual([
      {
        notificationId: 'n1',
        source: 'billing',
        kind: 'info',
        type: 'quota_reached',
        subject: null,
        decisionKey: null,
        data: {
          used: 1200,
          limit: 1000,
          projects: [{ name: 'Studio', runs: 900 }],
          paused: true,
        },
        count: 1,
        resolvedAt: null,
        outcome: null,
      },
    ]);
    expect(await inbox.pending('ann')).toBe(0);
  });

  it("resolves a decision by its contributor's key, with the contributor's own outcome", async () => {
    await inbox.send(decision('releases', 'q1', ['ann', 'bob']));
    // Another contributor's decision under the same key is a different decision.
    await inbox.send(decision('plans', 'q1', ['ann']));
    expect(await inbox.pending('ann')).toBe(2);
    // A recipient reads the card waiting on them, with its data; anyone else reads nothing.
    expect(
      await inbox.decision('ann', { source: 'releases', decisionKey: 'q1' }),
    ).toMatchObject({
      source: 'releases',
      decisionKey: 'q1',
      resolvedAt: null,
    });
    expect(
      await inbox.decision('cid', { source: 'releases', decisionKey: 'q1' }),
    ).toBeNull();

    announced = [];
    await inbox.resolve({
      source: 'releases',
      decisionKey: 'q1',
      outcome: 'deployed',
    });
    expect(await inbox.pending('ann')).toBe(1);
    expect(await inbox.pending('bob')).toBe(0);
    expect(
      await inbox.decision('bob', { source: 'releases', decisionKey: 'q1' }),
    ).toBeNull();
    expect(await inbox.notices('bob', ['n1'])).toMatchObject([
      { resolvedAt: '2026-10-01T08:00:00.000Z', outcome: 'deployed' },
    ]);
    expect(announced.sort()).toEqual(['ann', 'bob']);

    await inbox.withdraw({ source: 'plans', decisionKey: 'q1' });
    expect(await inbox.notices('ann', ['n2'])).toMatchObject([
      { outcome: 'withdrawn' },
    ]);
    expect(await inbox.pending('ann')).toBe(0);
    // Settling again changes nothing.
    await inbox.resolve({
      source: 'releases',
      decisionKey: 'q1',
      outcome: 'rejected',
    });
    expect(await inbox.notices('ann', ['n1'])).toMatchObject([
      { outcome: 'deployed' },
    ]);
  });

  it('merges information by group within its source only', async () => {
    const info = (source: string): InboxSend => ({
      key: `${source}:${next}`,
      source,
      kind: 'info',
      type: 'noted',
      userIds: ['ann'],
      title: 'Noted',
      body: '',
      group: 'same',
    });
    // Without the in-app store nothing merges; the group key is still the source's.
    await inbox.send(info('a'));
    await inbox.send(info('b'));
    const rows = await database
      .connection()
      .query.selectFrom('studioInboxNotices')
      .select('groupKey')
      .orderBy('notificationId')
      .execute();
    expect(rows.map((row) => row.groupKey)).toEqual(['a:same', 'b:same']);
  });

  it('refuses a decision without a key, a key on information, and data that is not a JSON object', async () => {
    await expect(
      inbox.send({ ...decision('releases', 'q1', ['ann']), decisionKey: null }),
    ).rejects.toThrow(InboxNoticeError);
    await expect(
      inbox.send({
        ...decision('releases', 'q1', ['ann']),
        kind: 'info',
      }),
    ).rejects.toThrow(/Only a decision/u);
    await expect(
      inbox.send({
        ...decision('releases', 'q1', ['ann']),
        data: ['not', 'an', 'object'] as never,
      }),
    ).rejects.toThrow(/JSON object/u);
    await expect(
      inbox.send({ ...decision('', 'q1', ['ann']) }),
    ).rejects.toThrow(/source/u);
    expect(sent).toEqual([]);
  });
});

describe('release management plugged in', () => {
  const app = { id: 'app1', name: 'crm', environmentId: 'production' };
  const request = {
    id: 'req1',
    appId: 'app1',
    environmentId: 'production',
    releaseId: 'rel1',
    kind: 'deploy',
    note: 'Hotfix for the login page',
    requestedBy: 'carl',
    requestedVia: 'human',
    decisionNote: null,
    createdAt: '2026-10-01T07:00:00.000Z',
  };
  const created = {
    type: 'request.created',
    app,
    request,
    approvers: ['ann', 'bob', 'carl'],
    actor: { userId: 'carl', kind: 'human' },
  } as never;

  it('gives every approver, the requester included, a decision about the App, keyed by the request and opening it over the App', () => {
    expect(
      requestNotice(created, {
        release: {
          version: '2.1.0',
          sha: 'a1'.repeat(20),
          ref: 'v2.1.0',
          logsUrl: 'https://ci.example.com/runs/7',
        },
        environmentName: 'Production',
      }),
    ).toMatchObject({
      source: 'releases',
      kind: 'decision',
      type: 'deployment_requested',
      userIds: ['ann', 'bob', 'carl'],
      path: '/releases/app1/requests/req1',
      subject: { type: 'app', id: 'app1', label: 'crm' },
      decisionKey: 'req1',
      data: {
        requestId: 'req1',
        appName: 'crm',
        releaseVersion: '2.1.0',
        sha: 'a1'.repeat(20),
        ref: 'v2.1.0',
        logsUrl: 'https://ci.example.com/runs/7',
        environmentName: 'Production',
        note: 'Hotfix for the login page',
      },
    });
  });

  it('keeps the approvers’ inboxes in step with its events, and tells the requester', async () => {
    let listener: ReleasesEventListener = () => undefined;
    const stop = bindReleasesInbox({
      events: {
        subscribe: (next) => {
          listener = next;
          return () => undefined;
        },
      },
      port: () => inbox,
      lookup: {
        userName: (id) => Promise.resolve(id.toUpperCase()),
        environmentName: () => Promise.resolve('Production'),
        release: () =>
          Promise.resolve({
            version: '2.1.0',
            sha: null,
            ref: null,
            logsUrl: null,
          }),
        requester: () => Promise.resolve('carl'),
      },
    });
    await listener(created);
    expect(await inbox.pending('ann')).toBe(1);
    // The requester is an approver too, so may decide their own request.
    expect(await inbox.pending('carl')).toBe(1);
    expect(await inbox.notices('bob', ['n1'])).toMatchObject([
      { source: 'releases', decisionKey: 'req1', resolvedAt: null },
    ]);
    await listener({
      type: 'request.decided',
      app,
      request,
      decision: 'approved',
      actor: { userId: 'ann', kind: 'human' },
    } as never);
    expect(await inbox.notices('bob', ['n1'])).toMatchObject([
      { outcome: 'approved' },
    ]);
    expect(await inbox.pending('ann')).toBe(0);
    // The requester hears the outcome.
    expect(await inbox.notices('carl', ['n2'])).toMatchObject([
      {
        kind: 'info',
        type: 'deployment_request_decided',
        data: { decision: 'approved' },
      },
    ]);

    const second = { ...request, id: 'req2' };
    await listener({ ...(created as object), request: second } as never);
    await listener({
      type: 'request.decided',
      app,
      request: second,
      decision: 'cancelled',
      actor: { userId: 'carl', kind: 'human' },
    } as never);
    expect(await inbox.notices('ann', ['n3'])).toMatchObject([
      { outcome: 'withdrawn' },
    ]);

    // A failed deployment of an approved request goes to its requester.
    await listener({
      type: 'deployment.failed',
      app,
      deployment: {
        id: 'd1',
        kind: 'deploy',
        requestId: 'req1',
        actorId: 'ann',
      },
      release: { version: '2.1.0' },
      error: 'Health check failed.',
      actor: { userId: 'ann', kind: 'human' },
    } as never);
    expect(await inbox.notices('carl', ['n4'])).toMatchObject([
      {
        type: 'deployment_failed',
        data: { error: 'Health check failed.', releaseVersion: '2.1.0' },
      },
    ]);
    stop();
  });
});
