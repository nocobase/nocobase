import { afterEach, describe, expect, it, vi } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import { recordActualModels } from '../server/core/runs/execution.js';
import { findRunRecord } from '../server/core/runs/run.store.js';

describe('execution history', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const usage = (model: string, tool = 'codex') => ({
    tool,
    model,
    inputTokens: 10,
    outputTokens: 5,
  });
  const handledInputIds = async (runId: string) =>
    (await h.services.runs.detail(runId)).inputs.map((input) => input.id);

  it('keeps claim-time machine and tool facts after rename and deletion', async () => {
    h = await createHarness();
    let ownerName = 'Alice';
    h.services.people.provide({
      names: (_conn, ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, ownerName]))),
      list: () => Promise.resolve([]),
    });
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null, effort: 'high' }],
    });
    const runner = await h.registerRunner({
      name: 'dev-2',
      trust: 'team',
      ownerUserId: 'alice',
      tools: [{ kind: 'codex', version: '1.2.3', authenticated: true }],
    });
    const runId = await h.enqueue(agent);
    await claim(h, runner);
    ownerName = 'Renamed Alice';
    await h.services.runners.update(runner.runnerId, { name: 'renamed' });
    await h.services.reports.complete({ id: runner.runnerId }, runId, {
      summary: '',
      handledInputIds: await handledInputIds(runId),
      usage: [usage('gpt-real'), usage('helper-model', 'claude')],
    });
    await h.services.runners.revoke(runner.runnerId);
    await h.services.runners.remove(runner.runnerId);
    const run = await h.services.runs.detail(runId);
    expect(run).toMatchObject({
      runnerName: 'dev-2',
      runnerOwnerUserId: 'alice',
      runnerOwnerName: 'Alice',
      toolVersion: '1.2.3',
      actualModels: ['gpt-real'],
    });
    expect(run.executions).toMatchObject([
      {
        attempt: 1,
        runnerId: runner.runnerId,
        runnerName: 'dev-2',
        runnerTrust: 'team',
        model: null,
        actualModels: ['gpt-real'],
        effort: 'high',
        finishedAt: expect.any(String),
      },
    ]);
    expect(
      (await h.services.runs.list({ subjectKind: 'sample' }))[0],
    ).toMatchObject({ actualModels: ['gpt-real'], runnerName: 'dev-2' });
  });

  it('isolates attempts and preserves the released runner while waiting to retry', async () => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    const options = {
      tools: [{ kind: 'codex' as const, authenticated: true }],
    };
    const first = await h.registerRunner({ ...options, name: 'dev-1' });
    const second = await h.registerRunner({ ...options, name: 'dev-2' });
    const runId = await h.enqueue(agent);
    await claim(h, first);
    await h.services.reports.fail({ id: first.runnerId }, runId, {
      reason: 'toolRateLimit',
      usage: [usage('model-one')],
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      runnerId: null,
      runnerName: 'dev-1',
      actualModels: ['model-one'],
      executions: [
        { runnerId: first.runnerId, failureReason: 'toolRateLimit' },
      ],
    });
    h.clock.advance(30_000);
    await claim(h, second);
    expect((await h.services.runs.get(runId)).actualModels).toEqual([]);
    await h.services.reports.complete({ id: second.runnerId }, runId, {
      summary: '',
      handledInputIds: await handledInputIds(runId),
      usage: [usage('model-two')],
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      actualModels: ['model-two'],
      executions: [
        { attempt: 1, runnerName: 'dev-1', actualModels: ['model-one'] },
        { attempt: 2, runnerName: 'dev-2', actualModels: ['model-two'] },
      ],
    });
  });

  it('learns all primary models from live usage and retains them after a lost lease', async () => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: 'requested' }],
    });
    const runner = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
    });
    const runId = await h.enqueue(agent);
    await claim(h, runner);
    await h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 1,
          type: 'usage',
          at: h.clock.now().toISOString(),
          meta: {
            usage: [
              usage('actual-one'),
              usage('helper', 'claude'),
              usage('actual-two'),
            ],
          },
        },
      ],
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      model: 'requested',
      actualModels: ['actual-one', 'actual-two'],
    });
    h.clock.advance(151_000);
    await h.sweep();
    expect((await h.services.runs.get(runId)).executions?.[0]).toMatchObject({
      actualModels: ['actual-one', 'actual-two'],
      finishedAt: expect.any(String),
    });
  });

  it('returns known legacy models without fabricating historical runner snapshots', async () => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    const runner = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
    });
    const runId = await h.enqueue(agent);
    await claim(h, runner);
    await h.services.reports.complete({ id: runner.runnerId }, runId, {
      summary: '',
      handledInputIds: await handledInputIds(runId),
      usage: [
        usage('legacy-real'),
        usage('legacy-real'),
        usage('helper', 'claude'),
      ],
    });
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({
        filter: { id: runId },
        values: { executionHistory: null },
      });
    const detail = await h.request('GET', `/agents/runs/${runId}`, {
      user: 'owner',
    });
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({
      actualModels: ['legacy-real'],
      runnerName: null,
      executions: [],
    });
    expect(
      (await h.services.runs.list({ subjectKind: 'sample' }))[0]?.actualModels,
    ).toEqual(['legacy-real']);
  });

  it('separates requested effort from primary-tool reports and preserves changes with source and time', async () => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: 'requested', effort: 'high' }],
    });
    const runner = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
    });
    const runId = await h.enqueue(agent);
    await claim(h, runner);
    expect((await h.services.runs.get(runId)).actualEffort).toBeNull();
    const at = h.clock.now().toISOString();
    await h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 1,
          type: 'status',
          tool: 'claude',
          at,
          meta: { execution: { effort: 'max', source: 'helper' } },
        },
        {
          seq: 2,
          type: 'status',
          tool: 'codex',
          at,
          meta: {
            execution: { effort: 'medium', source: 'codex.thread/start' },
          },
        },
      ],
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      effort: 'high',
      actualEffort: 'medium',
      actualEffortSource: 'codex.thread/start',
      actualEffortAt: at,
    });
    h.clock.advance(1000);
    const changed = h.clock.now().toISOString();
    await h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 3,
          type: 'status',
          tool: 'codex',
          at: changed,
          meta: { execution: { effort: null, source: 'codex.turn/start' } },
        },
        {
          seq: 4,
          type: 'status',
          tool: 'codex',
          at: changed,
          meta: { effort: 'high' },
        },
      ],
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      actualEffort: null,
      actualEffortSource: 'codex.turn/start',
      actualEffortAt: changed,
      executions: [
        {
          effortReports: [
            { effort: 'medium', source: 'codex.thread/start', at },
            { effort: null, source: 'codex.turn/start', at: changed },
          ],
        },
      ],
    });
    // Duplicate resends and delayed older facts cannot restore a value that the tool stopped reporting.
    await h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 5,
          type: 'status',
          tool: 'codex',
          at,
          meta: {
            execution: { effort: 'medium', source: 'codex.thread/start' },
          },
        },
      ],
    });
    expect((await h.services.runs.get(runId)).actualEffort).toBeNull();
  });

  it('skips snapshot reads and writes for repeated or helper model usage', async () => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: 'requested' }],
    });
    const runner = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
    });
    const runId = await h.enqueue(agent);
    await claim(h, runner);
    await h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 1,
          type: 'usage',
          at: h.clock.now().toISOString(),
          meta: { usage: [usage('actual')] },
        },
      ],
    });
    const conn = h.database.connection();
    const record = (await findRunRecord(conn, runId))!;
    const repository = vi.spyOn(conn, 'repository');
    try {
      await recordActualModels(
        conn,
        record,
        [usage('actual'), usage('helper', 'claude')],
        h.clock.now().toISOString(),
      );
      expect(repository).not.toHaveBeenCalled();
    } finally {
      repository.mockRestore();
    }
  });

  it('does not create a phantom attempt when assembly rolls back', async () => {
    h = await createHarness();
    const agent = await h.createAgent();
    const runner = await h.registerRunner();
    const runId = await h.enqueue(agent);
    h.failAssembly = true;
    expect(await claim(h, runner)).toEqual([]);
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      attempt: 1,
      executions: [],
    });
    h.failAssembly = false;
    await claim(h, runner);
    expect((await h.services.runs.get(runId)).executions).toHaveLength(1);
  });

  it('protects all attempts and flat machine fields in lists, details and mutation responses', async () => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: 'requested' }],
    });
    const runner = await h.registerRunner({
      name: 'private-hostname',
      ownerUserId: 'alice',
      tools: [{ kind: 'codex', authenticated: true }],
    });
    const runId = await h.enqueue(agent);
    await claim(h, runner);
    const hidden = {
      runnerName: null,
      runnerOwnerName: null,
      machineHidden: true,
      executions: [
        {
          runnerName: null,
          runnerOwnerName: null,
          runnerTrust: null,
          machineHidden: true,
        },
      ],
    };
    const owner = await h.request('GET', `/agents/runs/${runId}`, {
      user: 'alice',
      can: ['agents.agents/read'],
    });
    expect(owner.body.data.runnerName).toBe('private-hostname');
    const manager = await h.request('GET', `/agents/runs/${runId}`, {
      user: 'manager',
      can: ['agents.agents/read', 'agents.runners/manage'],
    });
    expect(manager.body.data.runnerName).toBe('private-hostname');
    const outsider = await h.request('GET', `/agents/runs/${runId}`, {
      user: 'owner',
    });
    expect(outsider.status).toBe(200);
    expect(outsider.body.data).toMatchObject(hidden);
    const list = await h.request('GET', '/agents/runs', { user: 'owner' });
    expect(list.body.data[0]).toMatchObject(hidden);
    const cancelled = await h.request('POST', `/agents/runs/${runId}/cancel`, {
      user: 'owner',
    });
    expect(cancelled.body.data).toMatchObject(hidden);
    expect((await h.services.runs.get(runId)).runnerName).toBe(
      'private-hostname',
    );
  });

  it('records online holders and their reported model without a fictitious machine owner', async () => {
    h = await createHarness();
    const service = await h.services.online.services.create({
      title: 'Mock',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:9/v1',
      models: [{ value: 'requested', label: 'Requested' }],
    });
    const agent = await h.createAgent({
      type: 'online',
      modelEntries: [{ modelService: service.name, model: 'requested' }],
    });
    const conversation = await h.services.conversations.create('owner', {
      agentId: agent,
    });
    const sent = await h.services.conversations.send('owner', conversation.id, {
      content: 'Hello',
    });
    const runId = sent.run!.id;
    const holder = { id: 'server:test' };
    await h.services.claims.claimServer(holder, 1);
    await h.services.reports.onlineUsage(holder, runId, {
      modelService: service.name,
      model: 'resolved',
      inputTokens: 2,
      outputTokens: 1,
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      actualModels: ['resolved'],
      executions: [
        {
          runnerId: 'server:test',
          runnerOwnerUserId: null,
          toolVersion: null,
          modelService: service.name,
        },
      ],
    });
  });
});
