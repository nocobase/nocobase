# User task center

Use the personal index for a user's task lists and status counts across approval and ordinary business sources. It stores only identity, safe presentation and `pending | completed | cancelled`; it does not discover users, infer business state, authorize actions or render business content. The host owns the center page and per-source detail components.

## Start from the business request

Select this composition when the user asks to centralize approvals or personal work; do not wait for them to request an index or contributor. Inventory the businesses in scope and reuse their existing approval definitions, routes, organization service and page. For a new center, assemble source writes, list/count reads and business handling together. For an existing center, migrate its reads and backfill its sources before retiring the old personal-query path. Keep permission relations and unrelated consumers intact.

| Business request                                            | Default implementation                                                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Handle leave and expense approvals together                 | Enable `userTasks` on both definitions; one center reads `approval.task` across their subjects and opens the appropriate business detail/actions |
| Show approvals and equipment collection in one place        | Add an ordinary source writer for equipment collection; retain its business completion operation without wrapping it in an approval process      |
| Add a center to an application with active approvals        | Enable online contributions, backfill each source with durable cursors, verify counts and switch the existing page's reads                       |
| Allow a deputy to handle approvals while a reviewer is away | Use the business directory's delegation and persist synchronization for creation, changes, revocation and timed start/expiry                     |
| Let applicants track their submissions too                  | Add a separate applicant view and host-owned application projection only when requested; track the complete business lifecycle                   |

Use existing business rules and ask only when ownership, visibility or handling semantics remain unresolved. Do not expand a single approval detail change or a notification request into a center. A pending index item can represent waiting/blocked work: the business detail's offered actions determine whether it is actionable now.

## Register Task Center

Install and register `@nocobase/app-plugin-task-center/server` alongside Approval and authentication, then apply the plugin migrations. Read Task Center's `nocobase-app-plugin-task-center` Skill for its source writer, authenticated HTTP reads and Client integration. Import generic types and `userTaskServiceToken` from `@nocobase/app-plugin-task-center/server`; the approval contributor and coordination tokens remain exported from `@nocobase/app-plugin-approval/server`. `approval.task` and `approval.cc` are reserved by the shared approval contributor, while applicant tracking is a separate host source.

Register each source once and reuse its writer. Pass the same database transaction to business and index writes. Lists and counts use `/api/userTasks` and `/api/userTasks/statistics`; their filters must describe the same source/business scope. The generic HTTP API derives the owner from authentication and rejects client-supplied identities. An index entry never grants business detail or action permission.

The unchanged `202610190001_user_tasks` migration is now owned by Task Center; upgrade both packages together and register Task Center before applying migrations. Previously applied history is recognized by name and checksum, preserving existing rows. Old application-owned index prototypes require separate migration.

## Connect an approval definition

Resolve `approvalTaskContributorToken` once from the plugin provider and add it to the definition's host services. Extend the existing business service type with `taskContributor: ApprovalTaskContributor`. Reuse the same services in the runtime registration and `ApprovalService` composition described in [Lifecycle integration](lifecycle-integration.md).

```ts
import {
  approvalTaskContributorToken,
  defineApproval,
  type ApprovalTaskContributor,
} from '@nocobase/app-plugin-approval/server';

const services = {
  ...businessServices,
  taskContributor: container.resolve(approvalTaskContributorToken),
};

// RequestTypes.services includes the taskContributor field above.
const request = defineApproval<RequestTypes>({
  ...requestDefinition,
  userTasks: (services) => ({
    contributor: services.taskContributor,
    describe: (task) => ({
      subject: task.source,
      title: 'Review request',
    }),
  }),
});
runtime.register(request, { services });
// Pass request.approval and the same services to ApprovalService.
```

Without `userTasks`, that definition contributes nothing. The container contributor is shared across definitions; do not instantiate one per definition. `describe(task, context)` returns `{ subject, title }`, synchronously or asynchronously. Context provides `transaction`, `at`, `directory` and `kind`. Use its transaction for business reads and contribute only titles safe for every recipient. Keep mapping free of notifications, external effects and lifecycle mutations. Optional `recipients(task, context)` overrides open-task recipients for explicit host rules, not historical completion ownership.

### Business example: centralize leave and expense approvals

User request: "Managers should handle leave and expense approvals in one place and see how many are waiting." Preserve both businesses' existing stages and authorized action routes. The following composition example assumes the application already exports `leaveDefinition`, `expenseDefinition`, their lifecycle type contracts `LeaveTypes` and `ExpenseTypes`, and one compatible `businessServices` object. These names are application-owned placeholders, not package exports; adapt them to the actual application. The existing definitions should be option objects used to construct the lifecycles, not already registered lifecycles.

