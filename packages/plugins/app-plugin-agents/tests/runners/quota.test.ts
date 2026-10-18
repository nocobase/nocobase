import type { Knex } from 'knex';
import { afterEach, expect, it, vi } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import type { QuotaMarkTarget } from '../../shared/quota.js';
import type { UnavailableModel } from '../../shared/runners.js';
const targetOf = (mark: UnavailableModel): QuotaMarkTarget => ({
  tool: mark.tool,
  scope: mark.scope ?? 'model',
  target: mark.model,
  window: mark.window ?? 'account',
});
import { runsEntry, quotaForAgent } from '../../shared/runners.js';
let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});
const known = {
  windows: [
    {
      scope: 'tool' as const,
      target: '',
      window: '5h',
      exhausted: true,
      resetsAt: '2026-10-01T01:00:00.000Z',
      usedPercent: 100,
    },
  ],
};
it('filters quota before claim, permits another machine, and expires without rewriting marks or reviving failures', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const a = await h.registerRunner();
  const b = await h.registerRunner();
  const failed = await h.enqueue(agent, 'failed');
  expect((await claim(h, a))[0].run.id).toBe(failed);
  const result = await h.request(
    'POST',
    `/agents/runners/runs/${failed}/fail`,
    { runnerKey: a.key, body: { reason: 'toolQuota', quota: known } },
  );
  expect(result.status).toBe(200);
  const before = await h.services.runners.get(a.runnerId);
  expect(before.unavailableModels?.[0]).toMatchObject({
    reason: 'toolQuota',
    scope: 'tool',
    resetsAt: known.windows[0].resetsAt,
  });
  expect((await h.services.runs.get(failed)).executions?.at(-1)?.quota).toEqual(
    known,
  );
  const next = await h.enqueue(agent, 'other');
  expect(await claim(h, a)).toEqual([]);
  expect((await claim(h, b))[0].run.id).toBe(next);
  const queued = await h.enqueue(agent, 'waiting');
  h.clock.advance(3_600_000);
  expect((await claim(h, a))[0].run.id).toBe(queued);
  expect((await h.services.runners.get(a.runnerId)).quotaRevision).toBe(
    before.quotaRevision,
  );
  expect((await h.services.runs.get(failed)).status).toBe('failed');
});
it('keeps unknown provider marks through model changes, and clears only the selected mark with owner/admin permission without a client revision and idempotently', async () => {
  h = await createHarness();
  const a = await h.registerRunner({
    ownerUserId: 'alice',
    tools: [
      {
        kind: 'pi',
        authenticated: true,
        models: [{ id: 'openrouter/a' }, { id: 'openrouter-other/a' }],
      },
    ],
  });
  const report = {
    windows: [
      {
        scope: 'provider' as const,
        target: 'openrouter',
        window: 'credits',
        exhausted: true,
        resetsAt: null,
      },
    ],
  };
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(
      unit,
      a.runnerId,
      'pi',
      'openrouter/a',
      report,
    ),
  );
  const runner = await h.services.runners.get(a.runnerId);
  expect(runsEntry(runner, { tool: 'pi', model: 'openrouter/a' })).toBe(false);
  expect(runsEntry(runner, { tool: 'pi', model: 'openrouter-other/a' })).toBe(
    true,
  );
  const target = targetOf(runner.unavailableModels![0]);
  const path = `/agents/runners/${a.runnerId}/quota/clear`;
  expect(
    (
      await h.request('POST', path, {
        body: target,
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await h.request('POST', path, {
        user: 'bob',
        can: ['agents.runners/read'],
        body: target,
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await h.request('POST', path, {
        user: 'alice',
        body: { ...target, revision: 99 },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await h.request('POST', path, {
        user: 'root',
        can: ['agents.runners/manage'],
        body: target,
      })
    ).status,
  ).toBe(204);
  expect((await h.services.runners.get(a.runnerId)).unavailableModels).toEqual(
    [],
  );
  expect(
    (
      await h.request('POST', path, {
        user: 'root',
        can: ['agents.runners/manage'],
        body: target,
      })
    ).status,
  ).toBe(204);
});
it('merges independent reports, deduplicates repeated events, and rejects forged provider scope', async () => {
  h = await createHarness();
  const a = await h.registerRunner();
  const quota = {
    windows: [
      {
        scope: 'tool' as const,
        target: '',
        window: 'account',
        exhausted: true,
        resetsAt: null,
      },
    ],
  };
  for (const tool of ['claude', 'codex'] as const)
    await h.services.tx.run((unit) =>
      h.services.runners.reportQuota(unit, a.runnerId, tool, null, quota),
    );
  const before = await h.services.runners.get(a.runnerId);
  expect(before.unavailableModels).toHaveLength(2);
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, a.runnerId, 'codex', null, quota),
  );
  expect((await h.services.runners.get(a.runnerId)).quotaRevision).toBe(
    before.quotaRevision,
  );
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, a.runnerId, 'pi', 'openrouter/a', {
      windows: [
        {
          scope: 'provider',
          target: 'other',
          window: 'credits',
          exhausted: true,
          resetsAt: null,
        },
      ],
    }),
  );
  expect((await h.services.runners.get(a.runnerId)).quotaRevision).toBe(
    before.quotaRevision,
  );
});

it('does not reapply an acknowledged quota event after a manual clear', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const runner = await h.registerRunner({ ownerUserId: 'alice' });
  const runId = await h.enqueue(agent);
  await claim(h, runner);
  const quota = {
    windows: [
      {
        scope: 'tool',
        target: '',
        window: 'account',
        exhausted: true,
        resetsAt: null,
      },
    ],
  };
  const body = {
    events: [
      {
        seq: 1,
        at: h.clock.now().toISOString(),
        type: 'status',
        meta: { quota },
      },
    ],
  };
  const path = `/agents/runners/runs/${runId}/events`;
  expect(
    (await h.request('POST', path, { runnerKey: runner.key, body })).status,
  ).toBe(200);
  const marked = await h.services.runners.get(runner.runnerId);
  await h.services.runners.clearQuota(
    runner.runnerId,
    targetOf(marked.unavailableModels![0]),
  );
  expect(
    (await h.request('POST', path, { runnerKey: runner.key, body })).status,
  ).toBe(200);
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toEqual([]);
});
it('keeps a clear across events and final failure, retains history, and accepts a new sequence as a new observation', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const runtime = await h.registerRunner({ ownerUserId: 'alice' });
  const quota = {
    windows: [
      {
        scope: 'tool' as const,
        target: '',
        window: 'account',
        exhausted: true,
        resetsAt: null,
      },
    ],
  };
  const failed = await h.enqueue(agent, 'old');
  await claim(h, runtime);
  const post = (suffix: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${failed}/${suffix}`, {
      runnerKey: runtime.key,
      body,
    });
  const event = (seq: number) => ({
    events: [
      { seq, at: h.clock.now().toISOString(), type: 'status', meta: { quota } },
    ],
  });
  const clear = async () => {
    const runtimeState = await h.services.runners.get(runtime.runnerId);
    await h.services.runners.clearQuota(
      runtime.runnerId,
      targetOf(runtimeState.unavailableModels![0]),
    );
  };
  expect((await post('events', event(1))).status).toBe(200);
  await clear();
  expect((await post('events', event(2))).status).toBe(200);
  expect(
    (await h.services.runners.get(runtime.runnerId)).unavailableModels,
  ).toHaveLength(1);
  await clear();
  expect((await post('fail', { reason: 'toolQuota', quota })).status).toBe(200);
  expect(
    (await h.services.runners.get(runtime.runnerId)).unavailableModels,
  ).toEqual([]);
  expect((await h.services.runs.get(failed)).executions?.at(-1)?.quota).toEqual(
    quota,
  );
  const next = await h.enqueue(agent, 'new');
  expect((await claim(h, runtime))[0].run.id).toBe(next);
  expect(
    (
      await h.request('POST', `/agents/runners/runs/${next}/fail`, {
        runnerKey: runtime.key,
        body: { reason: 'toolQuota', quota },
      })
    ).status,
  ).toBe(200);
  expect(
    (await h.services.runners.get(runtime.runnerId)).unavailableModels,
  ).toHaveLength(1);
});
it('uses the earliest known alternative while preserving unknown windows within each alternative', async () => {
  h = await createHarness();
  const registered = await h.registerRunner({
    tools: ['claude', 'codex'].map((kind) => ({
      kind: kind as 'claude' | 'codex',
      authenticated: true,
      models: [{ id: 'a' }],
    })),
  });
  const reset = '2099-10-17T18:00:00.000Z';
  const report = (
    tool: 'claude' | 'codex',
    window: string,
    resetsAt: string | null,
  ) =>
    h.services.tx.run((unit) =>
      h.services.runners.reportQuota(unit, registered.runnerId, tool, 'a', {
        windows: [
          { scope: 'tool', target: '', window, exhausted: true, resetsAt },
        ],
      }),
    );
  await report('claude', 'account', null);
  await report('codex', '5h', reset);
  const agent = {
    id: 'alternatives',
    name: 'Alternatives',
    modelEntries: [
      { tool: 'claude' as const, model: 'a', effort: null },
      { tool: 'codex' as const, model: 'a', effort: null },
    ],
  };
  expect(
    quotaForAgent(
      [await h.services.runners.get(registered.runnerId)],
      agent,
      undefined,
      h.clock.now().getTime(),
    )[0].resetsAt,
  ).toBe(reset);
  await report('codex', '7d', '2099-10-20T18:00:00.000Z');
  expect(
    quotaForAgent(
      [await h.services.runners.get(registered.runnerId)],
      agent,
      undefined,
      h.clock.now().getTime(),
    )[0].resetsAt,
  ).toBe('2099-10-20T18:00:00.000Z');
  await report('codex', 'credits', null);
  expect(
    quotaForAgent(
      [await h.services.runners.get(registered.runnerId)],
      agent,
      undefined,
      h.clock.now().getTime(),
    )[0].resetsAt,
  ).toBeNull();
});
it('serves a system candidate quota to its owner without revealing another member’s personal runtime', async () => {
  h = await createHarness();
  const agent = await h.createAgent({ id: 'system-manager' });
  const runtime = await h.registerRunner({
    ownerUserId: 'alice',
    trust: 'ownerOnly',
  });
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, runtime.runnerId, 'claude', null, {
      windows: [
        {
          scope: 'tool',
          target: '',
          window: 'account',
          resetsAt: null,
          exhausted: true,
        },
      ],
    }),
  );
  const owner = await h.request('GET', `/agents/${agent}`, { user: 'alice' });
  expect(owner.status).toBe(200);
  expect(owner.body.data.source).toBe('system');
  expect(owner.body.data.quota).toHaveLength(1);
  const member = await h.request('GET', `/agents/${agent}`, { user: 'bob' });
  expect(member.status).toBe(200);
  expect(member.body.data.quota).toEqual([]);
});
it('retains independent tool observations submitted concurrently', async () => {
  h = await createHarness();
  const runner = await h.registerRunner();
  const report = {
    windows: [
      {
        scope: 'tool' as const,
        target: '',
        window: 'account',
        exhausted: true,
        resetsAt: null,
      },
    ],
  };
  const tools = ['claude', 'codex'] as const;
  const results = await Promise.allSettled(
    tools.map((tool) =>
      h.services.tx.run((unit) =>
        h.services.runners.reportQuota(
          unit,
          runner.runnerId,
          tool,
          null,
          report,
        ),
      ),
    ),
  );
  for (const [index, result] of results.entries())
    if (result.status === 'rejected')
      await h.services.tx.run((unit) =>
        h.services.runners.reportQuota(
          unit,
          runner.runnerId,
          tools[index],
          null,
          report,
        ),
      );
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels
      ?.map((mark) => mark.tool)
      .sort(),
  ).toEqual(['claude', 'codex']);
});

it('adds no SQL, writes, transactions or locks to heartbeat or an excluded claim', async () => {
  h = await createHarness();
  const registration = await h.registerRunner();
  const agent = await h.createAgent();
  await h.enqueue(agent);
  const client = await h.database.connection().client<Knex>();
  const measure = async (name: string, action: () => Promise<unknown>) => {
    const sql: string[] = [];
    const listen = (query: { sql: string }) => sql.push(query.sql);
    client.on('query', listen);
    try {
      await action();
    } finally {
      client.off('query', listen);
    }
    const result = {
      name,
      reads: sql.filter((q) => /^select/i.test(q)).length,
      writes: sql.filter((q) => /^(insert|update|delete)/i.test(q)).length,
      transactions: sql.filter((q) => /^begin/i.test(q)).length,
      locks: sql.filter((q) => /for update|for share/i.test(q)).length,
    };
    return result;
  };
  const runner = await h.services.runners.get(registration.runnerId);
  const heartbeat = {
    version: runner.version,
    features: runner.features,
    tools: runner.tools,
    active: [],
    load: { slots: runner.slots, free: runner.slots },
  };
  await h.services.runners.heartbeat(runner, heartbeat);
  const beforeHeartbeat = await measure('heartbeat-before', () =>
    h.services.runners.heartbeat(runner, heartbeat),
  );
  const beforeClaim = await measure('claim-incompatible-tool', () =>
    h.services.claims.claim({ ...runner, enabledTools: [] }, 1),
  );
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, runner.id, 'claude', null, {
      windows: [
        {
          scope: 'tool',
          target: '',
          window: 'account',
          exhausted: true,
          resetsAt: null,
        },
      ],
    }),
  );
  const marked = await h.services.runners.get(runner.id);
  const afterHeartbeat = await measure('heartbeat-with-quota', () =>
    h.services.runners.heartbeat(marked, heartbeat),
  );
  const afterClaim = await measure('claim-quota-filtered', () =>
    h.services.claims.claim(marked, 1),
  );
  const { name: _beforeH, ...costBeforeH } = beforeHeartbeat;
  const { name: _afterH, ...costAfterH } = afterHeartbeat;
  const { name: _beforeC, ...costBeforeC } = beforeClaim;
  const { name: _afterC, ...costAfterC } = afterClaim;
  expect(costAfterH).toEqual(costBeforeH);
  expect(costAfterC.reads).toBeLessThanOrEqual(costBeforeC.reads);
  expect(costAfterC.writes).toBe(0);
  expect(costAfterC.transactions).toBe(0);
  expect(costAfterC.locks).toBe(0);
});
it('throttles small usage changes, saves boundary transitions and broadcasts only mark changes', async () => {
  h = await createHarness();
  const runner = await h.registerRunner();
  const broadcasts: unknown[] = [];
  const stop = h.services.events.on('runner.changed', (event) =>
    broadcasts.push(event),
  );
  const report = (usedPercent: number, exhausted = false) =>
    h.services.tx.run((unit) =>
      h.services.runners.reportQuota(unit, runner.runnerId, 'claude', null, {
        windows: [
          {
            scope: 'tool',
            target: '',
            window: '5h',
            resetsAt: '2026-10-01T01:00:00.000Z',
            usedPercent,
            exhausted,
          },
        ],
      }),
    );
  await report(62);
  const revision = (await h.services.runners.get(runner.runnerId))
    .quotaRevision;
  for (const percent of [63, 64, 65, 66]) await report(percent);
  expect((await h.services.runners.get(runner.runnerId)).quotaRevision).toBe(
    revision,
  );
  expect(broadcasts).toHaveLength(0);
  await report(67);
  expect(
    (await h.services.runners.get(runner.runnerId)).quotaUsage?.[0]
      ?.usedPercent,
  ).toBe(67);
  await report(89);
  await report(90);
  expect(
    (await h.services.runners.get(runner.runnerId)).quotaUsage?.[0]
      ?.usedPercent,
  ).toBe(90);
  expect(broadcasts).toHaveLength(0);
  await report(100, true);
  expect(broadcasts).toHaveLength(1);
  await report(99, true);
  expect(broadcasts).toHaveLength(1);
  stop();
});
it('rejects manual clearing of known resets and retains default Claude weekly marks', async () => {
  h = await createHarness();
  const runner = await h.registerRunner({ ownerUserId: 'alice' });
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, runner.runnerId, 'claude', null, {
      windows: [
        {
          scope: 'model',
          target: 'claude-opus-5-5',
          window: 'seven_day_opus',
          resetsAt: '2026-10-01T01:00:00.000Z',
          exhausted: true,
        },
      ],
    }),
  );
  const mark = (await h.services.runners.get(runner.runnerId))
    .unavailableModels![0];
  expect(mark).toMatchObject({ scope: 'tool', model: '' });
  const result = await h.request(
    'POST',
    `/agents/runners/${runner.runnerId}/quota/clear`,
    { user: 'alice', body: targetOf(mark) },
  );
  expect(result.status).toBe(409);
  expect(
    (await h.services.runners.get(runner.runnerId)).unavailableModels,
  ).toHaveLength(1);
});
it('coalesces quota observations in a batch and reads only quota event metadata at final failure', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const runtime = await h.registerRunner();
  const runId = await h.enqueue(agent, 'batched');
  await claim(h, runtime);
  const client = await h.database.connection().client<Knex>();
  const sql: string[] = [];
  const listen = (query: { sql: string }) => sql.push(query.sql);
  client.on('query', listen);
  const quota = {
    windows: [
      {
        scope: 'tool' as const,
        target: '',
        window: '5h',
        exhausted: true,
        resetsAt: null,
        usedPercent: 100,
      },
    ],
  };
  try {
    const result = await h.request(
      'POST',
      `/agents/runners/runs/${runId}/events`,
      {
        runnerKey: runtime.key,
        body: {
          events: Array.from({ length: 20 }, (_, i) => ({
            seq: i + 1,
            at: h.clock.now().toISOString(),
            type: 'status',
            meta: i === 19 ? { quota } : { detail: 'ordinary' },
          })),
        },
      },
    );
    expect(result.status).toBe(200);
    expect(
      sql.filter((query) => /^update.*ag_runners.*quota_usage/is.test(query)),
    ).toHaveLength(1);
    sql.length = 0;
    expect(
      (
        await h.request('POST', `/agents/runners/runs/${runId}/fail`, {
          runnerKey: runtime.key,
          body: { reason: 'toolQuota', quota },
        })
      ).status,
    ).toBe(200);
    const observations = sql.filter((query) =>
      /^select.*meta.*ag_run_events/is.test(query),
    );
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatch(
      /json_array_length|jsonb_array_length|json_length/i,
    );
  } finally {
    client.off('query', listen);
  }
  expect((await h.services.runs.get(runId)).executions?.at(-1)?.quota).toEqual(
    quota,
  );
});
