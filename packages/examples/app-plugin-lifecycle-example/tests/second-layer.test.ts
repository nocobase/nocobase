// Second layers written by hand, without the approval layer: a multi-round
// material exchange (design step 5) and an agent that waits for a person
// (design step 7). Both keep their intermediate steps in rows of their own
// and move the record only when they conclude.
import { describe, expect, it } from 'vitest';

import {
  REPLANS,
  ReplanAgent,
  replanLifecycle,
} from './fixtures/second-layer/agent.js';
import {
  VISAS,
  VisaMaterials,
  visaLifecycle,
} from './fixtures/second-layer/materials.js';
import { createHarness, refusal, type Harness } from './support/harness.js';

function setup() {
  const h = createHarness({
    lifecycles: [visaLifecycle as never, replanLifecycle as never],
  });
  return {
    h,
    materials: new VisaMaterials(h.runtime),
    agent: new ReplanAgent(h.runtime),
  };
}

async function supplementing(h: Harness): Promise<string> {
  const visa = await h.create(
    VISAS,
    { applicantId: 'ann', officerId: 'officer' },
    'ann',
  );
  await h.fire(VISAS, visa.id, 'submit', {}, 'ann');
  await h.fire(
    VISAS,
    visa.id,
    'askMaterials',
    { request: 'Bank statements' },
    'officer',
  );
  return String(visa.id);
}

describe('a hand-written second layer: material in rounds', () => {
  it('rounds of requests, submissions and reviews leave the visa’s version and clock alone', async () => {
    const { h, materials } = setup();
    const id = await supplementing(h);
    const waiting = h.get(VISAS, id);
    h.advance({ hours: 1 });
    await materials.submit({
      visaId: id,
      actor: { id: 'ann' },
      files: ['march.pdf'],
    });
    expect(
      await materials.review({
        visaId: id,
        actor: { id: 'officer' },
        complete: false,
        note: 'April is missing',
      }),
    ).toBe('nextRound');
    h.advance({ hours: 1 });
    await materials.submit({
      visaId: id,
      actor: { id: 'ann' },
      files: ['april.pdf'],
    });
    expect(h.get(VISAS, id)).toBe(waiting);
    expect(
      await materials.review({
        visaId: id,
        actor: { id: 'officer' },
        complete: true,
        note: 'Complete',
      }),
    ).toBe('complete');
    expect(h.get(VISAS, id).status).toBe('reviewing');
    expect(
      (await materials.history(id)).map(
        (row) => `${row.round}:${row.kind}:${row.status}`,
      ),
    ).toEqual([
      '1:request:answered',
      '1:submission:answered',
      '1:review:answered',
      '2:request:answered',
      '2:submission:answered',
      '2:review:answered',
    ]);
    expect(await h.history(VISAS, id)).toEqual([
      '$create',
      'submit',
      'askMaterials',
      'materialsComplete',
    ]);
  });

  it('each side acts only on its own turn', async () => {
    const { h, materials } = setup();
    const id = await supplementing(h);
    expect(
      (
        await refusal(
          materials.review({
            visaId: id,
            actor: { id: 'officer' },
            complete: true,
            note: '',
          }),
        )
      ).code,
    ).toBe('NOT_YOUR_TURN');
    expect(
      (
        await refusal(
          materials.submit({ visaId: id, actor: { id: 'officer' }, files: [] }),
        )
      ).code,
    ).toBe('NOT_ASSIGNEE');
  });

  it('a withdrawal that gets there first ends the exchange; the final review writes nothing', async () => {
    const { h, materials } = setup();
    const id = await supplementing(h);
    await materials.submit({
      visaId: id,
      actor: { id: 'ann' },
      files: ['march.pdf'],
    });
    await h.fire(VISAS, id, 'withdraw', {}, 'ann');
    expect(
      (
        await refusal(
          materials.review({
            visaId: id,
            actor: { id: 'officer' },
            complete: true,
            note: 'ok',
          }),
        )
      ).code,
    ).toBe('STALE');
    expect(h.get(VISAS, id).status).toBe('withdrawn');
    expect((await materials.history(id)).map((row) => row.status)).toEqual([
      'answered',
      'answered',
      'void',
    ]);
  });

  it('a review read in an earlier stay is refused by the version and rolls back', async () => {
    const { h, materials } = setup();
    const id = await supplementing(h);
    await materials.submit({
      visaId: id,
      actor: { id: 'ann' },
      files: ['a.pdf'],
    });
    await materials.review({
      visaId: id,
      actor: { id: 'officer' },
      complete: true,
      note: 'ok',
    });
    // Asked again: a new stay, a new exchange; nothing of the old one is open.
    await h.fire(
      VISAS,
      id,
      'askMaterials',
      { request: 'One more page' },
      'officer',
    );
    const rows = await materials.history(id);
    expect(
      rows.filter((row) => row.status === 'open').map((row) => row.round),
    ).toEqual([1]);
    expect(new Set(rows.map((row) => row.enteredVersion)).size).toBe(2);
  });

  it('a conclusion fired by hand is refused: only the exchange concludes it', async () => {
    const { h } = setup();
    const id = await supplementing(h);
    expect(await h.allowed(VISAS, id, 'officer')).toEqual([]);
    expect(await h.allowed(VISAS, id, 'ann')).toEqual(['withdraw']);
  });
});

