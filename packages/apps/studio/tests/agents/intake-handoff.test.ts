// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
});
afterEach(() => h.close());

const submit = (agentId?: string, user = 'alice') =>
  h.request('POST', '/organizeIntake', {
    user,
    body: { text: 'Keep the requirement', ...(agentId ? { agentId } : {}) },
  });

async function expectNothingStarted() {
  expect(
    (await h.agents.conversations.list('alice', { archived: 'all' })).items,
  ).toEqual([]);
  expect(await h.agents.runs.list({ subjectKind: 'conversation' })).toEqual([]);
}

describe('intake requires a runnable handoff', () => {
  it('rejects anonymous requests', async () => {
    const response = await h.request('POST', '/organizeIntake', {
      body: { text: 'Requirements' },
    });
    expect(response.status).toBe(401);
    await expectNothingStarted();
  });

  it('explains a missing default without creating a conversation', async () => {
    const response = await submit();
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_AGENT');
    await expectNothingStarted();
  });

  it('explains an absent runner and creates no queued work', async () => {
    const id = await h.createAgent();
    const response = await submit(id);
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_RUNNER');
    await expectNothingStarted();
  });

  it('explains an absent runner for the default agent too', async () => {
    await h.createAgent();
    const response = await submit();
    expect(response.status).toBe(409);
    expect(response.body.error.reason).toBe('INTAKE_NO_RUNNER');
    await expectNothingStarted();
  });

  it('refuses an agent that is not enabled', async () => {
    const id = await h.createAgent();
    await h.database
      .connection()
      .query.updateTable('agAgents')
      .set({ status: 'disabled' })
      .where('id', '=', id)
      .execute();
    const response = await submit(id, 'bob');
    expect(response.status).toBe(403);
    expect(response.body.error.reason).toBe('INTAKE_AGENT_UNAVAILABLE');
    await expectNothingStarted();
  });
});
