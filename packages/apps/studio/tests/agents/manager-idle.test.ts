// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { createAgentWork } from '../../server/agents/work.js';
import {
  sweepManagerIdle,
  managerIdleMinutes,
  managerIdleSweepMinutes,
} from '../../server/agents/manager/idle.js';
import { idleFixture } from './idle-fixture.js';
let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.createAgent();
});
afterEach(() => h.close());

const work = () =>
  createAgentWork({ agents: h.agents, projects: () => h.projects });
const sweep = (now = new Date(), minutes = 15) =>
  sweepManagerIdle(h.agents, h.projects, work(), minutes, now);
async function inputs() {
  return (
    await h.database
      .connection()
      .repository<{ payload: { trigger?: string } }>('agRunInputs')
      .findMany({})
  ).filter((i) => i.payload?.trigger === 'managerIdle');
}

it('validates the idle timeout and periodic interval', () => {
  expect(managerIdleMinutes(undefined)).toBe(15);
  expect(managerIdleMinutes(0)).toBe(0);
  expect(managerIdleSweepMinutes(undefined)).toBe(5);
  for (const value of [-1, 'invalid', Infinity])
    expect(() => managerIdleMinutes(value)).toThrow();
  expect(() => managerIdleSweepMinutes(0)).toThrow();
});
it('uses the exact timeout boundary and existing facts to deduplicate consecutive/concurrent sweeps', async () => {
  const { managerRunId, finishedAt } = await idleFixture(h);
  await sweep(new Date(finishedAt.getTime() + 15 * 60_000 - 1));
  expect(await inputs()).toHaveLength(0);
  const now = new Date(finishedAt.getTime() + 15 * 60_000);
  await Promise.all([sweep(now), sweep(now)]);
  await sweep(now);
  expect(await inputs()).toHaveLength(1);
  expect((await inputs())[0]?.payload).toMatchObject({
    previousManagerRunId: managerRunId,
  });
});
it('defines the next idle period from the new manager completion without an epoch table', async () => {
  const { issue } = await idleFixture(h);
  await sweep();
  const runs = await h.agents.runs.list({
    subjectKind: 'issue',
    subjectId: issue.id,
  });
  const resumed = runs.find((r) => r.status === 'queued')!;
  const finishedAt = new Date(Date.now() + 1000);
  await h.database
    .connection()
    .repository('agRuns')
    .updateMany({
      filter: { id: resumed.id },
      values: { status: 'completed', finishedAt },
    });
  await sweep(new Date(finishedAt.getTime() + 15 * 60_000 - 1));
  expect(await inputs()).toHaveLength(1);
  await sweep(new Date(finishedAt.getTime() + 15 * 60_000));
  expect(await inputs()).toHaveLength(2);
});
it.each(['backlog', 'blocked', 'in_review', 'done', 'cancelled'])(
  'excludes %s',
  async (statusKey) => {
    const { issue } = await idleFixture(h);
    await h.database
      .connection()
      .repository('pmIssues')
      .updateMany({ filter: { id: issue.id }, values: { statusKey } });
    await sweep();
    expect(await inputs()).toHaveLength(0);
  },
);
it.each(['queued', 'dispatched', 'running'])(
  'excludes %s work',
  async (status) => {
    const { managerRunId } = await idleFixture(h);
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { id: managerRunId }, values: { status } });
    await sweep();
    expect(await inputs()).toHaveLength(0);
  },
);
it.each(['comment', 'event', 'input'])(
  'excludes newer %s activity',
  async (activity) => {
    const { issue, managerRunId } = await idleFixture(h);
    const conn = h.database.connection();
    if (activity === 'comment')
      await h.projects.comments.create(h.viewer('alice'), issue.id, {
        content: '/note New facts',
      });
    if (activity === 'event')
      await h.projects.activity.record(conn, {
        issueId: issue.id,
        actor: { type: 'system', id: null },
        action: 'test_event',
      });
    if (activity === 'input')
      await conn.repository('agRunInputs').updateMany({
        filter: { runId: managerRunId },
        values: { createdAt: new Date() },
      });
    await sweep();
    expect(await inputs()).toHaveLength(0);
  },
);
it('rechecks a candidate after a concurrent comment and enqueue', async () => {
  const { issue } = await idleFixture(h);
  const original = h.projects.tx.run.bind(h.projects.tx);
  const spy = vi
    .spyOn(h.projects.tx, 'run')
    .mockImplementationOnce(async (action, ...args) => {
      await h.projects.comments.create(h.viewer('alice'), issue.id, {
        content: 'New work',
      });
      return original(action, ...args);
    });
  try {
    await sweep();
  } finally {
    spy.mockRestore();
  }
  expect(await inputs()).toHaveLength(0);
});

it('disables the sweep at zero minutes', async () => {
  await idleFixture(h);
  await sweep(new Date(), 0);
  expect(await inputs()).toHaveLength(0);
});
