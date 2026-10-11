// @vitest-environment node
/**
 * An agent archived or deleted lets go of its work: its queued runs are withdrawn, and Studio clears it as executor of
 * every unfinished issue, recording "Executor X was removed" in the name of the person who removed it.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

async function assigned(title: string, agentId: string): Promise<Issue> {
  return h.projects.issues.create(alice(), {
    title,
    executor: { type: 'agent', id: agentId },
  });
}

async function executorOf(issueId: string) {
  return (await h.projects.issueQueries.detail(alice(), issueId)).executor;
}

describe('removing an agent', () => {
  it('clears it as executor of unfinished issues, with an activity entry, and withdraws its queued runs', async () => {
    const agentId = await h.createAgent({ name: 'Builder' });
    const open = await assigned('Open', agentId);
    const finished = await assigned('Finished', agentId);
    await h.database
      .connection()
      .repository('pmIssues')
      .updateMany({
        filter: { id: finished.id },
        values: { statusKey: 'done' },
      });
    const [queued] = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: open.id,
    });
    expect(queued?.status).toBe('queued');

    await h.agents.agents.archive(agentId, 'bob');

    await vi.waitFor(async () => expect(await executorOf(open.id)).toBeNull());
    expect(await executorOf(finished.id)).toEqual({
      type: 'agent',
      id: agentId,
    });
    expect((await h.agents.runs.get(queued!.id)).status).toBe('cancelled');
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

  it('lets go again when the agent is deleted, leaving nothing assigned to it', async () => {
    const agentId = await h.createAgent({ name: 'Builder' });
    const issue = await assigned('Open', agentId);
    await h.agents.agents.archive(agentId, 'alice');
    await vi.waitFor(async () => expect(await executorOf(issue.id)).toBeNull());
    await h.agents.agents.remove(agentId, 'alice');
    // Deleting finds nothing left to clear and records nothing more.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const activities = await h.projects.issueQueries.activities(
      alice(),
      issue.id,
      {},
    );
    expect(
      activities.data.filter(
        (activity) => activity.details.reason === 'executorRemoved',
      ),
    ).toHaveLength(1);
  });
});
