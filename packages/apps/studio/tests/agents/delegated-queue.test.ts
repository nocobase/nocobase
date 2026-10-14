import { createAgentWork } from '../../server/agents/work.js';
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import {
  delegationTimeout,
  managerDelegation,
} from '../../server/agents/delegated-queue.js';
import {
  drainRunReports as drainReports,
  stageRunReport,
} from '../../server/agents/run-report.js';
import { issueProgress } from '../../server/agents/manager/progress.js';
import { commentGuardId } from '../../server/agents/comment-guard.js';

function drainRunReports(
  agents: BridgeHarness['agents'],
  projects: BridgeHarness['projects'],
  now = new Date(),
  authorize?: Parameters<typeof drainReports>[3],
) {
  return drainReports(
    agents,
    projects,
    now,
    authorize,
    createAgentWork({ agents, projects: () => projects }),
  );
}

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  await h.close();
});
const eventually = <T>(check: () => T | Promise<T>) =>
  vi.waitFor(check, { timeout: 10_000 });
const alice = () => h.viewer('alice');
const manager = () => ({
  ...alice(),
  actor: { type: 'agent', id: PROJECT_MANAGER_ID },
});
async function dispatch(person = false) {
  const worker = await h.createAgent({ name: 'Worker' });
  const issue = await h.projects.issues.create(alice(), {
    title: 'Delegation timeout',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    start: false,
  });
  const { comment } = await h.projects.comments.create(
    person ? alice() : manager(),
    issue.id,
    { content: `[@Worker](mention://agent/${worker}) implement this step` },
  );
  const run = (
    await h.agents.runs.openOn(
      h.database.connection(),
      { kind: 'issue', id: issue.id },
      worker,
    )
  )[0]!;
  return { worker, issue, comment, run };
}
async function age(runId: string) {
  await h.database
    .connection()
    .query.updateTable('agRuns')
    .set({ queueEnteredAt: new Date(Date.now() - 600_001).toISOString() })
    .where('id', '=', runId)
    .execute();
}
const rows = (issueId: string) =>
  h.projects.commentQueries.list(h.database.connection(), issueId);
const pending = (id: string) =>
  h.database
    .connection()
    .repository<{
      status: string;
      attempts: number;
      lastError: string | null;
      payload: unknown;
    }>('studioRunReports')
    .findOne({ filter: { id } });

