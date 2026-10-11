import type { AgentTool } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import type { EnqueueRequest } from '../server/core/runs/index.js';
import type { AgentsEvent } from '../server/kernel/events.js';
import { RunSchema } from '../server/routes/schemas.js';
import { claim, createHarness, type Harness } from './harness.js';

const BOTH = [
  { kind: 'claude', authenticated: true },
  { kind: 'codex', authenticated: true },
] as const;
const subject = { kind: 'sample', id: '1' };

describe('work controls', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });
  async function agent(): Promise<string> {
    h = await createHarness();
    return h.createAgent({
      maxConcurrentRuns: 5,
      modelEntries: [
        { tool: 'claude', model: 'opus' },
        { tool: 'codex', model: 'gpt-6', effort: 'xhigh' },
      ],
    });
  }
  const enqueue = (
    agentId: string,
    tool?: AgentTool,
    extra: Partial<EnqueueRequest> = {},
  ) =>
    h.services.runs.enqueue({
      agentId,
      subject,
      actorUserId: 'owner',
      ...(tool ? { tool } : {}),
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Please work.',
      },
      ...extra,
    });
  const waits = async () =>
    new Map(
      (await h.services.runs.workload({ subjectKind: 'sample' })).runs.map(
        (run) => [run.id, run.wait],
      ),
    );

  it('fixes Codex before claim and uses its configured model only on a Codex runtime', async () => {
    const id = await agent();
    const run = await enqueue(id, 'codex');
    expect(await h.services.runs.get(run.runId!)).toMatchObject({
      tool: null,
      requestedTool: 'codex',
      model: null,
    });
    const claude = await h.registerRunner();
    expect(await claim(h, claude)).toEqual([]);
    expect((await waits()).get(run.runId!)?.tool).toBe('codex');
    const codex = await h.registerRunner({ tools: [...BOTH] });
    const [taken] = await claim(h, codex);
    expect(taken.tool).toMatchObject({
      kind: 'codex',
      model: 'gpt-6',
      effort: 'xhigh',
    });
    expect(await h.services.runs.get(run.runId!)).toMatchObject({
      model: 'gpt-6',
      requestedTool: 'codex',
    });
  });

  it('waits for full Codex slots while legacy work falls back to Claude', async () => {
    const id = await agent();
    const first = await enqueue(id, 'codex');
    const fixed = await enqueue(id, 'codex', {
      subject: { kind: 'sample', id: '2' },
    });
    const legacy = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '3' },
    });
    const runner = await h.registerRunner({
      tools: [...BOTH],
      slots: 4,
      toolSlots: { codex: 1, claude: 2 },
    });
    const taken = await claim(h, runner, 4);
    expect(taken.map((payload) => payload.run.id)).toEqual([
      first.runId,
      legacy.runId,
    ]);
    expect(taken.map((payload) => payload.tool.kind)).toEqual([
      'codex',
      'claude',
    ]);
    expect((await waits()).get(fixed.runId!)).toMatchObject({
      reason: 'toolSlotsFull',
      tool: 'codex',
      params: { tool: 'codex', used: 1, limit: 1 },
    });
    expect(await claim(h, runner)).toEqual([]);
  });

  it('honors the runtime’s reported room without changing a fixed tool', async () => {
    const id = await agent();
    const fixed = await enqueue(id, 'codex');
    const legacy = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '2' },
    });
    const runner = await h.registerRunner({ tools: [...BOTH], slots: 4 });
    expect(
      (await claim(h, runner, 4, { codex: 0, claude: 2 })).map(
        (payload) => payload.run.id,
      ),
    ).toEqual([legacy.runId]);
    expect((await h.services.runs.get(fixed.runId!)).status).toBe('queued');
  });

  it('does not merge different choices and still serializes the same work across tools', async () => {
    const id = await agent();
    const codex = await enqueue(id, 'codex');
    const claude = await enqueue(id, 'claude');
    const legacy = await enqueue(id);
    expect(new Set([codex.runId, claude.runId]).size).toBe(2);
    expect(legacy).toMatchObject({ outcome: 'merged', runId: codex.runId });
    expect(await enqueue(id, 'codex')).toMatchObject({
      outcome: 'merged',
      runId: codex.runId,
    });
    const runner = await h.registerRunner({ tools: [...BOTH], slots: 4 });
    expect(
      (await claim(h, runner, 4)).map((payload) => payload.run.id),
    ).toEqual([codex.runId]);
    expect(await enqueue(id, 'codex')).toMatchObject({
      outcome: 'appended',
      runId: codex.runId,
    });
    expect(await enqueue(id, 'claude')).toMatchObject({
      outcome: 'merged',
      runId: claude.runId,
    });
    expect((await waits()).get(claude.runId!)?.reason).toBe('sameWorkActive');
  });

  it('rejects an unlisted tool before creating a run or a pending request', async () => {
    const id = await agent();
    await expect(enqueue(id, 'pi')).rejects.toMatchObject({
      reason: 'TOOL_NOT_LISTED',
    });
    await expect(
      enqueue(id, 'pi', {
        responsibleUserId: 'alice',
        requestedByUserId: 'bob',
      }),
    ).rejects.toMatchObject({ reason: 'TOOL_NOT_LISTED' });
    await expect(
      enqueue(id, 'pi', {
        responsibleUserId: 'alice',
        requestedByUserId: 'bob',
        execution: 'mine',
      }),
    ).rejects.toMatchObject({ reason: 'TOOL_NOT_LISTED' });
    expect(await h.services.runs.list({})).toEqual([]);
    expect(await h.services.runs.requests.list({ userId: 'alice' })).toEqual(
      [],
    );
  });

  it('changes a queued tool and rejects changes once it has been claimed', async () => {
    const id = await agent();
    const queued = await enqueue(id, 'codex');
    const change = await h.request(
      'POST',
      `/agents/runs/${queued.runId}/changeTool`,
      { user: 'owner', body: { tool: 'claude' } },
    );
    expect(change.status).toBe(200);
    expect(change.body.data).toMatchObject({
      requestedTool: 'claude',
      tool: null,
    });
    const runner = await h.registerRunner();
    expect(await claim(h, runner)).toHaveLength(1);
    const held = await h.request(
      'POST',
      `/agents/runs/${queued.runId}/changeTool`,
      {
        user: 'owner',
        body: { tool: 'codex' },
      },
    );
    expect(held.status).toBe(409);
    expect(held.body.error.reason).toBe('CONFLICT');
  });

  it('restores fallback when the queued choice is cleared and keeps unfixed input merging after claim', async () => {
    const id = await agent();
    const run = await enqueue(id, 'codex');
    await h.services.runs.changeTool(run.runId!, null, 'owner');
    const runner = await h.registerRunner();
    expect((await claim(h, runner))[0].tool.kind).toBe('claude');
    expect(await enqueue(id)).toMatchObject({
      outcome: 'appended',
      runId: run.runId,
    });
    expect((await h.services.runs.get(run.runId!)).requestedTool).toBeNull();
  });

  it('preserves a fixed choice on retry while a legacy retry remains unfixed', async () => {
    const id = await agent();
    const fixed = await enqueue(id, 'codex');
    await h.services.runs.cancel(fixed.runId!, 'owner');
    const retry = await h.services.runs.retry(fixed.runId!, 'owner');
    expect(retry).toMatchObject({ requestedTool: 'codex', tool: null });
    const runner = await h.registerRunner();
    expect(await claim(h, runner)).toEqual([]);
    const legacy = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '2' },
    });
    await h.services.runs.cancel(legacy.runId!, 'owner');
    const legacyRetry = await h.services.runs.retry(legacy.runId!, 'owner');
    expect(legacyRetry.requestedTool).toBeNull();
    expect((await claim(h, runner))[0].run.id).toBe(legacyRetry.id);
  });

  it('pauses every agent and thread, still merges input, and claims after resume', async () => {
    const id = await agent();
    const other = await h.createAgent();
    const run = await enqueue(id, 'codex');
    const events: AgentsEvent[] = [];
    h.services.events.onAny((event) => {
      if (event.type.startsWith('subject.')) events.push(event);
    });
    const paused = await h.request('POST', '/agents/subjects/sample/1/pause', {
      user: 'owner',
      can: ['agents.agents/manage'],
    });
    expect(paused.status).toBe(200);
    expect(paused.body.data).toMatchObject({
      subject,
      pausedBy: 'owner',
      pausedAt: h.clock.now().toISOString(),
    });
    expect(await enqueue(id, 'codex')).toMatchObject({
      outcome: 'merged',
      runId: run.runId,
    });
    await enqueue(other, 'claude', { threadScope: 'other' });
    const runner = await h.registerRunner({ tools: [...BOTH], slots: 4 });
    expect(await claim(h, runner, 4)).toEqual([]);
    expect([...(await waits()).values()].map((wait) => wait?.reason)).toEqual([
      'paused',
      'paused',
    ]);
    const unrelated = await enqueue(id, 'codex', {
      subject: { kind: 'sample', id: '2' },
    });
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual([
      unrelated.runId,
    ]);
    await h.services.runs.pauseSubject(subject, 'owner');
    expect(events).toHaveLength(1);
    h.clock.advance(1000);
    const resumed = await h.request(
      'POST',
      '/agents/subjects/sample/1/resume',
      { user: 'owner', can: ['agents.agents/manage'] },
    );
    expect(resumed.body.data).toMatchObject({
      pausedAt: null,
      pausedBy: null,
    });
    expect(events.map((event) => event.type)).toEqual([
      'subject.paused',
      'subject.resumed',
    ]);
    expect(events[1]).toMatchObject({
      byUserId: 'owner',
      at: h.clock.now().toISOString(),
      subject,
    });
    expect(await claim(h, runner, 3)).toHaveLength(2);
  });

  it('can pause before any run exists, leaves held work running and rolls back pause events', async () => {
    const id = await agent();
    const runner = await h.registerRunner({ tools: [...BOTH], slots: 4 });
    const running = await enqueue(id, 'codex');
    await claim(h, runner);
    expect(
      (
        await h.request('POST', `/agents/runners/runs/${running.runId}/start`, {
          runnerKey: runner.key,
          body: {
            workDir: '/work/sample',
            adapter: { kind: 'codex' },
            acceptsInput: true,
          },
        })
      ).status,
    ).toBe(200);
    await h.services.runs.pauseSubject(subject, 'owner');
    expect((await h.services.runs.get(running.runId!)).status).toBe('running');
    const future = { kind: 'sample', id: 'future' };
    const events: AgentsEvent[] = [];
    h.services.events.onAny((event) => events.push(event));
    await expect(
      h.services.tx.run(async (unit) => {
        await h.services.runs.pauseSubject(future, 'owner', unit);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(events).toEqual([]);
    expect((await h.services.runs.subjectPause(future)).pausedAt).toBeNull();
    await h.services.runs.pauseSubject(future, 'owner');
    const queued = await enqueue(id, 'codex', { subject: future });
    expect(await claim(h, runner)).toEqual([]);
    await h.services.runs.resumeSubject(future, 'owner');
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual([
      queued.runId,
    ]);
  });

  it('protects subject control and tool changes before validation or writes', async () => {
    const id = await agent();
    const run = await enqueue(id, 'codex');
    expect(
      (await h.request('POST', '/agents/subjects/sample/1/pause')).status,
    ).toBe(401);
    expect(
      (
        await h.request('POST', '/agents/subjects/sample/1/pause', {
          user: 'stranger',
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('GET', '/agents/subjects/sample/1', {
          user: 'stranger',
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('POST', `/agents/runs/${run.runId}/changeTool`, {
          user: 'stranger',
          body: { tool: 'bad' },
        })
      ).status,
    ).toBe(404);
    expect((await h.services.runs.subjectPause(subject)).pausedAt).toBeNull();
    expect(
      (
        await h.request('POST', '/agents/subjects/sample/1/pause', {
          user: 'manager',
          can: ['agents.agents/manage'],
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await h.request('GET', '/agents/subjects/sample/1', {
          user: 'owner',
          can: ['agents.agents/manage'],
        })
      ).body.data.pausedBy,
    ).toBe('manager');
  });

  it('carries a tool from a request through responsible confirmation without changing identity', async () => {
    const id = await agent();
    const asked = await enqueue(id, 'codex', {
      responsibleUserId: 'alice',
      requestedByUserId: 'bob',
    });
    if (asked.outcome !== 'pending')
      throw new Error('Expected a pending request.');
    expect((await h.services.runs.requests.get(asked.requestId)).tool).toBe(
      'codex',
    );
    const other = await enqueue(id, 'claude', {
      responsibleUserId: 'alice',
      requestedByUserId: 'bob',
    });
    expect(other).not.toMatchObject({ requestId: asked.requestId });
    expect(
      (
        await h.request(
          'POST',
          `/agents/runRequests/${asked.requestId}/confirm`,
          { user: 'manager', can: ['agents.agents/manage'] },
        )
      ).status,
    ).toBe(404);
    const confirmed = await h.request(
      'POST',
      `/agents/runRequests/${asked.requestId}/confirm`,
      { user: 'alice' },
    );
    expect(confirmed.status).toBe(200);
    const run = await h.services.runs.detail(confirmed.body.data.run.runId);
    expect(run).toMatchObject({
      tool: null,
      requestedTool: 'codex',
      actorUserId: 'alice',
      requestedByUserId: 'bob',
      confirmedByUserId: 'alice',
      inputs: [{ actor: { id: 'owner' } }],
    });
    const claude = await h.registerRunner();
    expect(await claim(h, claude)).toEqual([]);
    const codex = await h.registerRunner({ tools: [...BOTH] });
    expect((await claim(h, codex))[0].tool.kind).toBe('codex');
  });

  it('retains the tool on request reassignment and requires that tool when running as the requester', async () => {
    const id = await agent();
    const asked = await enqueue(id, 'codex', {
      responsibleUserId: 'alice',
      requestedByUserId: 'bob',
    });
    if (asked.outcome !== 'pending')
      throw new Error('Expected a pending request.');
    const reassigned = await h.services.runs.requests.reassign({
      subject,
      toUserId: 'charlie',
      byUserId: 'owner',
    });
    expect(reassigned.created[0]).toMatchObject({
      tool: 'codex',
      responsibleUserId: 'charlie',
    });
    const next = reassigned.created[0]!;
    await h.registerRunner();
    await expect(
      h.services.runs.requests.runAsRequester(next.id, 'bob'),
    ).rejects.toMatchObject({ code: 'NO_RUNNER_AVAILABLE' });
    const runner = await h.registerRunner({
      tools: [...BOTH],
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const mine = await h.services.runs.requests.runAsRequester(next.id, 'bob');
    expect(await h.services.runs.get(mine.run.runId)).toMatchObject({
      tool: null,
      requestedTool: 'codex',
      actorUserId: 'bob',
      confirmedByUserId: null,
    });
    expect((await claim(h, runner))[0].tool.kind).toBe('codex');
  });

  it('reports the selected model, allowed runtimes and slot usage without leaking private runtimes', async () => {
    const id = await agent();
    const mine = await h.registerRunner({
      name: 'Mine',
      ownerUserId: 'alice',
      trust: 'ownerOnly',
      tools: [...BOTH],
      slots: 3,
      toolSlots: { codex: 1 },
    });
    const hidden = await h.registerRunner({
      name: 'Hidden',
      ownerUserId: 'bob',
      trust: 'ownerOnly',
      tools: [...BOTH],
    });
    const team = await h.registerRunner({ name: 'Team', tools: [...BOTH] });
    await h.registerRunner({ name: 'Wrong tool' });
    const work = await enqueue(id, 'codex', { actorUserId: 'alice' });
    await claim(h, mine);
    const response = await h.request(
      'GET',
      `/agents/${id}/availability?tool=codex`,
      {
        user: 'alice',
      },
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      agentId: id,
      tool: 'codex',
      model: 'gpt-6',
      effort: 'xhigh',
      available: true,
      wait: { reason: 'next' },
    });
    expect(response.body.data.runners).toEqual([
      expect.objectContaining({
        id: mine.runnerId,
        name: 'Mine',
        slots: { used: 1, limit: 3 },
        toolSlots: { used: 1, limit: 1 },
      }),
      expect.objectContaining({
        id: team.runnerId,
        name: 'Team',
        slots: { used: 0, limit: 2 },
      }),
    ]);
    expect(JSON.stringify(response.body)).not.toContain(hidden.runnerId);
    expect((await h.services.runs.get(work.runId!)).runnerId).toBe(
      mine.runnerId,
    );
  });

  it('reports missing features and unavailable tools and checks invocation permission', async () => {
    const id = await agent();
    expect(
      (await h.request('GET', `/agents/${id}/availability?tool=codex`)).status,
    ).toBe(401);
    expect(
      (
        await h.request('GET', `/agents/${id}/availability?tool=codex`, {
          user: 'alice',
        })
      ).body.data.wait,
    ).toMatchObject({ reason: 'toolUnavailable', tool: 'codex' });
    await h.registerRunner({ tools: [...BOTH], features: [] });
    const missing = await h.request(
      'GET',
      `/agents/${id}/availability?tool=codex&requires=checkout`,
      { user: 'alice' },
    );
    expect(missing.body.data).toMatchObject({
      available: false,
      wait: { reason: 'missingFeatures', missing: ['checkout'] },
    });
    expect(
      (
        await h.request('GET', `/agents/${id}/availability?tool=pi`, {
          user: 'alice',
        })
      ).status,
    ).toBe(400);
    const privateAgent = await h.createAgent({
      access: 'ownerOnly',
      ownerUserId: 'bob',
    });
    expect(
      (
        await h.request(
          'GET',
          `/agents/${privateAgent}/availability?tool=bad`,
          {
            user: 'alice',
          },
        )
      ).status,
    ).toBe(404);
  });

  it('returns toolSlotsFull for the selected tool even when another tool has room', async () => {
    const id = await agent();
    const runner = await h.registerRunner({
      tools: [...BOTH],
      slots: 3,
      toolSlots: { codex: 1, claude: 2 },
    });
    await enqueue(id, 'codex', { actorUserId: 'alice' });
    await claim(h, runner);
    const codex = await h.request(
      'GET',
      `/agents/${id}/availability?tool=codex`,
      {
        user: 'alice',
      },
    );
    expect(codex.body.data).toMatchObject({
      available: false,
      wait: {
        reason: 'toolSlotsFull',
        tool: 'codex',
        params: { tool: 'codex', used: 1, limit: 1 },
      },
    });
    expect(
      (
        await h.request('GET', `/agents/${id}/availability?tool=claude`, {
          user: 'alice',
        })
      ).body.data.available,
    ).toBe(true);
  });

  it('reuses secret eligibility reasons and never returns variable values', async () => {
    const id = await agent();
    await h.services.variables.set(
      { scope: 'agent', scopeId: id },
      'TEAM_ONLY',
      'synthetic-fixture-value',
      'owner',
      { teamRunnersOnly: true },
    );
    await h.registerRunner({
      tools: [...BOTH],
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const personal = await h.request(
      'GET',
      `/agents/${id}/availability?tool=codex`,
      {
        user: 'alice',
      },
    );
    expect(personal.body.data).toMatchObject({
      available: false,
      runners: [],
      wait: {
        reason: 'secretsNotAllowed',
        variables: [{ scope: 'agent', scopeId: id, name: 'TEAM_ONLY' }],
      },
    });
    expect(JSON.stringify(personal.body)).not.toContain(
      'synthetic-fixture-value',
    );
    const team = await h.registerRunner({ tools: [...BOTH] });
    const usable = await h.request(
      'GET',
      `/agents/${id}/availability?tool=codex`,
      {
        user: 'alice',
      },
    );
    expect(usable.body.data).toMatchObject({
      available: true,
      runners: [{ id: team.runnerId }],
    });
  });

  it('also pauses online claims and protects private subjects from unrelated managers', async () => {
    h = await createHarness();
    const model = await h.services.online.services.create({
      title: 'Mock',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:9/v1',
      models: [{ value: 'm1', label: 'Mock' }],
    });
    const id = await h.createAgent({
      type: 'online',
      modelEntries: [{ modelService: model.name, model: 'm1' }],
    });
    await expect(enqueue(id, 'codex')).rejects.toMatchObject({
      reason: 'TOOL_NOT_LISTED',
    });
    const conversation = await h.services.conversations.create('owner', {
      agentId: id,
    });
    const sent = await h.services.conversations.send('owner', conversation.id, {
      content: 'Hello',
    });
    const target = { kind: 'conversation', id: conversation.id };
    await h.services.runs.pauseSubject(target, 'owner');
    const holder = { id: 'server:test' };
    expect(await h.services.claims.claimServer(holder, 1)).toEqual([]);
    expect(
      (await h.services.runs.workload({ subjectKind: 'conversation' })).runs[0]
        ?.wait?.reason,
    ).toBe('paused');
    expect(
      (
        await h.request(
          'POST',
          `/agents/subjects/conversation/${conversation.id}/resume`,
          { user: 'manager', can: ['agents.agents/manage'] },
        )
      ).status,
    ).toBe(404);
    await h.services.runs.resumeSubject(target, 'owner');
    expect(
      (await h.services.claims.claimServer(holder, 1)).map((run) => run.runId),
    ).toEqual([sent.run!.id]);
  });
  it('appends an unpinned input to pinned held work and matches explicit input against the actual tool', async () => {
    const id = await agent();
    const pinned = await enqueue(id, 'codex');
    const runner = await h.registerRunner({ tools: [...BOTH], slots: 4 });
    await claim(h, runner);
    expect(await enqueue(id)).toMatchObject({
      outcome: 'appended',
      runId: pinned.runId,
    });
    expect(await enqueue(id, 'claude')).toMatchObject({ outcome: 'created' });
    const legacy = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '2' },
    });
    await claim(h, runner);
    expect(
      await enqueue(id, 'claude', { subject: { kind: 'sample', id: '2' } }),
    ).toMatchObject({ outcome: 'appended', runId: legacy.runId });
  });

  it('merges a changed tool into the same actor’s waiting run and keeps urgency and inputs', async () => {
    const id = await agent();
    const target = await enqueue(id, 'claude', {
      priority: 8,
      fireAt: new Date(h.clock.now().getTime() + 60000),
    });
    const source = await enqueue(id, 'codex', {
      priority: 2,
      fireAt: new Date(h.clock.now().getTime() + 10000),
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Second input',
      },
    });
    const events: AgentsEvent[] = [];
    h.services.events.onAny((event) => events.push(event));
    const ended = await h.services.runs.changeTool(
      source.runId!,
      'claude',
      'owner',
    );
    expect(ended).toMatchObject({
      status: 'cancelled',
      failureReason: 'toolChanged',
      failureDetail: `Merged into run ${target.runId}.`,
    });
    const detail = await h.services.runs.detail(target.runId!);
    expect(detail.priority).toBe(2);
    expect(detail.availableAt).toBe(
      new Date(h.clock.now().getTime() + 10000).toISOString(),
    );
    expect(detail.inputs.map((input) => input.text)).toEqual([
      'Please work.',
      'Second input',
    ]);
    expect((await h.services.runs.detail(source.runId!)).inputs).toEqual([]);
    expect(
      events
        .filter((event) => event.type === 'run.changed')
        .map((event) => event.runId),
    ).toEqual([source.runId, target.runId]);
  });

  it('does not merge changed tools across execution identities and also merges when clearing the pin', async () => {
    const id = await agent();
    const foreign = await enqueue(id, 'claude', { actorUserId: 'other' });
    const source = await enqueue(id, 'codex');
    expect(
      await h.services.runs.changeTool(source.runId!, 'claude', 'owner'),
    ).toMatchObject({
      status: 'queued',
      actorUserId: 'owner',
      requestedTool: 'claude',
    });
    expect((await h.services.runs.detail(foreign.runId!)).inputs).toHaveLength(
      1,
    );
    const unpinned = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '2' },
    });
    const pinned = await enqueue(id, 'codex', {
      subject: { kind: 'sample', id: '2' },
    });
    expect(
      await h.services.runs.changeTool(pinned.runId!, null, 'owner'),
    ).toMatchObject({
      status: 'cancelled',
      failureReason: 'toolChanged',
      failureDetail: `Merged into run ${unpinned.runId}.`,
    });
    expect((await h.services.runs.detail(unpinned.runId!)).inputs).toHaveLength(
      2,
    );
  });

  it('keeps both runs’ required features when a tool change merges them', async () => {
    const id = await agent();
    const target = await enqueue(id, 'claude');
    const source = await enqueue(id, 'codex', { requires: ['checkout'] });
    await h.services.runs.changeTool(source.runId!, 'claude', 'owner');
    const unpinned = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '2' },
    });
    const pinned = await enqueue(id, 'codex', {
      subject: { kind: 'sample', id: '2' },
      requires: ['checkout'],
    });
    await h.services.runs.changeTool(pinned.runId!, null, 'owner');
    for (const runId of [target.runId!, unpinned.runId!])
      expect((await h.services.runs.get(runId)).requires).toEqual(['checkout']);
    const bare = await h.registerRunner({ tools: [...BOTH], features: [] });
    expect(await claim(h, bare, 4)).toHaveLength(0);
    const able = await h.registerRunner({
      tools: [...BOTH],
      features: ['checkout'],
      slots: 4,
    });
    expect((await claim(h, able, 4)).map((payload) => payload.run.id).sort()).toEqual(
      [target.runId!, unpinned.runId!].sort(),
    );
  });

  it('claims unrelated work however many subjects are paused', async () => {
    const id = await agent();
    const now = h.clock.now().toISOString();
    await h.services.tx.run(async ({ conn }) => {
      for (let i = 0; i < 1000; i++) {
        const subjectId = `paused-${i}`;
        await conn.repository('agSubjectControls').createOne({
          values: {
            id: JSON.stringify(['sample', subjectId]),
            subjectKind: 'sample',
            subjectId,
            pausedByUserId: 'owner',
            pausedAt: now,
            lockAt: now,
          },
        });
      }
    });
    // More paused work than one page of candidates, all ahead of the unrelated run in claim order.
    for (let i = 0; i < 60; i++)
      await enqueue(id, undefined, {
        subject: { kind: 'sample', id: `paused-${i}` },
      });
    const active = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: 'active' },
    });
    const runner = await h.registerRunner({ tools: [...BOTH] });
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual([
      active.runId,
    ]);
    const { runs } = await h.services.runs.workload({
      subjectKind: 'sample',
      limit: 100,
    });
    expect(
      runs.find((run) => run.subject.id === 'paused-0')?.wait,
    ).toMatchObject({ reason: 'paused' });
  });

  it('keeps the requested tool through the public run schema', async () => {
    const id = await agent();
    const queued = await enqueue(id, 'codex');
    expect(
      RunSchema.parse(await h.services.runs.get(queued.runId!)).requestedTool,
    ).toBe('codex');
  });

  it('does not expire paused work and restarts the expiry window on resume', async () => {
    const id = await agent();
    h.services.subjects.register({
      ...h.services.subjects.get('sample')!,
      kind: 'expiring',
      queuedExpiryMs: 1000,
    });
    const subject = { kind: 'expiring', id: '1' };
    const run = await enqueue(id, 'codex', { subject });
    await h.services.runs.pauseSubject(subject, 'owner');
    h.clock.advance(10000);
    await h.sweep();
    expect((await h.services.runs.get(run.runId!)).status).toBe('queued');
    await h.services.runs.resumeSubject(subject, 'owner');
    expect((await h.services.runs.get(run.runId!)).updatedAt).toBe(
      h.clock.now().toISOString(),
    );
    await h.sweep();
    expect((await h.services.runs.get(run.runId!)).status).toBe('queued');
    const runner = await h.registerRunner({ tools: [...BOTH] });
    expect((await claim(h, runner))[0].run.id).toBe(run.runId);
    const next = await enqueue(id, 'codex', {
      subject: { kind: 'expiring', id: '2' },
    });
    await h.services.runs.pauseSubject({ kind: 'expiring', id: '2' }, 'owner');
    h.clock.advance(10000);
    await h.services.runs.resumeSubject({ kind: 'expiring', id: '2' }, 'owner');
    h.clock.advance(1001);
    await h.sweep();
    expect(await h.services.runs.get(next.runId!)).toMatchObject({
      status: 'failed',
      failureReason: 'queuedExpired',
    });
  });

  it('uses the responsible or global manage defaults, and lets canControl override both', async () => {
    await agent();
    h.services.subjects.register({
      ...h.services.subjects.get('sample')!,
      kind: 'owned',
      responsibleUserId: async () => 'alice',
    });
    for (const action of ['', '/pause', '/resume']) {
      const method = action ? 'POST' : 'GET';
      expect(
        (
          await h.request(method, `/agents/subjects/owned/1${action}`, {
            user: 'alice',
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await h.request(method, `/agents/subjects/owned/1${action}`, {
            user: 'manager',
            can: ['agents.agents/manage'],
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await h.request(method, `/agents/subjects/owned/1${action}`, {
            user: 'reader',
            can: ['agents.agents/read'],
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await h.request(method, `/agents/subjects/owned/1${action}`, {
            user: 'stranger',
          })
        ).status,
      ).toBe(404);
    }
    h.services.subjects.register({
      ...h.services.subjects.get('sample')!,
      kind: 'controlled',
      responsibleUserId: async () => 'alice',
      canControl: async (_id, user) =>
        user === 'delegate' ? 'allow' : user === 'hidden' ? 'hidden' : 'deny',
    });
    for (const action of ['', '/pause', '/resume']) {
      const method = action ? 'POST' : 'GET';
      expect(
        (
          await h.request(method, `/agents/subjects/controlled/1${action}`, {
            user: 'delegate',
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await h.request(method, `/agents/subjects/controlled/1${action}`, {
            user: 'alice',
            can: ['agents.agents/manage'],
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await h.request(method, `/agents/subjects/controlled/1${action}`, {
            user: 'hidden',
            can: ['agents.agents/manage'],
          })
        ).status,
      ).toBe(404);
    }
  });

  it('keeps a pin when reassignment queues the new responsible’s own request', async () => {
    const id = await agent();
    const asked = await enqueue(id, 'codex', {
      responsibleUserId: 'alice',
      requestedByUserId: 'bob',
    });
    expect(asked.outcome).toBe('pending');
    const result = await h.services.runs.requests.reassign({
      subject,
      toUserId: 'bob',
      byUserId: 'alice',
    });
    expect(await h.services.runs.get(result.queued[0].runId)).toMatchObject({
      requestedTool: 'codex',
      actorUserId: 'bob',
      requestedByUserId: 'bob',
      confirmedByUserId: null,
    });
  });

  it('waits when the pinned entry is removed instead of falling back', async () => {
    const id = await agent();
    const run = await enqueue(id, 'codex');
    const current = await h.services.agents.get(id);
    await h.services.agents.update(id, 'owner', {
      modelEntries: [{ tool: 'claude', model: 'opus' }],
      expectedRevision: current.revision,
    });
    const runner = await h.registerRunner({ tools: [...BOTH] });
    expect(await claim(h, runner)).toEqual([]);
    expect((await waits()).get(run.runId!)).toMatchObject({
      reason: 'toolUnavailable',
      tool: 'codex',
    });
  });
  it('rechecks pause after a candidate was selected and before its claim commits', async () => {
    const id = await agent();
    const queued = await enqueue(id, 'codex');
    const runner = await h.registerRunner({ tools: [...BOTH] });
    const remove = h.services.briefs.sections.register({
      key: 'pause-before-claim',
      prepare: async (run) => {
        await h.services.runs.pauseSubject(run.subject, 'owner');
        return null;
      },
      section: async () => null,
    });
    expect(await claim(h, runner)).toEqual([]);
    expect(await h.services.runs.get(queued.runId!)).toMatchObject({
      status: 'queued',
    });
    remove();
    await h.services.runs.resumeSubject(subject, 'owner');
    expect((await claim(h, runner))[0].run.id).toBe(queued.runId);
  });

  it('uses a tool changed after candidate selection instead of the stale choice', async () => {
    const id = await agent();
    const queued = await enqueue(id, 'codex');
    const runner = await h.registerRunner({ tools: [...BOTH] });
    const remove = h.services.briefs.sections.register({
      key: 'change-before-claim',
      prepare: async (run) => {
        await h.services.runs.changeTool(run.id, 'claude', 'owner');
        return null;
      },
      section: async () => null,
    });
    const [taken] = await claim(h, runner);
    remove();
    expect(taken.tool.kind).toBe('claude');
    expect(await h.services.runs.get(queued.runId!)).toMatchObject({
      requestedTool: 'claude',
      tool: 'claude',
    });
  });

  it('preserves pins on automatic requeue and lets previously claimed unpinned work fall back', async () => {
    const id = await agent();
    const pinned = await enqueue(id, 'codex');
    const unpinned = await enqueue(id, undefined, {
      subject: { kind: 'sample', id: '2' },
    });
    const first = await h.registerRunner({ tools: [...BOTH], slots: 4 });
    expect((await claim(h, first, 4)).map((run) => run.tool.kind)).toEqual([
      'codex',
      'claude',
    ]);
    h.clock.advance(180000);
    await h.sweep();
    expect(await h.services.runs.get(pinned.runId!)).toMatchObject({
      status: 'queued',
      requestedTool: 'codex',
    });
    expect(await h.services.runs.get(unpinned.runId!)).toMatchObject({
      status: 'queued',
      requestedTool: null,
      tool: 'claude',
    });
    h.clock.advance(180000);
    const codex = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
      slots: 4,
    });
    expect((await claim(h, codex, 4)).map((run) => run.tool.kind)).toEqual([
      'codex',
      'codex',
    ]);
  });
});
