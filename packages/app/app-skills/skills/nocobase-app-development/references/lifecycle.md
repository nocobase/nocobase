# Record lifecycles

Use `@nocobase/lifecycle` when a business record moves through stages that developers define in source: an expense report, a ticket, a contract, an order, a leave request. The record keeps its state in one of its own fields, every change is a transition declared in a definition, and the work a transition owes outside the database — mail, payments, calls to other systems — runs as effects after the transaction commits. There is no separate process instance, so the state is never kept in two places.

## Choose it or something else

| The requirement                                                                                   | Use                                                            |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| A record has clear stages, developers own the rules, and someone will ask who changed it and when | A lifecycle, this page                                         |
| Administrators draw or change the process in the UI                                               | The DAG flow plugin and its Skill, when it is installed        |
| A process that pauses for an external decision and is resumed by an id                            | The workflow plugin's `wait` node, as the main Skill describes |
| A notification when a field changes, with no stages                                               | An ordinary service call or event listener                     |
| Work that runs once in the background, or on a schedule, with no record state                     | [services and jobs](services-and-jobs.md)                      |

A parent and its children can each have a lifecycle and point at each other by foreign key, such as a document and the tasks it distributes; a child's last transition can move the parent on in the same transaction.

## Rules that are never broken

1. **The state lives only in the record's own field.** Query, filter and count on it like any other column; keep no copy elsewhere.
2. **Only the runtime changes the state.** Create with `runtime.create()`, change with `runtime.fire()`. Forms, imports, generic data endpoints, seeds of live data and SQL never write the state field, `statusChangedAt` or `lifecycleVersion`; doing so bypasses guards, the log, effects and the version check and leaves no trace. A data fix is a transition only the system may fire.
3. **Anything that leaves the database is an effect.** Never send mail or call an API from a guard, `route`, `set`, `onTransition` or a state hook.
4. **Fields that must change atomically with the state go in `accept` or `set`,** never in an effect, which runs after commit.
5. **Pass the effect's `idempotencyKey` to the external system.** An effect runs at least once; the key is what makes it take effect once. The key covers one run: a call that must happen once per business fact is keyed by that fact.
6. **Guards are business rules, not permissions.** Routes still authenticate and authorize: at least `read`, `fire` and `operate`, ahead of the validators.
7. **Inside a transaction, go through `tx`.** In `onTransition`, `onEnterState`, `onLeaveState` or `runtime.transaction()`, call `tx.fire()` / `tx.create()` or pass `transaction: context.transactionHandle`. A bare `runtime.fire()` there hangs forever on SQLite and commits separately on PostgreSQL or MySQL.
8. **Services that read other tables are a factory bound to the transaction:** `services: (handle) => ({ … })`. Reading through the database manager from a guard deadlocks on SQLite.

## Where the files go

```text
server/lifecycles/<name>.ts          types, effects and defineLifecycle()
server/providers/lifecycles.ts       the runtime, the store, the jobs dispatcher
database/main/migrations/            the record table and the two log tables
server/routes/<name>.ts              the record routes the page calls
client/lib/lifecycle.ts              createLifecycleHook(), configured once
client/pages/                        pages that call the hook
tests/                               test-kit unit tests and route tests
```

Add `@nocobase/lifecycle` to `dependencies` (`pnpm add @nocobase/lifecycle`): the server imports it at runtime, and the client's `@nocobase/lifecycle/react` resolves from the same declaration. `@nocobase/jobs` and `@nocobase/db` are already application dependencies. One application runs one `LifecycleRuntime` and registers every lifecycle on it; do not create a runtime per route or per lifecycle.

## 1. Types, effects and the definition

