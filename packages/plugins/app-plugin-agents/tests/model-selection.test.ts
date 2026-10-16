import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import { supportsWorkspaceKey } from '../shared/runners.js';
import { queueStart } from '../server/core/runs/selection.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});

async function setup() {
  h = await createHarness();
  const preferred = await h.registerRunner({ name: 'preferred', slots: 1 });
  const fallback = await h.registerRunner({
    name: 'fallback',
    slots: 1,
    tools: [{ kind: 'codex', authenticated: true }],
  });
  const worker = await h.createAgent();
  await h.enqueue(worker, 'busy');
  await claim(h, preferred);
  const manager = await h.createAgent({
    modelEntries: [
      { tool: 'claude', model: null },
      { tool: 'codex', model: null },
    ],
  });
  h.services.selectionPolicies.register(manager, async () => ({
    fallbackAfterSeconds: 120,
  }));
  const run = await h.enqueue(manager, 'manager');
  return { preferred, fallback, manager, run };
}

describe('heartbeat capacity diagnostics', () => {
  it.each(['updatePending', 'pruning'] as const)(
    'reports %s consistently in runner, manager diagnostics and workload, refusing new claims',
    async (draining) => {
      h = await createHarness();
      const runner = await h.registerRunner({ slots: 2 });
      const agent = await h.createAgent();
      const run = await h.enqueue(agent);
      const registered = (await h.services.runners.find(
        h.services.tx.read(),
        runner.runnerId,
      ))!;
      expect(
        (
          await h.request('POST', '/agents/runners/heartbeat', {
            runnerKey: runner.key,
            body: {
              version: registered.version,
              features: registered.features,
              tools: registered.tools,
              active: [],
              load: { slots: 2, free: 0, draining },
            },
          })
        ).status,
      ).toBe(200);
      expect(
        await h.services.runners.find(h.services.tx.read(), runner.runnerId),
      ).toMatchObject({ globalFree: 0, draining });
      expect(
        (await h.services.claims.selectionWait(run))?.entries[0],
      ).toMatchObject({
        reason: draining,
        runners: [expect.objectContaining({ reason: draining, used: 0 })],
      });
      expect(
        (await h.services.runs.workload({ subjectKind: 'sample' })).runs[0]
          ?.wait,
      ).toMatchObject({ reason: draining });
      expect(await claim(h, runner, 1)).toEqual([]);
    },
  );
  it('uses reported cross-application room and keeps it separate from server occupancy', async () => {
    h = await createHarness();
    const runner = await h.registerRunner({ slots: 2 });
    const agent = await h.createAgent();
    const run = await h.enqueue(agent);
    const registered = (await h.services.runners.find(
      h.services.tx.read(),
      runner.runnerId,
    ))!;
    const answer = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: registered.version,
        features: registered.features,
        tools: registered.tools,
        active: [],
        load: { slots: 2, free: 0 },
      },
    });
    expect(answer.status).toBe(200);
    expect(
      (await h.services.runners.find(h.services.tx.read(), runner.runnerId))
        ?.globalFree,
    ).toBe(0);
    expect(
      (await h.services.claims.selectionWait(run))?.entries[0],
    ).toMatchObject({
      reason: 'busy',
      compatibleCount: 1,
      runners: [
        expect.objectContaining({ used: 0, limit: 2, reportedTotalFree: 0 }),
      ],
    });
    expect(await h.services.runs.queueWait(run)).toMatchObject({
      reason: 'runnersBusy',
      params: { used: 0, limit: 2, reportedFree: ['0'] },
    });
    // Actual claim admission uses this request's free capacity, rather than reserving a heartbeat snapshot.
    expect(await claim(h, runner, 1)).toHaveLength(1);
  });
  it('does not promise immediate capacity before the first heartbeat', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const agent = await h.createAgent();
    const run = await h.enqueue(agent);
    await h.services.tx.run(async ({ conn }) => {
      await conn.query
        .updateTable('agRunners')
        .set({ load: null })
        .where('id', '=', runner.runnerId)
        .execute();
    });
    expect(
      (await h.services.claims.selectionWait(run))?.entries[0]?.reason,
    ).toBe('unknown');
  });
});

