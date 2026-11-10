# Operations offered in each stage

Import public APIs from `@nocobase/app-plugin-approval/server`. `actions` is required for every stage; `actions: []` enables none. No stage inherits another stage's operations. `afterEnd` only applies once a run has ended and does not supply missing operations during review. An action name appears once per list. `builtInActions` is a catalog, not an implicit registration.

```ts
const DECIDE = [approve(), reject({ reason: 'required' })];
const REVIEW = [
  ...DECIDE,
  returnTo({ targets: ['draft'], reason: 'required' }),
  transfer({ recipients: specifiedPeople(['reviewer-a', 'reviewer-b']) }),
  addSigner({
    recipients: peopleWithRole(allActivePeople(), 'finance'),
    modes: ['before', 'alongside'],
    maxDepth: 1,
  }),
];
```

A custom `PeopleScope` receives `ActionContext` with an erased `services` type (`Record<string, never>` in the current declarations). Use the host's checked service adapter, or an explicitly documented boundary conversion `context.services as unknown as BusinessServices` when the same host services are guaranteed by runtime registration; a direct `as BusinessServices` cast fails strict TypeScript. Keep this conversion at the integration boundary and retain typed business definitions.

IDs and roles above are illustrative; resolve real organization identities. `transfer` and `addSigner` require an explicit `PeopleScope`, even through `configureAction`. `specifiedPeople` restricts IDs; `allActivePeople` explicitly requires directory search; `peopleWithRole(scope, role)` intersects a scope with a role. A business-dependent scope uses `definePeopleScope` with `search` and `contains`. Membership and assignment eligibility are rechecked during submission. Do not use an unrestricted people picker to bypass the configured scope.

| Operation                  | Registration/configuration                     | Business behavior                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approve/reject             | `approve()`, `reject({ reason: 'required' })`  | Reject requires a reason by default; approve does not. Prefer `perform` with the concrete operation name; `approve`/`reject` are convenience adapters. `data` carries the stage's declared `outputs` only           |
| Custom decisions           | A separately named `defineApprovalAction`      | Declare a concrete operation for each policy-specific answer, such as abstain or returning one expense line. Do not expose a generic answer operation.                                                              |
| Return                     | `returnTo({ targets, reason })`                | Use explicit `targets` matching the standard returned outcome exit; any configured graph state is legal. Resume through an explicit business transition.                                                            |
| Transfer                   | `transfer({ recipients, reason })`             | Creates successor task and preserves old task as transferred; reason required by default                                                                                                                            |
| Add signer                 | `addSigner({ recipients, modes, maxDepth })`   | `before` holds member until signer answers; `after` starts after member approves and delays completion; `alongside` adds another member. Defaults allow all three modes, depth 1                                    |
| Request/provide material   | `askMaterialAction`, `provideMaterialAction`   | Requesting material blocks the reviewer without returning the run. The applicant submits it through `provideMaterial`; the task completes with `provided`.                                                          |
| Pool handling              | `claimAction`, `releaseAction`, `assignAction` | Explicit user operations; configured claim/assignment `timeoutHours` is processed automatically by the host sweep.                                                                                                  |
| Administrator intervention | `appointAction`, `reassignAction`              | Configure `adminRole` and actual authorization; appoint fills missing stage places. Reassignment keeps old responsibility evidence.                                                                                 |
| Copy/comment               | `ccAction`, `commentAction`, `readAction`      | Copy recipients read with `read`; information tasks do not vote. Put `readAction` in `afterEnd`: copies are read with it in any stage and after the run. A person already copied on the request is not copied again |

Actions represent explicit user operations, including administrator intervention. Register a named completion operation for every auxiliary task: pair `askMaterialAction` with `provideMaterialAction`, and a custom acknowledgement request with its own confirmation action. Automatic reminders, escalation and claim expiry are rules rather than actions.

A return is not a vote. Whatever the stage's policy, one member returning ends the stage at once and sends the request to the chosen target, even in a `threshold` committee whose other members have not voted; a rejection, by contrast, is one answer the policy counts. This is a business choice: offer `returnTo` only in stages where any single member may send the request back, and leave it out of `actions` where only the vote may decide.

## Connect operations to pages and routes

`actionsFor(lifecycle, recordId, actor)` and `runActionsFor(lifecycle, recordId, actor)` offer operations after the same guard/availability checks used by `perform`. Render the offered configuration (reason requirement, modes and return targets), not buttons guessed from task status. `candidatesFor({ target: { taskId }, action, actor, query })` returns eligible transfer/signer recipients; follow `nextOffset` even when a filtered page contains no people.

Prefer `perform({ action, target: { taskId } | { runId }, actor, input, comment, contentHash, requestId })` for writes. Named methods adapt built-in operations to convenient inputs and return shapes; keep behavior in the shared action pipeline rather than adding a second implementation. Replay semantics, including already-read copies, belong to the action pipeline and apply to both entry points. `preview` rolls the real action pipeline back. A retry with the same `requestId` must retain action, actor and target. `performBatch` requires an action declaring batch support; each stay commits or fails independently, so inspect the report. Supply the content hash shown on the page, not a freshly fetched current hash that would conceal a stale decision.

The host schedules `sweep`/`sweepReport`. `remindAfterHours` enables automatic reminders; `dueAfterHours` sets a deadline and `onDue: 'escalate'` enables escalation to the assignee's eligible manager. Claim/assignment `timeoutHours` enables automatic release of an expired claim. All of these hours run on the approval's `calendar` when it declares one, natural hours otherwise; see [Side effects](side-effects.md#time). Due processing takes priority; if no due rule can run, a passed reminder still runs. These write `task.reminded`, `task.escalated` and `task.claimTimedOut` events with no action record. A user-initiated reminder is a separately named action such as the example's `urge` with explicit actor permissions and cooldown.

## Extend only where built-ins do not express the business

Agents may define new operations in the business server code and opt them into the relevant stage, using the same checks, effect pipeline and history as built-ins. Read [Custom actions](custom-actions.md) for a complete definition/registration example and approval-example source references. Read [Frontend integration](frontend.md) to implement buttons, forms and history in a business page or a dedicated to-do center.

## Preview and retry boundaries

`preview()` executes the actual action, including policy callbacks, guards, routes, setters, `onTransition` and state hooks, and then rolls back the database transaction. Post-commit callbacks and queued lifecycle effects are not dispatched. Rollback cannot undo HTTP calls, cache writes or mutations of shared service objects performed inside those callbacks. Keep guards and planning callbacks pure; make hook writes through the supplied transaction, and schedule external work through durable lifecycle effects. Preview is not a sandbox for arbitrary business code.

`perform()` returns `CONFLICT` without automatically replaying callbacks; `performIn()` cannot restart the caller's transaction. A `requestId` deduplicates committed action records, not external work performed by a failed attempt. Applications may retry a confirmed transactional conflict a bounded number of times, using the same action, actor, target, input, content hash and request ID, only when all callbacks are transactional or independently idempotent. Do not retry stale tasks, content changes, authorization failures or arbitrary post-commit errors as concurrency conflicts.
