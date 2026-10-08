import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';

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
      usage: [usage('legacy-real')],
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
