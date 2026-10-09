import { describe, expect, it } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  describeLifecycle,
  LifecycleError,
  type LifecycleRecord,
} from '../src/index.js';
import { ticketLifecycle } from './fixtures/ticket.js';

interface DoorTypes {
  record: LifecycleRecord;
  state: 'open' | 'shut';
}

function attempt(build: () => unknown): string {
  try {
    build();
  } catch (error) {
    expect(error).toBeInstanceOf(LifecycleError);
    return (error as LifecycleError).message;
  }
  throw new Error('The definition was accepted.');
}

describe('defineLifecycle', () => {
  it('fills in the defaults a lifecycle leaves out', () => {
    expect(ticketLifecycle).toMatchObject({
      name: 'tickets',
      collection: 'tickets',
      stateField: 'status',
      changedAtField: 'statusChangedAt',
    });
  });

  it('rejects a transition into a state it does not declare', () => {
    expect(
      attempt(() =>
        defineLifecycle<DoorTypes>({
          name: 'doors',
          initial: 'open',
          states: ['open', { name: 'shut', final: true }],
          transitions: {
            // @ts-expect-error -- the type also rejects it
            lock: { from: 'shut', to: 'locked' },
          },
        }),
      ),
    ).toContain('unknown state "locked"');
  });

  it('requires a route when a transition can reach more than one state', () => {
    expect(
      attempt(() =>
        defineLifecycle<DoorTypes>({
          name: 'doors',
          initial: 'open',
          states: ['open', { name: 'shut', final: true }],
          transitions: { swing: { from: 'open', to: ['open', 'shut'] } },
        }),
      ),
    ).toContain('needs a route');
  });

  it('rejects a trigger waiting where its transition cannot start', () => {
    expect(
      attempt(() =>
        defineLifecycle<DoorTypes>({
          name: 'doors',
          initial: 'open',
          states: ['open', { name: 'shut', final: true }],
          transitions: { shut: { from: 'open', to: 'shut' } },
          triggers: {
            autoShut: { transition: 'shut', when: 'shut', after: () => 1 },
          },
        }),
      ),
    ).toContain('cannot start');
  });

  it('rejects an effect that continues with an unknown transition', () => {
    const effect = defineEffect<DoorTypes>({
      name: 'doors.chime',
      onSuccess: 'lock',
      run: () => null,
    });
    expect(
      attempt(() =>
        defineLifecycle<DoorTypes>({
          name: 'doors',
          initial: 'open',
          states: ['open', { name: 'shut', final: true }],
          transitions: {
            shut: { from: 'open', to: 'shut', effects: [effect] },
          },
        }),
      ),
    ).toContain('unknown transition "lock"');
  });

  it('describes itself for a client without exposing callbacks', () => {
    const description = describeLifecycle(ticketLifecycle);
    expect(description.transitions).toContainEqual({
      name: 'replyToCustomer',
      title: 'replyToCustomer',
      from: ['open'],
      to: ['awaitingCustomer'],
      effects: ['tickets.notifyCustomer'],
      accept: [],
      manual: true,
      meta: {},
    });
    expect(description.triggers).toEqual([
      { name: 'autoClose', transition: 'close', when: ['awaitingCustomer'] },
    ]);
    expect(JSON.parse(JSON.stringify(description))).toEqual(description);
  });
});
