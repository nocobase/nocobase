import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import { runsRepo, sessionsRepo } from '../server/core/runs/run.store.js';
import { runnersRepo } from '../server/runners/runner.store.js';

describe('task runner affinity', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  async function fixture() {
    h = await createHarness();
    const agent = await h.createAgent({ maxConcurrentRuns: 4 });
    const original = await h.registerRunner({ slots: 2 });
    const other = await h.registerRunner({ slots: 2 });
    await sessionsRepo(h.database.connection()).createOne({
      values: {
        id: 'prior-session',
        agentId: agent,
        runnerId: original.runnerId,
        subjectKind: 'sample',
        subjectId: 'task',
        threadScope: 'root',
        sessionId: 'session',
        workDir: '/fixed/task',
        branch: null,
        fingerprint: null,
        poisoned: false,
        updatedAt: h.clock.now().toISOString(),
      },
    });
    return { agent, original, other };
  }

  it('prefers a ready original runner across agents', async () => {
    const { original, other } = await fixture();
    const agent = await h.createAgent();
    const run = await h.enqueue(agent, 'task');
    expect(await claim(h, other)).toEqual([]);
    expect((await claim(h, original)).map((item) => item.run.id)).toEqual([
      run,
    ]);
  });

  it('does not defer a preferred-model machine to an original machine still waiting for model fallback', async () => {
    const { original, other } = await fixture();
    const agent = await h.createAgent({
      modelEntries: [
        { tool: 'claude', model: null },
        { tool: 'codex', model: null },
      ],
    });
    h.services.selectionPolicies.register(agent, async () => ({
      fallbackAfterSeconds: 120,
    }));
    await runnersRepo(h.database.connection()).updateMany({
      filter: { id: original.runnerId },
      values: {
        enabledTools: ['codex'],
        tools: [{ kind: 'codex', authenticated: true }],
      },
    });
    const run = await h.enqueue(agent, 'task');
    expect(await claim(h, original)).toEqual([]);
    expect((await claim(h, other)).map((item) => item.run.id)).toEqual([run]);
  });

  it.each([
    'busy',
    'offline',
    'tool',
    'policy',
    'variable',
    'draining',
  ] as const)(
    'immediately falls back when the original runner is %s',
    async (condition) => {
      const { agent, original, other } = await fixture();
      const conn = h.database.connection();
      const values =
        condition === 'busy'
          ? { load: { free: 0 } }
          : condition === 'offline'
            ? { status: 'offline' }
            : condition === 'tool'
              ? { enabledTools: [] }
              : condition === 'policy'
                ? { policy: { agents: ['other'] } }
                : condition === 'draining'
                  ? { load: { free: 2, draining: 'updatePending' } }
                  : { variables: [] };
      // Machine details normally arrive through heartbeat; direct fixture setup avoids elapsed-time waits.
      await runnersRepo(conn).updateMany({
        filter: { id: original.runnerId },
        values,
      });
      if (condition === 'variable') {
        await h.services.variables.set(
          { scope: 'agent', scopeId: agent },
          'LOCAL',
          undefined,
          'owner',
          { fromRunner: true },
        );
        await runnersRepo(conn).updateMany({
          filter: { id: other.runnerId },
          values: { variables: ['LOCAL'] },
        });
      }
      const run = await h.enqueue(agent, 'task');
      expect((await claim(h, other)).map((item) => item.run.id)).toEqual([run]);
    },
  );

  it('reserves only the interrupted run for five minutes from interruption and prioritizes it beyond a full ordinary page', async () => {
    const { agent, original, other } = await fixture();
    const interrupted = await h.enqueue(agent, 'task');
    const [payload] = await claim(h, original);
    await h.request('POST', `/agents/runners/runs/${interrupted}/fail`, {
      runnerKey: original.key,
      body: {
        reason: 'runnerUpgrade',
        detail: 'Planned update',
        handledInputIds: payload.inputs.map((input) => input.id),
      },
    });
    await runnersRepo(h.database.connection()).updateMany({
      filter: { id: original.runnerId },
      values: { status: 'offline' },
    });
    const separate = await h.enqueue(await h.createAgent(), 'task');
    expect((await claim(h, other)).map((item) => item.run.id)).toEqual([
      separate,
    ]);
    h.clock.advance(5 * 60_000 - 1);
    expect(await claim(h, other)).toEqual([]);
    // Revocation/deletion and the exact time boundary are tested separately below.
    h.clock.advance(1);
    expect((await claim(h, other)).map((item) => item.run.id)).toEqual([
      interrupted,
    ]);
  });

  it('takes the recovered upgrade run ahead of fifty earlier-priority ordinary candidates', async () => {
    const { agent, original } = await fixture();
    const interrupted = await h.enqueue(agent, 'task');
    const [payload] = await claim(h, original);
    const failed = await h.request(
      'POST',
      `/agents/runners/runs/${interrupted}/fail`,
      {
        runnerKey: original.key,
        body: {
          reason: 'runnerUpgrade',
          handledInputIds: payload.inputs.map((input) => input.id),
        },
      },
    );
    expect(failed.status).toBe(200);
    const ordinary = await h.enqueue(await h.createAgent(), 'ordinary');
    const repo = runsRepo(h.database.connection());
    const { revision: _revision, ...record } = (await repo.findOne({
      filter: { id: ordinary },
    }))!;
    await repo.updateMany({
      filter: { id: ordinary },
      values: { priority: -10 },
    });
    await repo.createMany({
      values: Array.from({ length: 49 }, (_, index) => ({
        ...record,
        id: `ordinary-${index}`,
        subjectId: `ordinary-${index}`,
        priority: -10,
      })),
    });
    expect((await claim(h, original, 1)).map((item) => item.run.id)).toEqual([
      interrupted,
    ]);
  });

  it.each(['revoked', 'deleted'] as const)(
    'releases an upgrade reservation when its runner is %s',
    async (state) => {
      const { agent, original, other } = await fixture();
      const interrupted = await h.enqueue(agent, 'task');
      const [payload] = await claim(h, original);
      await h.request('POST', `/agents/runners/runs/${interrupted}/fail`, {
        runnerKey: original.key,
        body: {
          reason: 'runnerUpgrade',
          handledInputIds: payload.inputs.map((input) => input.id),
        },
      });
      const machines = runnersRepo(h.database.connection());
      if (state === 'revoked')
        await machines.updateMany({
          filter: { id: original.runnerId },
          values: { status: 'revoked' },
        });
      else await machines.deleteMany({ filter: { id: original.runnerId } });
      expect((await claim(h, other)).map((item) => item.run.id)).toEqual([
        interrupted,
      ]);
    },
  );
});
