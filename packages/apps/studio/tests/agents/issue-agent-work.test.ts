// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { ApprovalRequest } from '@nocobase/app-plugin-projects/shared/approvals';
import { readIssueAgentWork } from '../../server/agents/issue-agent-work.js';
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
const approval = (
  issueId: string,
  agentId: string,
  type = 'agent',
): ApprovalRequest => ({
  id: 'approval',
  issueId,
  issueIdentifier: null,
  issueTitle: null,
  fromStatus: 'in_progress',
  toStatus: 'in_review',
  requestedByType: type,
  requestedById: agentId,
  requestedByName: null,
  approvers: [],
  approverUserIds: [],
  approverNames: [],
  status: 'pending',
  decidedById: null,
  decidedByName: null,
  decidedAt: null,
  comment: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('issue agent work summary', () => {
  it('matches only the current executor and visible requested issues, with no run details', async () => {
    const agentId = await h.createAgent();
    const other = await h.createAgent();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Working',
      executor: { type: 'agent', id: agentId },
    });
    const unrelated = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Other',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await h.claimOne();
    expect(await read([issue.id, 'missing', issue.id])).toEqual([
      { issueId: issue.id, agentId, working: true },
    ]);
    expect(await read([issue.id], 'bob')).toEqual([]);
    expect(await read([unrelated.id])).toEqual([
      { issueId: unrelated.id, agentId, working: false },
    ]);
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: other },
      start: false,
    });
    expect(await read([issue.id])).toEqual([
      { issueId: issue.id, agentId: other, working: false },
    ]);
    const updated = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: updated.revision,
      executor: { type: 'user', id: 'alice' },
    });
    expect(await read([issue.id])).toEqual([]);
  });

  it.each(['blocked', 'proposal_review', 'in_review'])(
    'uses runs and matching approvals, independently of stage %s',
    async (statusKey) => {
      const agentId = await h.createAgent();
      const issue = await h.projects.issues.create(h.viewer('alice'), {
        title: 'Active',
        executor: { type: 'agent', id: agentId },
      });
      const payload = await h.claimOne();
      expect(
        (
          await h.runner(RUNNER_ROUTES.start, payload.run.id, {
            workDir: '/tmp/w',
            adapter: { kind: 'claude' },
            acceptsInput: true,
          })
        ).status,
      ).toBe(200);
      const current = await h.projects.issueQueries.detail(
        h.viewer('alice'),
        issue.id,
      );
      await h.projects.issues.update(h.viewer('alice'), issue.id, {
        revision: current.revision,
        statusKey,
      });
      const pending = vi.spyOn(h.projects.approvals, 'pendingOn');
      pending.mockResolvedValue([]);
      expect((await read([issue.id]))[0]?.working).toBe(true);
      pending.mockResolvedValue([approval(issue.id, agentId)]);
      expect((await read([issue.id]))[0]?.working).toBe(false);
      pending.mockResolvedValue([
        approval(issue.id, 'another-agent'),
        approval(issue.id, agentId, 'user'),
        approval('other-issue', agentId),
      ]);
      expect((await read([issue.id]))[0]?.working).toBe(true);
      pending.mockResolvedValue([]);
      expect((await read([issue.id]))[0]?.working).toBe(true);
      vi.spyOn(h.agents.runs, 'workingOn').mockResolvedValue([]);
      expect((await read([issue.id]))[0]?.working).toBe(false);
      pending.mockRejectedValue(new Error('Approvals unavailable'));
      await expect(read([issue.id])).rejects.toThrow('Approvals unavailable');
    },
  );

  it('enforces the HTTP authentication, visibility and batch boundary', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Private',
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