describe('manager delegated queue timeout', () => {
  it('keeps the exact 600 second boundary and immutable source when inputs are appended', async () => {
    const { run, worker, issue } = await dispatch();
    const rule = delegationTimeout(h.agents);
    const entered = Date.parse(run.queueEnteredAt!);
    expect(
      await rule(h.database.connection(), run, new Date(entered + 599_999)),
    ).toBeNull();
    expect(
      await rule(h.database.connection(), run, new Date(entered + 600_000)),
    ).toMatchObject({ reason: 'delegatedQueueTimeout' });
    await h.projects.comments.create(manager(), issue.id, {
      content: `[@Worker](mention://agent/${worker}) additional context`,
    });
    const allInputs = (await h.agents.runs.detail(run.id)).inputs;
    const later = allInputs.at(-1)!;
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({
        createdAt: new Date(Date.parse(run.createdAt) - 1000).toISOString(),
      })
      .where('id', '=', later.id)
      .execute();
    const appended = await h.agents.runs.get(run.id);
    expect(appended.queueEnteredAt).toBe(run.queueEnteredAt);
    expect((await h.agents.runs.detail(run.id)).inputs).toHaveLength(2);
    expect(
      await managerDelegation(h.database.connection(), appended),
    ).not.toBeNull();
    await h.manager.update('alice', { delegationQueueTimeoutSeconds: 1200 });
    expect(
      await rule(
        h.database.connection(),
        appended,
        new Date(entered + 600_000),
      ),
    ).toBeNull();
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ availableAt: new Date(entered + 600_000).toISOString() })
      .where('id', '=', run.id)
      .execute();
    expect(
      await rule(
        h.database.connection(),
        await h.agents.runs.get(run.id),
        new Date(entered + 1_799_999),
      ),
    ).toBeNull();
  });
  it('does not adopt a human-created run when a manager mention joins it', async () => {
    const { run, worker, issue } = await dispatch(true);
    await h.projects.comments.create(manager(), issue.id, {
      content: `[@Worker](mention://agent/${worker}) more context`,
    });
    const appended = (await h.agents.runs.detail(run.id)).inputs.at(-1)!;
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({
        createdAt: new Date(Date.parse(run.createdAt) - 1000).toISOString(),
      })
      .where('id', '=', appended.id)
      .execute();
    await age(run.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
    expect(await pending(run.id)).toBeUndefined();
  });
  it('uses the incompatible owned runner cause in the queue, progress and timeout reply without exposing private machines', async () => {
    await h.claimOne();
    const { run, worker, issue } = await dispatch();
    const [owned] = await h.agents.runners.all(h.database.connection());
    await h.addUser('bob');
    const token = await h.agents.runners.createRegistrationToken('bob', {
      trust: 'ownerOnly',
    });
    const registration = await h.request('POST', '/agents/runners/register', {
      body: {
        registrationToken: token.token,
        name: 'private-machine-do-not-disclose',
        hostname: 'host',
        os: 'linux',
        arch: 'x64',
        version: owned!.version,
        protocolVersion: owned!.protocolVersion,
        features: owned!.features,
        tools: owned!.tools,
        slots: 2,
      },
    });
    expect(registration.status).toBe(200);
    await h.database
      .connection()
      .query.updateTable('agRunners')
      .set({
        trust: 'ownerOnly',
        ownerUserId: 'alice',
        status: 'upgrade_required',
        protocolVersion: 0,
      })
      .where('id', '=', owned!.id)
      .execute();
    const wait = (
      await h.agents.runs.workload({
        subjectKind: 'issue',
        subjectId: issue.id,
      })
    ).runs.find((row) => row.id === run.id)!.wait;
    expect(wait?.reason).toBe('incompatible');
    const progress = await issueProgress(
      { agents: h.agents, projects: h.projects },
      h.database.connection(),
      issue,
      { userId: 'alice', seesMachines: false },
    );
    expect(progress.managerWait?.entries[0]?.reason).toBe('incompatible');
    expect(JSON.stringify(progress)).not.toContain(
      'private-machine-do-not-disclose',
    );
    await age(run.id);
    await h.agents.sweeper.sweep();
    await eventually(async () =>
      expect(await pending(run.id)).toMatchObject({
        status: 'done',
        lastError: null,
      }),
    );
    const reply = (await rows(issue.id)).find(
      (row) => row.authorId === worker,
    )!;
    expect(reply.content).toContain('upgrade required');
    expect(reply.content).not.toContain('only other');
    expect(reply.content).not.toContain('private-machine-do-not-disclose');
  });

  it('withdraws offline work without polling and reports once in the original thread as its agent', async () => {
    const { run, worker, issue, comment } = await dispatch();
    await h.database
      .connection()
      .query.updateTable('agRunners')
      .set({ status: 'offline' })
      .allowAllRows()
      .execute();
    await age(run.id);
    await Promise.all([h.agents.sweeper.sweep(), h.agents.sweeper.sweep()]);
    await eventually(async () =>
      expect(await pending(run.id)).toMatchObject({
        status: 'done',
        lastError: null,
      }),
    );
    await Promise.all([
      drainRunReports(h.agents, h.projects),
      drainRunReports(h.agents, h.projects),
    ]);
    expect(await h.agents.runs.get(run.id)).toMatchObject({
      status: 'cancelled',
      failureReason: 'delegatedQueueTimeout',
      executions: [],
    });
    const reply = (await rows(issue.id)).filter((c) => c.authorId === worker);
    expect(reply).toHaveLength(1);
    expect(reply[0]).toMatchObject({
      authorType: 'agent',
      parentId: comment.id,
    });
    expect(reply[0]!.content).toContain('runners are offline');
    expect(reply[0]!.content).not.toContain('mention://');
    const woken = (
      await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        PROJECT_MANAGER_ID,
      )
    )[0]!;
    expect(woken.actorUserId).toBe('alice');
  });
  it('retains a failed delivery and retries it with its stored cause after a restarted dispatcher', async () => {
    const { run, worker, issue } = await dispatch();
    const post = vi
      .spyOn(h.projects.comments, 'post')
      .mockRejectedValue(new Error('Temporary delivery interruption'));
    await age(run.id);
    await h.agents.sweeper.sweep();
    await eventually(async () =>
      expect((await pending(run.id))?.attempts).toBe(1),
    );
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
    const snapshot = (await pending(run.id))!.payload;
    post.mockRestore();
    // A fresh dispatcher has no event history; it discovers the durable row alone.
    await drainRunReports(h.agents, h.projects, new Date(Date.now() + 60_000));
    expect(await pending(run.id)).toMatchObject({
      status: 'done',
      payload: snapshot,
      lastError: null,
    });
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(1);
  });
  it('rolls back the withdrawal when report registration fails, and never reports success', async () => {
    const { run, worker, issue } = await dispatch();
    await age(run.id);
    const binding = h.agents.subjects.get('issue')!;
    const original = binding.sink!.onRunFinished!;
    binding.sink!.onRunFinished = async (tx, ended) => {
      await original(tx, ended);
      throw new Error('Failed committing pending report');
    };
    await expect(h.agents.sweeper.sweep()).rejects.toThrow('Failed committing');
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
    expect(await pending(run.id)).toBeUndefined();
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
  });
  it.each(['claim', 'withdraw'] as const)(
    'forces %s to commit before its competitor',
    async (winner) => {
      await h.claimOne();
      const { run, worker, issue } = await dispatch();
      const [runner] = await h.agents.runners.all(h.database.connection());
      const claim = async () => (await h.agents.claims.claim(runner!, 1))[0];
      await age(run.id);
      let unlock!: () => void;
      let reached!: () => void;
      const locked = new Promise<void>((resolve) => {
        reached = resolve;
      });
      const barrier = new Promise<void>((resolve) => {
        unlock = resolve;
      });
      const binding = h.agents.subjects.get('issue')!;
      const context = binding.context;
      const assemble = context.assemble;
      const timeout = binding.queuedTimeout!;
      if (winner === 'claim') {
        context.assemble = async (conn, claim) => {
          if (
            claim.run.id === run.id &&
            claim.runner &&
            claim.run.status === 'dispatched'
          ) {
            reached();
            await barrier;
          }
          return assemble(conn, claim);
        };
      } else {
        Object.assign(binding, {
          queuedTimeout: async (...args: Parameters<typeof timeout>) => {
            reached();
            await barrier;
            return timeout(...args);
          },
        });
      }
      const first = winner === 'claim' ? claim() : h.agents.sweeper.sweep();
      await locked;
      let attempt!: () => void;
      const attempted = new Promise<void>((resolve) => {
        attempt = resolve;
      });
      const txRun = h.agents.tx.run.bind(h.agents.tx);
      const observer = vi
        .spyOn(h.agents.tx, 'run')
        .mockImplementation((fn, outer) =>
          txRun(async (unit) => {
            attempt();
            return fn(unit);
          }, outer),
        );
      const second = winner === 'claim' ? h.agents.sweeper.sweep() : claim();
      // Server dialects can open the competing transaction while the winner holds
      // the agent lock. SQLite has one pooled connection and queues before opening it.
      if (
        process.env.NOCOBASE_TEST_DB_DIALECT &&
        process.env.NOCOBASE_TEST_DB_DIALECT !== 'sqlite'
      )
        await attempted;
      unlock();
      const [a, b] = await Promise.all([first, second]);
      observer.mockRestore();
      const payload = winner === 'claim' ? a : b;
      const current = await h.agents.runs.get(run.id);
      if (winner === 'claim') {
        expect(payload.run.id).toBe(run.id);
        expect(current.status).toBe('dispatched');
        expect(await pending(run.id)).toBeUndefined();
      } else {
        expect(payload?.run.id).not.toBe(run.id);
        expect(current.status).toBe('cancelled');
        await eventually(async () =>
          expect(await pending(run.id)).toMatchObject({
            status: 'done',
            lastError: null,
          }),
        );
        expect(
          (await rows(issue.id)).filter((c) => c.authorId === worker),
        ).toHaveLength(1);
        expect(
          (
            await h.runner(RUNNER_ROUTES.complete, run.id, {
              summary: 'Late output',
              handledInputIds: [],
            })
          ).status,
        ).toBeGreaterThanOrEqual(400);
      }
    },
  );

  it('rejects a scanned queue generation after claim and requeue', async () => {
    const { run } = await dispatch();
    await age(run.id);
    let resume!: () => void;
    let scanned!: () => void;
    const barrier = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const reached = new Promise<void>((resolve) => {
      scanned = resolve;
    });
    const original = h.agents.tx.run.bind(h.agents.tx);
    const gate = vi
      .spyOn(h.agents.tx, 'run')
      .mockImplementationOnce(async (fn, outer) => {
        scanned();
        await barrier;
        return original(fn, outer);
      });
    const sweep = h.agents.sweeper.sweep();
    await reached;
    gate.mockRestore();
    const payload = await h.claimOne();
    expect(payload.run.id).toBe(run.id);
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({
        maxAttempts: 3,
        leaseExpiresAt: new Date(Date.now() - 1000).toISOString(),
      })
      .where('id', '=', run.id)
      .execute();
    await h.agents.sweeper.sweep();
    const fresh = await h.agents.runs.get(run.id);
    expect(fresh.status).toBe('queued');
    expect(fresh.queueEnteredAt).not.toBe(run.queueEnteredAt);
    resume();
    await sweep;
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
    expect(await pending(run.id)).toBeUndefined();
  });

  it.each(['before', 'after'] as const)(
    'recovers an interruption %s the report commit with one reply and wakeup',
    async (window) => {
      const { run, worker, issue } = await dispatch();
      const emit = h.agents.events.emit.bind(h.agents.events);
      vi.spyOn(h.agents.events, 'emit').mockImplementation((event) => {
        if (event.type === 'run.changed' && event.status === 'cancelled')
          return;
        emit(event);
      });
      await age(run.id);
      await h.agents.sweeper.sweep();
      expect((await h.agents.runs.get(run.id)).status).toBe('cancelled');
      expect((await pending(run.id))?.status).toBe('pending');
      expect(
        (await rows(issue.id)).filter((c) => c.authorId === worker),
      ).toHaveLength(0);
      if (window === 'before') {
        const post = h.projects.comments.post.bind(h.projects.comments);
        vi.spyOn(h.projects.comments, 'post').mockImplementationOnce(
          async (...args) => {
            await post(...args);
            throw new Error(
              'Interrupted after posting, before transaction commit',
            );
          },
        );
      } else {
        const txRun = h.projects.tx.run.bind(h.projects.tx);
        vi.spyOn(h.projects.tx, 'run').mockImplementationOnce(
          async (fn, outer) => {
            const result = await txRun(fn, outer);
            throw new Error(
              `Interrupted after committed delivery: ${String(result)}`,
            );
          },
        );
      }
      await drainRunReports(h.agents, h.projects);
      vi.restoreAllMocks();
      await drainRunReports(
        h.agents,
        h.projects,
        new Date(Date.now() + 60_000),
      );
      await drainRunReports(
        h.agents,
        h.projects,
        new Date(Date.now() + 120_000),
      );
      expect(await pending(run.id)).toMatchObject({
        status: 'done',
        lastError: null,
      });
      expect(
        (await rows(issue.id)).filter((c) => c.authorId === worker),
      ).toHaveLength(1);
      expect(
        await h.agents.runs.openOn(
          h.database.connection(),
          { kind: 'issue', id: issue.id },
          PROJECT_MANAGER_ID,
        ),
      ).toHaveLength(1);
    },
  );

  it('retains the manager input and shows manual continuation when commentRunLimit is reached', async () => {
    const { run, issue } = await dispatch();
    await h.manager.update('alice', { commentRunLimit: 1 });
    // One actual prior completed comment-triggered run reaches the existing quota.
    await h.database
      .connection()
      .query.updateTable('agRuns')
      .set({ status: 'completed', startedAt: new Date().toISOString() })
      .where('id', '=', run.id)
      .execute();
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({ deliveredAt: new Date().toISOString() })
      .where('runId', '=', run.id)
      .execute();
    const worker = await h.createAgent({ name: 'Second' });
    await h.projects.comments.create(manager(), issue.id, {
      content: `[@Second](mention://agent/${worker}) next step`,
    });
    // The existing guard held this mention. Resume explicitly to create a second delegation, preserving the first count.
    const guard = await h.database
      .connection()
      .repository<{ pendingToken: string; ruleConfig: unknown }>(
        'studioStageRunGuards',
      )
      .findOne({ filter: { id: commentGuardId(issue.id) } });
    expect(guard?.pendingToken).toBeTruthy();
    // Register a timeout report for the first run to exercise the same protected automatic reply path.
    const ended = {
      ...run,
      status: 'cancelled' as const,
      failureReason: 'delegatedQueueTimeout' as const,
      failureDetail: 'Queued too long; withdrawn.',
    };
    await h.projects.tx.run(async (tx) => stageRunReport(tx.conn, ended));
    await drainRunReports(h.agents, h.projects);
    expect(await pending(run.id)).toMatchObject({
      status: 'pending',
      lastError: null,
    });
    expect(
      await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        PROJECT_MANAGER_ID,
      ),
    ).toHaveLength(0);
    const held = await h.database
      .connection()
      .repository<{ pendingToken: string; ruleConfig: unknown }>(
        'studioStageRunGuards',
      )
      .findOne({ filter: { id: commentGuardId(issue.id) } });
    expect(held?.pendingToken).toBeTruthy();
    expect(JSON.stringify(held?.ruleConfig)).toContain('stepEnded');
    expect(
      (
        await issueProgress(
          { agents: h.agents, projects: h.projects },
          h.database.connection(),
          issue,
        )
      ).state,
    ).toBe('waitingForContinuation');
    const resumed = await h.request(
      'POST',
      `/issueCommentRuns/${issue.id}/continue`,
      { user: 'alice', body: { token: held!.pendingToken } },
    );
    expect(resumed.status).toBe(200);
    const managerRun = (
      await h.agents.runs.openOn(
        h.database.connection(),
        { kind: 'issue', id: issue.id },
        PROJECT_MANAGER_ID,
      )
    )[0]!;
    expect(
      (await h.agents.runs.detail(managerRun.id)).inputs.some(
        (input) =>
          (input.payload as { trigger?: string; runId?: string }).trigger ===
            'stepEnded' &&
          (input.payload as { runId?: string }).runId === run.id,
      ),
    ).toBe(true);
    expect(await pending(run.id)).toMatchObject({ status: 'done' });
  });
  it('leaves already claimed work alone and rejects late runner output after a withdrawal', async () => {
    const { run } = await dispatch();
    await age(run.id);
    const payload = await h.claimOne();
    expect(payload.run.id).toBe(run.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run.id)).status).toBe('dispatched');
    expect(await pending(run.id)).toBeUndefined();
  });
  it('falls back to the issue root when the dispatch comment was deleted', async () => {
    const { run, worker, issue, comment } = await dispatch();
    await h.database
      .connection()
      .query.updateTable('pmComments')
      .set({ deletedAt: new Date().toISOString() })
      .where('id', '=', comment.id)
      .execute();
    await age(run.id);
    await h.agents.sweeper.sweep();
    await eventually(async () =>
      expect(await pending(run.id)).toMatchObject({
        status: 'done',
        lastError: null,
      }),
    );
    const reply = (await rows(issue.id)).find((c) => c.authorId === worker)!;
    expect(reply.parentId).toBeNull();
    expect(reply.content).toContain(comment.id);
  });
  it('keeps permission-blocked delivery pending until the acting user regains access', async () => {
    const { run, worker, issue } = await dispatch();
    h.roles.set('alice', 'guest');
    await age(run.id);
    await h.agents.sweeper.sweep();
    await eventually(async () =>
      expect((await pending(run.id))?.attempts).toBeGreaterThanOrEqual(1),
    );
    expect((await pending(run.id))?.lastError).toBeTruthy();
    expect(
      (await rows(issue.id)).filter((c) => c.authorId === worker),
    ).toHaveLength(0);
    h.roles.set('alice', 'admin');
    await drainRunReports(
      h.agents,
      h.projects,
      new Date(Date.now() + 3_600_000),
    );
    expect(await pending(run.id)).toMatchObject({
      status: 'done',
      lastError: null,
    });
  });
  it('keeps provenance-unknown historical records queued', async () => {
    const { run } = await dispatch();
    const input = (await h.agents.runs.detail(run.id)).inputs[0]!;
    await h.database
      .connection()
      .query.updateTable('agRunInputs')
      .set({ payload: { trigger: 'mention', byAgent: true } })
      .where('id', '=', input.id)
      .execute();
    await age(run.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run.id)).status).toBe('queued');
  });
});
