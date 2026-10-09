# Concepts

A business record keeps its state in one of its own fields. Where an expense report stands is its `status`; there is no separate process instance table, so there are never two places that can disagree. Every change is a transition declared in source, and what has to happen after a change — a notification, a payment — runs after the transaction commits and can be retried.

## Why it is built this way

A typical process engine keeps a process instance of its own and mirrors a status onto the business record. The two copies drift: someone edits the record directly, or the engine writes the instance and the process dies before the record is written. Afterwards nobody can say which copy is right.

A lifecycle keeps one copy — the record's state field is the fact — so the runtime has to do three things well:

- **The state changes only through a declared transition.** Where it may start, where it goes, who may fire it and what input it needs are all in the definition.
- **A change happens completely or not at all.** The record, the log entry and the effects the transition owes are written in one database transaction.
- **Calls that leave the database stay out of the transaction.** Mail and payments run after commit, are retried by policy, and write their result back through another transition.

## The seven concepts

The examples below come from the expense report in `packages/examples/app-plugin-lifecycle-example`.

| Concept        | What it is                                                                                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State          | The stage a record is at, kept in its state field (`status` by default): `draft`, `awaitingManager`, `paid`. A final state is marked `final: true`                                                                         |
| Transition     | One named change, such as `submit`: `from` → `to`, optionally with `guard`, `validate`, `accept`, `route` and `set`                                                                                                        |
| Guard          | Answers "may this person do this now". When it refuses, it says why; the page shows the reason beside the greyed-out button, and a click is refused with the same reason                                                   |
| Effect         | Work a transition owes once it has committed: a notification, a payment request. It has retries, a timeout and a stable idempotency key, and may fire another transition on success or failure                             |
| Trigger        | Fires a transition on records that have stayed in a state longer than a parameter allows — a manager idle for three minutes is passed over. Records are found by a query, not by a timer per record                        |
| Transition log | One row per change: who, from where to where, the input, the version. A record's creation is a row too (`$create`), so its history starts where it does                                                                    |
| Runtime        | `LifecycleRuntime` fires transitions, runs effects and sweeps triggers. It keeps no state of its own — records, log and effect runs live in the store — so any process over the same store can carry on another one's work |

A definition looks like this, shortened from the example:

```ts
defineLifecycle<ExpenseTypes>({
  name: 'expenses',
  initial: 'draft',
  states: [
    'draft',
    'awaitingManager',
    'awaitingFinance',
    'needsInfo',
    'approved',
    { name: 'rejected', final: true },
    { name: 'paid', final: true },
  ],
  parameters: { autoApproveLimit: 5000, escalateAfterMinutes: 3 },
  transitions: {
    submit: {
      from: 'draft',
      to: ['approved', 'awaitingManager'],
      // The amount decides where it goes.
      route: ({ record, parameters }) =>
        record.amountCents <= parameters.autoApproveLimit * 100
          ? 'approved'
          : 'awaitingManager',
      // A refusal carries a stable code and a message.
      guard: ({ record, actor }) =>
        actor.id === record.applicantId || {
          code: 'applicantOnly',
          message: 'Only the applicant can do this with their report.',
        },
    },
    reject: {
      from: ['awaitingManager', 'awaitingFinance'],
      to: 'rejected',
      validate: reasonRequired,
      effects: [notifyApplicant],
    },
    paid: { from: 'approved', to: 'paid', accept: ['paymentRef'] },
  },
  // Whichever transition enters the state, these run.
  onEnter: { approved: [notifyApplicant, requestPayment] },
  triggers: {
    escalateStale: {
      transition: 'escalate',
      when: 'awaitingManager',
      after: ({ escalateAfterMinutes }) => escalateAfterMinutes * 60_000,
    },
  },
});
```

## What happens when a manager clicks "Approve"

1. **The page already knows the buttons.** `view()` returned the transitions the current state allows, each with `allowed` and its `blockers`, together with the record's version.
2. **The click carries a request key and the version.** The request key makes a repeated submission a replay instead of a second transition; the version says "I decided on version N", so a decision made on a page that has gone stale is refused.
3. **The decision and the writes are one transaction.** The state is checked, `validate` and then the guards run, the destination and the fields to write are computed, the record is updated on the condition that its state and version are unchanged, a log row is written, and the effects owed are recorded as queued runs.
4. **After commit, the effects run.** They go to the dispatcher — the application's jobs service, in the examples. A failure is retried by policy; a success may fire the next transition as the system, which is how a payment marks the report `paid`.
5. **Listeners are told.** Other code can subscribe to "this record completed that transition" to refresh a page or feed a to-do list. Delivery is best effort; work that must happen is an effect.

## Compared with the workflow plugin

They solve different problems and can coexist.

|                        | Workflow plugin                            | Lifecycle                                                                               |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Who defines it         | An administrator, in the UI                | A developer, in the plugin's source                                                     |
| Where the state lives  | In the execution record, beside the record | In the record's own field                                                               |
| How the state changes  | A node executes                            | Only through a declared transition                                                      |
| Concurrency            | Per execution                              | A conditional update on state and version; the later request gets `CONFLICT`            |
| Why a button is greyed | Up to the page                             | The guard says why, and `available()` and the click use the same judgement              |
| Timeouts               | Delay nodes, scheduled jobs                | Triggers found by a query; a restart loses nothing                                      |
| Testing                | Mostly integration tests                   | A test kit with a memory store and a clock to advance; waits and retries are unit tests |

## When to use it

**Use it** when a business record has clear stages, the rules belong to developers, and someone will ask "who changed it to what, and when". Expense reports, tickets, contracts, orders and official documents are all this shape. A parent and its children may each have a lifecycle and point at each other by foreign key; the incoming documents and their distributed tasks in the office flows example do exactly that.

**Do not use it** when end users must draw the process themselves — that is the workflow plugin — or when all you want is a notification on a field change, which an ordinary hook does.

Five rules of thumb follow from the design:

1. The state lives only in the record's own field. Query, filter and count on it like any other column.
2. Only `fire()` changes the state. Forms, imports and generic CRUD never write it, and a data fix is a transition only the system may fire.
3. Anything that must happen outside the database is an effect. Do not send mail or call an API from `set` or a guard.
4. Fields that must change atomically with the state go in `set`, not in an effect, which runs outside the transaction.
5. Pass the effect's `idempotencyKey` to the external service. An effect runs at least once; running to effect exactly once is the key's job.

## Glossary

| In code                 | Meaning                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `lifecycle`             | The complete definition of one kind of record: states, transitions, effects and triggers |
| `state` / `final`       | A stage; a final state has no way out, and every other state must have one               |
| `transition`            | One named change of state                                                                |
| `guard` / `blocker`     | Whether it may be done, and the reasons it may not                                       |
| `validate` / `problems` | What is wrong with the input, per field                                                  |
| `accept`                | Input fields copied onto the record as they are                                          |
| `route`                 | Picks one destination when a transition declares several                                 |
| `set`                   | Other fields written in the same update as the state                                     |
| `effect` / `effect run` | Work owed after commit, and the record of each time it was run                           |
| `trigger`               | A transition fired on records idle in a state for too long                               |
| `actor` / `system`      | Who fired it; effect continuations and triggers fire as the system                       |
| `version` / `requestId` | Refuses a decision made on a stale page / makes a repeated request a replay              |