```ts
import {
  ApprovalService,
  approvalTaskContributorToken,
  defineApproval,
  type Approval,
  type ApprovalTaskContributor,
} from '@nocobase/app-plugin-approval/server';

// Extend each existing lifecycle's service contract; preserve record/state types.
type CenterLeaveTypes = Omit<LeaveTypes, 'services'> & {
  services: LeaveTypes['services'] & {
    taskContributor: ApprovalTaskContributor;
  };
};
type CenterExpenseTypes = Omit<ExpenseTypes, 'services'> & {
  services: ExpenseTypes['services'] & {
    taskContributor: ApprovalTaskContributor;
  };
};
const services = {
  ...businessServices,
  taskContributor: container.resolve(approvalTaskContributorToken),
};
const leave = defineApproval<CenterLeaveTypes>({
  ...leaveDefinition,
  userTasks: (services) => ({
    contributor: services.taskContributor,
    describe: (task) => ({
      subject: 'leave',
      title:
        task.kind === 'copy' ? 'Leave request copy' : 'Review leave request',
    }),
  }),
});
const expense = defineApproval<CenterExpenseTypes>({
  ...expenseDefinition,
  userTasks: (services) => ({
    contributor: services.taskContributor,
    describe: (task) => ({
      subject: 'expense',
      title:
        task.kind === 'copy'
          ? 'Expense request copy'
          : 'Review expense request',
    }),
  }),
});
runtime.register(leave, { services });
runtime.register(expense, { services });
const approvals = new ApprovalService(
  runtime,
  [leave.approval, expense.approval] as unknown as Approval<never>[],
  services,
);
```

Apply this at the existing composition point, replacing the original registrations; do not register the same lifecycle twice or create a competing `ApprovalService`. The heterogeneous metadata cast follows the service's current public contract; it does not replace checking that the supplied services satisfy both definitions. Use the application's server translation convention for contributed titles; the literal English titles here only illustrate a safe mapping. Do not put leave reasons, expense details or other restricted content in the shared index title.

The center's default list reads `/api/userTasks?status=pending&sourceType=approval.task`; its counts read `/api/userTasks/statistics?sourceType=approval.task`. Add `subject=leave` or `subject=expense` to both when a business filter is selected. Do not pass `status=pending` to statistics when displaying counts for all status tabs. Use the host API client and its configured base path. If the center is scoped to only these two businesses in an application with other approval sources, the API has no subject-array filter: implement an owner-scoped, database-filtered read in the owning service/API or present separate subject views; never concatenate independently paged results or silently include unrelated approvals.

On opening an item, use an application-owned mapping from its `sourceType` and `subject` to the business detail adapter. `sourceKey` is the approval task ID, not the application record ID; resolve it through the existing authorized business API. Show reviewed content and offered actions using [Frontend integration](frontend.md), then submit to that business's approval operation. After a successful action, reload the detail and invalidate both the affected list and counts. On a conflict or stale task, refresh the detail/actions before another decision. Never complete an approval by calling the generic index writer from a page or by exposing a generic completion endpoint.

For these already-running businesses, run the backfill below for each definition with its own source and cursor. If delegation is supported, use that same configuration for dependency synchronization. A newly submitted task then appears without a separate notification subscriber or manual index write in the submit/approve endpoints.

The engine writes contributions at every task insert or successful conditional update through `ApprovalWork`, inside the approval fact transaction. This covers entry and next stages, partial/final/batch decisions, pool claim/release and timeout, transfers, added/removed signers, administrator changes, custom task effects, withdrawal/return, reuse, sweep escalation and copy reading. A failed contribution rolls back the operation. Do not add `observeApprovalFacts`, `ApprovalQuery` or a second projection hook to make this work. Direct writes to approval tables bypass the engine and are unsupported.

| Task fact                     | Personal item                                                           |
| ----------------------------- | ----------------------------------------------------------------------- |
| Open decision or waiting work | `approval.task`, pending for active recipients                          |
| Suspended pool candidate      | Cancelled; release can restore pending with the same identity           |
| Completed decision            | Completed for the assignee and actual actor; unused delegates cancelled |
| Transferred or voided work    | Cancelled for former recipients                                         |
| Unread/read copy              | `approval.cc`, pending/completed                                        |

The source key is the task ID. Return/resubmission creates new task identities. Default decision recipients include the assignee and active directory delegate, excluding applicant delegates unless the stage enables `allowSelfApproval`; copies are not delegated. For manual synchronization/backfill outside the coordinator, pass `allowSelfApproval: (stage) => approval.stage(stage).allowSelfApproval === true` in the contribution context; omitting it retains applicant-delegate exclusion. Forward-mode delegation can include an existing task when the engine permits that delegate to act, but synchronization does not physically reassign task rows. Completed history survives delegation expiry. The index includes waiting work; it does not evaluate every action guard. Keep actual decisions behind the existing authenticated, authorized approval APIs.

## Track applications separately