```ts
// server/lifecycles/leave.ts
import {
  defineEffect,
  defineLifecycle,
  type Lifecycle,
  type LifecycleRecord,
  type TransitionContext,
} from '@nocobase/lifecycle';

export type LeaveState =
  'draft' | 'pending' | 'approved' | 'rejected' | 'expired';

export interface Leave extends LifecycleRecord {
  readonly status: LeaveState;
  readonly applicantId: string;
  readonly approverId: string;
  readonly days: number;
}

export interface LeaveTypes {
  record: Leave;
  state: LeaveState;
  parameters: { expireAfterHours: number };
  services: {
    mail: { send(to: string, subject: string, key: string): Promise<void> };
  };
}

const notifyApprover = defineEffect<LeaveTypes>({
  name: 'leaves.notifyApprover', // stored on every effect run: never rename casually
  retry: { attempts: 3, backoffMs: 5_000, factor: 2 },
  run: ({ record, services, idempotencyKey }) =>
    services.mail.send(
      record.approverId,
      'A leave request awaits you',
      idempotencyKey,
    ),
});

const applicantOnly = ({ record, actor }: TransitionContext<LeaveTypes>) =>
  actor.id === record.applicantId || {
    code: 'applicantOnly',
    message: 'Only the applicant can do this.',
  };

const approverOnly = ({ record, actor }: TransitionContext<LeaveTypes>) =>
  actor.id === record.approverId || {
    code: 'approverOnly',
    message: 'Only the approver can decide.',
  };

export const leaveLifecycle: Lifecycle<LeaveTypes> =
  defineLifecycle<LeaveTypes>({
    name: 'leaves', // also the default collection name; stored in the log: never rename
    initial: 'draft',
    states: [
      'draft',
      'pending',
      { name: 'approved', final: true },
      { name: 'rejected', final: true },
      { name: 'expired', final: true },
    ],
    parameters: { expireAfterHours: 72 },
    create: {
      guard: ({ values, actor }) =>
        actor.id === values.applicantId || 'Apply for yourself only.',
    },
    transitions: {
      submit: {
        title: 'Submit',
        from: 'draft',
        to: 'pending',
        guard: applicantOnly,
      },
      withdraw: {
        title: 'Withdraw',
        from: 'pending',
        to: 'draft',
        guard: applicantOnly,
      },
      approve: {
        title: 'Approve',
        from: 'pending',
        to: 'approved',
        guard: approverOnly,
      },
      reject: {
        title: 'Reject',
        from: 'pending',
        to: 'rejected',
        guard: approverOnly,
        validate: (input) =>
          input.reason ? [] : [{ field: 'reason', message: 'Give a reason.' }],
        accept: ['reason'],
      },
      expire: { from: 'pending', to: 'expired', manual: false }, // only server code and triggers fire it
    },
    onEnter: { pending: [notifyApprover] },
    triggers: {
      expireStale: {
        transition: 'expire',
        when: 'pending',
        after: ({ expireAfterHours }) => expireAfterHours * 3_600_000,
      },
    },
  });
```

The definition is checked when the module loads: an unreachable state, a non-final state without a way out, or a final state with one throws `INVALID_DEFINITION`. Pick the building block by what the requirement says:

| The requirement says                                              | Write                                                                                                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Only some people may do it, and the page should say why not       | `guard` returning `true`, or `{ code, message, kind? }`; `kind: 'precondition'` when nobody may until the record changes    |
| The action needs input such as a reason                           | `validate` returning `[{ field, message }]`, and `accept: ['field']` to write it onto the record                            |
| Other fields change with the state                                | `set(context)`; it runs after `accept` and wins on the same field                                                           |
| One button, several destinations (by amount, by type)             | `to: ['a', 'b']` and `route(context)` returning one                                                                         |
| Record a change without changing the state (reassign, escalate)   | A self-transition, `from` equal to `to`; the version moves and a trigger's wait restarts                                    |
| Available from almost any state                                   | `from: '*'` or `from: { except: [...] }`                                                                                    |
| Something happens after N hours idle                              | A trigger with `when` and `after(parameters)`, firing a transition marked `manual: false`                                   |
| Call an outside system, then move on                              | An effect with `retry`, `timeoutMs`, `onSuccess` / `onFailure`; throw `EffectFailure(code, message, { details })` to branch |
| Always do X when entering a state, whichever transition got there | `onEnter: { state: [effect] }`                                                                                              |
| Write rows of other tables with the change                        | `onTransition(context)`, in the same transaction, writing through `context.transactionHandle`                               |
| Rows that belong to a stay, such as the tasks a stage opens       | `onEnterState` / `onLeaveState` on the lifecycle or on the state itself                                                     |
| Only server code, a webhook or a vote may conclude it             | `manual: false` on the transition                                                                                           |
| Several records move together                                     | `runtime.transaction(async (tx) => { … })`                                                                                  |
| Who may create a record and what it must hold                     | `create: { validate, guard }` on the definition, not in a route, so imports and scripts meet the same rule                  |

`guard`, `route` and `set` must be pure decisions over the record, input, actor, parameters and transaction-bound services. A guard is also asked with `{}` as input by `view()` and `available()`, so it must answer for empty input.

