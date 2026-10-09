import { afterEach, describe, expect, it } from 'vitest';

import type { Agent } from '../shared/agents.js';
import type { Runner } from '../shared/runners.js';
import { explainWait } from '../server/core/runs/workload.js';
import { claim, createHarness, type Harness } from './harness.js';

const byId = async (h: Harness) =>
  new Map(
    (await h.services.runs.workload({ subjectKind: 'sample' })).runs.map(
      (run) => [run.id, run],
    ),
  );

describe('the workload', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('explains why each queued run waits and what the held ones do', async () => {
    h = await createHarness();
    const coder = await h.createAgent({ maxConcurrentRuns: 1 });
    const first = await h.enqueue(coder, '1', { text: 'One.' });
    const second = await h.enqueue(coder, '2', { text: 'Two.' });

    // Nobody online: both wait for a runner, in claim order.
    let runs = await byId(h);
    expect(runs.get(first)?.wait).toMatchObject({
      reason: 'noRunnerOnline',
      position: 1,
      agentPosition: 1,
    });
    expect(runs.get(second)?.wait).toMatchObject({
      reason: 'noRunnerOnline',
      position: 2,
      agentPosition: 2,
    });

    // A runner with only Codex signed in cannot take Claude's work.
    await h.registerRunner({
      name: 'codex-box',
      tools: [
        { kind: 'claude', authenticated: false },
        { kind: 'codex', authenticated: true },
      ],
    });
    runs = await byId(h);
    expect(runs.get(first)?.wait).toMatchObject({
      reason: 'toolUnavailable',
      tool: 'claude',
    });

    // One that can: the first run is taken, the second waits for the agent's only slot.
    const runner = await h.registerRunner({ name: 'mac', slots: 4 });
    runs = await byId(h);
    expect(runs.get(first)?.wait?.reason).toBe('next');
    await claim(h, runner);
    const started = await h.request(
      'POST',
      `/agents/runners/runs/${first}/start`,
      {
        runnerKey: runner.key,
        body: {
          workDir: '/w',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        },
      },
    );
    expect(started.status).toBe(200);
    await h.request('POST', `/agents/runners/runs/${first}/events`, {
      runnerKey: runner.key,
      body: {
        events: [
          {
            seq: 1,
            at: new Date().toISOString(),
            type: 'text',
            content: 'Reading   the code\nnow.',
          },
        ],
      },
    });
    const workload = await h.services.runs.workload({ subjectKind: 'sample' });
    expect(workload.runs.map((run) => run.id)).toEqual([first, second]);
    const held = workload.runs[0]!;
    expect(held).toMatchObject({
      status: 'running',
      runnerName: 'mac',
      wait: null,
    });
    expect(held.lastActivity).toMatchObject({
      type: 'text',
      text: 'Reading the code now.',
    });
    expect(workload.runs[1]?.wait).toMatchObject({
      reason: 'concurrencyFull',
      position: 1,
    });
    expect(workload.runners).toEqual({
      online: 2,
      busy: 1,
      slots: 6,
      used: 1,
    });
    expect(workload.agents).toEqual([
      {
        agentId: coder,
        active: 1,
        queued: 1,
        maxConcurrentRuns: 1,
        online: true,
      },
    ]);
  });

  it('tells a delayed run by when it may start', async () => {
    h = await createHarness();
    const coder = await h.createAgent();
    const at = new Date(h.clock.now().getTime() + 60 * 60_000);
    const { runId } = await h.services.runs.enqueue({
      agentId: coder,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      fireAt: at,
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Later.',
        payload: { trigger: 'scheduled' },
      },
    });
    const run = (await byId(h)).get(runId);
    expect(run?.trigger).toBe('scheduled');
    expect(run?.wait).toMatchObject({
      reason: 'delayed',
      position: null,
      until: at.toISOString(),
    });
  });
});

