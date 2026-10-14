// @vitest-environment node
/** Issue pages hear of runs on their issue (`server/agents/issue-runs-announcer.ts`), once for the runs of a moment. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { announceIssueRuns } from '../../server/agents/issue-runs-announcer.js';
import type { StudioIssueRunsEvent } from '../../shared/issue-runs.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
});
afterEach(() => h.close());

describe('issue run announcements', () => {
  it('names the issues whose runs were queued, once for a burst', async () => {
    const published: StudioIssueRunsEvent[] = [];
    const stop = announceIssueRuns({
      events: h.agents.events,
      conn: () => h.database.connection(),
      publish: (event) => published.push(event),
      delayMs: 20,
    });
    try {
      await h.createAgent();
      const issues = [];
      for (const title of ['One', 'Two'])
        issues.push(
          await h.projects.issues.create(h.viewer('alice'), {
            title,
            statusKey: 'in_progress',
            start: false,
          }),
        );
      await new Promise((resolve) => setTimeout(resolve, 50));
      published.length = 0;
      for (const issue of issues)
        await h.agents.runs.enqueue({
          agentId: PROJECT_MANAGER_ID,
          subject: { kind: 'issue', id: issue.id },
          actorUserId: 'alice',
          input: {
            type: 'signal',
            actor: { kind: 'system', id: 'system', name: 'Studio' },
            text: 'PR checks passed',
            payload: { trigger: 'prChecksPassed' },
          },
        });
      await expect
        .poll(() => published.flatMap((event) => event.issueIds))
        .toEqual(expect.arrayContaining(issues.map((issue) => issue.id)));
      expect(published).toHaveLength(1);
    } finally {
      stop();
    }
  });
});