## 2. The migration

The library ships no migration. Write one self-contained migration under `database/main/migrations/` with every field spelled out, as [migrations and seeds](migrations.md) requires: never build it from the lifecycle definition.

The record table needs, besides its business fields:

- the state field, `status` by default, `string` not null;
- `statusChangedAt`, `datetimeTz` not null;
- `lifecycleVersion`, `integer` not null, default `0`;
- an index on `(status, statusChangedAt)`, which the trigger sweep reads.

The two log tables, created once for every lifecycle in the application:

- `lifecycleTransitions`: `id`, `lifecycle`, `recordId` (string), `transition`, `from` (nullable), `to`, `actorId`, `input` (json), `at` (`datetimeTz`), `version` (integer), `requestId` (nullable), `requestKey` (not null); unique indexes on `(lifecycle, recordId, version)` and `(lifecycle, recordId, requestKey)`, and an index on `(lifecycle, recordId, id)`.
- `lifecycleEffectRuns`: `id`, `transitionId`, `lifecycle`, `recordId` (string), `effect`, `stayBound` (boolean not null), `status`, `attempts` (default 0), `maxAttempts` (default 1), `result` (json), `error` (text), `createdAt`, `updatedAt`, `claimedAt`, `runAfter`, `continuation` (json, nullable), `continuationDueAt` and `continuationAbandonedAt` (`datetimeTz`, nullable); indexes on `(status, id)`, `(lifecycle, recordId, id)`, `continuationDueAt` and `continuationAbandonedAt`.

Different table names are passed to `createRepositoryLifecycleStore(db, { collections: { transitions, effectRuns } })`. Copy the column list from the installed package's README or the lifecycle example's migration (`packages/examples/app-plugin-lifecycle-example/database/migrations/` in the NocoBase repository) rather than guessing, and test it with `describeMigration()` as [testing](testing.md) describes.

## 3. The provider

```ts
// server/providers/lifecycles.ts
import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import {
  createRepositoryLifecycleStore,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';

import { leaveLifecycle } from '../lifecycles/leave.js';

const SCOPE = '@acme/crm'; // the application's package name

export const lifecycleRuntimeToken: ServiceToken<LifecycleRuntime> =
  createServiceToken<LifecycleRuntime>('app/lifecycle-runtime');

export default class LifecycleProvider extends ServiceProvider<Application> {
  public readonly name: string = 'app/lifecycle-provider';
  private jobs: LifecycleJobs | undefined;
  private runtime: LifecycleRuntime | undefined;

  public override register(): void {
    this.app.container.singleton(lifecycleRuntimeToken, () =>
      this.lifecycleRuntime(),
    );
  }

  public override async start(): Promise<void> {
    // Registers the effect job, opens the executors, schedules the sweep
    // (reclaim, triggers, onSweep) and recovers runs an earlier process left.
    await this.effectJobs().start(this.lifecycleRuntime());
  }

  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }

  private effectJobs(): LifecycleJobs {
    if (this.jobs) return this.jobs;
    const executors = this.app.container.resolve(jobExecutorServiceToken);
    this.jobs = createLifecycleJobs({
      jobs: executors.getJobExecutor(SCOPE),
      schedule: executors.getScheduleExecutor(SCOPE),
      jobName: `${SCOPE}/lifecycle-effect`, // stored with every queued task: keep it stable
      sweepEveryMs: 60_000, // well below the shortest trigger `after`
      onSweep: async () => {
        await this.lifecycleRuntime().prune({
          olderThan: new Date(Date.now() - 7 * 86_400_000),
        });
      },
    });
    return this.jobs;
  }

  private lifecycleRuntime(): LifecycleRuntime {
    if (this.runtime) return this.runtime;
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('lifecycle');
    const runtime = new LifecycleRuntime({
      store: createRepositoryLifecycleStore(
        this.app.container.resolve(databaseManagerToken),
      ),
      dispatcher: this.effectJobs(),
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    runtime.register(leaveLifecycle, {
      services: { mail: createMail(this.app) },
    });
    this.runtime = runtime;
    return runtime;
  }
}
```

Add the provider to `server/providers/index.ts`. Business services that create or move records take the runtime from `lifecycleRuntimeToken` rather than writing the table. Without a dispatcher, effects run in process before `fire()` returns; that is acceptable in a unit test, not in an application. A deployment with more than one instance sets `jobs.default` to `redis`, as [services and jobs](services-and-jobs.md) explains, so each effect and sweep runs once.