describe('explainWait', () => {
  const agent = {
    id: 'a1',
    modelEntries: [{ tool: 'claude', model: null }],
    runnerIds: [],
    maxConcurrentRuns: 2,
    archivedAt: null,
  } as unknown as Agent;
  const runner = (patch: Partial<Runner> = {}): Runner =>
    ({
      id: 'r1',
      name: 'r1',
      status: 'online',
      trust: 'team',
      ownerUserId: 'owner',
      slots: 2,
      features: ['checkout'],
      tools: [{ kind: 'claude', authenticated: true }],
      enabledTools: null,
      toolSlots: null,
      toolLoad: null,
      ...patch,
    }) as Runner;
  const run = {
    actorUserId: 'bob',
    availableAt: null,
    claimFailures: 0,
    failureDetail: null,
    requires: [],
  } as const;
  const context = {
    now: new Date('2026-10-02T10:00:00Z'),
    agent,
    runners: [runner()],
    runnerUsed: new Map<string, number>(),
    agentActive: 0,
    sameWorkActive: false,
  };

  it('follows the claim rules in order', () => {
    expect(explainWait(run, { ...context, agent: null }).reason).toBe(
      'agentArchived',
    );
    expect(
      explainWait(
        { ...run, availableAt: '2026-10-02T11:00:00Z' },
        { ...context, runners: [] },
      ),
    ).toMatchObject({ reason: 'delayed', until: '2026-10-02T11:00:00.000Z' });
    expect(explainWait(run, { ...context, runners: [] }).reason).toBe(
      'noRunnerOnline',
    );
    expect(
      explainWait(run, { ...context, agent: { ...agent, runnerIds: ['r9'] } })
        .reason,
    ).toBe('runnersOffline');
    expect(
      explainWait(run, {
        ...context,
        runners: [runner({ enabledTools: ['codex'] })],
      }),
    ).toMatchObject({ reason: 'toolUnavailable', tool: 'claude' });
    expect(
      explainWait(run, {
        ...context,
        runners: [runner({ trust: 'ownerOnly' })],
      }).reason,
    ).toBe('noSharedRunner');
    expect(
      explainWait({ ...run, requires: ['checkout', 'secrets'] }, context),
    ).toMatchObject({ reason: 'missingFeatures', missing: ['secrets'] });
    expect(explainWait(run, { ...context, sameWorkActive: true }).reason).toBe(
      'sameWorkActive',
    );
    expect(explainWait(run, { ...context, agentActive: 2 }).reason).toBe(
      'concurrencyFull',
    );
    expect(
      explainWait(run, { ...context, runnerUsed: new Map([['r1', 2]]) }).reason,
    ).toBe('runnersBusy');
    expect(
      explainWait(run, {
        ...context,
        runners: [runner({ toolSlots: { claude: 1 } })],
        runnerUsed: new Map([['r1', 1]]),
        runnerToolUsed: new Map([['r1', { claude: 1 }]]),
      }),
    ).toMatchObject({ reason: 'toolSlotsFull', tool: 'claude' });
    // Full by what the runner reported across its applications, though it runs nothing of this one's.
    expect(
      explainWait(run, {
        ...context,
        runners: [runner({ toolLoad: { claude: { slots: 2, free: 0 } } })],
      }).reason,
    ).toBe('toolSlotsFull');
    // A runner built without the fields for limits per tool has none.
    const { toolSlots: _toolSlots, toolLoad: _toolLoad, ...older } = runner();
    expect(
      explainWait(run, { ...context, runners: [older as Runner] }).reason,
    ).toBe('next');
    // A full machine reads as the machine's slots, whatever its tools say.
    expect(
      explainWait(run, {
        ...context,
        runners: [runner({ toolSlots: { claude: 1 } })],
        runnerUsed: new Map([['r1', 2]]),
        runnerToolUsed: new Map([['r1', { claude: 1 }]]),
      }).reason,
    ).toBe('runnersBusy');
    // Another of the agent's tools still has room.
    expect(
      explainWait(run, {
        ...context,
        agent: {
          ...agent,
          modelEntries: [
            { tool: 'claude', model: null },
            { tool: 'codex', model: null },
          ],
        } as unknown as Agent,
        runners: [
          runner({
            toolSlots: { claude: 1 },
            tools: [
              { kind: 'claude', authenticated: true },
              { kind: 'codex', authenticated: true },
            ],
          }),
        ],
        runnerUsed: new Map([['r1', 1]]),
        runnerToolUsed: new Map([['r1', { claude: 1 }]]),
      }).reason,
    ).toBe('next');
    expect(
      explainWait(
        { ...run, claimFailures: 1, failureDetail: 'No repo.' },
        context,
      ),
    ).toMatchObject({ reason: 'setupRetrying', detail: 'No repo.' });
    expect(explainWait(run, context).reason).toBe('next');
  });
});
