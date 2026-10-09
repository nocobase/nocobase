// What a lifecycle tells a page before and after a click: the reasons a
// transition is refused, the input problems, and where a record's history
// starts.
import { describe, expect, it } from 'vitest';

import {
  CREATE_TRANSITION,
  defineEffect,
  defineLifecycle,
  type Lifecycle,
  type LifecycleDefinition,
  type LifecycleRecord,
} from '../src/index.js';
import { createLifecycleTestKit } from '../src/testing.js';

type State = 'draft' | 'review' | 'done';

interface Request extends LifecycleRecord {
  readonly status: State;
  readonly ownerId: string;
  readonly note?: string;
  readonly closedBy?: string;
}

interface RequestTypes {
  record: Request;
  state: State;
  parameters: object;
  services: { readonly welcomed: string[] };
}

const welcome = defineEffect<RequestTypes>({
  name: 'requests.welcome',
  run: ({ record, services }) => void services.welcomed.push(record.ownerId),
});

const requestDefinition: LifecycleDefinition<RequestTypes> = {
  name: 'requests',
  initial: ['draft', 'review'],
  states: ['draft', 'review', { name: 'done', final: true }],
  transitions: {
    submit: {
      from: 'draft',
      to: 'review',
      guard: ({ record, actor }) =>
        actor.id === record.ownerId || {
          code: 'NOT_OWNER',
          message: 'Only the owner can submit it.',
        },
    },
    approve: {
      from: 'review',
      to: 'done',
      guard: ({ actor }) =>
        actor.id === 'reviewer' || 'Only a reviewer can approve it.',
      validate: (input) =>
        typeof input.note === 'string' && input.note
          ? []
          : [{ field: 'note', message: 'A note is required.' }],
      accept: ['note', 'closedBy'],
      // set runs after accept, and wins.
      set: ({ actor }) => ({ closedBy: actor.id }),
    },
    reject: {
      from: 'review',
      to: 'draft',
      validate: (input) => (input.reason ? null : 'A reason is required.'),
    },
  },
  onEnter: { draft: [welcome] },
};

const requests: Lifecycle<RequestTypes> =
  defineLifecycle<RequestTypes>(requestDefinition);

function kit() {
  const services = { welcomed: [] as string[] };
  return { services, kit: createLifecycleTestKit(requests, { services }) };
}