To react to changes elsewhere — refresh a page through realtime, keep a to-do list — subscribe with `runtime.on('completed' | 'entered' | 'announce', filter, listener)`. Delivery is best effort: work that must happen is an effect.

## 4. The record routes

The library ships no routes. Write them in `server/routes/` like every other `/api` route, as [server routes](server-routes.md) and [HTTP API design](http-api.md) require: authenticated, authorized, validated with `apiValidator()`, declared with `describeRoute()`, and refusing through `ApiError`. The React hook calls these paths below its `basePath`:

| Request                                                                              | `data`                                    |
| ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `GET <lifecycle>/lifecycle`                                                          | `lifecycleDescriptionView(runtime, name)` |
| `GET <lifecycle>/{id}`                                                               | `runtime.view(name, id, actor)`           |
| `POST <lifecycle>/{id}/fire` with `{ transition, input, requestId, expectVersion? }` | the record view plus `replayed`           |
| `POST <lifecycle>/{id}/effectRuns/{runId}/retry` with `{ force?, reason? }`          | the record view                           |
| `POST <lifecycle>/{id}/effectRuns/{runId}/continue`                                  | the record view                           |
| `POST <lifecycle>/{id}/effectRuns/{runId}/cancel`                                    | the record view                           |

Lists and creation are ordinary routes of the application; creation calls `runtime.create(name, values, { actor })`. The fire route passes `manual: true`, so a transition marked `manual: false` is refused with `NOT_MANUAL`:

```ts
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';

/** A lifecycle refusal as the standard error body; anything else rethrown as it is. */
function toApiError(error: unknown, inputField?: string): unknown {
  if (!(error instanceof LifecycleError)) return error;
  const fields = lifecycleErrorFields(error, inputField ? { inputField } : {});
  return fields ? new ApiError({ ...fields, domain: 'leaves' }) : error;
}

router.onError((error, c) => apiErrorHandler(toApiError(error), c));

// inside the POST /leaves/:leaveId/fire handler, after auth, authorization and validators:
const actor = { id: String(signedInUserId) };
try {
  const result = await runtime.fire('leaves', leaveId, body.transition, {
    actor,
    manual: true,
    input: body.input,
    requestId: body.requestId,
    ...(body.expectVersion === undefined
      ? {}
      : { expect: { version: body.expectVersion } }),
  });
  const view = await runtime.view('leaves', leaveId, actor);
  return c.json({ data: { ...view, replayed: result.replayed === true } });
} catch (error) {
  throw toApiError(error, 'input'); // field problems are reported under `input`
}
```

`lifecycleErrorFields()` maps the refusals: `GUARD_REJECTED` to `403`, or `400 FAILED_PRECONDITION` when every blocker is a precondition; `INVALID_STATE` to `400`; `CONFLICT` to `409`; `INVALID_INPUT` to `400` with field violations; unknown records to `404`. It returns `undefined` for the server's own faults, which are rethrown to become an opaque `500`. For the `continue` route pass `{ continuation: true }`. A route answers a record or run named in its URL that does not exist with `404` itself before calling the runtime. Retry, continue and cancel are operator actions: authorize them separately from firing.

A webhook from an outside system is a `defineRootRoutes()` route that verifies the sender's signature, then fires a `manual: false` transition as `SYSTEM_ACTOR` with the sender's delivery id as `requestId`, so a redelivery is a replay.

## 5. The page

```ts
// client/lib/lifecycle.ts
import { useApiClient } from '@nocobase/app-client';
import {
  createLifecycleHook,
  type UseRecordLifecycle,
} from '@nocobase/lifecycle/react';

export const useLeaveLifecycle: UseRecordLifecycle = createLifecycleHook({
  useTransport: useApiClient,
  basePath: 'leaves', // the route path, without /api
});
```

```tsx
const { view, busy, fire } = useLeaveLifecycle('leaves', id);
if (!view) return null;
return view.available.map((transition) => (
  <Button
    key={transition.name}
    disabled={!transition.allowed || busy}
    title={
      transition.blockers[0] &&
      t(`leaves.blockers.${transition.blockers[0].code}`)
    }
    onClick={() =>
      fire(transition.name).catch(
        (error) =>
          error instanceof LifecycleRequestError && toast(error.message),
      )
    }
  >
    {t(`leaves.transitions.${transition.name}`)}
  </Button>
));
```

