// Lifecycle calls that join a transaction the caller already holds: a parent
// creating its children inside its own transition, a child moving its parent
// on in the same commit, and an application grouping several calls in one.
import { describe, expect, it } from 'vitest';

import {
  CREATE_TRANSITION,
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type Lifecycle,
  type LifecycleRecord,
} from '../src/index.js';

interface Purchase extends LifecycleRecord {
  readonly status: 'draft' | 'inReview' | 'approved';
  readonly departments: readonly string[];
  readonly pending: number;
  readonly frozen: boolean;
}

interface Review extends LifecycleRecord {
  readonly status: 'inReview' | 'approved';
  readonly purchaseId: string;
  readonly department: string;
}

interface Services {
  readonly runtime: () => LifecycleRuntime;
  /** Each notification, with the purchase's state when it was sent. */
  readonly notified: string[];
}

interface PurchaseTypes {
  record: Purchase;
  state: Purchase['status'];
  services: Services;
}

interface ReviewTypes {
  record: Review;
  state: Review['status'];
  services: Services;
}

const DEPARTMENTS = ['it', 'legal', 'security'];

const notifyReviewer = defineEffect<ReviewTypes>({
  name: 'reviews.notify',
  run: async ({ record, services }) => {
    const purchase = await services
      .runtime()
      .view('purchases', record.purchaseId, SYSTEM_ACTOR);
    services.notified.push(`${record.department}:${purchase.state}`);
  },
});

const purchases: Lifecycle<PurchaseTypes> = defineLifecycle<PurchaseTypes>({
  name: 'purchases',
  initial: 'draft',
  states: ['draft', 'inReview', { name: 'approved', final: true }],
  transitions: {
    submit: {
      from: 'draft',
      to: 'inReview',
      set: ({ record }) => ({ pending: record.departments.length }),
      // Each department's review is created through its own lifecycle, in
      // this transition's transaction.
      onTransition: async ({ record, services, transactionHandle }) => {
        for (const department of record.departments)
          await services
            .runtime()
            .create(
              'reviews',
              { purchaseId: String(record.id), department },
              { actor: SYSTEM_ACTOR, transaction: transactionHandle },
            );
      },
    },
    childDone: {
      from: 'inReview',
      to: ['inReview', 'approved'],
      guard: ({ record }) =>
        !record.frozen || {
          code: 'frozen',
          message: 'The purchase is frozen.',
        },
      route: ({ record }) => (record.pending <= 1 ? 'approved' : 'inReview'),
      set: ({ record }) => ({ pending: record.pending - 1 }),
    },
  },
});

const reviews: Lifecycle<ReviewTypes> = defineLifecycle<ReviewTypes>({
  name: 'reviews',
  initial: 'inReview',
  create: {
    validate: (values) =>
      DEPARTMENTS.includes(String(values.department))
        ? null
        : [{ field: 'department', message: 'No such department.' }],
  },
  states: ['inReview', { name: 'approved', final: true }],
  transitions: {
    approve: {
      from: 'inReview',
      to: 'approved',
      // The parent moves on in this commit, or the approval does not happen.
      onTransition: ({ record, services, transactionHandle }) =>
        services
          .runtime()
          .fire('purchases', record.purchaseId, 'childDone', {
            actor: SYSTEM_ACTOR,
            transaction: transactionHandle,
          })
          .then(() => undefined),
    },
  },
  onEnter: { inReview: [notifyReviewer] },
});

function setup() {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  const services: Services = { runtime: () => runtime, notified: [] };
  runtime.register(purchases, { services });
  runtime.register(reviews, { services });
  const completed: string[] = [];
  runtime.on('completed', {}, (event) => {
    completed.push(`${event.lifecycle}.${event.transition}`);
  });
  const purchase = (values: Partial<Purchase> = {}) =>
    store.insertRecord('purchases', {
      status: 'draft',
      departments: ['it', 'legal'],
      pending: 0,
      frozen: false,
      statusChangedAt: '2026-10-01T09:00:00.000Z',
      lifecycleVersion: 0,
      ...values,
    }) as Purchase;
  // Ids come from one sequence, so the reviews are among the first few.
  const reviewsOf = (purchaseId: string): Promise<Review[]> =>
    Promise.resolve(
      Array.from(
        { length: 50 },
        (_, index) => store.record('reviews', index + 1) as Review | undefined,
      ).filter((review): review is Review => review?.purchaseId === purchaseId),
    );
  return { store, runtime, services, completed, purchase, reviewsOf };
}

