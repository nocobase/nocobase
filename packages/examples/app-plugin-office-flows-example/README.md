# @nocobase/app-plugin-office-flows-example

Two office processes built on `@nocobase/lifecycle`, each document a record with its own lifecycle and each sub-task a record that points at its parent. There is no workflow engine and no process instance: where a document stands is its `status`, and every change is a transition declared in `server/lifecycles/`.

| Page         | What it shows                                                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 数据使用申请 | A form whose questions depend on earlier answers; three managers; acceptance that cannot return the request once an extraction task exists, nor finish while one is open; extraction tasks created for each period and moved off weekends and holidays |
| 收文         | Two office approvals, then distribution: department rows bring in their people from configuration, management groups come from configuration or by hand, and re-approval followed by a second distribution reminds nobody twice                        |
| 我的待办     | Clerk tasks with a countersign, execution-team and executor tasks, assisting departments created beside the clerk task, the processing lists of every level, and each person's reminders                                                               |
| 配置         | The departments, management groups and the 2026 holiday calendar the processes read                                                                                                                                                                    |

The process vocabulary — field names, options, states and steps — is Chinese, as the process is; the page chrome is translated through `client/locales/`. Each page lets you act as any of the example's people (`shared/people.ts`) so one person can play every role; a real application takes the actor from the signed-in user and authorizes each action. Attachments keep their file names only.

## Where each rule lives

| Rule                                                      | Where                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Which form fields appear, and their validation            | `shared/data-request.ts`, used by the page and by the `submit` transition                  |
| Who may approve, return, accept or exit                   | The `guard` of each transition                                                             |
| No return once a task exists; no finish while one is open | Guards reading extraction tasks through the transition's own transaction                   |
| Extraction dates, weekends and holidays                   | `server/calendar.ts`, and the sweep in `OfficeFlowsService.runSchedule()`                  |
| Creating sub-tasks from department rows                   | `OfficeStore.dispatch()`, run as an effect of a self-transition, one row claimed at a time |
| One reminder per person, document and level               | `OfficeStore.notify()`, a ledger with a unique key                                         |
| Distribution traces on the root document                  | The clerk-task effects; team and executor feedback is not traced on the root               |

## Patterns worth copying

| Problem                                                                               | Pattern                                                                                                                                                                                                                                                                                                        | Where                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| A parent waits for its children                                                       | Children are records with their own lifecycle; the parent's guard counts them through the transition's transaction and refuses with `kind: 'precondition'`, answered `400 FAILED_PRECONDITION`                                                                                                                 | `complete` in `server/lifecycles/data-request.ts`   |
| Creating children cannot race the parent's decision                                   | The child's insert runs in a transaction that bumps the parent's `lifecycleVersion` while it is still in the right state                                                                                                                                                                                       | `OfficeStore.createExtraction()`                    |
| Concurrent edits keep each other's fields, and a decision made before them is refused | An edit writes only the fields it sends, on the `lifecycleVersion` it read, and moves it on; one that loses reads again and reapplies its patch, so edits of different fields both stay while the later of two edits of one field wins, and a transition that read the record before the edit meets `CONFLICT` | `OfficeFlowsService.edit()`                         |
| Dispatching several times from one state                                              | A self-transition with an effect; the effect claims each row and writes children under unique keys, so a retry repeats nothing                                                                                                                                                                                 | `dispatchClerks` in `server/lifecycles/incoming.ts` |
| A countersign: everyone agrees, or one objection ends it                              | A self-transition whose `route` stays in `signing` until every assignee has signed and leaves on the first objection; a second signature is refused to that clerk alone, as `kind: 'permission'`                                                                                                               | `sign` in `server/lifecycles/tasks.ts`              |
| One approve button across several levels                                              | `from` lists every level, `route` picks the next by the current state, `set` changes the approver                                                                                                                                                                                                              | `approve` in both root lifecycles                   |
| Something created on entering a state                                                 | `onEnter`                                                                                                                                                                                                                                                                                                      | `onEnter.accepting: [createOneTimeExtraction]`      |
| An external action that may run twice but must count once                             | The effect's `idempotencyKey` as the unique key of a ledger or trace row                                                                                                                                                                                                                                       | `OfficeStore.trace()`, `OfficeStore.notify()`       |

## Assumptions

The source requirements leave these open; the example takes the first reading and says so here. A date falling on a weekend or holiday moves to the next workday, or the workday before when that would pass the last delivery date. "每季度第几天" counts from the first day of the quarter. "其他固定频次" creates no task by itself. All three managers may return a request, and accepting it finishes it. A department's clerks all countersign "[C]" before its task moves on, while "[Y]" or "[B]" from any of them ends it. Voided extraction tasks do not count against returning or finishing a request. Reminders are deduplicated per root document and level.

Task dispatch stores each assignee in `officeFlowsTaskAssignees` in the same transaction as the task. The personal task list filters those scalar memberships before loading tasks; it does not require a database driver's JSON filtering support. The task's `assignees` array remains the snapshot used by its guards.

Serial allocation retries a confirmed deadlock at most five times when it owns the transaction. Inside a caller transaction it propagates the failure so the caller can retry the whole operation; a connection error with an uncertain commit outcome is never retried here.

## Testing

`tests/calendar.test.ts` and `tests/data-request-form.test.ts` cover the scheduling and the form rules as plain functions. `tests/flows.test.ts` runs both processes on the test database (SQLite by default) with the migration and seed applied, and their routes on the real service; `tests/routes.test.ts` covers the HTTP boundary.

```bash
pnpm --filter @nocobase/app-plugin-office-flows-example lint
pnpm --filter @nocobase/app-plugin-office-flows-example typecheck
pnpm --filter @nocobase/app-plugin-office-flows-example test
pnpm --filter @nocobase/app-plugin-office-flows-example build
```