An applicant's “my applications” item is host-owned. Register `approval.application` once and use the application record ID as its stable source key across return/resubmission. In business lifecycle hooks, map the complete business state to index status and call the writer with `tx.handle`. Keep an application pending while it waits for correction or later stages when the business requires it; one stage's approval does not mean the whole application is completed. Explicitly choose the original applicant and/or delegated filer as owners. Never infer ownership from an arbitrary transition actor. Business execution after approval may also need to finish before the application item completes.

## Synchronize dependencies and backfill history

Enable online contributions before backfilling. Reuse each definition's exact mapping, directory, kind and clock. `source` below is the approval definition's `name`, not `approval.task` or the collection name. The following example assumes the host supplies a durable `backfillJobs` repository whose `save` method writes through the given connection; persist its cursor and completion marker in the same transaction as the batch:

```ts
const approval = request.approval;
const configuration = approval.options.userTasks!(services);

const result = await runtime.transaction(async (tx) => {
  const batch = await configuration.contributor.synchronizeBatch(
    approval.name,
    configuration,
    {
      transaction: tx,
      at: tx.now,
      directory: approval.options.directory(services),
      kind: approval.kind,
    },
    { afterId: lastCommittedCursor, limit: 100 },
  );
  await backfillJobs.save(
    {
      source: approval.name,
      cursor: batch.nextCursor,
      done: batch.nextCursor === null,
    },
    tx.handle as DatabaseConnection,
  );
  return batch;
});
```

`synchronize(taskId, source, configuration, context)` handles one existing task and returns false for a missing task or wrong source. `synchronizeBatch(source, configuration, context, { afterId?, limit?, assigneeId? })` scans ascending numeric task IDs, defaults to 100 and permits at most 1000 per batch. Its result is `{ processed, nextCursor }`; null means exhausted, including a possible final empty pass after an exact-size batch. Store cursors per source and scan scope; serialize workers for the same durable job or protect cursor updates with a conditional version check. Resume from the last committed cursor, and do not treat null as a request to restart a finished job.

Synchronization claims the current task version before projecting, so stale backfill cannot restore pending after an online completion. Single and batch calls use savepoints: failure rolls back all their index changes and version increments even if the caller catches it. On `ApprovalError` code `CONFLICT`, deadlock or database serialization errors, retry the entire outer transaction with a fresh snapshot and reload the committed cursor. Retrying in the old transaction is insufficient. Never advance the cursor of a failed batch. Synchronization changes concurrency versions, so concurrent online actions may also need a fresh transaction retry; it does not replay business actions, notifications or lifecycle transitions. Replaying unchanged projections preserves item identity and timestamps.

The host must durably trigger synchronization for organization/delegation changes, timed delegation start/expiry and business fields used in titles. Where possible, update the dependency and synchronize affected tasks in one database transaction; otherwise persist a retryable job with the dependency change. Use `assigneeId` to bound an affected principal's scan. Changing a pool definition does not mutate existing tasks: use engine assignment operations before reconciling recipient eligibility. GET requests never repair projections. Missing facts do not imply deletion; the source owns any purge and index retention policy.

Move new personal lists and counts directly to the index, backfill and verify each source, then retire the old personal-query registrations. Remove the old approval query/statistics registrations. Use record-level participation checks for business permission relations and host-owned projections for business metrics; see the Task Center migration guide. Preserve host detail authorization and source-specific actions; the index provides neither a universal completion button nor an automatic replacement for the application's center UI.

## Business acceptance

Verify the requested center through the application's real composition and routes, not just a standalone writer. For the leave/expense example, submit one of each, sign in as their assigned reviewer, open each from the center, inspect the business content, perform an offered decision, and verify list/count refresh and the next stage's recipient. Verify another user cannot read the item or perform the action. The list and counts must use the same business/source scope.

Exercise the operations the business supports: one countersigner finishing while others remain pending; transfer cancelling the former recipient's work; withdrawal cancelling outstanding work; return/resubmission producing fresh task identities; copy reading updating only the copy source; and contribution failure rolling back both business and index changes. With delegation, verify activation and expiry without any approval write or GET-triggered repair. For existing data, replay and resume backfill while an online decision occurs and confirm completed work never returns to pending.

If no running application or suitable database is available, report the unverified scenarios explicitly. Installing the plugin, configuring `userTasks`, passing type checks or drawing the center page alone does not establish this business loop.

## Durable dependency coordinator

Prefer `approvalTaskDependencyCoordinatorToken` for dependency changes and timed delegation eligibility. Register definitions and fresh, versioned transaction-bound adapters before provider readiness; see [the integration contract](task-dependencies.md). Capture writes through `change()`, include old/new original assignees, and use a source-wide fallback when reverse user/organization dependencies cannot be narrowed safely. Persist both start and expiry boundaries. Complete resumable initialization before reporting the source ready. Registered online writes, repairs and worker batches share a source fence and refresh projection contexts after locking; retry conflicts in a fresh outer transaction. Expose `status`, bounded `jobs`, `retry` and `reinitialize` only through authorized host administration.
