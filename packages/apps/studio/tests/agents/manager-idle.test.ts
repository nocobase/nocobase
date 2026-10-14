// @vitest-environment node
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { createAgentWork } from '../../server/agents/work.js';
import {
  sweepManagerIdle,
  waitingKind,
  managerIdleMinutes,
} from '../../server/agents/manager/idle.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.createAgent();
});
afterEach(() => h.close());

it('validates configuration and requires explicit nonhuman waiting', () => {
  expect(managerIdleMinutes(undefined)).toBe(15);
  expect(managerIdleMinutes(0)).toBe(0);
  expect(() => managerIdleMinutes(-1)).toThrow();
  expect(() => managerIdleMinutes('invalid')).toThrow();
  expect(waitingKind('等待负责人提供环境')).toBeNull();
  expect(waitingKind('Review now')).toBeNull();
  expect(waitingKind('Waiting for agent runs and CI checks')).toEqual({
    agent: true,
    checks: true,
  });
});

it('wakes once per external epoch, survives a fresh sweeper and ignores its own waiting loop', async () => {
  const viewer = h.viewer('alice');
  const worker = await h.createAgent({ name: 'Worker' });
  const issue = await h.projects.issues.create(viewer, {
    title: 'Idle',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    start: false,
  });
  await h.projects.comments.create(
    { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
    issue.id,
    {
      content: `Next: Waiting for agent run to end\n\n[@Worker](mention://agent/${worker}) Investigate.`,
    },
  );
  // A historical terminated target is evidence of the manager's outstanding wait; do not stage a terminal wake here.
  await h.database
    .connection()
    .repository('agRuns')
    .updateMany({
      filter: { subjectId: issue.id },
      values: { status: 'completed', finishedAt: new Date().toISOString() },
    });
  const work = createAgentWork({
    agents: h.agents,
    projects: () => h.projects,
  });
  const now = new Date(Date.now() + 15 * 60_000 + 1000);
  await sweepManagerIdle(
    h.agents,
    h.projects,
    work,
    15,
    new Date(now.getTime() - 2000),
  );
  expect(
    (
      await h.agents.runs.list({ subjectId: issue.id, subjectKind: 'issue' })
    ).filter((r) => r.agentId === PROJECT_MANAGER_ID),
  ).toHaveLength(0);
  await Promise.all([
    sweepManagerIdle(h.agents, h.projects, work, 15, now),
    sweepManagerIdle(h.agents, h.projects, work, 15, now),
  ]);
  const state = await h.database
    .connection()
    .repository('studioManagerIdle')
    .findOne({ filter: { id: issue.id } });
  expect(state?.wokenEpoch).toBe(state?.epoch);
  await h.projects.comments.create(
    { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
    issue.id,
    { content: 'Next: Waiting for agent run to end' },
  );
  await h.database
    .connection()
    .repository('agRuns')
    .updateMany({
      filter: { subjectId: issue.id, agentId: PROJECT_MANAGER_ID },
      values: { status: 'completed' },
    });
  await sweepManagerIdle(
    h.agents,
    h.projects,
    createAgentWork({ agents: h.agents, projects: () => h.projects }),
    15,
    new Date(now.getTime() + 60 * 60_000),
  );
  const inputs = await h.database
    .connection()
    .repository<{ payload: { trigger?: string } }>('agRunInputs')
    .findMany({});
  expect(
    inputs.filter((i) => i.payload.trigger === 'managerIdle'),
  ).toHaveLength(1);
  await h.projects.comments.create(viewer, issue.id, {
    content: '/note New external information.',
  });
  await sweepManagerIdle(
    h.agents,
    h.projects,
    work,
    15,
    new Date(now.getTime() + 61 * 60_000),
  );
  await sweepManagerIdle(
    h.agents,
    h.projects,
    work,
    15,
    new Date(now.getTime() + 77 * 60_000),
  );
  const again = await h.database
    .connection()
    .repository<{ payload: { trigger?: string } }>('agRunInputs')
    .findMany({});
  expect(again.filter((i) => i.payload.trigger === 'managerIdle')).toHaveLength(
    2,
  );
});

it.each(['backlog', 'blocked', 'in_review', 'done', 'cancelled'])(
  'never wakes %s even with an ended delegation',
  async (statusKey) => {
    const viewer = h.viewer('alice');
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await h.projects.issues.create(viewer, {
      title: 'Excluded status',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    await h.projects.comments.create(
      { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
      issue.id,
      {
        content: `Next: Waiting for worker run to end\n\n[@Worker](mention://agent/${worker}) Investigate.`,
      },
    );
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({
        filter: { subjectId: issue.id },
        values: { status: 'completed' },
      });
    await h.database
      .connection()
      .repository('pmIssues')
      .updateMany({ filter: { id: issue.id }, values: { statusKey } });
    await sweepManagerIdle(
      h.agents,
      h.projects,
      createAgentWork({ agents: h.agents, projects: () => h.projects }),
      15,
      new Date(Date.now() + 60 * 60_000),
    );
    expect(
      await h.database
        .connection()
        .repository('studioManagerIdle')
        .findOne({ filter: { id: issue.id } }),
    ).toBeUndefined();
  },
);

it.each(['queued', 'dispatched', 'running'])(
  'excludes any %s worker',
  async (status) => {
    const viewer = h.viewer('alice');
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await h.projects.issues.create(viewer, {
      title: 'Active worker',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    await h.projects.comments.create(
      { ...viewer, actor: { type: 'agent', id: PROJECT_MANAGER_ID } },
      issue.id,
      {
        content: `Next: Waiting for worker run to end\n\n[@Worker](mention://agent/${worker}) Investigate.`,
      },
    );
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { subjectId: issue.id }, values: { status } });
    await sweepManagerIdle(
      h.agents,
      h.projects,
      createAgentWork({ agents: h.agents, projects: () => h.projects }),
      15,
      new Date(Date.now() + 60 * 60_000),
    );
    expect(
      await h.database
        .connection()
        .repository('studioManagerIdle')
        .findOne({ filter: { id: issue.id } }),
    ).toBeUndefined();
  },
);
