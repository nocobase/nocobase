// Extension points: listeners told after commit, and a hook that writes
// inside the transition's transaction.
import { describe, expect, it } from 'vitest';

import {
  CREATE_TRANSITION,
  defineEffect,
  defineLifecycle,
  type AnnounceEvent,
  type Lifecycle,
  type LifecycleEvent,
  type LifecycleRecord,
} from '../src/index.js';
import { createLifecycleTestKit } from '../src/testing.js';

type State = 'draft' | 'review' | 'approved' | 'archived';

interface Doc extends LifecycleRecord {
  readonly status: State;
  readonly title: string;
}

interface Services {
  readonly ledger: string[];
  failHook: boolean;
}

interface DocTypes {
  record: Doc;
  state: State;
  parameters: { archiveAfterMinutes: number };
  services: Services;
}

const publish = defineEffect<DocTypes>({
  name: 'docs.publish',
  onSuccess: 'archive',
  run: () => ({ url: 'https://example.com/doc' }),
});

const docs: Lifecycle<DocTypes> = defineLifecycle<DocTypes>({
  name: 'docs',
  initial: 'draft',
  states: ['draft', 'review', 'approved', { name: 'archived', final: true }],
  parameters: { archiveAfterMinutes: 60 },
  transitions: {
    submit: { from: 'draft', to: 'review' },
    approve: {
      from: 'review',
      to: 'approved',
      effects: [publish],
      onTransition: ({ record, from, to, entry, services }) => {
        if (services.failHook) throw new Error('The ledger is full.');
        services.ledger.push(
          `${record.title}:${from}->${to}@v${entry.version}`,
        );
      },
    },
    reject: { from: 'review', to: 'draft' },
    archive: { from: ['approved', 'draft'], to: 'archived' },
  },
});

function setup() {
  const services: Services = { ledger: [], failHook: false };
  const kit = createLifecycleTestKit(docs, { services });
  const heard: string[] = [];
  const record = (event: string) => (e: LifecycleEvent) =>
    void heard.push(`${event}:${e.transition}:${e.from ?? '∅'}->${e.to}`);
  return { services, kit, heard, record };
}

describe('listeners', () => {
  it('hear every commit, creations and continuations included, in order', async () => {
    const { kit, heard, record } = setup();
    kit.runtime.on('completed', {}, record('completed'));
    const doc = await kit.start({ title: 'Plan' }, { actor: 'lin' });
    await kit.fire(doc, 'submit', {}, { actor: 'lin' });
    await kit.fire(doc, 'approve', {}, { actor: 'wang' });
    expect(heard).toEqual([
      `completed:${CREATE_TRANSITION}:∅->draft`,
      'completed:submit:draft->review',
      'completed:approve:review->approved',
      // The effect's onSuccess, fired as the system.
      'completed:archive:approved->archived',
    ]);
  });

  it('filter by lifecycle, transition and state', async () => {
    const { kit, heard, record } = setup();
    kit.runtime.on('completed', { transition: 'approve' }, record('approved'));
    kit.runtime.on('entered', { state: 'review' }, record('inReview'));
    kit.runtime.on('completed', { lifecycle: 'other' }, record('other'));
    const doc = await kit.start({ title: 'Plan' });
    await kit.fire(doc, 'submit');
    await kit.fire(doc, 'reject');
    await kit.fire(doc, 'submit');
    expect(heard).toEqual([
      'inReview:submit:draft->review',
      'inReview:submit:draft->review',
    ]);
  });

  it('announce each transition the new state allows, for a to-do list', async () => {
    const { kit } = setup();
    const todo: string[] = [];
    kit.runtime.on('announce', {}, (event: AnnounceEvent) => {
      if (event.entry.transition === 'submit') todo.push(event.next);
    });
    const doc = await kit.start({ title: 'Plan' });
    await kit.fire(doc, 'submit');
    expect(todo).toEqual(['approve', 'reject']);
  });

  it('carry the actor, and the system for what effects and triggers fire', async () => {
    const { kit } = setup();
    const actors: string[] = [];
    kit.runtime.on('completed', {}, (event) => {
      actors.push(
        `${event.transition}:${event.actor.id}:${event.actor.system === true}`,
      );
    });
    const doc = await kit.start({ title: 'Plan' }, { actor: 'lin' });
    await kit.fire(doc, 'submit', {}, { actor: 'lin' });
    await kit.fire(doc, 'approve', {}, { actor: 'wang' });
    expect(actors).toEqual([
      `${CREATE_TRANSITION}:lin:false`,
      'submit:lin:false',
      'approve:wang:false',
      'archive:system:true',
    ]);
  });

  it('cannot break the transition they hear about, and can stop listening', async () => {
    const { kit, heard, record } = setup();
    kit.runtime.on('completed', {}, () => {
      throw new Error('The listener is broken.');
    });
    const stop = kit.runtime.on('completed', {}, record('kept'));
    const doc = await kit.start({ title: 'Plan' });
    await kit.fire(doc, 'submit');
    expect(kit.get(doc).status).toBe('review');
    stop();
    await kit.fire(doc, 'reject');
    expect(heard).toEqual([
      `kept:${CREATE_TRANSITION}:∅->draft`,
      'kept:submit:draft->review',
    ]);
  });
});

describe('onTransition', () => {
  it('runs inside the transition with the record as written', async () => {
    const { kit, services } = setup();
    const doc = await kit.start({ title: 'Plan' });
    await kit.fire(doc, 'submit');
    await kit.fire(doc, 'approve');
    expect(services.ledger).toEqual(['Plan:review->approved@v3']);
  });

  it('refuses the transition by throwing, and leaves nothing behind', async () => {
    const { kit, services } = setup();
    const heard: string[] = [];
    kit.runtime.on('completed', { transition: 'approve' }, (event) => {
      heard.push(event.transition);
    });
    const doc = await kit.start({ title: 'Plan' });
    await kit.fire(doc, 'submit');
    services.failHook = true;
    await expect(kit.fire(doc, 'approve')).rejects.toThrow(
      'The ledger is full.',
    );
    expect(kit.get(doc)).toMatchObject({
      status: 'review',
      lifecycleVersion: 2,
    });
    expect(await kit.history(doc)).toEqual([CREATE_TRANSITION, 'submit']);
    expect(await kit.effects(doc)).toEqual([]);
    expect(heard).toEqual([]);
  });
});
