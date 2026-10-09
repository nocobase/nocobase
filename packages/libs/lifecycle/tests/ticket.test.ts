import { describe, expect, it } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  planTransition,
  SYSTEM_ACTOR,
} from '../src/index.js';
import {
  createLifecycleTestKit,
  type LifecycleTestKit,
} from '../src/testing.js';
import {
  notifyCustomer,
  ticketDefinition,
  ticketLifecycle,
  type TicketTypes,
} from './fixtures/ticket.js';

/** The ticket lifecycle with a notification that backs off a minute, then two. */
const backedOff = defineLifecycle<TicketTypes>({
  ...ticketDefinition,
  transitions: {
    ...ticketDefinition.transitions,
    replyToCustomer: {
      ...ticketDefinition.transitions.replyToCustomer,
      effects: [
        defineEffect<TicketTypes>({
          ...notifyCustomer,
          retry: { attempts: 3, backoffMs: 60_000, factor: 2 },
        }),
      ],
    },
  },
});

function setup(): { kit: LifecycleTestKit<TicketTypes>; sent: string[] } {
  const sent: string[] = [];
  const kit = createLifecycleTestKit(ticketLifecycle, {
    now: '2026-10-01T09:00:00Z',
    services: { mail: { send: (to) => void sent.push(to) } },
  });
  return { kit, sent };
}

describe('ticket lifecycle', () => {
  it('waits for the customer and closes after the wait runs out', async () => {
    const { kit, sent } = setup();
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await kit.fire(ticket, 'replyToCustomer', { message: 'Please confirm' });
    expect(sent).toEqual(['a@example.com']);

    kit.advance({ hours: 71 });
    expect(await kit.runTriggers()).toBe(0);
    expect(kit.get(ticket).status).toBe('awaitingCustomer');

    kit.advance({ hours: 2 });
    expect(await kit.runTriggers()).toBe(1);
    expect(kit.get(ticket).status).toBe('closed');
    expect(await kit.history(ticket)).toEqual(['replyToCustomer', 'close']);
    expect((await kit.transitions(ticket)).at(-1)?.actorId).toBe('system');
  });

  it('restarts the wait when the customer replies in time', async () => {
    const { kit } = setup();
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await kit.fire(ticket, 'replyToCustomer', { message: 'Please confirm' });
    kit.advance({ hours: 10 });
    await kit.fire(ticket, 'customerReplied');
    kit.advance({ hours: 100 });
    await kit.runTriggers();
    expect(kit.get(ticket).status).toBe('open');
  });

  it('retries a failed notification with the same idempotency key', async () => {
    const { kit } = setup();
    kit.failEffect('tickets.notifyCustomer', { times: 2 });
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await kit.fire(ticket, 'replyToCustomer', { message: 'Please confirm' });
    expect(await kit.effectRuns(ticket)).toMatchObject([
      {
        effect: 'tickets.notifyCustomer',
        status: 'succeeded',
        attempts: 3,
        result: { sentTo: 'a@example.com' },
      },
    ]);
  });

  it('waits out a backoff on the fake clock before the next attempt', async () => {
    const sent: string[] = [];
    const kit = createLifecycleTestKit(backedOff, {
      now: '2026-10-01T09:00:00Z',
      services: { mail: { send: (to) => void sent.push(to) } },
    });
    kit.failEffect('tickets.notifyCustomer', { times: 2 });
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await kit.fire(ticket, 'replyToCustomer', { message: 'Please confirm' });
    expect(await kit.effectRuns(ticket)).toMatchObject([
      { status: 'queued', attempts: 1, runAfter: '2026-10-01T09:01:00.000Z' },
    ]);

    kit.advance({ seconds: 59 });
    expect(await kit.runDue()).toBe(0);
    expect(sent).toEqual([]);
    kit.advance({ seconds: 1 });
    expect(await kit.runDue()).toBe(1);
    // The second backoff is twice the first.
    expect(kit.dispatcher.waiting()).toEqual([
      {
        runId: expect.any(String),
        runAfter: '2026-10-01T09:03:00.000Z',
      },
    ]);
    kit.advance({ minutes: 2 });
    expect(await kit.runDue()).toBe(1);
    expect(sent).toEqual(['a@example.com']);
    expect(await kit.effectRuns(ticket)).toMatchObject([
      { status: 'succeeded', attempts: 3 },
    ]);
  });

  it('runs every retry at once when asked to, recording its backoff', async () => {
    const kit = createLifecycleTestKit(backedOff, {
      retries: 'immediate',
      services: { mail: { send: () => undefined } },
    });
    kit.failEffect('tickets.notifyCustomer', { times: 2 });
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await kit.fire(ticket, 'replyToCustomer', { message: 'Please confirm' });
    expect(await kit.effectRuns(ticket)).toMatchObject([
      { status: 'succeeded', attempts: 3, runAfter: expect.any(String) },
    ]);
    expect(kit.dispatcher.waiting()).toEqual([]);
  });

  it('keeps the transition when every attempt of its effect fails', async () => {
    const { kit } = setup();
    kit.failEffect('tickets.notifyCustomer', { times: 5 });
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await kit.fire(ticket, 'replyToCustomer', { message: 'Please confirm' });
    expect(kit.get(ticket).status).toBe('awaitingCustomer');
    expect(await kit.effectRuns(ticket)).toMatchObject([
      {
        status: 'failed',
        attempts: 3,
        error: expect.stringContaining('Simulated'),
      },
    ]);
  });

  it('refuses a transition from the wrong state and changes nothing', async () => {
    const { kit } = setup();
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    await expect(kit.fire(ticket, 'customerReplied')).rejects.toMatchObject({
      code: 'INVALID_STATE',
    });
    await expect(kit.fire(ticket, 'replyToCustomer', {})).rejects.toMatchObject(
      {
        code: 'INVALID_INPUT',
      },
    );
    await expect(
      kit.fire(ticket, 'close', {}, { actor: 'visitor' }),
    ).rejects.toBeInstanceOf(LifecycleError);
    expect(kit.get(ticket).status).toBe('open');
    expect(await kit.history(ticket)).toEqual([]);
  });

  it('lists what an actor may do next', async () => {
    const { kit } = setup();
    const ticket = kit.create({ customerEmail: 'a@example.com' });
    expect(await kit.available(ticket, 'visitor')).toMatchObject([
      { name: 'replyToCustomer', allowed: true },
      { name: 'close', allowed: false },
    ]);
  });

  it('plans a transition without a store', async () => {
    const plan = await planTransition(
      ticketLifecycle,
      { id: 1, status: 'awaitingCustomer', customerEmail: 'a@example.com' },
      'close',
      {
        actor: SYSTEM_ACTOR,
        parameters: { waitHours: 72 },
        services: { mail: { send: () => {} } },
        now: new Date('2026-10-01T09:00:00Z'),
      },
    );
    expect(plan).toMatchObject({
      from: 'awaitingCustomer',
      to: 'closed',
      values: { status: 'closed', statusChangedAt: '2026-10-01T09:00:00.000Z' },
      effects: [],
    });
  });
});
