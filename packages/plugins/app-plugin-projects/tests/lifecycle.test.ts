// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  canMove,
  fire,
  compile,
  createLifecycleRegistry,
  LifecycleError,
  move,
  validateDefinition,
  type LifecycleDefinition,
  type LifecycleSchema,
} from '../server/lifecycle/index.js';

const schema: LifecycleSchema = {
  categories: ['open', 'closed'],
  actors: ['user', 'bot'],
};

const definition: LifecycleDefinition = {
  states: [
    { key: 'draft', name: 'Draft', category: 'open' },
    { key: 'review', name: 'Review', category: 'open' },
    { key: 'done', name: 'Done', category: 'closed' },
  ],
  transitions: [
    { from: '*', to: '*', actors: ['user'] },
    { from: 'draft', to: 'review', actors: ['bot'] },
  ],
};

const paths = (input: unknown, options = {}) => {
  const result = validateDefinition(input, schema, options);
  return result.ok ? [] : result.issues.map((issue) => issue.path);
};

describe('validateDefinition', () => {
  it('accepts a valid definition and trims names', () => {
    const result = validateDefinition(
      {
        ...definition,
        states: [{ ...definition.states[0], name: ' Draft ' }],
        transitions: [],
      },
      schema,
    );
    expect(result).toMatchObject({
      ok: true,
      definition: { states: [{ name: 'Draft' }] },
    });
  });

  it('reports each problem at its path', () => {
    expect(
      paths({
        states: [
          { key: 'Draft', name: '', category: 'nope' },
          { key: 'ok', name: 'Ok', category: 'open', extra: 1 },
        ],
        transitions: [{ from: 'ok', to: 'ok', actors: ['alien'] }],
      }),
    ).toEqual([
      'states[0].key',
      'states[0].name',
      'states[0].category',
      'states[1].extra',
      'transitions[0].actors',
    ]);
  });

  it('checks keys, ends and duplicate pairs across the definition', () => {
    expect(
      paths({
        states: [
          { key: 'a1', name: 'A', category: 'open' },
          { key: 'a1', name: 'A again', category: 'open' },
        ],
        transitions: [
          { from: 'a1', to: 'zz', actors: ['user'] },
          { from: 'a1', to: 'a1', actors: ['user'] },
          { from: '*', to: 'a1', actors: ['user'] },
          { from: '*', to: 'a1', actors: ['bot'] },
        ],
      }),
    ).toEqual([
      'states[1].key',
      'transitions[0].to',
      'transitions[1]',
      'transitions[3]',
    ]);
  });

  it('keeps the category of a state the base already has', () => {
    const changed = {
      ...definition,
      states: definition.states.map((state) =>
        state.key === 'done' ? { ...state, category: 'open' } : state,
      ),
    };
    expect(paths(changed, { base: definition })).toEqual([
      'states[2].category',
    ]);
  });

  it('refuses rules no registry offers', () => {
    expect(
      paths({
        states: [
          {
            key: 'draft',
            name: 'Draft',
            category: 'open',
            rules: [{ type: 'notify' }],
          },
        ],
        transitions: [
          {
            from: '*',
            to: '*',
            actors: ['user'],
            who: { type: 'author' },
            approval: { approvers: ['lead'] },
          },
        ],
      }),
    ).toEqual([
      'states[0].rules[0].type',
      'transitions[0].who.type',
      'transitions[0].approval.approvers[0]',
    ]);
  });

  it("checks named rules against the registry and each rule's settings", () => {
    const registry = createLifecycleRegistry<Doc, Log>()
      .stateRule('notify', {
        validate: (config) =>
          typeof config.to === 'string'
            ? []
            : [{ path: 'to', message: 'Whom to notify.' }],
      })
      .approver('lead', { resolve: () => Promise.resolve([]) });
    expect(
      paths(
        {
          states: [
            {
              key: 'draft',
              name: 'Draft',
              category: 'open',
              rules: [
                { type: 'notify', config: {} },
                { type: 'notify', config: { to: 'x' } },
              ],
            },
          ],
          transitions: [
            {
              from: '*',
              to: '*',
              actors: ['user'],
              approval: { approvers: ['lead'] },
            },
            {
              from: 'draft',
              to: '*',
              actors: ['bot'],
              approval: { approvers: ['lead'] },
            },
          ],
        },
        { registry },
      ),
    ).toEqual(['states[0].rules[0].config.to']);
  });

  it('runs the application rules once the shape is valid', () => {
    const result = validateDefinition(definition, schema, {
      rules: [
        (value) =>
          value.states.some((state) => state.key === 'archived')
            ? []
            : [{ path: 'states', message: 'archived is required' }],
      ],
    });
    expect(result).toEqual({
      ok: false,
      issues: [{ path: 'states', message: 'archived is required' }],
    });
  });
});

