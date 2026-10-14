// @vitest-environment node
/**
 * An agent disabled lets go of its work: its queued runs are withdrawn, and Studio clears it as executor of every
 * unfinished issue an earlier version gave it, recording "Executor X was removed" in the name of the person who
 * disabled it. The project manager's issues are left alone.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

/** An issue an earlier version gave to `agentId` directly: only the project manager executes issues now. */
async function executedBy(
  title: string,
  agentId: string,
  statusKey = 'in_progress',
): Promise<Issue> {
  const issue = await h.projects.issues.create(alice(), {
    title,
    executor: null,
  });
  await h.database
    .connection()
    .repository('pmIssues')
    .updateMany({
      filter: { id: issue.id },
      values: { executorType: 'agent', executorId: agentId, statusKey },
    });
  return issue;
}

async function executorOf(issueId: string) {
  return (await h.projects.issueQueries.detail(alice(), issueId)).executor;
}

async function disable(agentId: string, byUserId: string): Promise<void> {
  const agent = await h.agents.agents.get(agentId);
  await h.agents.agents.update(agentId, byUserId, {
    enabled: false,
    expectedRevision: agent.revision,
  });
}

describe('disabling an agent', () => {
  it('clears it as executor of unfinished issues, with an activity entry', async () => {
    const agentId = await h.createAgent({ name: 'Builder' });
    const open = await executedBy('Open', agentId);
    const finished = await executedBy('Finished', agentId, 'done');

    await disable(agentId, 'bob');

    await vi.waitFor(async () => expect(await executorOf(open.id)).toBeNull());
    expect(await executorOf(finished.id)).toEqual({
      type: 'agent',
      id: agentId,
    });
    const activities = await h.projects.issueQueries.activities(
      alice(),
      open.id,
      {},
    );
    expect(
      activities.data.find(
        (activity) =>
          activity.action === 'executor_changed' &&
          activity.details.reason === 'executorRemoved',
      ),
    ).toMatchObject({
      actorType: 'user',
      actorId: 'bob',
      details: {
        from: { type: 'agent', id: agentId },
        to: null,
        name: 'Builder',
      },
    });
  });

  it('withdraws its queued step and leaves the project manager on its issues', async () => {
    await h.createAgent({ name: 'Coder' });
    const agentId = await h.createAgent({ name: 'Builder' });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Open',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    await h.projects.comments.create(alice(), issue.id, {
      content: `[@Builder](mention://agent/${agentId}) build it`,
    });
    const step = (
      await h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id })
    ).find((run) => run.agentId === agentId);
    expect(step?.status).toBe('queued');

    await disable(agentId, 'alice');

    await vi.waitFor(async () =>
      expect((await h.agents.runs.get(step!.id)).status).toBe('cancelled'),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await executorOf(issue.id)).toEqual({
      type: 'agent',
      id: PROJECT_MANAGER_ID,
    });
  });
});
