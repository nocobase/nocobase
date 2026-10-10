// @vitest-environment node
/**
 * "Preview full prompt" in Studio: an issue scenario on a made-up issue and a conversation scenario, each rendered by
 * the code a claim uses, the made-up values marked `[sample]`, nothing read from a real issue and nothing queued.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness({ knowledge: true });
  await h.addUser('alice');
});
afterEach(() => h.close());

const alice = { id: 'alice', name: 'Alice' };

describe('previewing an agent’s full prompt', () => {
  it('renders the issue scenario on a sample issue, the agent’s prompt last', async () => {
    const agentId = await h.createAgent({
      instructions: 'Keep pull requests small.',
    });
    const preview = await h.agents.briefs.preview(agentId, 'issue', alice);
    expect(preview).toMatchObject({
      scenario: 'issue',
      subject: {
        key: 'SAMPLE-1',
        title: '[sample] Export the issue list as CSV',
      },
    });
    expect(preview.platform).toContain(
      '# SAMPLE-1 [sample] Export the issue list as CSV',
    );
    expect(preview.platform).toContain('comment add SAMPLE-1');
    // The agent's own prompt, as written, follows the platform's part.
    expect(preview.agentPrompt).toBe('Keep pull requests small.');
    expect(preview.firstMessage).toContain('SAMPLE-1');
    expect(await h.agents.runs.list({})).toEqual([]);
  });

  it('renders the conversation scenario with a sample message', async () => {
    const agentId = await h.createAgent();
    const preview = await h.agents.briefs.preview(
      agentId,
      'conversation',
      alice,
    );
    expect(preview.subject.title).toBe('[sample] This week');
    expect(preview.firstMessage).toContain(
      '[sample] What is waiting for me this week?',
    );
  });
});