describe('explaining refusals', () => {
  it('lists every reason a transition is refused, and refuses the click the same way', async () => {
    const { kit: k } = kit();
    const request = k.create({ ownerId: 'lin' });
    expect(await k.available(request, 'he')).toEqual([
      {
        name: 'submit',
        title: 'submit',
        to: ['review'],
        allowed: false,
        blockers: [
          {
            source: 'guard',
            kind: 'permission',
            code: 'NOT_OWNER',
            message: 'Only the owner can submit it.',
          },
        ],
      },
    ]);
    await expect(
      k.fire(request, 'submit', {}, { actor: 'he' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
      message: 'Only the owner can submit it.',
      blockers: [expect.objectContaining({ code: 'NOT_OWNER' })],
    });
    expect((await k.available(request, 'lin'))[0]).toMatchObject({
      allowed: true,
      blockers: [],
    });
  });

  it('says a transition cannot start from the current state', async () => {
    const { kit: k } = kit();
    const request = k.create({ ownerId: 'lin' });
    expect(await k.can(request, 'approve', 'reviewer')).toEqual({
      allowed: false,
      blockers: [
        {
          source: 'state',
          kind: 'precondition',
          code: 'INVALID_STATE',
          message: '"approve" cannot start from "draft".',
        },
      ],
      problems: [],
    });
    expect(await k.can(request, 'submit', 'lin')).toEqual({
      allowed: true,
      blockers: [],
      problems: [],
    });
  });

  it('lets other code veto a transition, and joins its reason to the others', async () => {
    const { kit: k } = kit();
    const request = k.create({ ownerId: 'lin' });
    const remove = k.runtime.addGuard<RequestTypes>('requests', '*', () => ({
      code: 'FROZEN',
      message: 'Requests are frozen this week.',
    }));
    expect(await k.can(request, 'submit', 'he')).toMatchObject({
      allowed: false,
      blockers: [{ code: 'NOT_OWNER' }, { code: 'FROZEN' }],
    });
    await expect(
      k.fire(request, 'submit', {}, { actor: 'lin' }),
    ).rejects.toMatchObject({ blockers: [{ code: 'FROZEN' }] });
    remove();
    await k.fire(request, 'submit', {}, { actor: 'lin' });
    expect(k.get(request).status).toBe('review');
    expect(() => k.runtime.addGuard('requests', 'publish', () => true)).toThrow(
      /no transition "publish"/,
    );
  });
});

describe('input', () => {
  it('reports each input problem, and still takes a single message', async () => {
    const { kit: k } = kit();
    const request = await k.start({ ownerId: 'lin' }, { state: 'review' });
    await expect(
      k.fire(request, 'approve', {}, { actor: 'reviewer' }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      problems: [{ field: 'note', message: 'A note is required.' }],
    });
    await expect(
      k.fire(request, 'reject', {}, { actor: 'reviewer' }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: 'A reason is required.',
      problems: [{ message: 'A reason is required.' }],
    });
  });

  it('writes accepted input fields onto the record, with set taking precedence', async () => {
    const { kit: k } = kit();
    const request = await k.start({ ownerId: 'lin' }, { state: 'review' });
    await k.fire(
      request,
      'approve',
      { note: 'Looks right', closedBy: 'someone else', ignored: true },
      { actor: 'reviewer' },
    );
    expect(k.get(request)).toMatchObject({
      status: 'done',
      note: 'Looks right',
      closedBy: 'reviewer',
    });
    expect(k.get(request)).not.toHaveProperty('ignored');
  });

  it('refuses to accept a field the lifecycle owns', () => {
    expect(() =>
      defineLifecycle<RequestTypes>({
        name: 'bad',
        initial: 'draft',
        states: ['draft', { name: 'done', final: true }],
        transitions: {
          finish: { from: 'draft', to: 'done', accept: ['status'] },
        },
      }),
    ).toThrow(/may not accept "status"/);
  });
});

describe('creating through the lifecycle', () => {
  it('starts the history at the creation and runs what the initial state owes', async () => {
    const { kit: k, services } = kit();
    const request = await k.start({ ownerId: 'lin' }, { actor: 'lin' });
    expect(request).toMatchObject({ status: 'draft', lifecycleVersion: 1 });
    expect(await k.transitions(request)).toMatchObject([
      {
        transition: CREATE_TRANSITION,
        from: null,
        to: 'draft',
        actorId: 'lin',
        version: 1,
      },
    ]);
    expect(services.welcomed).toEqual(['lin']);
    await k.fire(request, 'submit', {}, { actor: 'lin' });
    expect(
      (await k.transitions(request)).map((entry) => entry.version),
    ).toEqual([1, 2]);
  });

  it('creates in another initial state only when asked, and never in any other', async () => {
    const { kit: k, services } = kit();
    const direct = await k.start({ ownerId: 'lin' }, { state: 'review' });
    expect(direct.status).toBe('review');
    expect(services.welcomed).toEqual([]);
    await expect(
      k.start({ ownerId: 'lin' }, { state: 'done' }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });
    await expect(
      k.start({ ownerId: 'lin', status: 'done' }),
    ).rejects.toMatchObject({ code: 'INVALID_SET' });
  });

  it('checks the values and then who creates it, before writing anything', async () => {
    const checked = defineLifecycle<RequestTypes>({
      ...requestDefinition,
      create: {
        validate: (values) =>
          typeof values.ownerId === 'string' && values.ownerId
            ? null
            : [{ field: 'ownerId', message: 'Name the owner.' }],
        guard: ({ values, state, actor }) => {
          // The guard only ever sees values that passed validation.
          expect(typeof values.ownerId).toBe('string');
          if (state === 'review' && actor.id !== 'reviewer')
            return {
              code: 'reviewerOnly',
              message: 'Only a reviewer can file one straight into review.',
            };
          return (
            values.ownerId === actor.id || {
              code: 'ownOnly',
              message: 'You can only file a request for yourself.',
            }
          );
        },
      },
    });
    const services = { welcomed: [] as string[] };
    const k = createLifecycleTestKit(checked, { services });

    await expect(k.start({}, { actor: 'lin' })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      problems: [{ field: 'ownerId', message: 'Name the owner.' }],
    });
    await expect(
      k.start({ ownerId: 'boss' }, { actor: 'intern' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
      blockers: [{ source: 'guard', code: 'ownOnly' }],
    });
    await expect(
      k.start({ ownerId: 'lin' }, { actor: 'lin', state: 'review' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
      blockers: [{ code: 'reviewerOnly' }],
    });
    // Nothing of the refusals was written, and no effect ran.
    expect(await k.store.listEffectRuns({})).toEqual([]);
    expect(services.welcomed).toEqual([]);

    const request = await k.start({ ownerId: 'lin' }, { actor: 'lin' });
    expect(request).toMatchObject({ ownerId: 'lin', status: 'draft' });
    expect(services.welcomed).toEqual(['lin']);
  });
});

interface Report extends LifecycleRecord {
  readonly status: 'review' | 'done';
  readonly lines: readonly {
    readonly approverId: string;
    readonly approved: boolean;
  }[];
}

interface ReportTypes {
  record: Report;
  state: 'review' | 'done';
}

/** Each line of a report has its own approver, so whether one may approve depends on the line. */
const reports = defineLifecycle<ReportTypes>({
  name: 'reports',
  initial: 'review',
  states: ['review', { name: 'done', final: true }],
  transitions: {
    approveLine: {
      from: 'review',
      to: 'review',
      validate: (input) =>
        Number.isInteger(input.line)
          ? null
          : [{ field: 'line', message: 'Pick a line.' }],
      // available() asks with no input, so the guard answers for {} too.
      guard: ({ record, actor, input }) =>
        record.lines[Number(input.line)]?.approverId === actor.id || {
          code: 'notYourLine',
          message: 'Someone else approves this line.',
        },
      set: ({ record, input }) => ({
        lines: record.lines.map((line, index) =>
          index === input.line ? { ...line, approved: true } : line,
        ),
      }),
    },
    finish: { from: 'review', to: 'done' },
  },
});

describe('input and guards', () => {
  const lines = [
    { approverId: 'admin', approved: false },
    { approverId: 'it', approved: false },
  ];

  it('validates the input before any guard reads it', async () => {
    const k = createLifecycleTestKit(reports);
    const report = await k.start({ lines });
    // A missing line is a field problem, not the guard's "not your line".
    await expect(
      k.fire(report, 'approveLine', {}, { actor: 'it' }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      problems: [{ field: 'line', message: 'Pick a line.' }],
    });
    await k.fire(report, 'approveLine', { line: 1 }, { actor: 'it' });
    expect(k.get(report).lines[1]).toMatchObject({ approved: true });
  });

  it('answers can() for the input a button would send', async () => {
    const k = createLifecycleTestKit(reports);
    const report = await k.start({ lines });
    expect(await k.can(report, 'approveLine', 'it', { line: 1 })).toEqual({
      allowed: true,
      blockers: [],
      problems: [],
    });
    expect(await k.can(report, 'approveLine', 'it', { line: 0 })).toMatchObject(
      {
        allowed: false,
        blockers: [{ code: 'notYourLine' }],
        problems: [],
      },
    );
    // Input validate refuses is answered with its problems, not thrown.
    expect(await k.can(report, 'approveLine', 'it', { line: 'x' })).toEqual({
      allowed: false,
      blockers: [],
      problems: [{ field: 'line', message: 'Pick a line.' }],
    });
    // Without input the guards see {}: which line is not known, so no line is yours.
    expect(
      (await k.available(report, 'it')).find(
        (transition) => transition.name === 'approveLine',
      ),
    ).toMatchObject({ allowed: false, blockers: [{ code: 'notYourLine' }] });
    // The state still comes first.
    await k.fire(report, 'finish');
    expect(await k.can(report, 'approveLine', 'it', { line: 1 })).toMatchObject(
      {
        allowed: false,
        blockers: [{ source: 'state' }],
      },
    );
  });
});
