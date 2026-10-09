# @nocobase/lifecycle

Record lifecycles: a business record keeps its state in one of its own fields, every change is a transition declared in source, and the effects a transition owes run after it commits. There is no separate process instance, so where a record stands is never kept in two places.

```ts
import {
  defineEffect,
  defineLifecycle,
  type Lifecycle,
} from '@nocobase/lifecycle';

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
        effects: [notifyCustomer],
      },
      customerReplied: { from: 'awaitingCustomer', to: 'open' },
      close: { from: ['open', 'awaitingCustomer'], to: 'closed' },
    },
    triggers: {
      autoClose: {
        transition: 'close',
        when: 'awaitingCustomer',
        after: ({ waitHours }) => waitHours * 3_600_000,
      },
    },
  });
```

| Concept    | What it is                                                                                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transition | `from`, `to`, and optionally `guard` (may this actor fire it, and if not, why), `validate` (input problems), `accept` (input fields written onto the record), `route` (pick one of several `to`) and `set` (other fields)                                      |
| Effect     | A function run after commit, with `retry`, a stable `idempotencyKey`, and `onSuccess`/`onFailure` transitions, fired with the effect's result or its error — a code and details when it throws an `EffectFailure` — as input; `onEnter` runs effects per state |
| Trigger    | Fires a transition on records idle in a state for longer than `after`, found by a query rather than a timer per record                                                                                                                                         |

`LifecycleRuntime.fire()` checks the state, writes the record, a transition log entry and the effect runs in one transaction, guarded by a conditional update on the state and on a version every transition increments, so two concurrent transitions of one record cannot both commit. Effects are handed to a dispatcher after commit, retried by policy, and fenced so a reclaimed attempt cannot record a result over its replacement. `runTriggers()` sweeps the triggers, `reclaim()` hands over again what no process is working on — attempts whose lease expired and queued runs whose dispatch was lost — and tries again a waiting continuation once it is due, and `recover()` picks up what an earlier process left queued.

## Entries

| Entry                         | Provides                                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nocobase/lifecycle`         | `defineLifecycle`, `defineEffect`, `LifecycleRuntime`, `createRepositoryLifecycleStore`, `MemoryLifecycleStore`, `toMermaid`, and `lifecycleErrorFields()` and `lifecycleDescriptionView()` for a plugin's own routes |
| `@nocobase/lifecycle/jobs`    | `createLifecycleJobs()`, the dispatcher that runs effects on `@nocobase/jobs` and sweeps triggers on a schedule                                                                                                       |
| `@nocobase/lifecycle/react`   | `createLifecycleHook()`, configured once per plugin so a page calls one hook; `createLifecycleClient()` and `useLifecycle()` beneath it                                                                               |
| `@nocobase/lifecycle/testing` | `createLifecycleTestKit()`: a memory store, a fake clock and in-process effects whose retries wait for that clock, so waits and retries are unit tests                                                                |

`@nocobase/db` is a peer; `@nocobase/jobs` and `react` are optional peers, each needed only by the entry that imports it. A plugin declares `@nocobase/lifecycle` itself in `peerDependencies`, never in `dependencies`, and the application provides it in its own `dependencies`: the plugins of an application share one runtime, and code recognises `LifecycleError` and `EffectFailure` with `instanceof`, which a second copy of the module fails. The library ships no HTTP routes: they belong to the plugin, under its namespace and declared for the application's API document, and the guide shows how to write the ones the React hook calls.

## Documentation

- [docs/concepts.md](docs/concepts.md) — why the record is the process, the seven concepts, what a click does, when to use it and when not.
- [docs/design.md](docs/design.md) — the invariants, the transaction, effect execution, trigger sweeps, storage requirements, where an extension goes, and how to change a definition that is in production.
- [docs/guide.md](docs/guide.md) — a leave request from definition to page, recipes by scenario, the checklist before going live, troubleshooting, error codes and the record routes a plugin writes for the React hook.
- [docs/examples.md](docs/examples.md) — one capability or combination per section, grouped by modelling transitions, time, effects and the outside, several records, extending and adopting, operating, and pages and tests, each with what the library does and does not take care of.

`packages/examples/app-plugin-lifecycle-example` shows every capability on a help desk and expense reports; `packages/examples/app-plugin-office-flows-example` builds two office processes from six lifecycles.
