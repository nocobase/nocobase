// @vitest-environment node
import type { NotificationService } from '@nocobase/app-plugin-notification/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { noticeIdentities } from '../../server/inbox/identities.js';
import {
  createStudioInbox,
  type StudioInbox,
} from '../../server/inbox/service.js';
import {
  commentGuardId,
  commentGuards,
} from '../../server/agents/comment-guard.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let inbox: StudioInbox;
let next: number;
beforeEach(async () => {
  h = await createBridgeHarness();
  next = 0;
  inbox = createStudioInbox({
    database: h.database,
    notifications: () =>
      ({
        send: async () => ({ notificationId: `identity-${++next}` }),
      }) as unknown as NotificationService,
    channel: 'inbox',
    announce: () => {},
    identities: (_userId, rows, notices) =>
      noticeIdentities(h.database.connection(), h.agents, rows, notices),
  });
});
afterEach(() => h.close());

describe('historical notice identities', () => {
  it('resolves actor and target independently after two renames, without changing storage or sharing other recipients notices', async () => {
    const coder = await h.createAgent({ name: 'Coder' });
    await inbox.send({
      key: 'old-blocked',
      source: 'projects',
      type: 'agent_blocked',
      kind: 'decision',
      decisionKey: 'old-blocked',
      userIds: ['alice'],
      title: 'Project manager is blocked',
      body: 'Historical Project manager body',
      actor: { type: 'agent', id: PROJECT_MANAGER_ID, name: 'Project manager' },
      data: {
        actorName: 'Project manager',
        agentId: coder,
        agentName: 'Coder',
        agentNameKey: 'studioAgents.projectManager.name',
        agentNameNs: 'studio',
      },
    });
    for (const name of ['项目经理', '负责人']) {
      await h.manager.update('alice', { name });
      const notices = await inbox.notices('alice', ['identity-1']);
      expect(notices[0].data).toMatchObject({
        actorName: name,
        agentName: 'Coder',
      });
      expect(notices[0].data?.agentNameKey).toBeUndefined();
      expect(
        (
          await inbox.decision('alice', {
            source: 'projects',
            decisionKey: 'old-blocked',
          })
        )?.data?.actorName,
      ).toBe(name);
      expect(await inbox.notices('bob', ['identity-1'])).toEqual([]);
      expect(
        await inbox.decision('bob', {
          source: 'projects',
          decisionKey: 'old-blocked',
        }),
      ).toBeNull();
    }
    const row = await h.database
      .connection()
      .repository('studioInboxNotices')
      .findOne({ filter: { notificationId: 'identity-1' } });
    const data =
      typeof row?.data === 'string'
        ? (JSON.parse(row.data) as Record<string, unknown>)
        : row?.data;
    expect(data).toMatchObject({ actorName: 'Project manager' });
  });

  it('recovers a legacy limit notice only with its exact pending token and otherwise suppresses the identity snapshot', async () => {
    await commentGuards(h.database.connection()).createOne({
      values: {
        id: commentGuardId('issue-old'),
        issueId: 'issue-old',
        statusKey: '@comments',
        resetAt: null,
        pendingToken: 'exact',
        agentId: null,
        fromStatus: null,
        ruleConfig: {
          actor: {
            kind: 'agent',
            id: PROJECT_MANAGER_ID,
            name: 'Project manager',
          },
        },
      },
    });
    for (const [index, token] of ['exact', 'stale', ''].entries())
      await inbox.send({
        key: `limit-${index}`,
        source: 'projects',
        type: 'comment_runs_limited',
        kind: 'info',
        userIds: ['alice'],
        title: 'Comments reached their limit',
        body: 'Old body',
        subject: { type: 'issue', id: 'issue-old', label: 'PM-1' },
        data: { agentName: 'Project manager', continueToken: token },
      });
    await h.manager.update('alice', { name: '项目经理' });
    const notices = await inbox.notices('alice', [
      'identity-1',
      'identity-2',
      'identity-3',
    ]);
    expect(
      notices.find((notice) => notice.notificationId === 'identity-1')?.data,
    ).toMatchObject({ agentId: PROJECT_MANAGER_ID, agentName: '项目经理' });
    for (const id of ['identity-2', 'identity-3'])
      expect(
        notices.find((notice) => notice.notificationId === id)?.data,
      ).toMatchObject({ agentIdentityUnknown: true });
    expect(
      notices.find((notice) => notice.notificationId === 'identity-2')?.data
        ?.agentName,
    ).toBeUndefined();
    await commentGuards(h.database.connection()).updateOne({
      filter: { id: commentGuardId('issue-old') },
      values: { pendingToken: null },
    });
    expect(
      (await inbox.notices('alice', ['identity-1']))[0].data
        ?.agentIdentityUnknown,
    ).toBe(true);
  });

  it('uses a run ID when an old notice lacks its agent ID and falls back only for a missing subject', async () => {
    await h.addUser('alice');
    await h.createAgent({ name: 'Coder' });
    const queued = await h.agents.runs.enqueue({
      agentId: PROJECT_MANAGER_ID,
      subject: { kind: 'issue', id: 'old' },
      actorUserId: 'alice',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'alice', name: 'Alice' },
        text: 'Old input',
      },
    });
    await inbox.send({
      key: 'run-notice',
      source: 'projects',
      type: 'run_failed_final',
      kind: 'info',
      userIds: ['alice'],
      title: 'Old title',
      body: 'Old body',
      data: { runId: queued.runId, agentName: 'Project manager' },
    });
    await inbox.send({
      key: 'missing',
      source: 'projects',
      type: 'agent_blocked',
      kind: 'info',
      userIds: ['alice'],
      title: 'Old title',
      body: 'Old body',
      data: { agentId: 'missing', agentName: 'Deleted agent' },
    });
    await h.manager.update('alice', { name: 'Team lead' });
    expect(
      (await inbox.notices('alice', ['identity-1']))[0].data?.agentName,
    ).toBe('Team lead');
    expect(
      (await inbox.notices('alice', ['identity-2']))[0].data?.agentName,
    ).toBe('Deleted agent');
  });
});
