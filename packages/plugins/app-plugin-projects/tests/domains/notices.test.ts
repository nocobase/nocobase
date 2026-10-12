// @vitest-environment node
import { i18nToken } from '@nocobase/app-server/i18n';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import {
  createVisibilityFilter,
  startNotifications,
} from '../../server/providers/notifications.js';
import {
  projectsNoticesToken,
  type ProjectNotice,
  type ProjectsNotices,
} from '../../server/tokens.js';
import { createHarness, permissionsOf, type Harness } from '../harness.js';

let h: Harness;
let sent: ProjectNotice[];
let stop: () => void;

/** An application that binds its own notices and translates keys as `key(values)`. */
function application(): AppPluginApplication {
  const services = new Map<unknown, unknown>([
    [
      projectsNoticesToken,
      {
        send: (notice: ProjectNotice) => {
          sent.push(notice);
          return Promise.resolve();
        },
      } satisfies ProjectsNotices,
    ],
    [
      i18nToken,
      {
        getDefaultLocale: () => 'en-US',
        ensureLocaleLoaded: () => Promise.resolve(),
        getFixedT:
          () =>
          (key: string, values: Record<string, unknown> = {}) =>
            `${key}(${Object.entries(values)
              .filter(([name]) => name !== 'defaultValue')
              .map(([name, value]) => `${name}=${String(value)}`)
              .join(',')})`,
      },
    ],
  ]);
  return {
    config: { get: () => undefined },
    container: {
      has: (token: unknown) => services.has(token),
      resolve: (token: unknown) => services.get(token),
    },
  } as unknown as AppPluginApplication;
}

beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'lead', 'alice']) await h.addUser(id, id);
  sent = [];
  stop = startNotifications(application(), h.services.events);
});
afterEach(async () => {
  stop();
  await h.close();
});

const admin = () => h.viewer('admin', 'admin');
const lead = () => h.viewer('lead');
const alice = () => h.viewer('alice');

async function moveTo(
  viewer: ReturnType<typeof alice>,
  issue: Issue,
  to: string,
) {
  const current = await h.services.issueQueries.detail(viewer, issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey: to,
  });
}

describe('owner notified', () => {
  it('tells the owner when someone else moves the issue to blocked or in review', async () => {
    const issue = await h.services.issues.create(lead(), {
      title: 'Retry callbacks',
      statusKey: 'in_progress',
    });
    await moveTo(alice(), issue, 'blocked');
    await vi.waitFor(() =>
      expect(
        sent.filter((notice) => notice.type === 'owner_notified'),
      ).toHaveLength(1),
    );
    expect(
      sent.find((notice) => notice.type === 'owner_notified'),
    ).toMatchObject({
      kind: 'info',
      userIds: ['lead'],
      title: `notifications.ownerNotified(identifier=${issue.identifier},status=status.blocked())`,
      body: 'Retry callbacks',
      params: { status: 'blocked', statusName: 'Blocked' },
    });
    await moveTo(alice(), issue, 'in_review');
    await vi.waitFor(() =>
      expect(
        sent.filter((notice) => notice.type === 'owner_notified'),
      ).toHaveLength(2),
    );
    // The owner's own move tells nobody; a status that does not ask for the owner neither.
    await moveTo(lead(), issue, 'blocked');
    await moveTo(alice(), issue, 'in_progress');
    expect(
      (await h.services.issueQueries.activities(admin(), issue.id, {})).data
        .filter((activity) => activity.action === 'owner_notified')
        .map((activity) => activity.details.statusKey),
    ).toEqual(['blocked', 'in_review']);
  });
});

describe('collaboration notices', () => {
  const bob = () => h.viewer('bob');
  const mention = (id: string) => `[@${id}](mention://user/${id})`;

  beforeEach(async () => {
    await h.addUser('bob', 'Bob');
    await h.addUser('carol', 'Carol');
  });

  it('tells followers of a comment and the people it mentions, never the author', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Callbacks',
    });
    await h.services.subscriptions.set(h.viewer('carol'), issue.id, true);
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: `Ping ${mention('alice')} please`,
    });
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    const byType = Object.fromEntries(
      sent.map((notice) => [notice.type, notice]),
    );
    expect(byType.mentioned).toMatchObject({
      key: `pm:mentioned:comment:${comment.id}`,
      userIds: ['alice'],
      group: `mentioned:${issue.id}`,
      path: `/issues/${issue.identifier}?comment=${comment.id}`,
      body: 'Ping @alice please',
      params: { source: 'comment', commentId: comment.id, actorName: 'Bob' },
    });
    expect(byType.commented).toMatchObject({
      key: `pm:commented:${comment.id}`,
      userIds: ['carol'],
      title: `notifications.commented(identifier=${issue.identifier},actor=Bob)`,
    });
  });

  it('tells nobody of a note written by another kind', async () => {
    h.services.kinds.add({ key: 'bot' });
    const issue = await h.services.issues.create(alice(), { title: 'Bots' });
    await h.services.comments.post({ type: 'bot', id: 'b1' }, issue.id, {
      content: `/note ${mention('alice')}`,
    });
    await h.services.comments.post({ type: 'bot', id: 'b1' }, issue.id, {
      content: 'Done',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ type: 'commented', userIds: ['alice'] });
  });

  it('tells new owners, executors and followers of a status change by a person', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Handover',
      executor: { type: 'user', id: 'carol' },
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      type: 'executor_assigned',
      userIds: ['carol'],
    });
    const current = await h.services.issueQueries.detail(alice(), issue.id);
    await h.services.issues.update(alice(), issue.id, {
      revision: current.revision,
      ownerUserId: 'bob',
      statusKey: 'in_progress',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(3));
    expect(
      sent.slice(1).map((notice) => [notice.type, notice.userIds]),
    ).toEqual([
      ['owner_assigned', ['bob']],
      ['status_changed', ['carol', 'bob']],
    ]);
    expect(sent[2]?.params).toMatchObject({
      from: 'backlog',
      status: 'in_progress',
      statusName: 'In progress',
    });
  });

  it('lets a plugin rule join, and a decision beat a status change', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Rules' });
    await h.services.subscriptions.set(bob(), issue.id, true);
    const stopRule = h.services.noticeRules.add(async ({ events }) =>
      events.some((event) => event.type === 'issue.updated')
        ? [
            {
              key: `test:decide:${issue.id}`,
              kind: 'decision',
              type: 'test_decision',
              issue: {
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
              },
              userIds: ['bob'],
              actor: { type: 'user', id: 'alice', name: 'alice' },
              slot: 'change',
              params: { title: 'Decide', body: 'Please' },
            },
          ]
        : [],
    );
    const current = await h.services.issueQueries.detail(alice(), issue.id);
    await h.services.issues.update(alice(), issue.id, {
      revision: current.revision,
      statusKey: 'in_progress',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      type: 'test_decision',
      kind: 'decision',
      userIds: ['bob'],
      title: 'Decide',
    });
    stopRule();
  });

  it('sends only to those who may see the issue', async () => {
    stop();
    stop = startNotifications(
      application(),
      h.services.events,
      createVisibilityFilter(
        {
          permissionsOfUser: (userId) =>
            Promise.resolve(
              permissionsOf(userId === 'carol' ? 'none' : 'member', userId),
            ),
        },
        () => h.database.connection(),
      ),
    );
    const issue = await h.services.issues.create(alice(), { title: 'Secret' });
    await h.services.comments.create(bob(), issue.id, {
      content: `${mention('carol')} ${mention('alice')}`,
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ type: 'mentioned', userIds: ['alice'] });
  });
});
