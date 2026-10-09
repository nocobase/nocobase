# @nocobase/app-plugin-lifecycle-example

Shows record lifecycles built on `@nocobase/lifecycle`: a business record keeps its state in one of its own fields, every change is a transition declared in source, and the side effects a transition owes run after it commits, with retries. There is no separate process instance — where a ticket or an expense stands is its `status`.

Two lifecycles run under **Lifecycle Example** in the application menu, each behind a page that reads like the product rather than like the lifecycle:

| Page            | Lifecycle                      | What it shows                                                                                                                                                                                                                                   |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Help desk       | `server/lifecycles/ticket.ts`  | A customer files a ticket; agents take it from a queue and reply; a ticket left waiting on the customer closes itself, a customer reply brings it back, and a closed ticket can be reopened for a week. The conversation is the transition log  |
| Expense reports | `server/lifecycles/expense.ts` | An employee claims itemized expenses; the amount decides whether it is approved automatically or needs the manager and finance; approvers approve, send back or reject with a reason; an idle manager is passed over; payment runs as an effect |

Each page has a **Signed in as** switch over the example's people — agents and customers, or employees, managers, an executive and the finance director — so one person can play every role; a real application takes the actor from the signed-in user and authorizes the action. The waits are minutes rather than days so you can watch a trigger fire, and a demo option on each new record makes its first email deliveries or payment attempts fail on purpose, to show retries. Under each record, **Under the hood** shows its states, parameters, transition log and effect runs.

`tests/fixtures/second-layer/` shows what goes on while a record waits in one state, written by hand as test fixtures without a page of its own: a visa waits in `supplementing` while the applicant and the officer exchange material in rounds, and an order waits in `replanning` while an assistant asks the planner to choose. Each keeps its rounds in rows of its own, set up and ended by the state's `onEnterState` and `onLeaveState` hooks, and moves the record only when it concludes, by firing a `manual: false` transition in `runtime.transaction()` — so the record's version and clock stay where they were until then. They run only on the memory store and are not part of the published plugin; a real plugin keeps such rows in tables of its own, created by a migration and written through the transaction's Repository. A reusable second layer, such as an approval layer, could provide the whole state in the same way.

## Try it

Run the examples application with `pnpm --filter @nocobase/app-template-examples dev`, sign in, and open **Lifecycle Example** in the menu.

1. **See why a button is greyed out.** As an employee, file a 6,000 expense report and submit it. Switch to another employee: under **Under the hood**, "What the current identity can do" lists `✗ approve` with the reason.
2. **See an escalation.** Leave the report alone for three minutes, or click **Run triggers now**. The approver becomes the manager's manager, the log gains an `escalate` row fired by the system, and the version goes up by one.
3. **See retries.** Create a report with "payments that fail on purpose" set to 5 and approve it. The payment run fails three times and becomes `failed`. Click **Retry**: it gets three more attempts; the fourth and fifth fail, the sixth succeeds, the report becomes `paid` and the payment reference is written onto it.
4. **See the concurrency guard.** Open the same waiting report in two windows. Approve it in one, then send it back in the other: the second click is refused because the version it saw is stale.
5. **See the diagram.** The panel shows the Mermaid source of the lifecycle, its parameters, its log and its effect runs.

## How it is wired

| Concern                     | Where                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| States and transitions      | `server/lifecycles/*.ts`, the only definition of each flow                                                                                                                                                                                                                                                                              |
| Effects                     | `server/lifecycles/*.effects.ts`, plain functions                                                                                                                                                                                                                                                                                       |
| Records and the log         | `database/migrations/`, through the Repository store                                                                                                                                                                                                                                                                                    |
| Effects, triggers, recovery | `createLifecycleJobs()` from `@nocobase/lifecycle/jobs`: a `JobExecutor` job per effect run, a `ScheduleExecutor` sweep every 10 seconds that reclaims expired attempts, fires triggers and prunes old runs, and `recover()` on start                                                                                                   |
| Record routes               | `server/routes/lifecycle.ts`: the description, a record's view, firing and an operator's retry, continue and cancel under `/api/lifecycleExample/{tickets,expenses}`, at the paths the React hook calls, declared with `describeRoute()` and `apiValidator()`; refusals become the standard error body through `lifecycleErrorFields()` |
| Record pages                | `createLifecycleHook()` from `@nocobase/lifecycle/react`, configured once in `client/lib/use-example-record.ts` with the API client as transport; the routes' path is shared with the server in `shared/routes.ts`                                                                                                                      |

## Patterns worth copying

| Problem                                           | Pattern                                                                                                              | Where                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| One button, several destinations                  | `to` as an array and a `route` shared by `submit` and `resubmit`; the limits are `parameters`                        | `server/lifecycles/expense.ts`                            |
| Telling the person why a button is greyed out     | Guards return `{ code, message }`; the client translates the code through its locales and falls back to the message  | `server/lifecycles/*.ts`, `client/lib/api.ts`             |
| Checking the record before it may move on         | `readyToSubmit` validates the lines inside `set` and throws `INVALID_INPUT`, computing the approver at the same time | `server/lifecycles/expense.ts`                            |
| A reason that must be given                       | `validate: reasonRequired` returning `[{ field: 'reason', message }]`                                                | `server/lifecycles/expense.ts`, `ticket.ts`               |
| Withdraw from anywhere under way                  | `from: { except: ['draft', 'approved'] }`                                                                            | `server/lifecycles/expense.ts`                            |
| An idle approver is passed over                   | The self-transition `escalate`, guarded to the system, fired by the trigger `escalateStale`                          | `server/lifecycles/expense.ts`                            |
| An external call whose result moves the record on | `requestPayment` in `onEnter.approved`, with retries, a timeout and `onSuccess: 'paid'`; `paid` accepts `paymentRef` | `server/lifecycles/expense.effects.ts`, `expense.ts`      |
| A conversation that is the history                | Every reply is the input of the transition it caused, read back from the transition log                              | `server/lifecycles/ticket.ts`, `client/pages/tickets.tsx` |
| Reopening within a window                         | A guard that compares `statusChangedAt` with a parameter and refuses with `kind: 'precondition'`, answered `400`     | `server/lifecycles/ticket.ts`                             |

## Testing

`tests/lifecycles.test.ts` tests both lifecycles with `@nocobase/lifecycle/testing`: a memory store, a fake clock and in-process effects, so waiting, escalating and retrying are plain function calls. `tests/provider.test.ts` runs the real Provider on the test database (SQLite by default) with the memory jobs service, `tests/routes.test.ts` covers the HTTP boundary, `tests/concurrent-edits.test.ts` covers an edit racing a submit or another edit on the test database, and `tests/error-message.test.ts` covers how a page words a refusal.

`tests/second-layer.test.ts` runs the two hand-written second layers in `tests/fixtures/second-layer/` on memory storage and a fake clock: rounds that leave the record alone, the conclusion that moves it, and a late answer for a stay that has already ended being refused.

```bash
pnpm --filter @nocobase/app-plugin-lifecycle-example lint
pnpm --filter @nocobase/app-plugin-lifecycle-example typecheck
pnpm --filter @nocobase/app-plugin-lifecycle-example test
pnpm --filter @nocobase/app-plugin-lifecycle-example build
```
