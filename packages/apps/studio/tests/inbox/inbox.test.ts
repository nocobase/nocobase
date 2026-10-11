// @vitest-environment node
/**
 * Studio's inbox over a real database: the projects plugin's notices, sent through Studio's inbox port, go out through
 * the notification service and are recorded per recipient, decisions wait until resolved, and each user reads only
 * their own notices.
 */
import path from 'node:path';

import type {
  NotificationSendInput,
  NotificationService,
} from '@nocobase/app-plugin-notification/server';
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

let databases: ProvisionedTestDatabases;
let testDatabase: TestDatabase;
let database: DatabaseManager;
let inbox: StudioInbox;
/** The projects plugin's side of the port (`projectsNoticesToken`). */
let projects: ProjectsNotices;
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

const decision = (userIds: string[]): ProjectNotice => ({
  key: 'pm:approval-requested:r1',
  kind: 'decision',
  type: 'approval_requested',
  userIds,
  title: 'PM-1 waits for your approval to move to Done',
  body: 'Retry callbacks',
  path: '/issues/PM-1',
  issue: { id: 'i1', identifier: 'PM-1' },
  approvalRequestId: 'r1',
  params: { identifier: 'PM-1', status: 'done', statusName: 'Done' },
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
  projects = createProjectsNotices(() => inbox);
});
afterEach(() => testDatabase.destroy());

describe('inbox', () => {
  it('sends a notice through the in-app channel and records it for each recipient', async () => {
    await projects.send(decision(['lead', 'admin', 'lead']));
    expect(sent).toEqual([
      {
        idempotencyKey: 'pm:approval-requested:r1',
        source: { type: 'studio.inbox', referenceId: 'approval_requested' },
        messages: {
          inbox: {
            to: ['lead', 'admin', 'lead'],
            title: 'PM-1 waits for your approval to move to Done',
            body: 'Retry callbacks',
            target: { type: 'route', path: '/issues/PM-1' },
          },
        },
      },
    ]);
    expect(await inbox.notices('lead', ['n1'])).toEqual([
      {
        notificationId: 'n1',
        source: 'projects',
        kind: 'decision',
        type: 'approval_requested',
        subject: { type: 'issue', id: 'i1', label: 'PM-1' },
        decisionKey: 'r1',
        data: { identifier: 'PM-1', status: 'done', statusName: 'Done' },
        count: 1,
        resolvedAt: null,
        outcome: null,
      },
    ]);
    expect(await inbox.pending('lead')).toBe(1);
    expect(await inbox.pending('admin')).toBe(1);
    expect(announced).toEqual(['lead', 'admin']);
  });

  it('shows each user only their own notices', async () => {
    await projects.send(decision(['lead']));
    expect(await inbox.notices('alice', ['n1'])).toEqual([]);
    expect(await inbox.pending('alice')).toBe(0);
  });

  it('stops counting a decision once it is resolved, and keeps how it ended', async () => {
    await projects.send(decision(['lead', 'admin']));
    const ref = { source: 'projects', decisionKey: 'r1' };
    expect(await inbox.waiting(ref)).toBe(true);
    announced = [];
    await projects.resolve({ approvalRequestId: 'r1', outcome: 'approved' });
    expect(await inbox.waiting(ref)).toBe(false);
    expect(await inbox.waiting({ ...ref, decisionKey: 'never-sent' })).toBe(
      false,
    );
    expect(await inbox.pending('lead')).toBe(0);
    expect(await inbox.notices('admin', ['n1'])).toMatchObject([
      { resolvedAt: '2026-10-01T08:00:00.000Z', outcome: 'approved' },
    ]);
    expect(announced.sort()).toEqual(['admin', 'lead']);
    // Resolving again changes nothing and tells no one.
    announced = [];
    await projects.resolve({ approvalRequestId: 'r1', outcome: 'stale' });
    expect(announced).toEqual([]);
    expect(await inbox.notices('lead', ['n1'])).toMatchObject([
      { outcome: 'approved' },
    ]);
  });

  it('lists the decisions of a type that still wait, once each with everyone they wait on', async () => {
    await projects.send(decision(['lead', 'admin']));
    await projects.send({
      ...decision(['lead']),
      key: 'pm:approval-requested:r2',
      approvalRequestId: 'r2',
      issue: { id: 'i2', identifier: 'PM-2' },
    });
    await projects.send({
      ...decision(['lead']),
      key: 'other',
      type: 'run_failed_final',
      approvalRequestId: null,
    });
    await projects.resolve({ approvalRequestId: 'r2', outcome: 'approved' });
    expect(await inbox.openDecisions('projects', 'approval_requested')).toEqual(
      [
        {
          decisionKey: 'r1',
          subject: { type: 'issue', id: 'i1', label: 'PM-1' },
          data: expect.objectContaining({ identifier: 'PM-1' }),
          userIds: ['lead', 'admin'],
          createdAt: expect.any(String),
        },
      ],
    );
    expect(await inbox.openDecisions('releases', 'approval_requested')).toEqual(
      [],
    );
  });

  it('records a notice sent twice once', async () => {
    const deduplicating = {
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
      notifications: () => deduplicating,
      channel: 'inbox',
      announce: () => undefined,
    });
    await projects.send(decision(['lead']));
    await projects.send(decision(['lead']));
    expect(await inbox.notices('lead', ['same'])).toHaveLength(1);
  });

  it('sends nothing without a notification service', async () => {
    inbox = createStudioInbox({
      database,
      notifications: () => null,
      channel: 'inbox',
      announce: () => undefined,
    });
    await projects.send(decision(['lead']));
    expect(await inbox.pending('lead')).toBe(0);
  });
});
