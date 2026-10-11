---
title: 'Extension reference'
---

# Extension reference

For developers reviewing or extending generated code. Business users can begin with [Quick start](./quick-start.md).

## Transaction and post-commit work

`@nocobase/lifecycle` stores the current stage on the business record. Processing checks conditions, changes data, and writes history in a transaction; external calls happen afterward.

| Need                   | Extension                                   | Boundary                              |
| ---------------------- | ------------------------------------------- | ------------------------------------- |
| Conditions and reasons | `guard`, `runtime.addGuard()`               | Before writes, within transaction     |
| Record updates         | `set`                                       | Same commit                           |
| Other tables           | `onTransition`                              | Same transaction                      |
| Stage exchanges        | `onEnterState`, `onLeaveState`              | Same transaction                      |
| Multiple records       | `transaction()`, `tx.fire()`, `tx.create()` | Atomic                                |
| Reliable external work | `effects`, `onEnter`                        | Post-commit retries and failure exits |
| UI and index updates   | `completed`, `entered`, `announce`          | Best effort, not redelivered          |

Do not call external systems inside transactional extensions. Retry support does not replace provider idempotency agreements.

## Existing tables and exchanges

Add state, entry time, version, history, and effect-run storage. Map existing data to stages and close direct status writes in forms, imports, and APIs.

Default fields are `status`, `statusChangedAt`, and `lifecycleVersion`, with configurable names. The owning application or plugin supplies migrations.

Repeated exchanges within a stage belong in dedicated records. End exchanges and advance the business record consistently; late replies must not reopen ended exchanges.

## APIs and integration

Other plugins can add conditions with `addGuard()` and retain its removal function. Creation has separate guards. Event subscriptions inform UI or indexes; reliable work uses effects.

| Entry                         | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `@nocobase/lifecycle`         | Definitions, runtime, storage, diagrams |
| `@nocobase/lifecycle/jobs`    | Effects, deadlines, recovery            |
| `@nocobase/lifecycle/react`   | Record views and actions                |
| `@nocobase/lifecycle/testing` | Memory storage and adjustable clocks    |

Use creation and processing, availability, views, descriptions, and history methods. The application owns authenticated and authorized business HTTP routes; the library supplies none.

System-only actions use `manual: false`. Translate condition, input, state, and version errors into application feedback without overwriting concurrent work.

## Boundaries

No drag-and-drop designer, nested stages, or general parallel branches are provided. Coordinate child records for parallel business work. Authorization remains separate; complex human decisions use approval.