Render the buttons from `view.available`, never from a hard-coded state check, so the page and the server use the same judgement. Translate titles and blocker messages by their stable `name` and `code`, as every user-visible string goes through a translation key. `fire` sends a fresh `requestId` and the version on screen; on `CONFLICT` tell the person the record changed and reload rather than retrying. On `INVALID_INPUT`, mark the fields in `error.problems`. The hook refreshes every 4 seconds by default; `refreshMs` changes it. Follow [the frontend workflow](frontend/ui-workflow.md) for the page itself.

## 6. Tests

Unit-test the definition with the test kit — a memory store, a fake clock and in-process effects — so waits, retries and refusals need no database:

```ts
import { createLifecycleTestKit } from '@nocobase/lifecycle/testing';

it('expires a request nobody handles', async () => {
  const kit = createLifecycleTestKit(leaveLifecycle, {
    services: { mail: fakeMail },
  });
  const leave = await kit.start(
    { applicantId: 'lin', approverId: 'wang', days: 2 },
    { actor: 'lin' },
  );
  await kit.fire(leave, 'submit', {}, { actor: 'lin' });
  kit.advance({ hours: 73 });
  await kit.runTriggers();
  expect(kit.get(leave).status).toBe('expired');
  expect(await kit.history(leave)).toEqual(['$create', 'submit', 'expire']);
});
```

`kit.start()` goes through `runtime.create()` with its checks and `$create` entry; `kit.create()` inserts directly, for tests about later transitions only. Cover every guard's refusal and its `code`, every `validate` problem, each trigger, each effect's success, retry and `onFailure` path, and duplicate requests. Then test the migration with `describeMigration()` and the routes against a started application as [testing](testing.md) describes, including `403`, `400 FAILED_PRECONDITION`, `409` on a stale `expectVersion`, and the `NOT_MANUAL` refusal.

## Before finishing

- The sweep interval is well below the shortest trigger `after`, and every effect's `timeoutMs` is below the five-minute lease.
- Every external call receives `idempotencyKey`, or the business fact's own key.
- `prune()` runs in `onSweep`.
- Routes authorize read, fire and operate separately; guards are not the only check.
- No code outside the runtime writes the state, `statusChangedAt` or `lifecycleVersion`. An edit that a transition must not race, such as changing an amount a guard reads, may only increment `lifecycleVersion` conditionally on the version it read.
- Effect runs that are `failed`, `dead`, or hold a waiting or abandoned continuation are visible to an operator: `listEffectRuns({ status: 'failed' })`, `listEffectRuns({ continuationPending: true })`, `listEffectRuns({ continuationAbandoned: true })`.

## Changing a definition in production

States, transition, lifecycle and effect names are stored in the database. Adding states, transitions, triggers or effects and changing guard or `set` logic is safe. Renaming or removing a state takes three releases: add the new state and a system-only transition from the old one, fire it on every record in the old state, then remove the old state. Keep a removed or renamed effect registered until no run under its name is queued or running. Never rename a lifecycle. Renaming the state, timestamp or version field needs a migration in the same release.

## Troubleshooting

| Symptom                                        | Cause and fix                                                                                                                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A request or transition hangs on SQLite        | A guard or hook reads through the database manager, or calls `runtime.fire()` without `tx`. Use a services factory and `tx`                                                                           |
| A trigger never fires                          | The record was not created through `runtime.create()`, nothing sweeps, a self-transition restarted the wait, or the guard refuses `SYSTEM_ACTOR`; `can(name, id, transition, SYSTEM_ACTOR)` shows why |
| An effect run stays `queued`                   | Its effect was renamed and no process registers the old name, or `runAfter` has not come                                                                                                              |
| An effect succeeded but the record never moved | Its continuation was refused, often because a parent is not ready; it waits on the run and the sweep retries it, or `continueRun(id)` once the cause is fixed                                         |
| Frequent `CONFLICT`                            | Expected for stale pages; reload and let the person decide again. If triggers or continuations conflict with people, check they do not compete for the same state                                     |
| `INVALID_SET` on create                        | `values` set the state, timestamp or version; pass `{ state }` to `create()` to start in another initial state                                                                                        |

The installed package's README lists its entries; the full guide, design notes and 28 worked recipes are in `packages/libs/lifecycle/docs/` of the NocoBase repository, and `packages/examples/app-plugin-lifecycle-example` and `packages/examples/app-plugin-office-flows-example` are complete working code.
