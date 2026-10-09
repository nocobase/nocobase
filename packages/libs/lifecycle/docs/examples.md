# Examples

One capability, or one way of combining capabilities, per section: the business need in a sentence, the code, and what the library does and does not take care of. Start with the [guide](guide.md#quick-start-a-leave-request) for a complete plugin and come here to pick a pattern; the [concepts](concepts.md) explain the vocabulary and the [design](design.md) the transaction and recovery guarantees. Complete business solutions — data model, permissions, failure recovery and tests together — live in the two example plugins under `packages/examples/`. Compensation across several external systems is not covered.

The snippets are TypeScript-shaped pseudocode, not complete plugins. Unless one calls `defineLifecycle`, it shows entries to put inside `transitions`, `onEnter` or `triggers` as labelled; imports, type arguments and the surrounding states are left out, and every state and effect named must be declared in the full definition. `applicantOnly`, `approverOnly`, `systemOnly` and `services.*` are application code: a guard such as `systemOnly` is `({ actor }) => actor.system === true || { code: 'systemOnly', message: '…' }`, and the services are whatever the plugin registers. Authentication and authorization belong on the application's routes in every scenario.

Sections 1–7, 9–12, 14, 15, 17–19, 21 and 25 are run by `tests/recipes.test.ts`, pitfalls included: if the runtime changes what a recipe says, that test fails. The others need a database, routes or the jobs service, which the store and provider tests cover.

| Group                   | Sections                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modelling transitions   | [1. Route by amount](#1-route-by-amount) · [2. Approve through several levels](#2-approve-through-several-levels) · [3. Hand over, escalate, reassign](#3-hand-over-escalate-reassign) · [4. Withdraw or reopen](#4-withdraw-or-reopen) · [5. Freeze a rule at submission](#5-freeze-a-rule-at-submission)                                                                     |
| Time                    | [6. Expire an idle request](#6-expire-an-idle-request) · [7. Remind before escalating](#7-remind-before-escalating) · [8. Act on a record's own deadline](#8-act-on-a-records-own-deadline)                                                                                                                                                                                    |
| Effects and the outside | [9. A background process in steps](#9-a-background-process-in-steps) · [10. Pay and continue](#10-pay-and-continue-after-the-external-call) · [11. Confirm by webhook](#11-confirm-by-webhook) · [12. Refuse while an effect is in flight](#12-refuse-while-an-effect-is-in-flight) · [13. Write related data with the transition](#13-write-related-data-with-the-transition) |
| Several records         | [14. Wait for every signer](#14-wait-for-every-signer) · [15. Wait for child tasks](#15-wait-for-child-tasks) · [16. Dispatch sub-records repeatedly](#16-dispatch-sub-records-repeatedly) · [17. Two lifecycles on one record](#17-two-lifecycles-on-one-record) · [18. Act on many records at once](#18-act-on-many-records-at-once)                                         |
| Extending and adopting  | [19. Add a rule from another plugin](#19-add-a-rule-from-another-plugin) · [20. A to-do list from announce](#20-a-to-do-list-from-announce) · [21. Configuration](#21-configuration-fields-initial-states-and-administrator-parameters) · [22. Adopt an existing table](#22-adopt-an-existing-table)                                                                           |
| Operating               | [23. An operations page](#23-an-operations-page) · [24. Duplicate requests and stale pages](#24-duplicate-requests-and-stale-pages) · [25. A data fix as a transition](#25-a-data-fix-as-a-transition) · [26. Permissions on the record routes](#26-permissions-on-the-record-routes)                                                                                          |
| Pages and tests         | [27. A record page](#27-a-record-page-reasons-field-problems-conflicts-and-meta) · [28. Testing waits, retries and refusals](#28-testing-waits-retries-and-refusals)                                                                                                                                                                                                           |

## Modelling transitions

### 1. Route by amount

An expense under a configured limit is approved at once; a larger one waits for a manager. The person clicks the same Submit button either way.

```ts
// parameters
{ autoApproveLimitCents: 500_000 }

// transitions
submit: {
  from: 'draft',
  to: ['approved', 'awaitingManager'],
  guard: applicantOnly,
  route: ({ record, parameters }) =>
    record.amountCents <= parameters.autoApproveLimitCents
      ? 'approved'
      : 'awaitingManager',
  set: ({ to, now }) => ({
    approvedAt: to === 'approved' ? now.toISOString() : null,
  }),
},

// onEnter
approved: [requestPayment],
```

`route` must return one of the declared `to` values, or the transition is refused with `INVALID_ROUTE`. It reads the record as it was before this transition's writes, so an amount arriving in this action's `input` has to be validated and read from the input explicitly. `onEnter` starts the payment whichever way `approved` was reached — this route, or a manager's later decision.

### 2. Approve through several levels

A request passes a manager and then finance. One `approve` action covers every stage; `route` picks the next stage from the current state and `set` moves the approver.

```ts
const NEXT = { awaitingManager: 'awaitingFinance', awaitingFinance: 'approved' };

// transitions
approve: {
  title: 'Approve',
  from: ['awaitingManager', 'awaitingFinance'],
  to: ['awaitingFinance', 'approved'],
  guard: ({ record, actor }) =>
    actor.id === record.approverId || {
      code: 'approverOnly',
      message: 'Only the current approver can decide.',
    },
  route: ({ record }) => NEXT[record.status],
  set: ({ record, to, services }) => ({
    approverId: to === 'approved' ? null : services.org.approverFor(to, record),
  }),
},
returnToApplicant: {
  from: ['awaitingManager', 'awaitingFinance'],
  to: 'draft',
  guard: approverOnly,
  validate: (input) =>
    input.reason ? null : [{ field: 'reason', message: 'Give a reason.' }],
  accept: ['reason'],
  set: () => ({ approverId: null }),
},

// onEnter
awaitingFinance: [notifyApprover],
approved: [notifyApplicant],
```

The same guard and the same button serve every level, and the log shows each decision with its level as `from` and `to`. The library supplies no organization chart, delegation policy or permission model: keep the approver on the record or resolve it through the plugin's services.

### 3. Hand over, escalate, reassign

A transition whose `from` equals its `to` changes fields without changing the stage. It still increments the version, writes a log entry and updates `statusChangedAt`, so a trigger starts its wait again.

```ts
// transitions
transfer: {
  title: 'Hand over',
  from: 'awaitingManager',
  to: 'awaitingManager',
  guard: approverOnly,
  validate: (input) =>
    typeof input.to === 'string' && input.to
      ? null
      : [{ field: 'to', message: 'Choose who takes it.' }],
  set: async ({ input, services }) => {
    await services.org.requireApprover(input.to); // reads through the transaction
    return { approverId: input.to };
  },
  effects: [notifyApprover],
},
escalate: {
  from: 'awaitingManager',
  to: 'awaitingManager',
  guard: ({ record, actor, services }) => {
    if (actor.system !== true)
      return { code: 'systemOnly', message: 'Escalation is automatic.' };
    return services.org.managerOf(record.approverId) !== undefined || {
      code: 'topApprover',
      message: 'The current approver is already the highest level.',
    };
  },
  set: ({ record, services }) => ({
    approverId: services.org.managerOf(record.approverId),
  }),
},

// triggers
escalateStale: {
  transition: 'escalate',
  when: 'awaitingManager',
  after: ({ escalateAfterDays }) => escalateAfterDays * 86_400_000,
},
```

Entering a state again runs its `onEnter` effects, so a notification that belongs only to the hand-over goes on the transition's own `effects`, as above, rather than on `onEnter.awaitingManager`. A service that `set` reads must be bound to the transaction (see [the guide](guide.md#read-other-tables-from-a-guard)). A record whose guard refuses the trigger — one already at the top approver — is passed over by the sweep and does not hold up the records behind it.

### 4. Withdraw or reopen

A request may be withdrawn from any stage under way; a closed ticket may be reopened by its customer for seven days.

```ts
// request transitions
withdraw: {
  title: 'Withdraw',
  from: { except: ['draft', 'approved'] }, // every non-final state but these
  to: 'draft',
  guard: applicantOnly,
  set: () => ({ approverId: null }),
},

// ticket transitions, in another lifecycle
reopen: {
  from: 'closed',
  to: 'open',
  guard: ({ record, actor, now }) => {
    if (actor.id !== record.customerId)
      return { code: 'customerOnly', message: 'Only the customer can reopen.' };
    return (
      now.getTime() - Date.parse(record.statusChangedAt) < 7 * 86_400_000 || {
        code: 'reopenExpired',
        message: 'The ticket closed too long ago to reopen.',
      }
    );
  },
},
```

`except` and `'*'` cover non-final states only, so a reopenable `closed` is not marked `final`. They also pick up every state added later; list the source states by name when adding a stage should force a deliberate decision about withdrawal. The window above counts from the last transition; if other self-transitions in `closed` must not extend it, write a `closedAt` field in `set` and compare with that. Withdrawing while an effect is still working on the record is [section 12](#12-refuse-while-an-effect-is-in-flight).

### 5. Freeze a rule at submission

Parameters are read when a transition fires, so a limit an administrator changes applies to records still on their way. To judge a record by the rule in force when it was submitted, copy the rule onto the record and read it back from there.

```ts
submit: {
  from: 'draft',
  to: ['approved', 'awaitingManager'],
  route: ({ record, parameters }) =>
    record.amountCents <= parameters.autoApproveLimitCents
      ? 'approved'
      : 'awaitingManager',
  set: ({ parameters }) => ({
    autoApproveLimitAtSubmit: parameters.autoApproveLimitCents,
  }),
},
// Later transitions and effects read record.autoApproveLimitAtSubmit.
```

The same applies to effects: an effect reads the record when its attempt starts, not as it was when the transition fired. Payment terms that must not change while a payment is pending are either kept immutable in those states or captured onto the record by the transition that starts the payment.

## Time

### 6. Expire an idle request

A pending request expires after 72 hours of nobody acting on it.

```ts
// parameters
{ expireAfterHours: 72 }

// transitions
expire: {
  from: 'pending',
  to: 'expired', // a final state
  guard: systemOnly,
  effects: [notifyApplicant],
},

// triggers
expireStale: {
  transition: 'expire',
  when: 'pending',
  after: ({ expireAfterHours }) => expireAfterHours * 3_600_000,
  batchSize: 100, // transitions fired per sweep
},
```

Sweeps run only when something calls `runTriggers()`; `createLifecycleJobs()` schedules them. A record expires on the first sweep after the threshold, not at an exact instant, so the sweep interval bounds the delay. The wait counts from the last transition, self-transitions included.

### 7. Remind before escalating

A manager is reminded after two idle days and passed over after three. The reminder is not a trigger.

A trigger can only fire a transition, and a reminder that changes nothing would be a self-transition — which updates `statusChangedAt`. Two triggers on `awaitingManager`, a reminder at two days and an escalation at three, therefore never escalate: every reminder restarts the three days, and the next reminder comes first. Keep the reminder out of the lifecycle: the sweep sends it and records that it did in a field of the plugin's own.

```ts
// triggers: the escalation only
escalateStale: {
  transition: 'escalate',
  when: 'awaitingManager',
  after: ({ escalateAfterDays }) => escalateAfterDays * 86_400_000,
},

// escalate's set also clears the mark, so the next approver is reminded too
set: ({ record, services }) => ({
  approverId: services.org.managerOf(record.approverId),
  remindedAt: null,
}),

// createLifecycleJobs({ onSweep })
onSweep: async () => {
  const cutoff = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const idle = await database.repository('expenses').findMany({
    filter: (f) =>
      f.and([
        f.string('status').eq('awaitingManager'),
        f.date('statusChangedAt').before(cutoff),
        f.date('remindedAt').empty(),
      ]),
    limit: 100,
  });
  for (const record of idle) {
    // Claim the reminder on the version that was read: a record that moved on is left alone,
    // and two instances sweeping at once remind once.
    const { updatedCount } = await database.repository('expenses').updateMany({
      filter: {
        id: record.id,
        status: 'awaitingManager',
        lifecycleVersion: record.lifecycleVersion,
        remindedAt: null,
      },
      values: { remindedAt: new Date().toISOString() },
    });
    if (updatedCount) await mail.send(record.approverId, 'An expense report awaits you');
  }
},
```

`remindedAt` is an ordinary field, not one the lifecycle manages, so writing it directly is allowed and changes neither the version nor the log. A reminder sent after its claim is at most once: a crash between the two loses it, which suits a reminder. One that must arrive is a child record with its own lifecycle and an effect.

### 8. Act on a record's own deadline

An invoice is overdue the moment its own `dueAt` passes. A trigger cannot express that — `after` receives the parameters, not the record — so the sweep selects the due records and fires the transition on each.

```ts
// transitions
markOverdue: {
  from: 'unpaid',
  to: 'overdue',
  guard: systemOnly,
  effects: [remindCustomer],
},

// createLifecycleJobs({ onSweep })
onSweep: async () => {
  const due = await database.repository('invoices').findMany({
    filter: (f) =>
      f.and([
        f.string('status').eq('unpaid'),
        f.date('dueAt').before(new Date().toISOString()),
      ]),
    sort: (s) => s.field('dueAt').asc(),
    limit: 100,
  });
  for (const invoice of due) {
    try {
      await runtime.fire('invoices', invoice.id, 'markOverdue', {
        actor: SYSTEM_ACTOR,
        requestId: `overdue:${invoice.id}`, // another instance's sweep becomes a replay
      });
    } catch (error) {
      // Paid since it was read: no longer this sweep's business.
      if (!(error instanceof LifecycleError && error.code === 'INVALID_STATE')) throw error;
    }
  }
},
```

Index `(status, dueAt)` for the query. A record paid between the query and the fire is refused with `INVALID_STATE`; anything else is a real failure and is thrown, which fails the sweep step and is logged.

## Effects and the outside

### 9. A background process in steps

An order reserves stock, then ships, and goes to backorder when the reservation fails. Each intermediate state names the step under way, and each step is an effect that fires the next transition when it finishes.

```ts
const reserveStock = defineEffect({
  name: 'orders.reserveStock',
  retry: { attempts: 3, backoffMs: 5_000, factor: 2 },
  onSuccess: 'reserved', // fired as the system with the result as input
  onFailure: 'backordered', // fired as the system with { error } as input, plus errorCode and details for an EffectFailure
  run: ({ record, idempotencyKey, services }) =>
    services.inventory.reserve(record.items, { idempotencyKey }),
});

const createShipment = defineEffect({
  name: 'orders.createShipment',
  retry: { attempts: 5, backoffMs: 10_000 },
  onSuccess: 'shipped',
  run: ({ record, idempotencyKey, services }) =>
    services.carrier.book(record.address, { idempotencyKey }),
});

// transitions
submit:       { from: 'draft',     to: 'reserving', guard: clerkOnly,  effects: [reserveStock] },
reserved:     { from: 'reserving', to: 'shipping',  guard: systemOnly, effects: [createShipment] },
backordered:  { from: 'reserving', to: 'backorder', guard: systemOnly, accept: ['error'] },
shipped:      { from: 'shipping',  to: 'done',      guard: systemOnly, accept: ['trackingNumber'] },
retryReserve: { from: 'backorder', to: 'reserving', guard: clerkOnly,  effects: [reserveStock] },
```

A process that stops between steps leaves the record in `reserving` or `shipping` with its next run recorded. `reclaim()` on any instance's sweep hands the run over again once it has waited a lease — a queued run whose dispatch was lost, or an attempt that was running when its process stopped — and `recover()` does so when a process next starts. Either way the run carries the same idempotency key. `accept` copies `trackingNumber` from the effect's result onto the record, and the continuations are guarded to the system so a person cannot click them.

### 10. Pay and continue after the external call

Approval starts a payment after commit. A successful payment writes its reference through another transition; a declined card is not retried, and exhausted retries move the report to a state a person looks at.

```ts
const requestPayment = defineEffect({
  name: 'expenses.requestPayment',
  retry: {
    attempts: 3,
    backoffMs: 2_000,
    factor: 2,
    // A decline is an answer, not an outage: retrying it changes nothing.
    shouldRetry: (error) => !(error instanceof PaymentDeclined),
  },
  timeoutMs: 10_000, // below the runtime's leaseMs
  onSuccess: 'paid',
  onFailure: 'paymentFailed',
  run: async ({ record, services, signal }) => {
    try {
      const payment = await services.payments.pay({
        amountCents: record.amountCents,
        recipientId: record.applicantId,
        // One key per report, not per run: see below.
        idempotencyKey: `expense-payment:${record.id}`,
        signal,
      });
      return { paymentRef: payment.reference };
    } catch (error) {
      // A frozen account is an answer: fail at once, with a code to branch on.
      if (error instanceof PayeeFrozen)
        throw new EffectFailure('payeeFrozen', 'The payee account is frozen.', {
          details: { payeeId: record.applicantId },
        });
      throw error;
    }
  },
});

// onEnter
approved: [requestPayment],

// transitions
paid: {
  from: 'approved',
  to: 'paid',
  guard: systemOnly,
  accept: ['paymentRef'],
},
paymentFailed: {
  from: 'approved',
  to: ['paymentNeedsAttention', 'needsNewAccount'],
  guard: systemOnly,
  // input is { error, errorCode, details } for an EffectFailure, { error } otherwise.
  route: ({ input }) =>
    input.errorCode === 'payeeFrozen' ? 'needsNewAccount' : 'paymentNeedsAttention',
  accept: ['error'],
},
retryPayment: {
  from: 'paymentNeedsAttention',
  to: 'approved', // re-enters approved, so requestPayment runs again as a new run
  guard: financeOnly,
},
```

The effect's own `idempotencyKey` is the same on every attempt of one run, but `retryPayment` re-enters `approved` and so creates a new run with a new key. If an earlier attempt did pay and only its response was lost — a timeout, say — a key per run would let the second run pay again. The business key above, one per report, makes the payment service refuse the duplicate; where the service has no idempotency, look the payment up by that key before paying.

An effect that knows why it failed throws an `EffectFailure`: it is not retried unless it passes `retry: true`, and `onFailure` receives its `code` as `errorCode` and its `details` as they are, so the route branches on a code rather than on the wording of a message.

`retryRun()` on the failed run is refused with `RUN_SETTLED` once `paymentFailed` has moved the report on: a payment made now would leave the report waiting for attention with the money gone, because `paid` cannot start from `paymentNeedsAttention`. Recover through the record's own transitions, as `retryPayment` does here. When the provider confirms the failed attempts paid nothing, `retryRun(id, { force: true, reason })` runs it anyway, and a success still continues only if the state allows `onSuccess`. A continuation's log entry carries `$run:<runId>:failed` or `:succeeded` as its `requestId`, which is how the runtime knows, and why a run continues its record at most once per outcome. Pass `signal` to services that can cancel.

### 11. Confirm by webhook

When the provider confirms asynchronously, the effect only starts the payment and the provider's callback fires the transition. The sender's event id, namespaced by source, is the `requestId`, so a redelivered callback is a replay rather than a second transition.

```ts
const requestPayment = defineEffect({
  name: 'expenses.requestPayment',
  retry: { attempts: 3, backoffMs: 2_000 },
  // No onSuccess: the provider's callback moves the record on.
  run: ({ record, services }) =>
    services.payments.start(record.applicantId, record.amountCents, {
      idempotencyKey: `expense-payment:${record.id}`,
    }),
});

router.post('/payments/callback', async (c) => {
  const event = await services.payments.verify(c); // authenticate the sender first
  try {
    await runtime.fire(
      'expenses',
      event.metadata.expenseId,
      event.ok ? 'paid' : 'paymentFailed',
      {
        actor: SYSTEM_ACTOR,
        requestId: `payments:${event.id}`,
        input: event.ok
          ? { paymentRef: event.reference }
          : { error: event.failureReason },
      },
    );
  } catch (error) {
    // The record has moved on or is gone, or the event's id already carried
    // the other outcome: acknowledge, so the provider stops retrying.
    if (
      error instanceof LifecycleError &&
      (error.code === 'INVALID_STATE' ||
        error.code === 'RECORD_NOT_FOUND' ||
        error.code === 'REQUEST_REUSED')
    )
      return c.body(null, 204);
    // A conflict or a database failure answers 500, and the provider retries.
    throw error;
  }
  return c.body(null, 204);
});
```

A replay returns the first log entry with `replayed: true` and the record as it is now. The same `requestId` sent for another transition, or by another actor, is not a replay but `REQUEST_REUSED`, and changes nothing. Acknowledge only what can never succeed; a `CONFLICT` may succeed on the provider's next delivery, and a store failure certainly should be retried.

### 12. Refuse while an effect is in flight

A report whose payment is queued or running cannot be withdrawn: withdrawing would not stop the payment, which would go through and then find its `paid` continuation refused. The guard looks for the run through the transition's own transaction.

```ts
// The plugin's service, bound to the transaction like any other a guard reads.
// available(), view() and can() ask the guard outside any transaction and
// hand the factory no handle: read through the database manager then.
const effectRuns = {
  bound: (handle) => ({
    inFlight: (lifecycle, recordId, effect) =>
      (handle ?? database)
        .repository('lifecycleEffectRuns') // the store's effectRuns collection
        .count({
          filter: (f) =>
            f.and([
              f.string('lifecycle').eq(lifecycle),
              f.string('recordId').eq(String(recordId)),
              f.string('effect').eq(effect),
              f.or([f.string('status').eq('queued'), f.string('status').eq('running')]),
            ]),
        }),
  }),
};
runtime.register(expenseLifecycle, {
  services: (handle) => ({ runs: effectRuns.bound(handle), ...others(handle) }),
});

// transitions
withdraw: {
  from: { except: ['draft'] },
  to: 'draft',
  guard: async ({ record, actor, services }) => {
    if (actor.id !== record.applicantId)
      return { code: 'applicantOnly', message: 'Only the applicant can withdraw.' };
    const paying = await services.runs.inFlight('expenses', record.id, 'expenses.requestPayment');
    return paying === 0 || {
      code: 'paymentInFlight',
      message: 'A payment is being made; wait for it to finish.',
    };
  },
},
```

Do not call `runtime.listEffectRuns()` from a guard. It reads through the runtime's own connection, outside the transaction the guard runs in, and on SQLite it waits forever for the connection that transaction holds. Where refusing is not acceptable, let the withdrawal through and compensate instead: an effect on `withdraw` that cancels queued runs with `cancelRun()` and refunds a payment that completed anyway. `cancelRun()` cannot stop an attempt already running in another process; it only discards that attempt's outcome.

### 13. Write related data with the transition

Confirming an order must reserve stock in the same database transaction, and a failed reservation must leave the order unconfirmed.

```ts
runtime.register(orderLifecycle, {
  services: (handle) => ({ stock: stockService.bound(handle) }),
});

// transitions
confirm: {
  from: 'draft',
  to: 'confirmed',
  guard: purchaserOnly,
  onTransition: async ({ record, entry, services }) => {
    await services.stock.reserveOrThrow(record.id, { transitionId: entry.id });
  },
  effects: [sendConfirmation],
},
```

`onTransition` runs after the record and the log entry are written, in the same transaction; throwing rolls back the state, the log entry and the reservation together. The service must use the transaction it was bound to and enforce availability atomically. An approval comment row, an audit row or a reservation belong here; a remote warehouse API does not, because a database rollback cannot undo an HTTP call — that is an effect with a follow-up transition, as in [section 9](#9-a-background-process-in-steps).

## Several records

### 14. Wait for every signer

Every assigned reviewer must agree; one objection ends the review. The record keeps who has signed, and `route` keeps the task in `signing` until the last agreement.

```ts
// transitions
sign: {
  title: 'Countersign',
  from: 'signing',
  to: ['signing', 'approved', 'rejected'],
  guard: ({ record, actor }) =>
    (record.assignees.includes(actor.id) &&
      !record.signedBy.includes(actor.id)) || {
      code: 'notYourTurn',
      message: 'Only an assignee who has not signed yet can countersign.',
    },
  validate: (input) =>
    input.decision === 'agree' || input.decision === 'reject'
      ? null
      : [{ field: 'decision', message: 'Choose a decision.' }],
  route: ({ record, actor, input }) => {
    if (input.decision === 'reject') return 'rejected';
    const signed = new Set([...record.signedBy, actor.id]);
    return record.assignees.every((id) => signed.has(id))
      ? 'approved'
      : 'signing';
  },
  set: ({ record, actor }) => ({ signedBy: [...record.signedBy, actor.id] }),
},
```

Create the record with `signedBy: []` and a non-empty `assignees`. Two signers acting at once both read the same `signedBy`; the second write fails its version check with `CONFLICT`, the page reloads, and they sign again on the updated list. Because entering `signing` again would re-run `onEnter.signing`, put the invitation on the transition that first enters review. For individual decisions with their own comments and deadlines, use child records instead of a growing array ([next section](#15-wait-for-child-tasks)).

### 15. Wait for child tasks

A document has several extraction tasks, each a record with its own lifecycle and a `parentId`. The document finishes when no task is still open — by its owner's hand, or by the system when the last task closes.

```ts
runtime.register(documentLifecycle, {
  services: (handle) => ({ tasks: taskService.bound(handle), runtime }),
});

// parent transitions
complete: {
  from: 'processing',
  to: 'done',
  guard: async ({ record, actor, services }) => {
    if (actor.system !== true && actor.id !== record.ownerId)
      return { code: 'ownerOnly', message: 'Only the owner can finish.' };
    return (await services.tasks.countOpen(record.id)) === 0 || {
      code: 'openTasks',
      message: 'Finish the outstanding tasks first.',
      kind: 'precondition', // the owner may act once they are done: 400, not 403
    };
  },
},
```

The guard admits the system as well as the owner, so the last task can finish the document. The open tasks are a `precondition` rather than a missing permission, so the owner's route answers `400 FAILED_PRECONDITION` and the page says what is outstanding, while a stranger still gets `403`. Give the task's finishing transition an effect that does so:

```ts
const nudgeParent = defineEffect({
  name: 'tasks.nudgeParent',
  retry: { attempts: 3, backoffMs: 1_000 }, // a CONFLICT is worth another look
  run: async ({ record, services }) => {
    if ((await services.tasks.countOpen(record.parentId)) > 0)
      return { waiting: true };
    try {
      await services.runtime.fire('documents', record.parentId, 'complete', {
        actor: SYSTEM_ACTOR,
      });
      return { completed: true };
    } catch (error) {
      // Finished by its owner already, or another task reopened: nothing to do.
      if (
        error instanceof LifecycleError &&
        (error.code === 'INVALID_STATE' || error.code === 'GUARD_REJECTED')
      )
        return { completed: false, reason: error.code };
      throw error; // a CONFLICT or a failure: retry
    }
  },
});
```

The guard alone is not enough when another transaction can create a child while the completion is being decided. Create children in a transaction that first touches the parent while it is still in the right state, bumping its version, so a `complete` decided on a stale count meets a conflict, and create the child through its own lifecycle inside that transaction:

```ts
async createTask(parentId, values) {
  return this.database.transaction(async (connection) => {
    const open = await connection.repository('documents').updateMany({
      filter: { id: parentId, status: 'processing' },
      values: { lifecycleVersion: { increment: 1 } },
    });
    if (open.updatedCount === 0) return undefined; // the parent moved on
    const { record } = await this.runtime.create(
      'tasks',
      { ...values, parentId },
      { actor: SYSTEM_ACTOR, transaction: connection },
    );
    return record;
  });
}
```

`transaction: connection` nests the creation in the caller's transaction as a savepoint: the child gets its `$create` log entry and owes its initial state's `onEnter` effects, which are dispatched once the outer transaction commits and dropped if it rolls back. A refused creation undoes only its own writes, so the caller may catch it and go on. The same option on `fire()` lets a child's last transition move its parent on in the same commit, from `onTransition` with its `transactionHandle`, instead of through `nudgeParent`: a parent that refuses then refuses the child's transition too, rather than leaving it finished with a parent that never heard. Keep the effect where the parent may legitimately say no, or be busy, without the child having to wait for it. Decide as explicitly how reopening a task relates to a parent that is already `done`. `OfficeStore.createExtraction()` in the office flows example touches the parent the same way, and inserts the task directly.

### 16. Dispatch sub-records repeatedly

A document in `dispatching` can be dispatched several times. Each dispatch is a self-transition whose input names the rows to send, and whose effect claims each row and creates its child under a unique key, so a retried effect creates nothing twice.

```ts
// transitions
dispatchClerks: {
  from: 'dispatching',
  to: 'dispatching',
  guard: registrarOnly,
  validate: (input) =>
    Array.isArray(input.rowIds) && input.rowIds.length
      ? null
      : 'There are no rows to dispatch.',
  effects: [dispatchClerks],
},

const dispatchClerks = defineEffect({
  name: 'incoming.dispatchClerks',
  retry: { attempts: 3, backoffMs: 1_000 },
  run: async ({ record, input, idempotencyKey, services }) => {
    // Claims each row (dispatched: false → true) and creates its task in one transaction.
    const result = await services.store.dispatch(1, input.rowIds);
    // A ledger keyed by (root, level, recipient): nobody is reminded twice.
    await services.store.notify({
      rootId: record.id,
      level: '1',
      recipients: result.recipients,
      message: `Document ${record.title} was distributed to you.`,
    });
    // The run's key has a unique index: one trace however many attempts run.
    await services.store.trace({
      key: idempotencyKey,
      docId: record.id,
      action: 'dispatch',
      detail: result,
    });
    return { created: result.created.length };
  },
});
```

The effect is written so that every step may run twice: a row already claimed is reported again rather than skipped, so a retry after the reminders failed still sends them, while the ledger and the keyed trace keep the repeats from writing twice.

### 17. Two lifecycles on one record

An order has a fulfilment stage and a payment stage that move independently. Each is its own lifecycle on the same collection, with its own state, timestamp and version fields.

```ts
const orderLifecycle = defineLifecycle({
  name: 'orders',
  collection: 'orders',
  stateField: 'status',
  changedAtField: 'statusChangedAt',
  versionField: 'lifecycleVersion',
  transitions: {
    ship: {
      from: 'packed',
      to: 'shipped',
      guard: ({ record }) =>
        record.paymentStatus === 'paid' || {
          code: 'unpaid',
          message: 'The order is not paid yet.',
        },
    },
    // …
  },
});

const orderPaymentLifecycle = defineLifecycle({
  name: 'orderPayments',
  collection: 'orders',
  stateField: 'paymentStatus',
  changedAtField: 'paymentStatusChangedAt',
  versionField: 'lifecycleVersion', // shared on purpose: see below
  transitions: {
    refund: {
      from: 'paid',
      to: 'refunded',
      guard: ({ record }) =>
        record.status !== 'shipped' || {
          code: 'shipped',
          message: 'A shipped order is returned, not refunded.',
        },
    },
    // …
  },
});
```

The changed-at fields must differ, or one lifecycle's transitions restart the other's triggers. The version field is the real decision. With separate version fields the two never conflict, but rules that read each other's state — ship only when paid, refund only when not shipped — can both pass at once: `ship` and `refund` each check a field the other is changing, each conditional update sees its own version unchanged, and the order ends up shipped and refunded. Sharing one version field makes every transition of either lifecycle conflict with any concurrent one, which closes that gap at the price of conflicts between unrelated transitions. Share it when the lifecycles constrain each other, and separate it only when they do not.

The library protects a lifecycle's own three fields from its `set` and `accept`, not the other lifecycle's: `set` in `orders` could write `paymentStatus` and bypass `orderPayments` entirely. Never let one lifecycle write the other's fields; to move the other, fire its transition.

### 18. Act on many records at once

An approver selects twenty reports and approves them in one click. Each report is its own transaction: some may succeed and others be refused, and the result says which.

```ts
// The page sends the versions it showed and one key for this click.
router.post('/expenses/approve-many', async (c) => {
  const { batchId, items } = await c.req.json(); // items: [{ id, version }]
  const actor = { id: String(c.get('auth').user.id) };
  const results = [];
  for (const { id, version } of items) {
    try {
      await runtime.fire('expenses', id, 'approve', {
        actor,
        requestId: `${batchId}:${id}`, // a retried click replays, item by item
        expect: { version },
      });
      results.push({ id, ok: true });
    } catch (error) {
      if (!(error instanceof LifecycleError)) throw error;
      results.push({ id, ok: false, code: error.code, message: error.message });
    }
  }
  return c.json({ results });
});
```

Every item is checked against the version the page showed, so a report that changed since is reported as `CONFLICT` rather than approved blind; the page shows the refusals and reloads them. There is no all-or-nothing across records. If the batch must succeed or fail as a whole, it is a record of its own — a batch with a lifecycle — not a loop of fires.

## Extending and adopting

### 19. Add a rule from another plugin

A budget plugin vetoes approvals while a budget is frozen, without touching the expense definition. Its refusal joins the other blockers on the page and in the `fire()` error.

```ts
const removeGuard = runtime.addGuard(
  'expenses',
  ['approve'],
  async ({ record, services }) => {
    const frozen = await services.budgets.isFrozen(record.budgetId);
    return (
      !frozen || { code: 'budgetFrozen', message: 'This budget is frozen.' }
    );
  },
);

// When the extension shuts down:
removeGuard();
```

`addGuard()` injects no services: `services.budgets` must already be part of what the lifecycle was registered with, bound to the transaction. If freezing a budget must serialize with approvals in flight, enforce that in the database too; a guard sees the budget as it is at decision time. Follow-up work that must happen is an effect, not a listener.

### 20. A to-do list from announce

`announce` fires once per transition the new state allows, which is what a to-do list needs: a person's pending work is the set of records with a transition they may fire.

```ts
runtime.on('announce', { lifecycle: 'expenses' }, async ({ record, next }) => {
  if (next !== 'approve') return;
  await todos.upsert({
    key: `expenses:${record.id}:approve`,
    assignee: record.approverId,
    title: `Approve ${record.title}`,
  });
});
runtime.on('completed', { lifecycle: 'expenses' }, async ({ record }) => {
  await todos.remove({ key: `expenses:${record.id}:approve` });
});
```

Delivery is best effort: a listener that throws is logged, and nothing is redelivered after a crash. Rebuild the list from the records when that matters, or make each to-do a child record with its own lifecycle.

### 21. Configuration: fields, initial states and administrator parameters

A contract lifecycle runs on an existing table whose columns have other names, accepts contracts imported already signed, and lets an administrator change its waiting times.

```ts
const contractLifecycle = defineLifecycle({
  name: 'contracts', // unique in the application, and the name stored in the log
  collection: 'crmContracts', // defaults to the name
  stateField: 'stage', // defaults to 'status'
  changedAtField: 'stageChangedAt', // defaults to 'statusChangedAt'
  versionField: 'stageVersion', // defaults to 'lifecycleVersion'
  initial: ['draft', 'signed'], // the first is the default; the others must be asked for
  create: {
    validate: (values) =>
      values.customerId
        ? null
        : [{ field: 'customerId', message: 'Choose a customer.' }],
    // Only an import may create a contract already signed.
    guard: ({ state, actor }) =>
      state !== 'signed' ||
      actor.system === true ||
      'Only an import creates signed contracts.',
  },
  parameters: { remindAfterDays: 14 },
  // …
});

// An import creates records already signed, with a log entry saying where they came from.
await runtime.create('contracts', values, {
  actor: SYSTEM_ACTOR,
  state: 'signed',
  input: { source: 'import:2026-10' },
});

// Administrator overrides: read once, refreshed when the setting changes.
let overrides = await settings.read('contracts');
settings.onChange('contracts', (next) => {
  overrides = next;
});
runtime.register(contractLifecycle, {
  parameters: () => overrides, // called on every transition and sweep
});
```

`parameters` is called synchronously on every transition and every sweep, so it reads memory, never the database: an `async` function is refused by the type checker, and its promise would otherwise be spread into nothing and the defaults used silently. With several instances, each keeps its own copy, so `onChange` must reach all of them — through the application's pub/sub, or by restarting. `create` is checked by every `runtime.create()`, whichever route, import or script calls it: `validate` reads the values first, then `guard` sees the values, the state asked for and the actor, and refuses as a transition's guard does, so the create form shows the same blockers and problems.

### 22. Adopt an existing table

An `expenses` table already exists, with a `status` column written by forms. Adopting a lifecycle adds two columns, fills them for the rows already there, creates the log tables, and removes every other write to `status` in the same release.

```ts
// A new migration, for example 202611010001_expenses_adopt_lifecycle
async up({ builder, query }) {
  await builder.alterCollection('expenses', (table) => {
    table.datetimeTz('statusChangedAt'); // nullable: existing rows have no value yet
    table.integer('lifecycleVersion').notNull().defaultTo(0);
    table.index(['status', 'statusChangedAt']);
  });
  // Existing rows have waited since their last update.
  await query
    .updateTable('expenses')
    .set((eb) => ({ statusChangedAt: eb.ref('updatedAt') }))
    .where('statusChangedAt', 'is', null)
    .execute();
  // Then lifecycleTransitions and lifecycleEffectRuns, as in a new plugin.
},
```

Before deploying, check that every value already in `status` is a state of the definition (`select distinct status`); a row in an unknown state has no transition and is never swept. Existing rows start at version 0 and have no `$create` entry, so their history starts at their first transition. A row whose `statusChangedAt` stays empty is invisible to triggers, which is why the backfill matters. Old form handlers, imports and SQL scripts that wrote `status` must go in the same release: anything still writing it bypasses the guards, the log and the version check.

## Operating

### 23. An operations page

An operator sees the failed and dead runs across all records, the runs whose continuation waits and those whose continuation the sweep gave up on, retries, continues or cancels them, and old finished runs are pruned.

```ts
// The plugin's own route: the record routes only operate the runs of one record.
router.get(
  '/expenses/effectRuns',
  requireOperator, // the permission first, then the declaration and the validators
  describeRoute({ tags, summary: 'List effect runs', operationId: 'expensesListEffectRuns', responses }),
  apiValidator('query', ListRunsQuery), // { status?: 'failed' | 'dead' | 'queued', waiting?: boolean, abandoned?: boolean, pageSize }
  async (c) => {
    const { status, waiting, abandoned, pageSize } = c.req.valid('query');
    const runs = await runtime.listEffectRuns({
      lifecycle: 'expenses',
      ...(status ? { status } : {}),
      ...(waiting ? { continuationPending: true } : {}),
      // Given up on by the sweep: Continue by hand once the cause is fixed.
      ...(abandoned ? { continuationAbandoned: true } : {}),
      limit: pageSize,
    });
    return c.json({ data: runs, meta: { total: runs.length } });
  },
);

// createLifecycleJobs({ onSweep })
onSweep: async () => {
  await runtime.prune({ olderThan: new Date(Date.now() - 7 * 86_400_000) });
},
```

```tsx
function FailedRuns() {
  const { client } = useExpenseLifecycle('expenses', undefined); // no record selected: just the client
  const runs = useLoader(() => api.get('/expenses/effectRuns?status=failed')); // the plugin's own loader
  return runs.map((run) => (
    <Row key={run.id}>
      {run.effect} · {run.error} · {run.attempts}/{run.maxAttempts}
      {run.registered ? null : <Badge>unknown effect</Badge>}
      {run.continuation ? (
        // Its outcome is recorded; what follows it waits. Retry would refuse.
        <Button
          onClick={() =>
            client.continueRun(run.lifecycle, run.recordId, run.id)
          }
        >
          Continue {run.continuation.transition}: {run.continuation.error}
        </Button>
      ) : (
        <Button
          onClick={() => client.retryRun(run.lifecycle, run.recordId, run.id)}
        >
          Retry
        </Button>
      )}
      <Button
        onClick={() => client.cancelRun(run.lifecycle, run.recordId, run.id)}
      >
        Cancel
      </Button>
    </Row>
  ));
}
```

Retry, continue and cancel go through the record routes, behind the plugin's operator permission ([section 26](#26-permissions-on-the-record-routes)). A run marked `registered: false` names an effect this process does not know — usually a renamed effect: while it is queued, `retryRun()` refuses it with `INVALID_STATE`, as every queued run, and once it has failed, with `UNKNOWN_EFFECT`; register the old name again or cancel it. A `dead` run ended without recording an outcome on every attempt, typically because the process crashed in it: find out why before retrying. A retry grants a fresh budget of attempts and counts on from the ones before. A run whose `onFailure` already moved the record on is refused with `RUN_SETTLED`; recover through the record's transitions, or pass `{ force: true, reason }` to `client.retryRun()` when the failed attempts are known to have done nothing. A run whose `continuation` is set recorded its outcome but could not fire its `onSuccess` or `onFailure` yet, so the record has not moved. Most often a lifecycle call its `onTransition` or a hook made was refused — a parent not ready to move — and otherwise the running definition cannot fire it — a rolling deploy, or a bug in `set`. Such a run may be `succeeded`, so a page that lists only failed runs never shows it: list `continuationPending: true` and `continuationAbandoned: true` as well, and offer Continue rather than Retry, which refuses a failed one with `RUN_SETTLED`. The sweep tries it again until it fires or the record moves on, and gives up after ten refused tries — about four hours with the default backoff — marking it `abandonedAt`; `continuationAbandoned: true` lists those, and `prune()` never deletes them, since such a run may be the only record of a payment its report never followed. A parent not ready to move is seldom ready within those hours, so a continuation given up on usually needs a person: `runtime.continueRun(id)` tries one at once, given up on or not, once the cause is fixed. It never runs the effect again.

### 24. Duplicate requests and stale pages

A decision belongs to the version the person saw, and a transport retry belongs to the same decision.

```ts
const requestId = crypto.randomUUID(); // once per decision, reused by its retries
await runtime.fire('expenses', expenseId, 'approve', {
  actor,
  input: { comment: 'Within budget.' },
  requestId,
  expect: { version: displayedVersion },
});
```

A `CONFLICT` means the record changed since the page was loaded: reload and let the person decide again; do not retry with the newer version. A repeated `requestId` replays the earlier log entry, marked `replayed`, and returns the record as it is now; the same key sent for another transition is refused with `REQUEST_REUSED`, so a key spent on one decision cannot swallow another. The React hook sends a fresh key and the displayed version per `fire()` call, so calling it again is a new decision. For a webhook, derive the key from the sender's delivery id, namespaced by source, as in [section 11](#11-confirm-by-webhook).

### 25. A data fix as a transition

A record stuck in the wrong state is fixed with a transition only the system may fire, so the fix is logged and the version moves on. A script fires it for each record, keyed so that rerunning the script changes nothing.

```ts
// transitions
repair: {
  from: 'awaitingManager',
  to: 'draft',
  guard: systemOnly,
  validate: (input) => (input.reason ? null : 'Say why the record is being repaired.'),
  accept: ['reason'],
  set: () => ({ approverId: null }),
},

for (const id of stuckIds)
  await runtime.fire('expenses', id, 'repair', {
    actor: SYSTEM_ACTOR,
    input: { reason: 'Approver left the company; ticket OPS-123' },
    requestId: `repair:OPS-123:${id}`,
  });
```

Never update the state field directly: it bypasses the guards, the log, the effects and the version check, and leaves no record of who did it.

### 26. Permissions on the record routes

Guards express business rules; the routes' middleware is where access control goes. Check the permission ahead of `describeRoute()` and the validators, as every route does, so a caller without it is answered `403` whatever it sent, and map each transition to a permission when transitions need their own.

```ts
// Reading a record and its lifecycle.
router.use('/expenses/:expenseId', requirePermission('expenses', 'read'));
// Firing: which transition is in the body, so the check reads it.
router.post('/expenses/:expenseId/fire', async (c, next) => {
  const { transition } = await c.req.json<{ transition?: string }>();
  await c.var.authz.require({
    resource: { type: 'expenses' },
    action: `fire:${String(transition)}`,
  });
  await next();
});
// Operating runs is for operators only.
router.use(
  '/expenses/:expenseId/effectRuns/*',
  requirePermission('lifecycle', 'operate'),
);
```

The permission is checked before the lifecycle's own guards, so a person without it never learns the business reason, and a person with it still meets the guard's blockers on the page.

## Pages and tests

### 27. A record page: reasons, field problems, conflicts and meta

A page shows the actions the record allows, greys out the ones the person may not take with the reason in their language, marks input problems on the fields, reloads on a conflict, and takes button styles and confirmations from the definition.

```ts
// The definition carries what the page needs.
reject: {
  title: 'Reject',
  from: 'pending',
  to: 'rejected',
  meta: { tone: 'destructive', confirm: true },
  validate: (input) => (input.reason ? null : [{ field: 'reason', message: 'Give a reason.' }]),
  accept: ['reason'],
},
```

```tsx
function LeaveActions({ id }: { id: string }) {
  const { view, description, busy, fire, reload } = useLeaveLifecycle(
    'leaves',
    id,
  );
  const { t } = useTranslation(NAMESPACE);
  const [rejection, setRejection] = useState('');
  const [problems, setProblems] = useState<Record<string, string>>({});
  if (!view || !description) return null;

  // A stable code translates; the English message is the fallback.
  const explain = (b: Blocker) =>
    t(`blockers.${b.code}`, { defaultValue: b.message });
  const meta = (name: string) =>
    description.description.transitions.find((item) => item.name === name)
      ?.meta ?? {};

  const act = async (name: string, input: JsonObject = {}) => {
    if (meta(name).confirm && !window.confirm(t('confirm'))) return;
    try {
      await fire(name, input);
      setProblems({});
    } catch (error) {
      if (!(error instanceof LifecycleRequestError)) throw error;
      if (error.code === 'CONFLICT') {
        toast(t('changedReload'));
        await reload();
        return;
      }
      if (error.problems.length) {
        setProblems(
          Object.fromEntries(
            error.problems
              .filter((p) => p.field)
              .map((p) => [
                p.field!,
                t(`problems.${p.field}`, { defaultValue: p.message }),
              ]),
          ),
        );
        return;
      }
      toast(error.blockers.map(explain).join(' ') || error.message);
    }
  };

  return (
    <>
      <Textarea
        value={rejection}
        onChange={setRejection}
        error={problems.reason}
      />
      {view.available.map((item) => (
        <Button
          key={item.name}
          variant={meta(item.name).tone ?? 'default'}
          disabled={!item.allowed || busy}
          title={item.blockers.map(explain).join(' ')}
          onClick={() =>
            act(item.name, item.name === 'reject' ? { reason: rejection } : {})
          }
        >
          {item.title}
        </Button>
      ))}
    </>
  );
}
```

`view.available` and a refusal carry the same blockers, so the greyed-out button and the click say the same thing. A refusal from `validate` is `INVALID_INPUT` with `problems`, one per field where the definition named one, and comes before any guard is asked; a guard refusal is `GUARD_REJECTED` with `blockers`. A button whose answer depends on its input, one per line of a report, asks `runtime.can(name, id, 'approveLine', actor, { input: { line } })` rather than reading `available`, which asks with no input. `meta` is whatever JSON the definition puts there — the library only passes it through `describe()`. State titles and colours come the same way from `description.description.stateInfo`. The lifecycle example's `client/lib/api.ts` is the complete version of the translation.

### 28. Testing waits, retries and refusals

The test kit runs a lifecycle on a memory store with a clock to advance; `fire()` returns once every effect it caused, and every transition those fired, has finished. A retry with a backoff is the exception: it waits for the fake clock as it would wait for the real one, and runs on the `runDue()` after `advance()` has passed its `runAfter`. `retries: 'immediate'` runs every retry at once instead, for a test about what the attempts do rather than when.

```ts
const kit = createLifecycleTestKit(expenseLifecycle, {
  services: fakeServices,
  parameters: { escalateAfterDays: 3 },
  now: '2026-10-01T09:00:00Z',
});

it('escalates to the next manager after three idle days', async () => {
  const report = await kit.start(
    { applicantId: 'alice', amountCents: 800_000 },
    { actor: 'alice' },
  );
  await kit.fire(report, 'submit', {}, { actor: 'alice' });
  kit.advance({ days: 3, minutes: 10 });
  expect(await kit.runTriggers()).toBe(1);
  expect(kit.get(report)).toMatchObject({
    status: 'awaitingManager',
    approverId: 'carol',
  });
  expect(await kit.history(report)).toEqual(['$create', 'submit', 'escalate']);
});

it('pays after one failed attempt, once its backoff has passed', async () => {
  const report = await kit.start(
    { applicantId: 'alice', amountCents: 300_000 },
    { actor: 'alice' },
  );
  kit.failEffect('expenses.requestPayment', { times: 1 });
  await kit.fire(report, 'submit', {}, { actor: 'alice' });
  // requestPayment backs off 2 seconds before its second attempt.
  expect(kit.get(report).status).toBe('approved');
  kit.advance({ seconds: 1 });
  expect(await kit.runDue()).toBe(0);
  kit.advance({ seconds: 1 });
  expect(await kit.runDue()).toBe(1);
  expect(kit.get(report).status).toBe('paid');
  expect(await kit.effectRuns(report)).toMatchObject([
    { effect: 'expenses.notifyApplicant', status: 'succeeded' },
    { effect: 'expenses.requestPayment', status: 'succeeded', attempts: 2 },
  ]);
});

it('refuses an approval from anyone but the approver, and says why', async () => {
  const report = await kit.start(
    { applicantId: 'alice', amountCents: 800_000 },
    { actor: 'alice' },
  );
  await kit.fire(report, 'submit', {}, { actor: 'alice' });
  expect(await kit.can(report, 'approve', 'alice')).toMatchObject({
    allowed: false,
    blockers: [{ code: 'approverOnly' }],
  });
  await expect(
    kit.fire(report, 'approve', {}, { actor: 'alice' }),
  ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
});
```

The kit covers definitions; the Repository store, migrations, routes and sweeps need a database. A provider test on the test database (SQLite by default) with the plugin's migration applied covers that wiring once, as `tests/provider.test.ts` does in the lifecycle example.

## From a recipe to a working plugin

Create records with `runtime.create()` and change their state with `runtime.fire()`; keep the state and timestamp fields out of ordinary CRUD routes, and let an edit route touch the version only by incrementing it on the version it read, as [the guide](guide.md#advance-the-version-outside-the-lifecycle) describes. Declare the business and log tables in a self-contained migration, mount the routes behind authentication and `authorize`, start `createLifecycleJobs()`, configure the page hook once with `createLifecycleHook()`, and test refusals and failures with the kit. The [guide's checklist](guide.md#before-going-live) covers what remains before going live.

For complete source, read [the help desk and expense plugin](../../../examples/app-plugin-lifecycle-example/README.md), starting with its `server/lifecycles/`, and [the office flows plugin](../../../examples/app-plugin-office-flows-example/README.md) for parent-child coordination, distribution and countersigning. They include the application helpers these recipes leave out.
