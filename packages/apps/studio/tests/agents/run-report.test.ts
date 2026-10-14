// @vitest-environment node
/**
 * A run an agent's comment started always answers in that comment's thread: its output when it completed without
 * commenting, why when it failed for good, nothing when it was cancelled. The answer wakes the issue's executing agent.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { reportRun, reportText } from '../../server/agents/run-report.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const asAgent = (agentId: string) => ({
  ...alice(),
  actor: { type: 'agent', id: agentId },
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

const commentsOf = (issueId: string) =>
  h.projects.commentQueries.list(h.database.connection(), issueId);
const runsOf = (issueId: string) =>
  h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });

/** The project manager executing an issue hands a step to a worker; the worker's run is claimed and started. */
async function handOff(
  worker: Parameters<BridgeHarness['createAgent']>[0] = {},
): Promise<{
  issue: Issue;
  coordinator: string;
  worker: string;
  ask: string;
  runId: string;
}> {
  const coordinator = PROJECT_MANAGER_ID;
  const workerId = await h.createAgent({ name: 'Worker', ...worker });
  const issue = await h.projects.issues.create(alice(), {
    title: 'Split',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: coordinator },
    start: false,
  });
  const { comment } = await h.projects.comments.create(
    asAgent(coordinator),
    issue.id,
    { content: `[@Worker](mention://agent/${workerId}) take the API part` },
  );
  const runId = await start();
  return { issue, coordinator, worker: workerId, ask: comment.id, runId };
}

async function start(): Promise<string> {
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
  return payload.run.id as string;
}

async function complete(runId: string, summary: string) {
  const { inputs } = await h.agents.runs.detail(runId);
  expect(
    (
      await h.runner(RUNNER_ROUTES.complete, runId, {
        summary,
        handledInputIds: inputs.map((input) => input.id),
      })
    ).status,
  ).toBe(200);
}