describe('ordered models opt-in policy', () => {
  it('cancels obsolete work before selection preflight assembly', async () => {
    const { fallback, run } = await setup();
    h.services.subjects.get('sample')!.context.admit = async () => ({
      reason: 'subjectMissing',
    });
    h.failAssembly = true;
    expect(await claim(h, fallback)).toEqual([]);
    expect(await h.services.runs.get(run)).toMatchObject({
      status: 'cancelled',
      executions: [],
    });
  });
  it.each([
    ['0.1.0-beta.6', false, true],
    ['0.1.0-beta.7', false, true],
    ['0.1.0-beta.6', true, false],
    ['0.1.0-beta.8', true, false],
  ])(
    'checks actual workspace payload support for %s (capability=%s)',
    async (version, capable, immediate) => {
      const { preferred, fallback, manager, run } = await setup();
      const context = h.services.subjects.get('sample')!.context;
      const original = context.assemble;
      context.assemble = async (conn, candidate) => ({
        ...(await original(conn, candidate)),
        workspaceKey: 'manager',
      });
      await h.services.tx.run(async ({ conn }) => {
        await conn.query
          .updateTable('agRunners')
          .set({
            version,
            protocolVersion: 9,
            features: capable
              ? ['workspaceKey', 'input', 'skills', 'secrets']
              : ['input', 'skills', 'secrets'],
          })
          .where('id', '=', preferred.runnerId)
          .execute();
        await conn.query
          .updateTable('agRunners')
          .set({ version: '0.1.0-beta.7' })
          .where('id', '=', fallback.runnerId)
          .execute();
      });
      const agent = await h.services.agents.get(manager);
      const first = await h.services.runners.find(
        h.services.tx.read(),
        preferred.runnerId,
      );
      expect(
        await h.services.eligibility.canClaim(
          h.services.tx.read(),
          { ...agent, modelEntries: agent.modelEntries.slice(0, 1) },
          { actorUserId: 'owner', workspaceKey: true, runners: [first!] },
        ),
      ).toBe(!immediate);
      expect((await claim(h, fallback)).length).toBe(immediate ? 1 : 0);
      const waiting = await h.services.claims.selectionWait(run);
      if (immediate) expect(waiting).toBeNull();
      else
        expect(waiting?.entries[0]).toMatchObject({
          compatibleCount: 1,
          reason: 'busy',
        });
    },
  );

  it('lets a recovering first choice race the fallback without duplicate execution', async () => {
    const { preferred, fallback, run } = await setup();
    h.clock.advance(120_000);
    await h.services.tx.run(async ({ conn }) => {
      await conn.query
        .updateTable('agRuns')
        .set({ status: 'completed' })
        .where('subjectId', '=', 'busy')
        .execute();
    });
    const results = await Promise.all([
      claim(h, preferred),
      claim(h, fallback),
    ]);
    expect(results.flat().map((payload) => payload.run.id)).toEqual([run]);
    expect((await h.services.runs.get(run)).executions).toHaveLength(1);
  });

  it('starts a fresh persisted queue episode on retry and excludes backoff', async () => {
    const { fallback, run } = await setup();
    h.clock.advance(120_000);
    await claim(h, fallback);
    h.clock.advance(5_000);
    await h.request('POST', `/agents/runners/runs/${run}/fail`, {
      runnerKey: fallback.key,
      body: { reason: 'workspaceBusy' },
    });
    const retried = await h.services.runs.get(run);
    expect(retried.queueEnteredAt).toBe(h.clock.now().toISOString());
    expect(queueStart(retried)).toBe(Date.parse(retried.availableAt!));
    expect(await claim(h, fallback)).toEqual([]);
  });
  it('keeps a compatible busy first choice until the exact threshold, then claims the original run once', async () => {
    const { fallback, run } = await setup();
    expect(await h.services.claims.selectionWait(run)).toMatchObject({
      entries: [{ reason: 'busy', compatibleCount: 1 }, { reason: 'ready' }],
    });
    expect(await claim(h, fallback)).toEqual([]);
    h.clock.advance(119_999);
    expect(await claim(h, fallback)).toEqual([]);
    h.clock.advance(1);
    expect((await claim(h, fallback))[0].run.id).toBe(run);
    expect(await claim(h, fallback)).toEqual([]);
    expect(await h.services.runs.get(run)).toMatchObject({
      executions: [
        { selection: { reason: 'preferredQueued', waitedSeconds: 120 } },
      ],
    });
  });

  it('does not change unregistered delegated runs', async () => {
    const { fallback } = await setup();
    const delegated = await h.createAgent({
      modelEntries: [
        { tool: 'claude', model: null },
        { tool: 'codex', model: null },
      ],
    });
    const run = await h.enqueue(delegated, 'delegated');
    expect((await claim(h, fallback))[0].run.id).toBe(run);
    expect(
      (await h.services.runs.get(run)).executions?.[0].selection,
    ).toBeUndefined();
  });

  it('preserves the queue when no fallback has capacity, including its own tool report', async () => {
    const { fallback, run } = await setup();
    h.clock.advance(120_000);
    expect(await claim(h, fallback, 1, { codex: 0 })).toEqual([]);
    expect((await h.services.runs.get(run)).status).toBe('queued');
    expect((await claim(h, fallback, 1, { codex: 1 }))[0].run.id).toBe(run);
  });

  it('uses an idle fallback immediately for an incompatible protocol', async () => {
    const { preferred, fallback, run } = await setup();
    await h.services.tx.run(({ conn }) =>
      conn.query
        .updateTable('agRunners')
        .set({ status: 'upgrade_required', protocolVersion: 0 })
        .where('id', '=', preferred.runnerId)
        .execute()
        .then(() => undefined),
    );
    expect(await h.services.claims.selectionWait(run)).toMatchObject({
      entries: [
        { reason: 'incompatible', compatibleCount: 0 },
        { reason: 'ready' },
      ],
    });
    expect((await claim(h, fallback))[0].run.id).toBe(run);
    expect(
      (await h.services.runs.get(run)).executions?.[0].selection?.reason,
    ).toBe('preferredUnavailable');
  });

  it('rolls back a failed fallback assembly without creating execution history', async () => {
    const { fallback, run } = await setup();
    h.clock.advance(120_000);
    const context = h.services.subjects.get('sample')!.context;
    const original = context.assemble;
    context.assemble = async (conn, candidate) => {
      if (candidate.run.status === 'dispatched')
        throw new Error('Failed after selection.');
      return original(conn, candidate);
    };
    expect(await claim(h, fallback)).toEqual([]);
    expect(await h.services.runs.get(run)).toMatchObject({
      status: 'queued',
      executions: [],
    });
    context.assemble = original;
    expect((await claim(h, fallback))[0].run.id).toBe(run);
  });

  it('serializes two fallback claims', async () => {
    const { fallback, run } = await setup();
    const other = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
    });
    h.clock.advance(120_000);
    const results = await Promise.all([claim(h, fallback), claim(h, other)]);
    expect(results.flat().map((payload) => payload.run.id)).toEqual([run]);
    expect((await h.services.runs.get(run)).executions).toHaveLength(1);
  });

  it('does not count delayed execution or reset on merged input', async () => {
    const { manager, run, fallback } = await setup();
    const created = (await h.services.runs.get(run)).queueEnteredAt;
    await h.enqueue(manager, 'manager', { text: 'More context.' });
    expect((await h.services.runs.get(run)).queueEnteredAt).toBe(created);
    const availableAt = new Date(
      h.clock.now().getTime() + 100_000,
    ).toISOString();
    await h.services.tx.run(({ conn }) =>
      conn.query
        .updateTable('agRuns')
        .set({ availableAt })
        .where('id', '=', run)
        .execute()
        .then(() => undefined),
    );
    h.clock.advance(120_000);
    expect(await claim(h, fallback)).toEqual([]);
    expect(queueStart(await h.services.runs.get(run))).toBe(
      Date.parse(availableAt),
    );
  });
});

it('requires an explicit workspace capability', () => {
  expect(supportsWorkspaceKey({ features: ['workspaceKey'] })).toBe(true);
  expect(supportsWorkspaceKey({ features: ['input'] })).toBe(false);
});
