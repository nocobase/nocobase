// @vitest-environment node
/**
 * The agent board (`server/agents/board.ts`) over the real projects and agents plugins: one row per issue
 * an agent is involved in, in the section of where its agent stands (waiting for a person, working, queued, idle), why
 * queued work waits, and only what the viewer may see.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgentBoard, AgentBoardQuery } from '../../shared/agent-board.js';
import {
  readAgentBoard,
  startAgentBoardIssue,
} from '../../server/agents/board.js';
import { createAgentWork } from '../../server/agents/work.js';
import { RUN_FAILED_FINAL } from '../../server/agents/notices.js';
import type { OpenDecision } from '../../server/inbox/service.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let decisions: OpenDecision[];
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
  decisions = [];
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

function board(
  userId: string,
  query: AgentBoardQuery = {},
  readsAllRuns = false,
): Promise<AgentBoard> {
  return readAgentBoard(
    {
      projects: () => h.projects,
      agents: h.agents,
      decisions: (source, type) =>
        Promise.resolve(
          source === 'projects' && type === RUN_FAILED_FINAL ? decisions : [],
        ),
      decisionSource: 'projects',
    },
    { viewer: h.viewer(userId), readsAllRuns },
    query,
  );
}

const titles = (result: AgentBoard, state: string) =>
  result.rows
    .filter((row) => row.state === state)
    .map((row) => row.issue.title)
    .sort();

const rowOf = (result: AgentBoard, issueId: string) =>
  result.rows.find((row) => row.issue.id === issueId);

describe('the agent board', () => {
  let agentId: string;
  let project: { id: string };
  let working: Issue;
  let queued: Issue;
  let failed: Issue;
  let proposal: Issue;

  beforeEach(async () => {
    agentId = await h.createAgent({ name: 'Coder', maxConcurrentRuns: 1 });
    project = await h.projects.projects.create(alice(), { name: 'Payments' });
    const give = (title: string, extra: object = {}) =>
      h.projects.issues.create(alice(), {
        title,
        projectId: project.id,
        executor: { type: 'agent', id: agentId },
        ...extra,
      });
    working = await give('Fix login');
    await h.claimOne();
    queued = await give('Retry callbacks');
    await give('Later', { start: false });
    await give('Which database?', { statusKey: 'blocked', start: false });
    const done = await give('Old work', { start: false });
    await h.projects.issues.update(alice(), done.id, {
      revision: done.revision,
      statusKey: 'done',
    });
    failed = await h.projects.issues.create(alice(), {
      title: 'Flaky deploy',
      projectId: project.id,
    });
    decisions.push({
      decisionKey: 'agents:run-failed:r1',
      subject: { type: 'issue', id: failed.id, label: failed.identifier },
      data: { agentId, runId: 'r1', failureReason: 'leaseExpired' },
      userIds: ['alice'],
      createdAt: '2026-10-02T08:00:00.000Z',
    });
    // Its design proposal waits in Proposal review, for the owner.
    proposal = await give('Plan the migration', {
      statusKey: 'proposal_review',
      start: false,
    });
  });

  it('shows each issue once, in the section of where its agent stands, and explains the queue', async () => {
    const result = await board('alice');
    expect(result.rows.map((row) => row.state)).toEqual([
      'waiting',
      'waiting',
      'waiting',
      'working',
      'queued',
      'idle',
    ]);
    expect(new Set(result.rows.map((row) => row.issue.id)).size).toBe(6);
    expect(result.agents[agentId]).toMatchObject({
      id: agentId,
      name: 'Coder',
      archived: false,
      online: true,
      active: 1,
      maxConcurrentRuns: 1,
    });
    expect(titles(result, 'working')).toEqual(['Fix login']);
    expect(titles(result, 'queued')).toEqual(['Retry callbacks']);
    expect(titles(result, 'waiting')).toEqual([
      'Flaky deploy',
      'Plan the migration',
      'Which database?',
    ]);
    // A finished issue an agent executed is not in the view.
    expect(titles(result, 'idle')).toEqual(['Later']);
    // The row carries the issue as the list shows it.
    expect(rowOf(result, working.id)?.issue).toMatchObject({
      identifier: working.identifier,
      project: { id: project.id, name: 'Payments' },
      owner: { id: 'alice' },
      executor: { type: 'agent', id: agentId },
    });

    // Alice gave the work: she sees the run's details.
    expect(rowOf(result, working.id)).toMatchObject({
      agentId,
      run: { status: 'dispatched', trigger: 'assigned', runnerName: 'runner' },
      others: [],
    });
    expect(rowOf(result, working.id)?.run?.id).toEqual(expect.any(String));
    expect(rowOf(result, queued.id)?.queue).toMatchObject({
      reason: 'concurrencyFull',
      agentPosition: 1,
    });
    expect(rowOf(result, failed.id)?.waiting).toMatchObject({
      kind: 'failedRun',
      waitingFor: [{ userId: 'alice', name: 'alice' }],
      viewerDecides: true,
      path: '/inbox?view=todo',
      detail: 'leaseExpired',
    });
    // A design proposal is decided where it shows in full: the issue's design section.
    expect(rowOf(result, proposal.id)?.waiting).toMatchObject({
      kind: 'proposal',
      viewerDecides: true,
      detail: null,
      path: `/issues/${proposal.identifier}#design`,
    });
    expect(
      result.rows.find((row) => row.issue.title === 'Which database?')?.waiting,
    ).toMatchObject({ kind: 'question', waitingFor: [{ userId: 'alice' }] });

    expect(result.summary).toMatchObject({
      waiting: 3,
      working: 1,
      queued: 1,
      idle: 1,
      runners: { online: 1, busy: 1 },
    });
    expect(result.statuses[project.id]?.map((status) => status.key)).toContain(
      'blocked',
    );
  });

  it('queues an issue an agent executes behind the unfinished issues it waits for', async () => {
    const blocker = await h.projects.issues.create(alice(), {
      title: 'Schema first',
      projectId: project.id,
    });
    const later = (await board('alice')).rows.find(
      (row) => row.issue.title === 'Later',
    )!;
    await h.projects.subtasks.addDependency(alice(), later.issue.id, {
      dependsOnIssueId: blocker.id,
    });
    const row = rowOf(await board('alice'), later.issue.id);
    expect(row).toMatchObject({
      state: 'queued',
      run: null,
      queue: null,
      blockedBy: [{ issueId: blocker.id, identifier: blocker.identifier }],
    });
  });

  it('says why an issue is idle, and starts its agent on "Start"', async () => {
    const later = (await board('alice')).rows.find(
      (row) => row.issue.title === 'Later',
    )!;
    expect(later.idle).toMatchObject({ lastRun: null, mayStart: true });
    expect(['noAutoRun', 'neverRan']).toContain(later.idle?.reason);

    const work = createAgentWork({
      agents: h.agents,
      projects: () => h.projects,
    });
    await expect(
      startAgentBoardIssue(
        { projects: () => h.projects, work },
        alice(),
        later.issue.id,
      ),
    ).resolves.toEqual({ started: true, skipped: null });
    expect(rowOf(await board('alice'), later.issue.id)?.state).toBe('queued');

    // In backlog: why, and no "Start".
    const parked = await h.projects.issues.create(alice(), {
      title: 'Parked',
      projectId: project.id,
      statusKey: 'backlog',
      executor: { type: 'agent', id: agentId },
    });
    expect(rowOf(await board('alice'), parked.id)?.idle).toEqual({
      reason: 'backlog',
      lastRun: null,
      mayStart: false,
    });
  });

  it('shows an issue waiting on a person while the run that asked is still closing', async () => {
    const current = await h.projects.issueQueries.detail(alice(), working.id);
    await h.projects.issues.update(alice(), working.id, {
      revision: current.revision,
      statusKey: 'blocked',
    });
    expect(rowOf(await board('alice'), working.id)).toMatchObject({
      state: 'waiting',
      waiting: { kind: 'question' },
    });
  });

  it('shows an issue two agents are on once, under the most pressing, naming the other', async () => {
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    decisions.push({
      decisionKey: 'agents:run-failed:r2',
      subject: { type: 'issue', id: working.id, label: working.identifier },
      data: { agentId: reviewer, runId: 'r2', failureReason: 'toolAuth' },
      userIds: ['alice'],
      createdAt: '2026-10-02T09:00:00.000Z',
    });
    const result = await board('alice');
    expect(
      result.rows.filter((row) => row.issue.id === working.id),
    ).toHaveLength(1);
    expect(rowOf(result, working.id)).toMatchObject({
      agentId: reviewer,
      state: 'waiting',
      others: [{ agentId, state: 'working' }],
    });
    expect(result.agents[reviewer]?.name).toBe('Reviewer');
    expect(result.summary.working).toBe(0);
  });

  it('shows another member the issues without the details of runs they did not start', async () => {
    const result = await board('carol');
    const run = rowOf(result, working.id)?.run;
    expect(run).toMatchObject({
      id: null,
      trigger: null,
      runnerName: null,
      lastActivity: null,
      status: 'dispatched',
    });
    // The proposal is Alice's to decide: Carol sees that it waits for her, on the issue.
    expect(rowOf(result, proposal.id)?.waiting).toMatchObject({
      kind: 'proposal',
      viewerDecides: false,
      waitingFor: [{ userId: 'alice' }],
    });
    expect(rowOf(result, failed.id)?.waiting).toMatchObject({
      viewerDecides: false,
      path: `/issues/${failed.identifier}`,
    });
    // Alice's decisions come first for her; Carol has none, so the longest waiting does.
    expect(
      (await board('alice')).rows
        .filter((row) => row.state === 'waiting')
        .every((row) => row.waiting?.viewerDecides),
    ).toBe(true);

    // Someone who may read every run sees them all.
    const all = await board('carol', {}, true);
    expect(rowOf(all, working.id)?.run?.id).toEqual(expect.any(String));
  });

  it('keeps wait parameters while hiding private preparation details', async () => {
    const workload = await h.agents.runs.workload({ subjectKind: 'issue' });
    vi.spyOn(h.agents.runs, 'workload').mockResolvedValue({
      ...workload,
      runs: workload.runs.map((run) =>
        run.subject.id === queued.id
          ? {
              ...run,
              wait: {
                ...run.wait!,
                reason: 'setupRetrying',
                detail: 'Private setup details',
                params: { detail: 'Private setup details', tool: 'claude' },
              },
            }
          : run,
      ),
    });
    expect(rowOf(await board('alice'), queued.id)?.queue).toMatchObject({
      detail: 'Private setup details',
      params: { detail: 'Private setup details', tool: 'claude' },
    });
    const hidden = rowOf(await board('carol'), queued.id)?.queue;
    expect(hidden?.detail).toBeNull();
    expect(hidden?.params).toEqual({ tool: 'claude' });
  });

  it('marks the issues the viewer owns, created or follows, and lists agents with nothing to do', async () => {
    expect((await board('alice')).rows.every((row) => row.mine)).toBe(true);
    expect((await board('carol')).rows.some((row) => row.mine)).toBe(false);
    await h.projects.subscriptions.set(h.viewer('carol'), working.id, true);
    const carol = await board('carol');
    expect(rowOf(carol, working.id)?.mine).toBe(true);
    expect(rowOf(carol, queued.id)?.mine).toBe(false);

    const idle = await h.createAgent({ name: 'Idle' });
    const all = await board('carol', {}, true);
    expect(all.agents[idle]).toMatchObject({ name: 'Idle', active: 0 });
    expect(all.rows.some((row) => row.agentId === idle)).toBe(false);
  });

  it('shows nothing of issues the viewer may not see, and follows the filters', async () => {
    h.roles.set('bob', 'none');
    expect((await board('bob')).rows).toEqual([]);

    const other = await h.projects.projects.create(alice(), { name: 'Other' });
    expect((await board('alice', { projectId: other.id })).rows).toEqual([]);
    expect(titles(await board('alice', { q: 'callbacks' }), 'queued')).toEqual([
      'Retry callbacks',
    ]);
    expect(
      (await board('alice', { executorId: agentId })).rows.length,
    ).toBeGreaterThan(0);
    expect((await board('alice', { executorId: 'carol' })).rows).toEqual([]);
  });
});