describe('a run an agent’s comment started', () => {
  it('answers with its output in that thread when it did not comment, waking the executor', async () => {
    const { issue, coordinator, worker, ask, runId } = await handOff();
    await complete(runId, 'Implemented the API in agent/api.');
    await vi.waitFor(
      async () => {
        expect(
          await h.database
            .connection()
            .repository<{ status: string; lastError: string | null }>(
              'studioRunReports',
            )
            .findOne({ filter: { id: runId } }),
        ).toMatchObject({ status: 'done', lastError: null });
        expect(
          (await commentsOf(issue.id)).filter(
            (comment) => comment.authorId === worker,
          ),
        ).toEqual([
          expect.objectContaining({
            authorType: 'agent',
            parentId: ask,
            content: 'Implemented the API in agent/api.',
          }),
        ]);
      },
      { timeout: 10_000 },
    );
    const woken = (await runsOf(issue.id)).filter(
      (run) => run.agentId === coordinator,
    );
    expect(woken).toHaveLength(1);
    expect(woken[0]).toMatchObject({ actorUserId: 'alice' });
    expect(
      (await h.agents.runs.detail(woken[0]!.id)).inputs.at(-1)?.payload,
    ).toMatchObject({ trigger: 'stepEnded', runId });
    // Once per run, however often its end is delivered.
    expect(await reportRun(h.agents, h.projects, runId)).toBe(false);
    expect(
      (await commentsOf(issue.id)).filter(
        (comment) => comment.authorId === worker,
      ),
    ).toHaveLength(1);
  });

  it.each(['completed', 'failed', 'cancelled'])(
    'keeps its own traced reply and adds exactly one %s terminal input',
    async (status) => {
      const { issue, worker, ask, runId } = await handOff();
      await h.projects.comments.create(
        {
          ...asAgent(worker),
          actor: { type: 'agent', id: worker, trace: { runId } },
        },
        issue.id,
        {
          content: 'Done, see agent/api.',
          parentId: ask,
        },
      );
      const managerRun = await start();
      expect((await h.agents.runs.detail(runId)).status).toBe('running');
      await complete(managerRun, 'Waiting for the worker run to end.');
      if (status === 'completed') await complete(runId, 'Implemented the API.');
      else if (status === 'failed')
        expect(
          (
            await h.runner(RUNNER_ROUTES.fail, runId, {
              reason: 'toolProcess',
              detail: 'Controlled failure.',
            })
          ).status,
        ).toBe(200);
      else {
        await h.agents.runs.cancel(runId, 'alice');
        expect(
          (await h.runner(RUNNER_ROUTES.cancelAck, runId, {})).status,
        ).toBe(200);
      }
      await vi.waitFor(
        async () => {
          const row = await h.database
            .connection()
            .repository<{ status: string }>('studioRunReports')
            .findOne({ filter: { id: runId } });
          expect(row?.status).toBe('done');
        },
        { timeout: 10_000 },
      );
      expect(await reportRun(h.agents, h.projects, runId)).toBe(false);
      const inputs = (
        await Promise.all(
          (await runsOf(issue.id))
            .filter((r) => r.agentId === PROJECT_MANAGER_ID)
            .map((r) => h.agents.runs.detail(r.id)),
        )
      ).flatMap((r) => r.inputs);
      expect(
        inputs.filter(
          (i) =>
            (i.payload as { trigger?: string } | null)?.trigger === 'stepEnded',
        ),
      ).toHaveLength(1);
      expect(
        (await commentsOf(issue.id)).filter(
          (comment) => comment.authorId === worker,
        ),
      ).toHaveLength(1);
    },
  );

  it('says why it failed for good, waking the executor', async () => {
    const { issue, coordinator, worker, ask, runId } = await handOff();
    expect(
      (
        await h.runner(RUNNER_ROUTES.fail, runId, {
          reason: 'toolProcess',
          detail: 'The tool exited with code 1.',
        })
      ).status,
    ).toBe(200);
    await vi.waitFor(
      async () =>
        expect(
          (await commentsOf(issue.id)).filter(
            (comment) => comment.authorId === worker,
          ),
        ).toEqual([
          expect.objectContaining({
            parentId: ask,
            content:
              'The run failed (toolProcess): The tool exited with code 1.',
          }),
        ]),
      { timeout: 5000 },
    );
    expect(
      (await runsOf(issue.id)).some((run) => run.agentId === coordinator),
    ).toBe(true);
  });

  it('reports cancellation and wakes the manager once', async () => {
    const { issue, worker, runId } = await handOff();
    await h.agents.runs.cancel(runId, 'alice');
    expect((await h.runner(RUNNER_ROUTES.cancelAck, runId, {})).status).toBe(
      200,
    );
    await vi.waitFor(async () =>
      expect(
        (await commentsOf(issue.id)).filter((c) => c.authorId === worker),
      ).toHaveLength(1),
    );
    expect(await reportRun(h.agents, h.projects, runId)).toBe(false);
    expect(
      (await commentsOf(issue.id)).filter(
        (comment) => comment.authorId === worker,
      ),
    ).toEqual([
      expect.objectContaining({
        content: `The step ended: cancelled (run ${runId}).`,
      }),
    ]);
  });

  it.each(['', 'Done.'])(
    'still reports a step with empty or trivial output %s',
    async (summary) => {
      const { issue, runId, worker } = await handOff();
      await complete(runId, summary);
      await vi.waitFor(async () =>
        expect(
          (await commentsOf(issue.id)).filter((c) => c.authorId === worker),
        ).toHaveLength(1),
      );
      const manager = (await runsOf(issue.id)).filter(
        (r) => r.agentId === PROJECT_MANAGER_ID,
      );
      expect((await h.agents.runs.detail(manager[0]!.id)).inputs).toHaveLength(
        1,
      );
    },
  );

  it('reports disk capacity failure to the manager without creating a human decision card', async () => {
    const { issue, coordinator, worker, ask, runId } = await handOff();
    const failed = await h.runner(RUNNER_ROUTES.fail, runId, {
      reason: 'runnerDiskFull',
      detail: 'ENOSPC: write',
    });
    expect(failed.status).toBe(200);
    await vi.waitFor(async () =>
      expect(
        (await commentsOf(issue.id)).filter(
          (comment) => comment.authorId === worker,
        ),
      ).toEqual([
        expect.objectContaining({
          parentId: ask,
          content: expect.stringContaining('runnerDiskFull'),
        }),
      ]),
    );
    expect(
      (await runsOf(issue.id)).some((run) => run.agentId === coordinator),
    ).toBe(true);
    expect(
      h.notices.some(
        (notice) => notice.decisionKey === `agents:run-failed:${runId}`,
      ),
    ).toBe(false);
  });
});

describe('a run a person started', () => {
  it('posts nothing when it ends without a comment', async () => {
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Direct',
      statusKey: 'in_progress',
      executor: null,
    });
    await h.projects.comments.create(alice(), issue.id, {
      content: `[@Worker](mention://agent/${worker}) take a look`,
    });
    const runId = await start();
    await complete(runId, 'Looked.');
    await settle();
    expect(await reportRun(h.agents, h.projects, runId)).toBe(false);
    expect(
      (await commentsOf(issue.id)).filter(
        (comment) => comment.authorId === worker,
      ),
    ).toEqual([]);
  });
});