describe('joining a transaction', () => {
  it('creates the children in the parent’s transaction, each with its history and effects', async () => {
    const { runtime, services, purchase, reviewsOf, completed } = setup();
    const { id } = purchase();
    await runtime.fire('purchases', id, 'submit', { actor: { id: 'lin' } });

    const created = await reviewsOf(String(id));
    expect(created.map((review) => review.department)).toEqual(['it', 'legal']);
    for (const review of created)
      expect(
        (await runtime.history('reviews', review.id)).transitions,
      ).toMatchObject([{ transition: CREATE_TRANSITION, actorId: 'system' }]);
    // The notifications went out after the whole submission committed.
    expect(services.notified).toEqual(['it:inReview', 'legal:inReview']);
    expect(completed).toEqual([
      'purchases.submit',
      'reviews.$create',
      'reviews.$create',
    ]);
  });

  it('rolls the children back with the parent, and runs none of their effects', async () => {
    const { runtime, services, store, purchase, reviewsOf, completed } =
      setup();
    const { id } = purchase({ departments: ['it', 'catering'] });
    await expect(
      runtime.fire('purchases', id, 'submit', { actor: { id: 'lin' } }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      problems: [{ field: 'department' }],
    });
    expect(store.record('purchases', id)).toMatchObject({ status: 'draft' });
    expect(await reviewsOf(String(id))).toEqual([]);
    expect(await store.listEffectRuns({})).toEqual([]);
    expect(services.notified).toEqual([]);
    expect(completed).toEqual([]);
  });

  it('moves the parent on in the child’s commit, and refuses the child when the parent refuses', async () => {
    const { runtime, store, purchase, reviewsOf } = setup();
    const { id } = purchase();
    await runtime.fire('purchases', id, 'submit', { actor: { id: 'lin' } });
    const [it, legal] = await reviewsOf(String(id));

    await runtime.fire('reviews', it!.id, 'approve', { actor: { id: 'it' } });
    expect(store.record('purchases', id)).toMatchObject({
      status: 'inReview',
      pending: 1,
    });

    // The parent refuses: the child's approval is not lost, it never happened.
    store.patchRecord('purchases', id, { frozen: true });
    await expect(
      runtime.fire('reviews', legal!.id, 'approve', { actor: { id: 'legal' } }),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
    expect(store.record('reviews', legal!.id)).toMatchObject({
      status: 'inReview',
    });
    expect(
      (await runtime.history('reviews', legal!.id)).transitions,
    ).toHaveLength(1);

    store.patchRecord('purchases', id, { frozen: false });
    await runtime.fire('reviews', legal!.id, 'approve', {
      actor: { id: 'legal' },
    });
    expect(store.record('purchases', id)).toMatchObject({
      status: 'approved',
      pending: 0,
    });
  });

  it('joins the caller’s own transaction: effects wait for its commit, and a rollback drops them', async () => {
    const { runtime, services, store, purchase, completed } = setup();
    const first = purchase();
    const second = purchase({ departments: ['security'] });

    await expect(
      store.transaction(async (tx) => {
        await runtime.fire('purchases', first.id, 'submit', {
          actor: { id: 'lin' },
          transaction: tx.transactionHandle,
        });
        throw new Error('The caller changes its mind.');
      }),
    ).rejects.toThrow('changes its mind');
    expect(store.record('purchases', first.id)).toMatchObject({
      status: 'draft',
    });
    expect(services.notified).toEqual([]);
    expect(completed).toEqual([]);

    await store.transaction(async (tx) => {
      for (const { id } of [first, second]) {
        const result = await runtime.fire('purchases', id, 'submit', {
          actor: { id: 'lin' },
          transaction: tx.transactionHandle,
        });
        expect(result.record).toMatchObject({ status: 'inReview' });
      }
      expect(services.notified).toEqual([]);
    });
    expect(services.notified).toEqual([
      'it:inReview',
      'legal:inReview',
      'security:inReview',
    ]);
  });

  it('undoes only the nested transition when the caller catches its refusal', async () => {
    const { runtime, store, purchase, reviewsOf } = setup();
    const { id } = purchase({ departments: ['it'] });
    await runtime.fire('purchases', id, 'submit', { actor: { id: 'lin' } });
    const [review] = await reviewsOf(String(id));
    store.patchRecord('purchases', id, { frozen: true });

    await store.transaction(async (tx) => {
      await expect(
        runtime.fire('reviews', review!.id, 'approve', {
          actor: { id: 'it' },
          transaction: tx.transactionHandle,
        }),
      ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
      await tx.createRecord('notes', { text: 'Asked to unfreeze it.' });
    });
    expect(store.record('reviews', review!.id)).toMatchObject({
      status: 'inReview',
    });
    expect(store.record('purchases', id)).toMatchObject({
      status: 'inReview',
      pending: 1,
    });
  });
});
