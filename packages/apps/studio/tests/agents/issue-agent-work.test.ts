// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { readIssueAgentWork } from '../../server/agents/issue-agent-work.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
  h.roles.set('bob', 'none');
});
afterEach(() => {
  vi.restoreAllMocks();
  return h.close();
});

const read = (ids: string[], user = 'alice') =>
  readIssueAgentWork(
    { projects: h.projects, runs: h.agents.runs },
    h.viewer(user),
    ids,
  );
const PM = PROJECT_MANAGER_ID;

describe('issue agent work summary', () => {
  it('matches only visible requested issues the project manager executes, with no run details', async () => {
    await h.createAgent();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Working',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PM },
    });
    const unrelated = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Other',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PM },
      start: false,
    });
    await h.claimOne();
    expect(await read([issue.id, 'missing', issue.id])).toEqual([
      { issueId: issue.id, agentId: PM, working: true },
    ]);
    expect(await read([issue.id], 'bob')).toEqual([]);
    expect(await read([unrelated.id])).toEqual([
      { issueId: unrelated.id, agentId: PM, working: false },
    ]);
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      executor: { type: 'user', id: 'alice' },
    });
    expect(await read([issue.id])).toEqual([]);
  });

  it('counts a step an agent works on for the project manager as work on the issue', async () => {
    await h.createAgent();
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Active',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PM },
      start: false,
    });
    expect((await read([issue.id]))[0]?.working).toBe(false);
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: `[@Worker](mention://agent/${worker}) take it`,
    });
    const payload = await h.claimOne();
    expect((await h.agents.runs.get(payload.run.id)).agentId).toBe(worker);
    expect(
      (
        await h.runner(RUNNER_ROUTES.start, payload.run.id, {
          workDir: '/tmp/w',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        })
      ).status,
    ).toBe(200);
    expect(await read([issue.id])).toEqual([
      { issueId: issue.id, agentId: PM, working: true },
    ]);
    vi.spyOn(h.agents.runs, 'workingOn').mockResolvedValue([]);
    expect((await read([issue.id]))[0]?.working).toBe(false);
  });

  it('enforces the HTTP authentication, visibility and batch boundary', async () => {
    await h.createAgent();
    const agentId = PM;
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Private',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: agentId },
    });
    await h.claimOne();
    const request = (issueIds: string[], user?: string) =>
      h.app.request('/agentBoard/issueWork', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(user ? { 'x-test-user': user } : {}),
        },
        body: JSON.stringify({ issueIds }),
      });
    expect((await request([issue.id])).status).toBe(401);
    const allowed = await request([issue.id], 'alice');
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toEqual({
      data: [{ issueId: issue.id, agentId, working: true }],
    });
    const hidden = await request([issue.id], 'bob');
    expect(hidden.status).toBe(200);
    expect(await hidden.json()).toEqual({ data: [] });
    expect(
      (
        await request(
          Array.from({ length: 100 }, (_, index) => String(index)),
          'alice',
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request(
          Array.from({ length: 101 }, (_, index) => String(index)),
          'alice',
        )
      ).status,
    ).toBe(400);
    await expect(
      read(Array.from({ length: 101 }, (_, index) => String(index))),
    ).rejects.toMatchObject({ reason: 'ISSUE_WORK_BATCH_TOO_LARGE' });
  });
});
