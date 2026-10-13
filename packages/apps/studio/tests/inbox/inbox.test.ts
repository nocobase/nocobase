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

const KEY = 'agents:blocked:i1:3';

const decision = (userIds: string[]): ProjectNotice => ({
  key: KEY,
  kind: 'decision',
  type: 'agent_blocked',
  userIds,
  title: 'Coder is blocked on PM-1',
  body: 'Coder is blocked and needs your input.',
  path: '/issues/PM-1',
  issue: { id: 'i1', identifier: 'PM-1' },
  params: { identifier: 'PM-1', actorName: 'Coder' },
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
        idempotencyKey: KEY,
        source: { type: 'studio.inbox', referenceId: 'agent_blocked' },
        messages: {
          inbox: {
            to: ['lead', 'admin', 'lead'],
            title: 'Coder is blocked on PM-1',
            body: 'Coder is blocked and needs your input.',
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
        type: 'agent_blocked',
        subject: { type: 'issue', id: 'i1', label: 'PM-1' },
        decisionKey: KEY,
        data: { identifier: 'PM-1', actorName: 'Coder' },
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
    const ref = { source: 'projects', decisionKey: KEY };
    expect(await inbox.waiting(ref)).toBe(true);
    announced = [];
    await inbox.resolve({ ...ref, outcome: 'answered' });
    expect(await inbox.waiting(ref)).toBe(false);
    expect(await inbox.waiting({ ...ref, decisionKey: 'never-sent' })).toBe(
      false,
    );
    expect(await inbox.pending('lead')).toBe(0);
    expect(await inbox.notices('admin', ['n1'])).toMatchObject([
      { resolvedAt: '2026-10-01T08:00:00.000Z', outcome: 'answered' },
    ]);
    expect(announced.sort()).toEqual(['admin', 'lead']);
    // Resolving again changes nothing and tells no one.
    announced = [];
    await inbox.resolve({ ...ref, outcome: 'stale' });
    expect(announced).toEqual([]);
    expect(await inbox.notices('lead', ['n1'])).toMatchObject([
      { outcome: 'answered' },
    ]);
  });

  it('lists the decisions of a type that still wait, once each with everyone they wait on', async () => {
    await projects.send(decision(['lead', 'admin']));
    await projects.send({
      ...decision(['lead']),
      key: 'agents:blocked:i2:5',
      issue: { id: 'i2', identifier: 'PM-2' },
    });
    await projects.send({
      ...decision(['lead']),
      key: 'other',
      type: 'run_failed_final',
    });
    await inbox.resolve({
      source: 'projects',
      decisionKey: 'agents:blocked:i2:5',
      outcome: 'answered',
    });
    expect(await inbox.openDecisions('projects', 'agent_blocked')).toEqual([
      {
        decisionKey: KEY,
        subject: { type: 'issue', id: 'i1', label: 'PM-1' },
        data: expect.objectContaining({ identifier: 'PM-1' }),
        userIds: ['lead', 'admin'],
        createdAt: expect.any(String),
      },
    ]);
    expect(await inbox.openDecisions('releases', 'agent_blocked')).toEqual([]);
  });

  it('pages waiting decisions by key without skipping cards beyond the first window', async () => {
    for (let index = 0; index < 501; index++) {
      const key = `decision-${String(index).padStart(4, '0')}`;
      await projects.send({
        ...decision(['lead']),
        key,
      });
    }
    const first = await inbox.openDecisions('projects', 'agent_blocked', '');
    expect(first).toHaveLength(500);
    const second = await inbox.openDecisions(
      'projects',
      'agent_blocked',
      first.at(-1)!.decisionKey,
    );
    expect(second.map((card) => card.decisionKey)).toEqual(['decision-0500']);
    expect(
      await inbox.openDecisions(
        'projects',
        'agent_blocked',
        second[0]!.decisionKey,
      ),
    ).toEqual([]);
    expect(
      await inbox.openDecisions('projects', 'agent_blocked', '', {
        type: 'issue',
        id: 'other',
      }),
    ).toEqual([]);
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

it('returns uncapped safe task decision summaries and excludes resolved, informational and unrelated notices', async () => {
  const ids = Array.from({ length: 601 }, (_, i) => `task-${i}`);
  for (const id of ids)
    await projects.send({
      ...decision(['lead', 'admin']),
      key: `question:${id}`,
      issue: { id, identifier: id },
      params: { privateText: 'Never expose this' },
    });
  await projects.send({
    ...decision(['admin']),
    key: 'second-reason',
    type: 'run_failed_final',
    issue: { id: ids[0]!, identifier: ids[0]! },
  });
  await projects.send({
    ...decision(['lead']),
    key: 'information',
    kind: 'info',
    issue: { id: 'info', identifier: 'info' },
  });
  const summaries = await inbox.taskDecisions([...ids, 'info'], 'lead');
  expect(summaries).toHaveLength(602);
  expect(
    summaries
      .filter((row) => row.type === 'agent_blocked')
      .every((row) => row.waitingForViewer),
  ).toBe(true);
  expect(summaries.find((row) => row.type === 'run_failed_final')).toEqual({
    issueId: ids[0],
    type: 'run_failed_final',
    waitingForViewer: false,
  });
  expect(JSON.stringify(summaries)).not.toMatch(
    /privateText|Never expose|userIds|decisionKey|notificationId/,
  );
  await inbox.resolve({
    source: 'projects',
    decisionKey: `question:${ids[0]}`,
    outcome: 'answered',
  });
  expect(await inbox.taskDecisions([ids[0]!], 'lead')).toEqual([
    { issueId: ids[0], type: 'run_failed_final', waitingForViewer: false },
  ]);
  expect(await inbox.taskDecisions([], 'lead')).toEqual([]);
});