describe('compile', () => {
  const machine = compile(definition);

  it('answers by category and key', () => {
    expect(machine.category('done')).toBe('closed');
    expect(machine.category('gone')).toBeNull();
    expect(machine.isKnown('review')).toBe(true);
  });

  it('expands wildcards per actor', () => {
    expect(machine.allowedMoves('draft', 'user')).toEqual(['review', 'done']);
    expect(machine.allowedMoves('draft', 'bot')).toEqual(['review']);
    expect(machine.allowedMoves('review', 'bot')).toEqual([]);
    expect(machine.canTransition('draft', 'draft', 'user')).toBe(false);
  });

  it('lets a state from another definition leave only through *', () => {
    expect(machine.canTransition('elsewhere', 'done', 'user')).toBe(true);
    expect(machine.canTransition('elsewhere', 'review', 'bot')).toBe(false);
  });
});

interface Doc {
  readonly author: string;
  readonly done: boolean;
}

type Log = string[];

describe('move', () => {
  const machine = compile(definition);
  const noRules = createLifecycleRegistry<Doc, Log>();
  const doc: Doc = { author: 'ann', done: false };
  const request = (
    from: string,
    to: string,
    actor = { type: 'user', id: 'bob' },
  ) => ({ from, to, actor, subject: doc, context: [] as Log });

  it('checks the move, then lets the caller write it', async () => {
    const written: string[] = [];
    await expect(
      move(
        machine,
        noRules,
        request('draft', 'review', { type: 'bot', id: null }),
        () => {
          written.push('draft->review');
          return Promise.resolve();
        },
      ),
    ).resolves.toEqual({ outcome: 'moved', approval: 'none', entry: [] });
    expect(written).toEqual(['draft->review']);
  });

  it('does nothing when the record is already there', async () => {
    let called = false;
    await expect(
      move(machine, noRules, request('done', 'done'), () => {
        called = true;
        return Promise.resolve();
      }),
    ).resolves.toEqual({ outcome: 'unchanged' });
    expect(called).toBe(false);
  });

  it('refuses unknown states and moves the actor may not make', async () => {
    const noop = () => Promise.resolve();
    await expect(
      move(machine, noRules, request('draft', 'gone'), noop),
    ).rejects.toMatchObject({ code: 'UNKNOWN_STATE' });
    const refused = move(
      machine,
      noRules,
      request('review', 'done', { type: 'bot', id: null }),
      noop,
    );
    await expect(refused).rejects.toBeInstanceOf(LifecycleError);
    await expect(refused).rejects.toMatchObject({
      code: 'TRANSITION_NOT_ALLOWED',
    });
  });

  it('answers whether a move may happen without making it', async () => {
    await expect(
      canMove(machine, noRules, request('draft', 'review')),
    ).resolves.toEqual({ ok: true });
    const refused = await canMove(
      machine,
      noRules,
      request('review', 'done', { type: 'bot', id: null }),
    );
    expect(refused).toMatchObject({
      ok: false,
      error: { code: 'TRANSITION_NOT_ALLOWED' },
    });
  });

  it('asks "who may" rules about the record', async () => {
    const registry = createLifecycleRegistry<Doc, Log>().whoRule('author', {
      allows: (ctx) => Promise.resolve(ctx.actor.id === ctx.subject.author),
    });
    const guarded = compile({
      ...definition,
      transitions: [
        { from: '*', to: '*', actors: ['user'], who: { type: 'author' } },
      ],
    });
    const noop = () => Promise.resolve();
    await expect(
      move(guarded, registry, request('draft', 'done'), noop),
    ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
    await expect(
      move(
        guarded,
        registry,
        request('draft', 'done', { type: 'user', id: 'ann' }),
        noop,
      ),
    ).resolves.toMatchObject({ outcome: 'moved' });
  });

  it('runs guards on leaving and entering, then entry actions in isolation', async () => {
    const registry = createLifecycleRegistry<Doc, Log>()
      .stateRule('finished', {
        canLeave: (ctx) =>
          Promise.resolve(
            ctx.subject.done || ctx.to === 'done'
              ? null
              : { code: 'NOT_DONE', message: 'Finish it first.' },
          ),
      })
      .stateRule('log', {
        entered: (ctx, config) => {
          ctx.context.push(`${String(config.say)} ${ctx.to}`);
          return Promise.resolve(undefined);
        },
      })
      .stateRule('broken', {
        entered: () => Promise.reject(new Error('boom')),
      })
      .stateRule('quiet', {
        entered: () =>
          Promise.resolve({ status: 'skipped', reason: 'nothing to do' }),
      });
    const ruled = compile({
      states: [
        {
          key: 'draft',
          name: 'Draft',
          category: 'open',
          rules: [{ type: 'finished' }],
        },
        {
          key: 'review',
          name: 'Review',
          category: 'open',
          rules: [
            { type: 'broken' },
            { type: 'log', config: { say: 'entered' } },
            { type: 'quiet' },
          ],
        },
        { key: 'done', name: 'Done', category: 'closed' },
      ],
      transitions: [{ from: '*', to: '*', actors: ['user'] }],
    });
    const noop = () => Promise.resolve();
    await expect(
      move(ruled, registry, request('draft', 'review'), noop),
    ).rejects.toMatchObject({
      code: 'GUARD_FAILED',
      failure: { code: 'NOT_DONE', rule: 'finished' },
    });
    await expect(
      move(
        ruled,
        registry,
        { ...request('draft', 'review'), skipGuards: true },
        noop,
      ),
    ).resolves.toMatchObject({ outcome: 'moved' });

    const log: Log = [];
    const isolated: string[] = [];
    const result = await move(
      ruled,
      registry,
      {
        ...request('draft', 'review'),
        subject: { author: 'ann', done: true },
        context: log,
        isolate: (run) => {
          isolated.push('savepoint');
          return run(log);
        },
      },
      noop,
    );
    expect(result).toMatchObject({
      outcome: 'moved',
      entry: [
        { rule: 'broken', status: 'failed' },
        { rule: 'log', status: 'applied' },
        { rule: 'quiet', status: 'skipped', reason: 'nothing to do' },
      ],
    });
    expect(log).toEqual(['entered review']);
    expect(isolated).toHaveLength(3);
  });

  it('holds a move that needs an approval, unless nobody or the actor approves it', async () => {
    const leads: string[] = ['carol', 'dave'];
    const registry = createLifecycleRegistry<Doc, Log>().approver('lead', {
      resolve: () => Promise.resolve(leads),
    });
    const approved = compile({
      ...definition,
      transitions: [
        { from: '*', to: '*', actors: ['user'] },
        {
          from: 'review',
          to: 'done',
          actors: ['user'],
          approval: { approvers: ['lead'] },
        },
      ],
    });
    let writes = 0;
    const write = () => {
      writes += 1;
      return Promise.resolve();
    };
    await expect(
      move(approved, registry, request('review', 'done'), write),
    ).resolves.toEqual({
      outcome: 'pending',
      approvers: ['lead'],
      approverIds: ['carol', 'dave'],
    });
    expect(writes).toBe(0);
    await expect(
      move(
        approved,
        registry,
        request('review', 'done', { type: 'user', id: 'carol' }),
        write,
      ),
    ).resolves.toMatchObject({ outcome: 'moved', approval: 'self' });
    await expect(
      move(
        approved,
        registry,
        { ...request('review', 'done'), approved: true },
        write,
      ),
    ).resolves.toMatchObject({ outcome: 'moved', approval: 'approved' });
    await expect(
      move(approved, registry, request('draft', 'done'), write),
    ).resolves.toMatchObject({ outcome: 'moved', approval: 'none' });
    leads.length = 0;
    await expect(
      move(approved, registry, request('review', 'done'), write),
    ).resolves.toMatchObject({ outcome: 'moved', approval: 'noApprover' });
    expect(writes).toBe(4);
  });
});

describe('event transitions', () => {
  const evented: LifecycleSchema = { ...schema, events: ['children.done'] };
  const withEvent: LifecycleDefinition = {
    ...definition,
    transitions: [
      ...definition.transitions,
      { from: 'review', to: 'done', actors: ['bot'], on: 'children.done' },
    ],
  };

  it('validates the event, its ends and what it may not carry', () => {
    const check = (transition: Record<string, unknown>, events = evented) => {
      const result = validateDefinition(
        { ...definition, transitions: [transition] },
        events,
      );
      return result.ok ? [] : result.issues.map((issue) => issue.path);
    };
    expect(
      validateDefinition(withEvent, evented).ok &&
        !validateDefinition(withEvent, schema).ok,
    ).toBe(true);
    expect(
      check({ from: 'review', to: 'done', actors: ['bot'], on: 'nope' }),
    ).toEqual(['transitions[0].on']);
    expect(
      check({ from: '*', to: '*', actors: ['bot'], on: 'children.done' }),
    ).toEqual(['transitions[0].from', 'transitions[0].to']);
    expect(
      check({
        from: 'review',
        to: 'done',
        actors: ['bot'],
        on: 'children.done',
        who: { type: 'x' },
        approval: { approvers: ['owner'] },
      }),
    ).toEqual(['transitions[0].who', 'transitions[0].approval']);
  });

  it('allows one target per state and event, beside an ordinary move of the same pair', () => {
    const twice = validateDefinition(
      {
        ...definition,
        transitions: [
          { from: 'review', to: 'done', actors: ['user'] },
          { from: 'review', to: 'done', actors: ['bot'], on: 'children.done' },
          { from: 'review', to: 'draft', actors: ['bot'], on: 'children.done' },
        ],
      },
      evented,
    );
    expect(twice.ok ? [] : twice.issues.map((issue) => issue.path)).toEqual([
      'transitions[2]',
    ]);
  });

  it('keeps event transitions out of ordinary moves', async () => {
    const machine = compile(withEvent);
    expect(machine.canTransition('review', 'done', 'bot')).toBe(false);
    expect(machine.allowedMoves('review', 'bot')).toEqual([]);
    expect(machine.eventTarget('review', 'children.done')).toBe('done');
    expect(machine.eventTarget('draft', 'children.done')).toBeNull();
    const registry = createLifecycleRegistry<Doc, Log>();
    const request = {
      from: 'review',
      to: 'done',
      actor: { type: 'bot', id: null },
      subject: { author: 'ann', done: false },
      context: [] as Log,
    };
    await expect(
      move(machine, registry, request, () => Promise.resolve()),
    ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
    await expect(
      move(machine, registry, { ...request, event: 'children.done' }, () =>
        Promise.resolve(),
      ),
    ).resolves.toMatchObject({ outcome: 'moved' });
    await expect(
      move(
        machine,
        registry,
        {
          ...request,
          to: 'draft',
          actor: { type: 'user', id: 'u' },
          event: 'children.done',
        },
        () => Promise.resolve(),
      ),
    ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
  });

  it('fires through move: ignored without a transition, guarded, never held for approval', async () => {
    const guarded = compile({
      ...withEvent,
      states: withEvent.states.map((state) =>
        state.key === 'done' ? { ...state, rules: [{ type: 'ready' }] } : state,
      ),
      transitions: [
        ...withEvent.transitions,
        { from: 'draft', to: 'review', actors: ['bot'], on: 'children.done' },
      ],
    });
    let ready = false;
    const registry = createLifecycleRegistry<Doc, Log>()
      .stateRule('ready', {
        canEnter: () =>
          Promise.resolve(
            ready ? null : { code: 'NOT_READY', message: 'Not yet.' },
          ),
      })
      .approver('owner', { resolve: () => Promise.resolve(['someone']) });
    const written: string[] = [];
    const request = (from: string) => ({
      from,
      actor: { type: 'bot', id: null },
      subject: { author: 'ann', done: false },
      context: [] as Log,
      event: 'children.done',
    });
    const apply = (to: string) => {
      written.push(to);
      return Promise.resolve();
    };
    await expect(
      fire(guarded, registry, request('done'), apply),
    ).resolves.toEqual({ outcome: 'ignored' });
    await expect(
      fire(guarded, registry, request('review'), apply),
    ).rejects.toMatchObject({ code: 'GUARD_FAILED' });
    ready = true;
    await expect(
      fire(guarded, registry, request('review'), apply),
    ).resolves.toMatchObject({ outcome: 'moved', approval: 'approved' });
    await expect(
      fire(guarded, registry, request('draft'), apply),
    ).resolves.toMatchObject({ outcome: 'moved' });
    expect(written).toEqual(['done', 'review']);
  });
});
