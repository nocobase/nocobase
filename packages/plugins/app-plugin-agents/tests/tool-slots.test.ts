import { PROTOCOL_VERSION, RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { api, claim, createHarness, type Harness } from './harness.js';

const BOTH = [
  { kind: 'claude', authenticated: true },
  { kind: 'codex', authenticated: true },
] as const;

describe('limits per coding tool', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const waits = async () =>
    new Map(
      (await h.services.runs.workload({ subjectKind: 'sample' })).runs.map(
        (run) => [run.id, run.wait],
      ),
    );

  it('runs two Claude runs of three and takes a Codex run behind them at once', async () => {
    h = await createHarness();
    const claude = await h.createAgent({ maxConcurrentRuns: 5 });
    const codex = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    const first = await h.enqueue(claude, '1');
    const second = await h.enqueue(claude, '2');
    const third = await h.enqueue(claude, '3');
    const runner = await h.registerRunner({
      tools: [...BOTH],
      slots: 3,
      toolSlots: { claude: 2, codex: 1 },
    });
    expect(await h.services.runners.get(runner.runnerId)).toMatchObject({
      slots: 3,
      toolSlots: { claude: 2, codex: 1 },
    });

    const taken = await claim(h, runner, 3);
    expect(taken.map((payload) => payload.run.id)).toEqual([first, second]);
    expect((await waits()).get(third)).toMatchObject({
      reason: 'toolSlotsFull',
      tool: 'claude',
    });

    // The machine has a slot left, and Codex has room: the Codex run is taken past the waiting Claude run.
    const later = await h.enqueue(codex, '4');
    const next = await claim(h, runner, 1);
    expect(next.map((payload) => payload.run.id)).toEqual([later]);
    expect(next[0].tool.kind).toBe('codex');

    // Now the machine is full.
    expect((await waits()).get(third)?.reason).toBe('runnersBusy');

    // The runs show on the runner by tool.
    const listed = await h.request('GET', '/agents/runners', { user: 'owner' });
    expect(
      (listed.body.data as { id: string; activeByTool: unknown }[]).find(
        (item) => item.id === runner.runnerId,
      )?.activeByTool,
    ).toEqual({ claude: 2, codex: 1 });
  });

  it('takes no run of a tool the runner says it has no room for', async () => {
    h = await createHarness();
    const claude = await h.createAgent();
    const codex = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    await h.enqueue(claude, '1');
    const codexRun = await h.enqueue(codex, '2');
    const runner = await h.registerRunner({ tools: [...BOTH], slots: 3 });
    // Its Claude slots are taken by another application's runs.
    const taken = await claim(h, runner, 3, { claude: 0 });
    expect(taken.map((payload) => payload.run.id)).toEqual([codexRun]);
  });

  it('counts down what the runner says it has room for within one claim', async () => {
    h = await createHarness();
    const claude = await h.createAgent({ maxConcurrentRuns: 5 });
    await h.enqueue(claude, '1');
    await h.enqueue(claude, '2');
    const runner = await h.registerRunner({ slots: 3 });
    expect(await claim(h, runner, 3, { claude: 1 })).toHaveLength(1);
  });

  it("runs with the agent's next tool while its first is full", async () => {
    h = await createHarness();
    const either = await h.createAgent({
      maxConcurrentRuns: 5,
      modelEntries: [
        { tool: 'claude', model: 'claude-requested', effort: 'high' },
        { tool: 'codex', model: 'codex-requested', effort: 'medium' },
      ],
    });
    await h.enqueue(either, '1');
    await h.enqueue(either, '2');
    const runner = await h.registerRunner({
      tools: BOTH.map((tool) => ({ ...tool, version: `${tool.kind}-version` })),
      slots: 2,
      toolSlots: { claude: 1 },
    });
    const taken = await claim(h, runner, 2);
    expect(taken.map((payload) => payload.tool.kind)).toEqual([
      'claude',
      'codex',
    ]);
    const runs = await Promise.all(
      taken.map((payload) => h.services.runs.get(payload.run.id)),
    );
    expect(runs.map((run) => run.executions)).toMatchObject([
      [
        {
          attempt: 1,
          runnerId: runner.runnerId,
          tool: 'claude',
          toolVersion: 'claude-version',
          model: 'claude-requested',
          effort: 'high',
          actualModels: [],
        },
      ],
      [
        {
          attempt: 1,
          runnerId: runner.runnerId,
          tool: 'codex',
          toolVersion: 'codex-version',
          model: 'codex-requested',
          effort: 'medium',
          actualModels: [],
        },
      ],
    ]);
  });

  it('keeps limits per tool on tokens and changes them on the runner', async () => {
    h = await createHarness();
    const token = await h.request(
      'POST',
      '/agents/runners/registrationTokens',
      {
        user: 'owner',
        body: { slots: 2, toolSlots: { codex: 1 } },
      },
    );
    expect(token.status).toBe(201);
    expect(token.body.data.toolSlots).toEqual({ codex: 1 });
    // A runner that names no limits of its own takes the token's.
    const registered = await h.request('POST', api(RUNNER_ROUTES.register), {
      body: {
        registrationToken: token.body.data.token,
        name: 'from-token',
        hostname: 'host',
        os: 'linux',
        arch: 'x64',
        version: '0.0.1',
        protocolVersion: PROTOCOL_VERSION,
        features: [],
        tools: [...BOTH],
      },
    });
    expect(registered.body.data).toMatchObject({
      slots: 2,
      toolSlots: { codex: 1 },
    });

    const runner = await h.registerRunner({ slots: 2 });
    const patched = await h.request(
      'PATCH',
      `/agents/runners/${runner.runnerId}`,
      { user: 'owner', body: { toolSlots: { claude: 1 } } },
    );
    expect(patched.status).toBe(200);
    expect(patched.body.data.toolSlots).toEqual({ claude: 1 });
    const cleared = await h.request(
      'PATCH',
      `/agents/runners/${runner.runnerId}`,
      { user: 'owner', body: { toolSlots: null } },
    );
    expect(cleared.body.data.toolSlots).toBeNull();
    const invalid = await h.request(
      'PATCH',
      `/agents/runners/${runner.runnerId}`,
      { user: 'owner', body: { toolSlots: { claude: 0 } } },
    );
    expect(invalid.status).toBe(400);
  });
});
