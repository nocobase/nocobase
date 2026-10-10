---
title: 'Extension'
description: 'For developers who review or extend process code: extension points, rules from other plugins, events, adopting an existing table, and the API reference.'
---

# Extension

This page is for developers who review or extend the code the Agent generates; you do not need it for everyday development.

Processes are implemented by `@nocobase/lifecycle`. Its core idea is that **the record is the process**. A record's current step is kept in a field of the record itself, with no separate "process instance", so where a record stands is recorded in exactly one place. Every change of step is an action (transition) declared in source, which checks its conditions and writes the record and its history entry in one transaction; external work such as notifications and calls to external systems runs after the transaction commits.

```ts
import { defineLifecycle, type Lifecycle } from '@nocobase/lifecycle';

export const ticketLifecycle: Lifecycle<TicketTypes> =
  defineLifecycle<TicketTypes>({
    name: 'tickets',
    initial: 'open',
    states: ['open', 'awaitingCustomer', { name: 'closed', final: true }],
    parameters: { waitHours: 72 },
    transitions: {
      replyToCustomer: {
        from: 'open',
        to: 'awaitingCustomer',
        effects: [notifyCustomer], // external work run after commit
      },
      customerReplied: { from: 'awaitingCustomer', to: 'open' },
      close: { from: ['open', 'awaitingCustomer'], to: 'closed' },
    },
    triggers: {
      // after more than 72 hours in awaitingCustomer, the system fires close
      autoClose: {
        transition: 'close',
        when: 'awaitingCustomer',
        after: ({ waitHours }) => waitHours * 3_600_000,
      },
    },
  });
```

## Choosing an extension point

Before extending a process, ask one question: **must this succeed together with the action?** The answer decides whether it goes inside the action's transaction or after it, and what happens when it fails.

| Need                                   | Extension point                                      | When it runs                      | On failure                                                                    |
| -------------------------------------- | ---------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| Refuse an action and say why           | `guard`; from another plugin, `runtime.addGuard()`   | In the transaction, before writes | Refused; the reasons are shown together                                       |
| Write other data with the action       | `set` (same record); `onTransition` (other tables)   | In the transaction                | The whole action rolls back                                                   |
| Set up or end what a step waits for    | `onEnterState` / `onLeaveState`                      | In the transaction                | The whole action rolls back                                                   |
| Act on several records at once         | `runtime.transaction()`, `tx.fire()`, `tx.create()`  | One transaction                   | All of it rolls back                                                          |
| External work that must happen         | `effects` / `onEnter`                                | After commit, retried             | Retried by policy; after the final failure `onFailure` may move the record on |
| Refresh a page, a to-do list, an index | `runtime.on('completed' \| 'entered' \| 'announce')` | After commit, best effort         | Logged, not redelivered                                                       |

Extension points inside the transaction must not reach outside the database: every call to an external system is external work.

