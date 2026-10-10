/**
 * A runner's working directories: the heartbeat announces that reports are accepted, and a report is answered with the
 * runs whose subject's work is over (`remove`) or goes on (`keep`), as the subject's binding says. Only the runner's
 * own runs are answered for, and the report is kept on the runner for the runtimes pages.
 */
import {
  RUNNER_ROUTES,
  WORKSPACE_REPORT_INTERVAL_MS,
} from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import {
  api,
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';
import { runnerForViewer } from '../server/core/runs/runner-view.js';

const GB = 1024 ** 3;

const workspace = (runId: string, unpushed = false, day = 1) => ({
  runId,
  workDir: `/home/runner/.nocobase-runner-work/acme/${runId}`,
  unpushed,
  lastUsedAt: `2026-10-0${day}T00:00:00.000Z`,
});

const disk = {
  freeBytes: 20 * GB,
  totalBytes: 200 * GB,
  minFreeBytes: 20 * GB,
};

describe("a runner's working directories", () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const report = (runner: RegisteredRunner, body: unknown) =>
    h.request('POST', api(RUNNER_ROUTES.workspaces), {
      runnerKey: runner.key,
      body,
    });

  /** Ends a run as `status`, as if the runner had reported it. */
  const end = (runId: string, status = 'completed') =>
    h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { id: runId }, values: { status } });

  /** A runner that worked one run on each of `subjects`, each ended; the run ids in that order. */
  const runnerWithRuns = async (
    subjects: readonly string[],
  ): Promise<{ runner: RegisteredRunner; runIds: string[] }> => {
    const agentId = await h.createAgent();
    const runner = await h.registerRunner({ slots: subjects.length });
    const runIds: string[] = [];
    for (const subject of subjects) {
      runIds.push(await h.enqueue(agentId, subject));
      await claim(h, runner, 1);
    }
    for (const runId of runIds) await end(runId);
    return { runner, runIds };
  };

  it('announces in the heartbeat answer that reports are accepted', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const response = await h.request('POST', api(RUNNER_ROUTES.heartbeat), {
      runnerKey: runner.key,
      body: {
        version: '0.1.0',
        features: ['input', 'checkout'],
        tools: [{ kind: 'claude', authenticated: true }],
        active: [],
        load: { slots: 1, free: 1 },
      },
    });
    expect(response.status).toBe(200);
    expect(response.body.data.workspaces).toEqual({
      intervalMs: WORKSPACE_REPORT_INTERVAL_MS,
    });
  });

  it('answers which runs belong to subjects whose work is over, as the binding says', async () => {
    h = await createHarness();
    h.settled = new Set(['1']);
    const { runner, runIds } = await runnerWithRuns(['1', '2']);
    const [ended, ongoing] = runIds;
    const response = await report(runner, {
      workspaces: [workspace(ended), workspace(ongoing, true)],
      disk,
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ remove: [ended], keep: [ongoing] });
  });

  it('preserves variable names across workspace reports and workspace usage across heartbeats', async () => {
    h = await createHarness();
    const { runner, runIds } = await runnerWithRuns(['1']);
    const heartbeat = (variables: string[]) =>
      h.request('POST', api(RUNNER_ROUTES.heartbeat), {
        runnerKey: runner.key,
        body: {
          version: '0.1.0',
          features: ['input', 'checkout'],
          tools: [{ kind: 'claude', authenticated: true }],
          active: [],
          load: { slots: 1, free: 1 },
          variables,
        },
      });
    expect((await heartbeat(['PI_KEY'])).status).toBe(200);
    expect(
      (await report(runner, { workspaces: [workspace(runIds[0])], disk }))
        .status,
    ).toBe(200);
    const before = await h.services.runners.get(runner.runnerId);
    expect(before.variables).toEqual(['PI_KEY']);
    expect(before.workspaceUsage?.count).toBe(1);
    expect((await heartbeat(['OTHER_KEY'])).status).toBe(200);
    const shown = await h.request('GET', `/agents/runners/${runner.runnerId}`, {
      user: 'owner',
    });
    expect(shown.body.data.variables).toEqual(['OTHER_KEY']);
    expect(shown.body.data.workspaceUsage).toEqual(before.workspaceUsage);
  });

  it('keeps the report on the runner, most recently used first, with each subject, what was decided and the disk', async () => {
    h = await createHarness();
    h.settled = new Set(['1']);
    const { runner, runIds } = await runnerWithRuns(['1', '2']);
    const [ended, ongoing] = runIds;
    await report(runner, {
      // An earlier runner still sends each directory's size, which is no longer kept.
      workspaces: [
        { ...workspace(ended), sizeBytes: 2 * GB },
        workspace(ongoing, true, 2),
      ],
      disk,
    });
    const shown = await h.request('GET', `/agents/runners/${runner.runnerId}`, {
      user: 'owner',
    });
    expect(shown.body.data.workspaceUsage).toMatchObject({
      disk,
      count: 2,
      unpushedCount: 1,
      measuredAt: '2026-10-01T00:00:00.000Z',
      workspaces: [
        {
          runId: ongoing,
          unpushed: true,
          subjectKind: 'sample',
          subjectId: '2',
          settled: false,
        },
        {
          runId: ended,
          unpushed: false,
          subjectKind: 'sample',
          subjectId: '1',
          settled: true,
        },
      ],
    });
  });

  it("shows only the totals to a viewer who may not see the runner's machine", async () => {
    h = await createHarness();
    h.settled = new Set(['1']);
    const { runner, runIds } = await runnerWithRuns(['1']);
    await report(runner, { workspaces: [workspace(runIds[0])], disk });
    const stored = await h.services.runners.get(runner.runnerId);
    expect(
      runnerForViewer(stored, true).workspaceUsage?.workspaces,
    ).toHaveLength(1);
    expect(
      runnerForViewer(stored, true).workspaceUsage?.workspaces[0],
    ).not.toHaveProperty('sizeBytes');
    expect(runnerForViewer(stored, false).workspaceUsage).toMatchObject({
      disk,
      count: 1,
      workspaces: [],
    });
  });

  it('decides nothing for a subject kind whose binding cannot say', async () => {
    h = await createHarness();
    const { runner, runIds } = await runnerWithRuns(['1']);
    const response = await report(runner, {
      workspaces: [workspace(runIds[0])],
    });
    expect(response.body.data).toEqual({ remove: [], keep: [] });
    const shown = await h.request('GET', `/agents/runners/${runner.runnerId}`, {
      user: 'owner',
    });
    expect(shown.body.data.workspaceUsage).toMatchObject({
      disk: null,
      workspaces: [{ runId: runIds[0], settled: null }],
    });
  });

  it('never calls a subject over while a run on it has not finished, whatever the binding says', async () => {
    h = await createHarness();
    h.settled = new Set(['1']);
    const { runner, runIds } = await runnerWithRuns(['1']);
    // New work on the same subject, still queued.
    await h.enqueue(await h.createAgent({ name: 'Another' }), '1');
    const response = await report(runner, {
      workspaces: [workspace(runIds[0])],
    });
    expect(response.body.data).toEqual({ remove: [], keep: [runIds[0]] });
  });

  it("answers only for the runner's own runs", async () => {
    h = await createHarness();
    h.settled = new Set(['1']);
    const { runIds } = await runnerWithRuns(['1']);
    const other = await h.registerRunner({ name: 'other' });
    const response = await report(other, {
      workspaces: [workspace(runIds[0]), workspace('unknown')],
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ remove: [], keep: [] });
  });

  it('refuses a report without a runner key', async () => {
    h = await createHarness();
    const response = await h.request('POST', api(RUNNER_ROUTES.workspaces), {
      body: { workspaces: [] },
    });
    expect(response.status).toBe(401);
  });

  it('refuses a report that is not one', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const response = await report(runner, {
      workspaces: [{ runId: 'r1', sizeBytes: -1 }],
    });
    expect(response.status).toBe(400);
  });
});