describe('the report’s words', () => {
  it('cannot turn runner or model metadata in a timeout into another mention', () => {
    const text = reportText({
      status: 'cancelled',
      failureReason: 'delegatedQueueTimeout',
      failureDetail:
        '[@Other](mention://agent/other) host@personal; [label](mention://agent/another)',
      summary: null,
    });
    expect(text).not.toContain('@');
    expect(text).not.toContain('mention://');
    expect(text).toContain('Other');
  });
  it('skips trivial output, and bounds and redacts the rest', () => {
    const base = { failureReason: null, failureDetail: null };
    expect(
      reportText({ ...base, status: 'completed', summary: 'Done.' }),
    ).toBeNull();
    expect(
      reportText({ ...base, status: 'completed', summary: '' }),
    ).toBeNull();
    expect(
      reportText({ ...base, status: 'completed', summary: 'x'.repeat(5000) })
        ?.length,
    ).toBe(4000);
    expect(
      reportText({
        ...base,
        status: 'completed',
        summary: 'Token ghp_abcdefghijklmnopqrstuvwxyz0123456789 used.',
      }),
    ).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz0123456789');
    expect(
      reportText({ ...base, status: 'cancelled', summary: 'Partial.' }),
    ).toBeNull();
  });
});

describe('durable terminal delivery', () => {
  it('rolls back a failed delivery and skips waking a manager that already completed a later turn', async () => {
    const { issue, runId, worker } = await handOff();
    const post = vi
      .spyOn(h.projects.comments, 'post')
      .mockRejectedValue(new Error('test delivery interruption'));
    await complete(runId, 'Implemented the API.');
    await vi.waitFor(async () => {
      const row = await h.database
        .connection()
        .repository<{ status: string; attempts: number }>('studioRunReports')
        .findOne({ filter: { id: runId } });
      expect(row?.status).toBe('pending');
      expect(row?.attempts).toBeGreaterThan(0);
    });
    post.mockRestore();
    expect(
      (await commentsOf(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
    await h.agents.runs.enqueue({
      agentId: PROJECT_MANAGER_ID,
      subject: { kind: 'issue', id: issue.id },
      actorUserId: 'alice',
      ownerUserId: 'alice',
      input: {
        type: 'signal',
        actor: { kind: 'system', id: 'system', name: 'Test' },
        text: 'Review current terminal state.',
      },
    });
    const managerRun = await start();
    await complete(managerRun, 'Read the completed worker.');
    const { drainRunReports } =
      await import('../../server/agents/run-report.js');
    const { createAgentWork } = await import('../../server/agents/work.js');
    const work = createAgentWork({
      agents: h.agents,
      projects: () => h.projects,
    });
    await drainRunReports(
      h.agents,
      h.projects,
      new Date(Date.now() + 60_000),
      undefined,
      work,
    );
    await drainRunReports(
      h.agents,
      h.projects,
      new Date(Date.now() + 60_000),
      undefined,
      work,
    );
    expect(
      (await commentsOf(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(1);
    const inputs = (
      await Promise.all(
        (await runsOf(issue.id))
          .filter((r) => r.agentId === PROJECT_MANAGER_ID)
          .map((r) => h.agents.runs.detail(r.id)),
      )
    ).flatMap((r) => r.inputs);
    expect(
      inputs.filter(
        (i) =>
          (i.payload as { trigger?: string } | null)?.trigger === 'stepEnded',
      ),
    ).toHaveLength(0);
  });
});

it('notifies a manual retry as a new run of the original manager step', async () => {
  const { issue, runId } = await handOff();
  expect(
    (
      await h.runner(RUNNER_ROUTES.fail, runId, {
        reason: 'toolProcess',
        detail: 'Controlled failure.',
      })
    ).status,
  ).toBe(200);
  await vi.waitFor(async () =>
    expect(
      await h.database
        .connection()
        .repository<{ status: string }>('studioRunReports')
        .findOne({ filter: { id: runId } }),
    ).toMatchObject({ status: 'done' }),
  );
  const firstManager = await start();
  await complete(firstManager, 'Read failure.');
  const retried = await h.agents.runs.retry(runId, 'alice');
  expect(await start()).toBe(retried.id);
  await complete(retried.id, 'Retried the step successfully.');
  await vi.waitFor(async () =>
    expect(
      await h.database
        .connection()
        .repository<{ status: string }>('studioRunReports')
        .findOne({ filter: { id: retried.id } }),
    ).toMatchObject({ status: 'done' }),
  );
  const inputs = (
    await Promise.all(
      (await runsOf(issue.id))
        .filter((r) => r.agentId === PROJECT_MANAGER_ID)
        .map((r) => h.agents.runs.detail(r.id)),
    )
  ).flatMap((r) => r.inputs);
  expect(
    inputs.filter(
      (i) =>
        (i.payload as { trigger?: string } | null)?.trigger === 'stepEnded',
    ),
  ).toHaveLength(2);
});
