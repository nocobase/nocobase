# Application-bound lifecycle integration

A business fact stores the effective data; an application stores the proposed addition or change. Bind an approval to an explicit application `collection`. One application record is one process, identified across tables by lifecycle binding and record ID. Return and resubmission continue that application; a new change after completion creates a new application.

A `run` is one stay (visit) in one approval state, with a single-stage `plan`. A multi-stage application has multiple runs, and re-entering a state creates another run. Use `(lifecycle, recordId)` to aggregate the application; neither a run ID nor `previousRunId` identifies a whole submission round. A separate submission-round identifier requires a host business contract.

## Define and register

When the requested business includes a personal task center or centralized approval handling, compose each applicable definition with `userTasks` and the shared contributor before registering it. Follow [the task-center recipe](user-tasks.md#business-example-centralize-leave-and-expense-approvals), including the same service object for lifecycle registration and `ApprovalService`. This wiring is an implementation responsibility, not an additional feature the user must name.

Use `defineApproval<BusinessTypes>({ name, collection, initial, states, transitions, applicant, directory, freeze })`. Declare each review with `approvalState('manager', stage.single({ assignee, actions: [approve(), reject()] }))`, where `stage = stagesFor<BusinessTypes>()`. Keep draft, revision, applying and final states in the same standard graph. `initial`, guards, routes, `accept`, `set`, effects and state hooks retain the lifecycle contract.

For every available conclusion, declare a unique transition from its approval state with `approvalOutcome: 'approved'`, `'rejected'` or `'returned'`. A transition can serve several approval states, but one state/outcome cannot have two exits. Use standard `route` for multiple non-return targets; the bridge generates returned routing from `input.returnTarget` when no explicit route is supplied; all targets must exist in the graph. Conditional review is a graph route, not a stage `when` or an ordered plan.

```ts
const request = defineApproval<RequestTypes>({
  name: 'expenseRequests',
  collection: 'expenseRequests',
  initial: 'draft',
  applicant: (record) => record.applicantId,
  directory: (services) => services.org,
  freeze: ['amount', 'purpose'],
  states: [
    'draft',
    approvalState(
      'manager',
      stage.single({
        assignee: resolveManager,
        onEmpty: 'refuse',
        actions: [approve(), reject()],
      }),
    ),
    { name: 'approved', final: true },
    { name: 'rejected', final: true },
    { name: 'withdrawn', final: true },
  ],
  transitions: {
    submit: { from: 'draft', to: 'manager', guard: applicantOnly },
    managerApproved: {
      from: 'manager',
      to: 'approved',
      approvalOutcome: 'approved',
    },
    managerRejected: {
      from: 'manager',
      to: 'rejected',
      approvalOutcome: 'rejected',
    },
    withdraw: {
      from: ['draft', 'manager'],
      to: 'withdrawn',
      guard: applicantOnly,
    },
  },
});
runtime.register(request, { services });
const approvals = new ApprovalService(
  runtime,
  [request.approval as unknown as Approval<never>],
  services,
);
```

There is no additional run lifecycle to register. Do not call `approval.state('approving')`, declare `flow/stages/exits` as a second graph, or fire transitions using run IDs.

## Entry, conclusion and return

Each successful state entry, including initial creation and same-state re-entry, creates a fresh run and tasks. The run records the application transition entry ID and entering version. `approvalApplicationStays` enforces a unique lifecycle/record/version identity in the same transaction. A run represents one stay, not the whole application. Closed task rows are never reactivated.

Partial decisions write only task/run bookkeeping, so no business hook or effect runs for them. Final decisions, closing the stay, the application transition and next-stage allocation commit together. Next-stage allocation, guards, routes or writes failing roll everything back. Outcome exits require a live, one-use server conclusion permit and the matching application stay; `manual: false` alone is not authorization. Notifications use the transaction's post-commit callbacks. What each step does to business data — reservations, applied changes, execution, releases on every exit — is declared on these transitions and states as [Side effects at each step](side-effects.md) describes.

Configure `returnTo({ targets })` (the `returnAction` catalog entry) with explicit `targets` matching the state's returned exit. Targets may be any declared business states, including a revision state or a later approval state. Omit `route` on returned exits: the bridge selects `input.returnTarget` from the declared targets. An explicit custom route choosing another target fails. Native returns do not use `applicant` aliases, earlier-stage ordering or hidden resume jumps. Express resumption with an explicit standard transition.

## Content, versions and storage

The application is the authoritative content. Runs store the frozen snapshot and content hash for that stay. Edit through guarded application transitions in a revision state; the next entry snapshots current values and creates new tasks. Do not write frozen application fields directly through a repository, or revise an independent run copy. Re-entry normally asks for new decisions. Opt a stage into `reuse: 'unchanged'` only when the business permits it: unchanged `covers`, matching policy version, identical assignee/responsibility and an original self-made approval are required. Reuse records source run/task IDs on new tasks and settles after both local and lifecycle-level entry hooks have finished, within the same transaction. A state with entry effects, or entered through a transition with effects, receives fresh undecided tasks instead of auto-reusing opinions, so the effects execute before a new human conclusion. Policies declare every possible `StageResult` through `outcomes(options)`; direct-conclusion actions declare `outcomes(config)`. Each result requires its own `approvalOutcome` transition. `itemizedPolicy` requires an explicit `returnTarget` matching the application graph.

Use a positive `version` covering the application graph and policies. A semantic policy/callback change needs an explicit `version` bump. A changed rule version disables positive/custom conclusions, while return and reject remain available for recovery. Presentation changes, action additions and unrelated graph additions do not block open stays. The content check uses each run's own frozen snapshot fields; structural signatures constrain opinion reuse, not every action. Keep states and outcome exits used by open stays until those stays are closed.

The host migrates its application tables and lifecycle transition/effect tables and configures `createRepositoryLifecycleStore` with their names. The approval plugin migrations create shared run/task/event/action storage and application stay identities. Upgrade by applying the new migration; do not rewrite historical migrations. The lifecycle log requires a non-null request key and unique lifecycle/record/request-key and lifecycle/record/version indexes.

## Evidence

Use `packages/examples/app-plugin-approval-example/server/scenarios/application-bound.ts` for the manager/finance/VP graph and `tests/scenarios/application-bound.test.ts` plus `tests/application-database.test.ts` for real service integration, re-entry, partial votes, rollback and concurrency. `server/scenarios/contract-change.ts` and `tests/contract-change-database.test.ts` demonstrate baseline-version comparison, fact application in the approval transaction, and external failure/retry after commit without repeating approvals.

## Empty stages and deployment changes

An empty `subjects()` list refuses the entry transaction with `NO_ASSIGNEE`, including under `onEmpty: 'hold'`: there is no real subject for an administrator to assign. Route applications with no reviewable subjects to an explicit business state before entering approval. A nonempty subject without an assignee follows the normal empty-place rule, as do empty assignee selections and pools without candidates. That rule defaults to `hold` when `adminRole` is configured and to `refuse` otherwise. Explicit `onEmpty: 'hold'` requires a nonblank `adminRole` at definition time. A held stage also needs an offered administrator assignment action and an active person in that directory role; configuring the role name alone cannot guarantee recovery.

The rule version is a deployment compatibility fence, not a stored executable rule snapshot. Callback source is deliberately not serialized; changing a callback without bumping the version does not preserve old behavior. Before deploying an incompatible version, stop new submissions and drain open stays under the old deployment, or arrange return/rejection of remaining stays before resubmitting under the new version. Keep their states and recovery exits available. Deployments that need old and new rules concurrently must retain separate lifecycle/collection bindings and route new applications to the new binding. This API does not offer in-place migration or version-dispatched historical callbacks; do not change a run's stored version to bypass the compatibility check.

`itemizedPolicy` accepts `amountFields: { requested, approved, total }` for integer quantities such as units. Defaults are `amountCents`, `approvedCents` and `approvedTotalCents` for compatibility. The `approved` name controls both the answer field and each subject's result field; `total` controls the aggregate result field. Declare the chosen answer field in stage outputs. The policy still validates positive safe integers and an upper bound against the requested quantity; use a custom policy for other domain semantics.