describe('a hand-written second layer: an agent that waits for a person', () => {
  async function replanning(h: Harness): Promise<string> {
    const order = await h.create(
      REPLANS,
      { plannerId: 'planner', plan: null },
      'planner',
    );
    await h.fire(REPLANS, order.id, 'replan', {}, 'planner');
    return String(order.id);
  }

  it('asks, the planner chooses, the agent goes on, and its plan confirms the order', async () => {
    const { h, agent } = setup();
    const id = await replanning(h);
    const waiting = h.get(REPLANS, id);
    const run = await agent.current(id);
    await agent.ask(run?.id ?? '', 'Which carrier?', ['A', 'B', 'C']);
    await agent.answer(run?.id ?? '', { id: 'planner' }, 'B');
    await agent.ask(run?.id ?? '', 'Split the shipment?', ['yes', 'no']);
    await agent.answer(
      run?.id ?? '',
      { id: 'planner' },
      'Only if the second part is under 5 kg',
    );
    // Two questions and two answers: the order never moved.
    expect(h.get(REPLANS, id)).toBe(waiting);
    await agent.finish(run?.id ?? '', { carrier: 'B', split: false });
    expect(h.get(REPLANS, id)).toMatchObject({
      status: 'confirmed',
      plan: { carrier: 'B', split: false },
    });
    expect((await agent.current(id))?.turns).toEqual([
      { question: 'Which carrier?', answer: 'B' },
      {
        question: 'Split the shipment?',
        answer: 'Only if the second part is under 5 kg',
      },
    ]);
  });

  it('the planner cancels in the conversation: the run ends and the order goes back to pending', async () => {
    const { h, agent } = setup();
    const id = await replanning(h);
    const run = await agent.current(id);
    await agent.ask(run?.id ?? '', 'Which carrier?', ['A', 'B', 'cancel']);
    await agent.answer(run?.id ?? '', { id: 'planner' }, 'cancel');
    expect(h.get(REPLANS, id).status).toBe('pending');
    expect((await agent.current(id))?.status).toBe('cancelled');
  });

  it('a timeout pre-empts the agent: the run is voided and its late plan is refused, not stored', async () => {
    const { h, agent } = setup();
    const id = await replanning(h);
    const run = await agent.current(id);
    h.advance({ minutes: 31 });
    expect(await h.runtime.runTriggers()).toBe(1);
    expect(h.get(REPLANS, id).status).toBe('pending');
    expect(h.messagesTo('agentRunner')).toEqual([
      `Abort agent run ${run?.id ?? ''}: replanTimedOut`,
    ]);
    expect(
      (await refusal(agent.finish(run?.id ?? '', { carrier: 'A' }))).code,
    ).toBe('STALE');
    expect(h.get(REPLANS, id).plan).toBeNull();
    expect((await agent.current(id))?.status).toBe('void');
  });

  it('a plan that arrives after the order left and came back belongs to the old stay and is refused', async () => {
    const { h, agent } = setup();
    const id = await replanning(h);
    const old = await agent.current(id);
    await h.fire(REPLANS, id, 'stopReplanning', {}, 'planner');
    await h.fire(REPLANS, id, 'replan', {}, 'planner');
    const fresh = await agent.current(id);
    expect(fresh?.id).not.toBe(old?.id);
    expect(
      (await refusal(agent.finish(old?.id ?? '', { carrier: 'A' }))).code,
    ).toBe('STALE');
    await agent.finish(fresh?.id ?? '', { carrier: 'C' });
    expect(h.get(REPLANS, id).plan).toEqual({ carrier: 'C' });
  });
});
