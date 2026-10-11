---
title: 'Developer reference'
---

# Developer reference

For developers reviewing or extending generated code. Business users can begin with [Process definition and action control](./definition.md).

## Why handling and notification results are separate

When a driver submits delivery evidence, save the order stage, evidence and history together so a delivered order never loses its evidence. Notify the account manager or call external systems after saving these records. Retain and retry failed external work without reverting delivery.

Developers choose extension points from these business requirements: check inputs and conditions before writing, save related business data with the action, and track subsequent notifications or external calls as retryable work. Events used only to refresh the page do not provide reliable delivery.

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
