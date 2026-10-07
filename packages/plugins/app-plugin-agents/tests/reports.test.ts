import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { ModelPrice, PriceBook } from '../shared/reports.js';
import {
  aggregateUsage,
  costOf,
  modelNames,
  percentile,
  priceFor,
  reliability,
  reportRange,
  type ReportCaller,
  type UsageRecord,
} from '../server/core/reports/index.js';
import { listPrices } from '../server/core/reports/prices.js';
import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

function price(model: string, overrides: Partial<ModelPrice> = {}): ModelPrice {
  return {
    id: model,
    tool: 'claude',
    modelService: null,
    model,
    inputPerM: 3,
    outputPerM: 15,
    cacheReadPerM: 0.3,
    cacheWritePerM: 3.75,
    currency: 'USD',
    note: null,
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function record(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    runId: 'r1',
    agentId: 'a1',
    userId: 'alice',
    tool: 'claude',
    modelService: null,
    model: 'claude-sonnet-4-5-20250929',
    subjectKind: 'sample',
    subjectId: 'i1',
    groupId: 'g1',
    day: '2026-10-01',
    durationMs: 60_000,
    inputTokens: 1_000_000,
    outputTokens: 100_000,
    cacheReadTokens: 2_000_000,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    ...overrides,
  };
}

/** The prices of `prices`, nothing paid by subscription unless named. */
function book(
  prices: readonly ModelPrice[],
  subscriptions: readonly string[] = [],
): PriceBook {
  return { prices, subscriptions };
}

const claude = (model: string | null) => ({
  tool: 'claude',
  modelService: null,
  model,
});

describe('model prices', () => {
  it('picks the most specific matching price of the coding tool', () => {
    const prices = book([
      price('claude-sonnet-4*'),
      price('claude-sonnet-4-5*', { inputPerM: 1 }),
      price('claude-sonnet-4-5-20250929', { inputPerM: 2 }),
      price('gpt-5*', { inputPerM: 9 }),
      price('gpt-5-mini*', { inputPerM: 0.25 }),
    ]);
    expect(
      priceFor(prices, claude('claude-sonnet-4-5-20250929'))?.inputPerM,
    ).toBe(2);
    expect(priceFor(prices, claude('claude-sonnet-4-5'))?.inputPerM).toBe(1);
    expect(priceFor(prices, claude('Claude-Sonnet-4-6'))?.inputPerM).toBe(3);
    expect(priceFor(prices, claude('gpt-5-mini-2025-08-07'))?.inputPerM).toBe(
      0.25,
    );
    expect(priceFor(prices, claude('openai/gpt-5-mini'))?.inputPerM).toBe(0.25);
    expect(priceFor(prices, claude('claude-haiku-4-5'))).toBeNull();
    expect(priceFor(prices, claude(null))).toBeNull();
  });

  it('prices a model by its source and never falls back across sources', () => {
    const prices = book([
      price('gpt-5*', { tool: 'codex', inputPerM: 1 }),
      price('gpt-5', { tool: 'online', modelService: 'team', inputPerM: 2 }),
      price('gpt-5', { tool: 'online', modelService: 'azure', inputPerM: 3 }),
    ]);
    expect(
      priceFor(prices, { tool: 'codex', modelService: null, model: 'gpt-5' })
        ?.inputPerM,
    ).toBe(1);
    expect(
      priceFor(prices, { tool: 'online', modelService: 'team', model: 'GPT-5' })
        ?.inputPerM,
    ).toBe(2);
    expect(
      priceFor(prices, {
        tool: 'online',
        modelService: 'azure',
        model: 'gpt-5',
      })?.inputPerM,
    ).toBe(3);
    // An online model matches exactly, within its service only.
    expect(
      priceFor(prices, {
        tool: 'online',
        modelService: 'team',
        model: 'gpt-5-mini',
      }),
    ).toBeNull();
    expect(
      priceFor(prices, {
        tool: 'online',
        modelService: 'other',
        model: 'gpt-5',
      }),
    ).toBeNull();
    expect(
      priceFor(prices, {
        tool: 'opencode',
        modelService: null,
        model: 'gpt-5',
      }),
    ).toBeNull();
  });

  it('charges nothing for a coding tool paid by subscription', () => {
    const prices = book([price('claude-*', { inputPerM: 9 })], ['claude']);
    expect(priceFor(prices, claude('claude-opus-5'))).toMatchObject({
      inputPerM: 0,
      outputPerM: 0,
    });
    expect(
      priceFor(prices, { tool: 'codex', modelService: null, model: 'gpt-5' }),
    ).toBeNull();
  });

  it('matches a provider-prefixed or suffixed model without its decoration', () => {
    expect(modelNames('anthropic/claude-opus-5-5[1m]')).toEqual([
      'anthropic/claude-opus-5-5[1m]',
      'claude-opus-5-5[1m]',
      'anthropic/claude-opus-5-5',
      'claude-opus-5-5',
    ]);
    expect(
      priceFor(book([price('claude-opus-5-5*')]), claude('claude-opus-5-5[1m]'))
        ?.model,
    ).toBe('claude-opus-5-5*');
  });

  it('charges each kind of token at its own rate, per million', () => {
    expect(
      costOf(price('m'), {
        inputTokens: 1_000_000,
        outputTokens: 200_000,
        cacheReadTokens: 3_000_000,
        cacheWriteTokens: 400_000,
      }),
    ).toBeCloseTo(3 + 3 + 0.9 + 1.5, 10);
  });
});

describe('usage aggregation', () => {
  it('groups records, counts each run once and adds cost per currency', () => {
    const prices = book([
      price('claude-sonnet-4*'),
      price('gpt-5*', {
        tool: 'codex',
        inputPerM: 1,
        outputPerM: 10,
        currency: 'EUR',
      }),
    ]);
    const records = [
      record(),
      // The same run on a second model: one run, one duration.
      record({ model: 'claude-haiku-9', inputTokens: 10, outputTokens: 0 }),
      record({
        runId: 'r2',
        agentId: 'a2',
        userId: 'bob',
        tool: 'codex',
        model: 'gpt-5-codex',
        day: '2026-09-30',
        durationMs: 30_000,
        inputTokens: 2_000_000,
        outputTokens: 100_000,
        cacheReadTokens: 0,
        reasoningTokens: 50_000,
      }),
    ];
    const byAgent = aggregateUsage(records, 'agent', prices);
    expect(byAgent.rows.map((row) => row.key)).toEqual(['a1', 'a2']);
    expect(byAgent.rows[0]).toMatchObject({
      runs: 1,
      durationMs: 60_000,
      inputTokens: 1_000_010,
      cost: { USD: 3 + 1.5 + 0.6 },
      // The haiku record had no price, so the run is not fully priced.
      pricedRuns: 0,
    });
    expect(byAgent.rows[1]).toMatchObject({
      runs: 1,
      cost: { EUR: 3 },
      pricedRuns: 1,
      reasoningTokens: 50_000,
    });
    expect(byAgent.totals).toMatchObject({
      runs: 2,
      durationMs: 90_000,
      cost: { USD: 5.1, EUR: 3 },
      pricedRuns: 1,
    });
    expect(byAgent.unpricedModels).toEqual(['claude-haiku-9 (claude)']);
    expect(byAgent.daily.map((point) => point.day)).toEqual([
      '2026-09-30',
      '2026-10-01',
    ]);

    const byDay = aggregateUsage(records, 'day', prices);
    expect(byDay.rows.map((row) => row.key)).toEqual([
      '2026-09-30',
      '2026-10-01',
    ]);
    expect(
      aggregateUsage(records, 'person', prices).rows.map((row) => row.key),
    ).toEqual(['alice', 'bob']);
    expect(
      aggregateUsage(records, 'tool', prices).rows.map((row) => row.key),
    ).toEqual(['claude', 'codex']);
    expect(
      aggregateUsage(records, 'subject', prices).rows.map((row) => row.key),
    ).toEqual(['sample:i1']);
    expect(
      aggregateUsage(records, 'group', prices).rows.map((row) => row.key),
    ).toEqual(['g1']);
    const unpriced = aggregateUsage(records, 'model', book([]));
    expect(unpriced.totals.cost).toBeNull();
    expect(byAgent.daily[0]?.series).toBeUndefined();
  });

  it('breaks each day down by group when asked for series', () => {
    const records = [
      record(),
      record({ runId: 'r2', agentId: 'a2', inputTokens: 5, outputTokens: 1 }),
      record({ runId: 'r3', agentId: 'a2', day: '2026-09-30' }),
    ];
    const report = aggregateUsage(
      records,
      'agent',
      book([price('claude-sonnet-4*')]),
      new Map(),
      true,
    );
    expect(
      report.daily.map((point) => [
        point.day,
        point.series?.map((cell) => cell.key),
      ]),
    ).toEqual([
      ['2026-09-30', ['a2']],
      ['2026-10-01', ['a2', 'a1']],
    ]);
    expect(report.daily[1]?.series?.[1]).toMatchObject({
      key: 'a1',
      inputTokens: 1_000_000,
    });
  });
});

describe('metric arithmetic', () => {
  it('reads ranges and percentiles', () => {
    const now = new Date('2026-10-01T12:00:00Z');
    expect(reportRange({}, now)).toMatchObject({
      from: '2026-09-02',
      to: '2026-10-01',
    });
    expect(reportRange({ from: '2026-09-01', to: '2026-09-01' }, now)).toEqual({
      from: '2026-09-01',
      to: '2026-09-01',
      start: new Date('2026-09-01T00:00:00Z'),
      end: new Date('2026-09-02T00:00:00Z'),
    });
    expect(() =>
      reportRange({ from: '2026-10-02', to: '2026-10-01' }, now),
    ).toThrow(/from must not be after to/u);
    expect(() => reportRange({ from: '2026-02-30' }, now)).toThrow(/date/u);
    expect(() => reportRange({ from: '2020-01-01' }, now)).toThrow(/366/u);

    expect(percentile([], 0.5)).toBeNull();
    expect(percentile([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(percentile([5, 1, 3, 2, 4], 0.95)).toBe(5);
  });

  it('measures runs: failures, claim latency, duration and lost runs', () => {
    const now = new Date('2026-10-01T12:00:00Z');
    const result = reliability(
      [
        {
          status: 'completed',
          failureReason: null,
          createdAt: '2026-10-01T00:00:00Z',
          dispatchedAt: '2026-10-01T00:00:02Z',
          startedAt: '2026-10-01T00:00:03Z',
          finishedAt: '2026-10-01T00:10:03Z',
          lastActivityAt: null,
        },
        {
          status: 'failed',
          failureReason: 'toolAuth',
          createdAt: '2026-10-01T01:00:00Z',
          dispatchedAt: '2026-10-01T01:00:04Z',
          startedAt: '2026-10-01T01:00:05Z',
          finishedAt: '2026-10-01T01:00:35Z',
          lastActivityAt: null,
        },
        {
          status: 'running',
          failureReason: null,
          createdAt: '2026-10-01T02:00:00Z',
          dispatchedAt: '2026-10-01T02:00:01Z',
          startedAt: '2026-10-01T02:00:01Z',
          finishedAt: null,
          lastActivityAt: '2026-10-01T03:00:00Z',
        },
        {
          status: 'queued',
          failureReason: null,
          createdAt: '2026-10-01T11:00:00Z',
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          lastActivityAt: null,
        },
      ],
      now,
    );
    expect(result).toEqual({
      runs: 4,
      completedRuns: 1,
      failedRuns: 1,
      failuresByReason: { toolAuth: 1 },
      claimLatencyP50Ms: 2_000,
      claimLatencyP95Ms: 4_000,
      runDurationP50Ms: 30_000,
      lostRuns: 1,
    });
  });
});

const ALL: ReportCaller = { userId: 'carol', allRuns: true };

describe('reporting service', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const post = (
    runner: RegisteredRunner,
    runId: string,
    action: string,
    body: unknown = {},
  ) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });

  /** Runs one queued run on `runner` to completion with `usage`. */
  async function complete(
    runner: RegisteredRunner,
    usage: readonly Record<string, unknown>[],
  ): Promise<string> {
    const [payload] = await claim(h, runner);
    const runId = payload.run.id as string;
    await post(runner, runId, 'start', {
      workDir: '/w',
      adapter: { kind: 'claude' },
      acceptsInput: false,
    });
    h.clock.advance(120_000);
    const done = await post(runner, runId, 'complete', {
      summary: 'Done.',
      handledInputIds: payload.inputs.map((input: { id: string }) => input.id),
      usage,
    });
    expect(done.status).toBe(200);
    return runId;
  }

  async function seed(): Promise<{ agentId: string }> {
    const agentId = await h.createAgent({ name: 'Coder' });
    const runner = await h.registerRunner();
    await h.enqueue(agentId, '1', { actorUserId: 'alice' });
    await complete(runner, [
      {
        tool: 'claude',
        model: 'claude-sonnet-4-5',
        inputTokens: 1_000_000,
        outputTokens: 100_000,
        cacheReadTokens: 1_000_000,
      },
    ]);
    await h.enqueue(agentId, '2', { actorUserId: 'bob' });
    await complete(runner, [
      {
        tool: 'claude',
        model: 'claude-haiku-4-5',
        inputTokens: 500_000,
        outputTokens: 0,
      },
    ]);
    return { agentId };
  }

  it('counts everyone’s runs only for a caller who may see them all', async () => {
    h = await createHarness();
    await seed();
    const all = await h.services.reporting.usage(ALL, { groupBy: 'person' });
    expect(all.rows.map((row) => row.key)).toEqual(['alice', 'bob']);
    expect(all.totals).toMatchObject({ runs: 2, durationMs: 240_000 });

    // Not every run: only the runs bob started.
    const own = await h.services.reporting.usage(
      { userId: 'bob', allRuns: false },
      { groupBy: 'person' },
    );
    expect(own.rows.map((row) => row.key)).toEqual(['bob']);

    await expect(
      h.services.reporting.usage(ALL, { groupBy: 'nope' as 'agent' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    expect(() =>
      h.services.reporting.range({ from: '2026-10-05', to: '2026-10-01' }),
    ).toThrow(/from must not be after to/u);
  });

  it('works costs out from the prices as they are when read', async () => {
    h = await createHarness();
    const { agentId } = await seed();
    const read = () => h.services.reporting.usage(ALL, { groupBy: 'model' });
    const before = await read();
    expect(before.totals.cost).toBeNull();
    expect(before.unpricedModels).toEqual([
      'claude-haiku-4-5 (claude)',
      'claude-sonnet-4-5 (claude)',
    ]);

    // Prices: reading needs agents.prices read, replacing needs manage.
    expect(
      (
        await h.request('GET', '/agents/prices', {
          user: 'carol',
          can: ['agents.agents/read'],
        })
      ).status,
    ).toBe(403);
    const body = {
      subscriptions: [],
      prices: [
        {
          tool: 'claude',
          model: 'claude-sonnet-4*',
          inputPerM: 3,
          outputPerM: 15,
          cacheReadPerM: 0.3,
          cacheWritePerM: 3.75,
        },
        {
          tool: 'claude',
          model: 'claude-haiku-4-5*',
          inputPerM: 1,
          outputPerM: 5,
        },
      ],
    };
    expect(
      (
        await h.request('PUT', '/agents/prices', {
          user: 'carol',
          can: ['agents.prices/read'],
          body,
        })
      ).status,
    ).toBe(403);
    const saved = await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body,
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.items).toHaveLength(2);
    expect(saved.body.data.items[0]).toMatchObject({
      tool: 'claude',
      modelService: null,
      model: 'claude-haiku-4-5*',
      cacheReadPerM: 0,
      currency: 'USD',
    });
    // The models the coding tools reported, to be priced.
    expect(saved.body.data.seen).toEqual([
      { tool: 'claude', model: 'claude-haiku-4-5' },
      { tool: 'claude', model: 'claude-sonnet-4-5' },
    ]);
    const duplicate = await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body: { subscriptions: [], prices: [body.prices[0], body.prices[0]] },
    });
    expect(duplicate.status).toBe(400);
    const negative = await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body: {
        subscriptions: [],
        prices: [{ tool: 'claude', model: 'x', inputPerM: -1, outputPerM: 0 }],
      },
    });
    expect(negative.status).toBe(400);
    // A chat price names its model service.
    const serviceless = await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body: {
        subscriptions: [],
        prices: [{ tool: 'online', model: 'x', inputPerM: 1, outputPerM: 1 }],
      },
    });
    expect(serviceless.status).toBe(400);

    const after = await read();
    // 3 + 1.5 + 0.3 for sonnet, 0.5 for haiku.
    expect(after.totals.cost).toEqual({ USD: 5.3 });
    expect(after.unpricedModels).toEqual([]);
    expect(after.totals.pricedRuns).toBe(2);

    // A changed price changes the report; nothing was stored with the runs.
    const listed = await h.request('GET', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/read'],
    });
    await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body: {
        subscriptions: [],
        prices: listed.body.data.items.map(
          ({ id: _id, updatedAt: _updatedAt, ...item }: ModelPrice) =>
            item.model === 'claude-haiku-4-5*'
              ? { ...item, inputPerM: 2 }
              : item,
        ),
      },
    });
    expect((await read()).totals.cost).toEqual({ USD: 5.8 });
    // Paid by subscription, Claude Code's runs cost nothing.
    await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body: { subscriptions: ['claude'], prices: [] },
    });
    const subscribed = await read();
    expect(subscribed.totals.cost).toEqual({ USD: 0 });
    expect(subscribed.totals.pricedRuns).toBe(2);
    await h.request('PUT', '/agents/prices', {
      user: 'carol',
      can: ['agents.prices/manage'],
      body: {
        subscriptions: [],
        prices: listed.body.data.items.map(
          ({ id: _id, updatedAt: _updatedAt, ...item }: ModelPrice) =>
            item.model === 'claude-haiku-4-5*'
              ? { ...item, inputPerM: 2 }
              : item,
        ),
      },
    });

    const figures = await h.services.reporting.runFigures(ALL, {
      ...h.services.reporting.range({}),
      groupId: null,
    });
    expect(figures).toMatchObject({
      runs: 2,
      completedRuns: 2,
      failedRuns: 0,
      lostRuns: 0,
      inputTokens: 1_500_000,
      outputTokens: 100_000,
      estimatedCost: { USD: 5.8 },
      costByAgent: [{ agentId, name: 'Coder', cost: { USD: 5.8 } }],
      activityDays: ['2026-10-01'],
      actorIds: ['alice', 'bob'],
    });
    // Each day of the range, with the runs started that day by outcome and the day's cost by agent type.
    expect(figures.daily).toHaveLength(30);
    expect(
      figures.daily.find((point) => point.day === '2026-10-01'),
    ).toMatchObject({
      completed: 2,
      failed: 0,
      open: 0,
      onlineCost: null,
      runnerCost: { USD: 5.8 },
    });
    // The usage page's API: behind its page grant, every run for a reader of agents.
    const usage = (can: string) =>
      h.app.request('/agents/usage?groupBy=type', {
        headers: { 'x-test-user': 'carol', 'x-test-can': can },
      });
    expect((await usage('agents.agents/read')).status).toBe(403);
    const served = await usage('page/usage,agents.agents/read');
    expect(served.status).toBe(200);
    expect(await served.json()).toMatchObject({
      data: { groupBy: 'type', totals: { runs: 2, cost: { USD: 5.8 } } },
    });
    expect((await usage('page/usage')).status).toBe(200);
    expect(
      (
        await h.app.request('/agents/usage?groupBy=nope', {
          headers: { 'x-test-user': 'carol', 'x-test-can': 'page/usage' },
        })
      ).status,
    ).toBe(400);
  });

  it('leaves out runs on subjects the caller may not see, and filters by group', async () => {
    h = await createHarness();
    h.services.subjects.register({
      kind: 'doc',
      context: h.services.subjects.get('sample')!.context,
      reports: {
        describe(_conn, userId, ids) {
          return Promise.resolve(
            new Map(
              ids.map((id) => [
                id,
                {
                  label: `DOC-${id}`,
                  visible: id !== 'secret' || userId === 'alice',
                  group: { id: `g-${id}`, name: `Group ${id}` },
                },
              ]),
            ),
          );
        },
      },
    });
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    for (const id of ['open', 'secret']) {
      await h.services.runs.enqueue({
        agentId,
        subject: { kind: 'doc', id },
        actorUserId: 'alice',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'alice', name: 'Alice' },
          text: 'Go.',
        },
      });
      await complete(runner, [
        { tool: 'claude', model: 'm', inputTokens: 10, outputTokens: 1 },
      ]);
    }
    const subjects = async (userId: string, groupId?: string) =>
      (
        await h.services.reporting.usage(
          { userId, allRuns: true },
          { groupBy: 'subject', ...(groupId ? { groupId } : {}) },
        )
      ).rows.map((row) => row.name);
    expect(await subjects('alice')).toEqual(['DOC-open', 'DOC-secret']);
    expect(await subjects('carol')).toEqual(['DOC-open']);
    expect(await subjects('alice', 'g-secret')).toEqual(['DOC-secret']);
    const groups = await h.services.reporting.usage(
      { userId: 'alice', allRuns: true },
      { groupBy: 'group' },
    );
    expect(groups.rows.map((row) => row.name).sort()).toEqual([
      'Group open',
      'Group secret',
    ]);

    const range = h.services.reporting.range({});
    expect(
      await h.services.reporting.runFigures(ALL, { ...range, groupId: null }),
    ).toMatchObject({ runs: 1, actorIds: ['alice'] });
    expect(
      await h.services.reporting.runFigures(
        { userId: 'alice', allRuns: true },
        { ...range, groupId: 'g-secret' },
      ),
    ).toMatchObject({ runs: 1 });

    // The runs themselves, by range or by subject, only those the caller may see.
    const alice: ReportCaller = { userId: 'alice', allRuns: true };
    const records = await h.services.reporting.runRecords(alice, {
      start: range.start,
      end: range.end,
      groupId: null,
    });
    expect(records.map((run) => [run.subjectId, run.status])).toEqual([
      ['open', 'completed'],
      ['secret', 'completed'],
    ]);
    expect(records[0]).toMatchObject({
      agentId,
      subjectKind: 'doc',
      failureReason: null,
      retryOfRunId: null,
    });
    expect(records[0].dispatchedAt).not.toBeNull();
    expect(records[0].finishedAt).not.toBeNull();
    const bySubject = (caller: ReportCaller, ids: string[]) =>
      h.services.reporting.runRecords(caller, {
        subjects: { kind: 'doc', ids },
        groupId: null,
      });
    expect(
      (await bySubject(ALL, ['open', 'secret'])).map((run) => run.subjectId),
    ).toEqual(['open']);
    expect(await bySubject(alice, [])).toEqual([]);
    expect(
      await h.services.reporting.runRecords(alice, {
        start: range.end,
        groupId: null,
      }),
    ).toEqual([]);
  });

  it('seeds current prices once, keeping prices someone changed', async () => {
    h = await createHarness();
    const seeder = () =>
      h.database
        .createSeeder({
          directory: path.resolve(import.meta.dirname, '../database/seeds'),
          packageName: '@nocobase/app-plugin-agents',
        })
        .run();
    await seeder();
    const prices = await listPrices(h.database.connection());
    expect(prices.prices.length).toBeGreaterThan(40);
    const codex = (model: string) => ({
      tool: 'codex',
      modelService: null,
      model,
    });
    expect(
      priceFor(prices, claude('claude-sonnet-4-5-20250929')),
    ).toMatchObject({
      inputPerM: 3,
      outputPerM: 15,
      cacheReadPerM: 0.3,
      cacheWritePerM: 3.75,
      currency: 'USD',
    });
    expect(priceFor(prices, claude('claude-opus-4-20250514'))?.inputPerM).toBe(
      15,
    );
    expect(priceFor(prices, claude('claude-opus-4-6'))?.inputPerM).toBe(5);
    expect(priceFor(prices, codex('gpt-5-codex'))?.outputPerM).toBe(10);
    expect(priceFor(prices, codex('gpt-5.4-mini'))?.inputPerM).toBe(0.75);
    expect(priceFor(prices, codex('o3-mini'))?.inputPerM).toBe(1.1);
    expect(
      priceFor(prices, claude('anthropic/claude-haiku-4-5'))?.inputPerM,
    ).toBe(1);
    // Claude Code is not priced at OpenAI's models.
    expect(priceFor(prices, claude('gpt-5-codex'))).toBeNull();
  });

  it('records the usage a lost runner reported before it went silent', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxAttempts: 1 });
    await h.enqueue(agentId);
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    const runId = payload.run.id as string;
    await post(runner, runId, 'start', {
      workDir: '/w',
      adapter: { kind: 'claude' },
      acceptsInput: false,
    });
    const usage = (inputTokens: number) => [
      { tool: 'claude', model: 'm', inputTokens, outputTokens: 7 },
    ];
    await post(runner, runId, 'events', {
      events: [
        {
          seq: 1,
          at: '2026-10-01T00:00:01Z',
          type: 'usage',
          meta: { usage: usage(100) },
        },
        {
          seq: 2,
          at: '2026-10-01T00:00:02Z',
          type: 'usage',
          meta: { usage: usage(250) },
        },
      ],
    });
    h.clock.advance(151_000);
    await h.sweep();
    const detail = await h.services.runs.detail(runId);
    expect(detail.status).toBe('failed');
    expect(detail.usage).toMatchObject([
      { tool: 'claude', model: 'm', inputTokens: 250, outputTokens: 7 },
    ]);
  });
});