Deliberately not provided: a visual designer, nested steps and parallel branches (use child records instead), reliable event delivery (reliability belongs to external work), a migration helper, and permissions (handled by the application's [authorization](../authorization/index.md)).

## Adding rules from another plugin

Without changing the process itself, another plugin can add a condition to given actions of a given process — for example, a risk plugin that freezes orders of suspicious customers:

```ts
const remove = runtime.addGuard(
  'orders',
  ['ship'],
  async ({ record, services }) =>
    !(await services.risk.isSuspicious(record.customerId)) || {
      code: 'customerUnderReview',
      message:
        'The customer is under risk review and the order cannot be shipped yet',
    },
);
```

- The second argument lists action names, and `'*'` means every action; the returned function removes the condition.
- The added condition runs in the action's transaction and may read other tables; its reason is shown together with the process's own.
- It applies to actions, not to creating a record: who may create one is decided only by `create.guard` in the definition.
- Plugins share one process runtime, so `@nocobase/lifecycle` must be declared as a peer dependency, with the application providing it in `dependencies`.

You can hand it to the Agent like this:

```text
Add a risk plugin. When a customer is flagged as suspicious, their orders cannot be shipped, with the message "The customer is under risk review and the order cannot be shipped yet". Do not change the process in the orders plugin.
```

## Subscribing to events

```ts
const off = runtime.on(
  'completed',
  { lifecycle: 'orders', transition: 'ship' },
  (event) => {
    // refresh an index, push a page update…
  },
);
```

| Event       | When it fires                                                    | Typical use           |
| ----------- | ---------------------------------------------------------------- | --------------------- |
| `completed` | Once after each action or creation; filter by process and action | Sync an index         |
| `entered`   | After entering a step; filter by step                            | Refresh a page        |
| `announce`  | Once for each action the new step allows                         | Maintain a to-do list |

Events are delivered on a best-effort basis after commit; a failure is only logged and never redelivered. Work that must happen is external work.

## Several rounds within one step

While a record stays in one step, there may be several rounds of exchange, such as an applicant and a reviewer going back and forth during "more information requested". Keep these exchanges in a table of their own rather than splitting them into many steps:

- Create the exchange rows with `onEnterState` on entering the step and end them with `onLeaveState` on leaving it, both inside the action's transaction.
- When the exchange concludes, move the record on in the same transaction (write the exchange rows in `runtime.transaction()`, then `tx.fire()`).
- Refuse a late reply to an exchange that has already ended.

## Adopting an existing table

A process uses three fields of the record's table by default, which the process definition can rename:

| Option           | Default name       | Purpose                                                    |
| ---------------- | ------------------ | ---------------------------------------------------------- |
| `stateField`     | `status`           | The current step                                           |
| `changedAtField` | `statusChangedAt`  | When the record entered the current step                   |
| `versionField`   | `lifecycleVersion` | Incremented by every action, against concurrent overwrites |

It also needs two tables: the history (`lifecycleTransitions`) and the execution records of external work (`lifecycleEffectRuns`). `@nocobase/lifecycle` ships no migration; the plugin that owns the process creates the tables in its own migration, following the example plugins under `packages/examples/*/database/migrations/`.

To adopt an existing table:

1. Add the missing columns and the two tables in a migration.
2. Decide which step each existing record belongs to.
3. Close off the forms, imports and APIs that used to change the step field directly, so that from then on a step changes only through an action.

```text
The application already has a contracts table, whose status field is currently changed directly by a form. Put it under a process: first list every place that changes this field directly and the number of existing records in each status, and propose how existing contracts map to the steps of the new process; implement it after I confirm, and make sure the form can no longer change a contract's status directly.
```

## API reference

### Terms

| In the process          | In code               | Meaning                                                              |
| ----------------------- | --------------------- | -------------------------------------------------------------------- |
| Process                 | `lifecycle`           | The complete process definition for one kind of record               |
| Step                    | `state` / `final`     | Where the record is, kept in a field of the record itself            |
| Action                  | `transition`          | A named act, one button on the page                                  |
| Condition               | `guard` / `blocker`   | Who may act and when, and why not                                    |
| Required input          | `validate` / `accept` | Input validation, and input written directly onto the record         |
| Branch                  | `route`               | One action leading to different steps by condition                   |
| Written with the action | `set`                 | Other fields written in the same update as the step                  |
| External work           | `effect` / `onEnter`  | Notifications and external calls run after commit, retried           |
| Timeout                 | `trigger`             | An action taken automatically when a record stays too long in a step |
| Process values          | `parameters`          | Timeouts, amount thresholds and other values the process uses        |
| History                 | transition log        | Who acted, when, the steps before and after, and the input           |
| System                  | `system` actor        | The actor for timeouts and results of external work                  |

An action only the server may take, such as an external callback or a system data correction, sets `manual: false` in the definition: it never appears on a page, and calling it through a page's API is refused.

### Entries

| Entry                         | Provides                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@nocobase/lifecycle`         | `defineLifecycle`, `defineEffect`, `LifecycleRuntime`, the stores, `toMermaid` (the diagram)                   |
| `@nocobase/lifecycle/jobs`    | `createLifecycleJobs()`: runs external work on background jobs and checks timeouts regularly                   |
| `@nocobase/lifecycle/react`   | `createLifecycleHook()`: a page reads the record and its available actions and acts                            |
| `@nocobase/lifecycle/testing` | `createLifecycleTestKit()`: a memory store and a clock you can advance, so timeouts and retries are unit tests |

Dependencies: a plugin declares `@nocobase/lifecycle` as a peer dependency, and the application provides it in `dependencies`. The library ships no HTTP routes; the plugin writes them under its own namespace.

### Common runtime methods

| Method                                              | Purpose                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `create()` / `fire()`                               | Create a record / take an action                                                           |
| `available()` / `can()`                             | List the available actions / check whether one may be taken, and why not                   |
| `view()` / `describe()` / `history()`               | The record's view / the process description / the history                                  |
| `transaction()`                                     | Act on several records in one transaction                                                  |
| `addGuard()` / `on()`                               | Add a condition / subscribe to events                                                      |
| `listEffectRuns()` / `retryRun()` / `continueRun()` | List, retry and continue external work                                                     |
| `runTriggers()` / `reclaim()` / `recover()`         | Check timeouts / take over interrupted work / recover on start (usually called by `/jobs`) |

### Error codes

A refused action throws a `LifecycleError`, and `lifecycleErrorFields()` turns it into the fields of the application's standard error body. The common ones:

| Code             | HTTP status | Meaning                                                                |
| ---------------- | ----------- | ---------------------------------------------------------------------- |
| `GUARD_REJECTED` | 403 / 400   | A condition is not met; `blockers` gives the reasons                   |
| `INVALID_STATE`  | 400         | The current step does not allow this action                            |
| `INVALID_INPUT`  | 400         | Input validation failed; `problems` lists the fields                   |
| `CONFLICT`       | 409         | Someone else has handled the record, or the page is stale              |
| `NOT_MANUAL`     | 403         | A page called an action only the server may take                       |
| `REQUEST_REUSED` | 400         | The same request ID was already used for another action on this record |
