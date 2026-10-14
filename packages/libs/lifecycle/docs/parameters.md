# Runtime parameter configuration

Lifecycle structure stays in source. Administrators can change only fields explicitly declared in `parameterConfiguration`: schemas, modes, bindings, states, transitions, effects and timeouts remain code-owned.

## Declare complete parameter groups

```ts
const expenseThresholds: ParameterGroup = {
  key: 'expenseThresholds',
  title: 'Expense thresholds',
  schemaVersion: 1,
  fields: {
    autoApproveLimit: {
      type: 'number',
      title: 'Automatic approval limit',
      parse: (value) => z.number().finite().nonnegative().parse(value),
      bindings: [{ transition: 'submit' }],
    },
    financeLimit: {
      type: 'number',
      title: 'Finance limit',
      parse: (value) => z.number().finite().nonnegative().parse(value),
      bindings: [{ state: 'awaitingManager' }],
    },
  },
  sameReadMode: [['autoApproveLimit', 'financeLimit']],
  validate: ({ autoApproveLimit, financeLimit }) => {
    if (Number(autoApproveLimit) > Number(financeLimit))
      throw new Error('Automatic approval cannot exceed the finance limit.');
  },
};

// Inside defineLifecycle():
parameters: { autoApproveLimit: 500, financeLimit: 5000 },
parameterConfiguration: {
  readMode: 'snapshot',
  snapshotTransition: 'submit',
  groups: [expenseThresholds],
},
```

Each field has a stable key and a parser that returns its entire normalized JSON value. A save must contain exactly the group's complete field set; object values replace the entire object, without recursive merging. The runtime rejects duplicate groups or fields, invalid defaults, unknown bindings and incompatible `sameReadMode` declarations. A field can override the flow's mode with `readMode: 'live'` or `'snapshot'`. Modes cannot be changed through configuration saves.

A first successful `snapshotTransition` persists all snapshot fields before routing, setters and hooks, inside the business transaction. Draft previews read current values and do not persist a snapshot. Return, withdrawal and resubmission retain the original snapshot. Both outer transaction rollback and failed nested savepoints discard snapshot writes and their cached resolutions. A submitted record missing a newly declared snapshot field, or using an incompatible schema, fails explicitly and requires a migration.

## Storage and registration

```ts
const parameters = new StoredLifecycleParameters(
  lifecycleStore,
  collectionNames,
);
runtime.register(expenseLifecycle, {
  parameterConfiguration: {
    store: parameters,
    scope: ({ record }) => resolveScopeFromAuthoritativeRecord(record),
    snapshotRequired: (record) => record.status !== 'draft',
    legacyRecord: (record) => record.parameterContract !== 1,
  },
});
```

`LifecycleParameterStore` is an optional capability separate from `LifecycleStore`. Existing custom stores need no new methods. Registering a configured lifecycle without a complete parameter adapter fails immediately. `StoredLifecycleParameters` works with the memory and repository lifecycle stores; repository applications create the six collections named by `LIFECYCLE_PARAMETER_COLLECTIONS`, or supply application-specific names.

The collections store current heads (`id, scope, groupKey, status, revision`), immutable versions (`id, payload, selectionCounts`), reviewer selections (`id, versionId, ruleKey, group, type, referenceId`), request receipts (`id, actorId, fingerprint, revision`), snapshots (`id, payload`) and usage facts (`id, payload, recordKey, at`). IDs are strings; scope/group heads need a unique constraint, selections an index on versionId, and usages an index on recordKey/at/id. Payload fields are JSON, selectionCounts is JSON, fingerprint is text, and at is a zoned timestamp. Snapshot and usage persistence joins the runtime's transaction handle. The example plugin includes a complete migration.

Scopes come from server-owned context. Authenticate and authorize reads and writes before validation or record lookup; validate every referenced entity in that scope inside the save transaction. Do not accept effective parameters, read modes, arbitrary field names or scope overrides from a business request. `legacyRecord` is an explicit application policy that keeps pre-contract records on code defaults; `snapshotRequired` prevents missing historical snapshots from silently acquiring current values.

`store.save({ scope, group, values, expectedRevision, requestId, actorId, at }, transaction?)` validates and atomically saves a complete immutable version and its selections. Heads use compare-and-swap. A stale expectedRevision raises `CONFIGURATION_CONFLICT`; replaying the same actor/requestId/normalized values returns the original version, and reusing a request ID for different input raises `CONFIGURATION_REQUEST_REUSED`. Failed reads, invalid stored values and incompatible versions propagate; defaults apply only when no configuration exists.

## Execution, actions and history

A transition reads once after request replay and record expectation checks. Its guards, route, set, state hooks and transition hook share detached, recursively frozen values. Same-record nested `tx.fire()` calls inherit them; another record gets its own resolution. Independent executions, effect attempts and continuation transitions read live values again.

`withParameterExecution(name, id, work, { actionId, transaction? })` loads the authoritative record in a transaction and passes effective parameters, a `LifecycleTransaction` and the optional `ParameterResolution` (including sources) to the callback. Use it after the application's business-action replay check. It does not deduplicate actions. Supplying a stable actionId writes the action's parameter usage fact in the same transaction; nested transitions have their own facts and share the values.

```ts
await runtime.withParameterExecution(
  'expenses',
  expenseId,
  async (values, tx) => {
    await executeBusinessAction(values, tx.handle);
    await tx.fire('expenses', expenseId, 'approve', { actor });
  },
  { actionId: businessActionId },
);
```

`available()`, `can()`, `view()` and `lifecycleDescriptionViewAsync()` support asynchronous resolution. A configured record view returns `parameterValues` from the same record and context used to compute availability. An authorized description preview resolves current values with `record: null`; a record preview resolves its snapshot plus current live values. Previews produce no snapshot, task or usage fact and do not replace action-time guard checks.

Transitions and identified actions save actual values and per-field sources transactionally. Each effect attempt saves its actual values before external execution, fenced against the active run attempt. Sources identify group, immutable revision, schemaVersion, mode and whether values came from defaults or configuration. `snapshot()`, `usage()` and `listUsage()` expose persisted facts. Lifecycle run pruning never deletes these configuration facts. Show actual usage separately from current effective values; legacy records without facts must display “Not recorded”, rather than presenting today's configuration as history.

Live retries read the new complete configuration. Effect idempotency keys remain stable per run. Use live retry examples for presentation copy; payment amounts, accounts and recipients come from persisted business facts and must not change under the same external idempotency key.

## Reviewer selections

A reviewer field uses `type: 'reviewers'` and a parser calling `normalizeReviewerSelections(value, allowedTypes)`. Choices persist as simple selection rows with group, type and stable referenceId. `resolveReviewerSelections()` intersects conditions in each group, unions groups, deduplicates and applies the same eligibility filter to every result, including explicitly added people. Alternative users belong in separate groups.

Code registers selector implementations and the eligible callback. The example supports precise departments, scope-limited roles and users, excludes inactive people and the applicant, and rejects a zero-candidate submission. Custom selector types can represent positions, context references or named queries; arbitrary scripts and nested expressions are unsupported.

Snapshot stores the complete immutable rule, not a pointer to mutable choices. It does not snapshot organization membership. Resolve the selected rule when creating a task and persist that task's candidates. Existing task candidates remain fixed. The separate reviewer demonstration uses a finite, code-defined “any candidate may decide” policy, with record version checks allowing only one concurrent decision; it does not alter the expense workflow's single-approver semantics.

## Editor integration and compatibility

The example plugin exports `ParameterEditor`, `parameterApi` and `boundParameterGroups` from its client entry. A configuration page, an embedded form and optional diagram bindings all use the same editor and save endpoint. Bindings identify declared state or transition names, can expose several groups, and never execute a transition. Unbound diagram entries retain their original details. Read-only users have no save control; CAS conflicts preserve inputs and require reviewing the current revision before retrying. Editing current values never rewrites historical facts.

For custom asynchronous overrides without configured storage, register `parameterProvider`. Its values must be structured-cloneable primitives, plain objects and arrays; mutable built-ins such as Date, Map and Set are rejected. It receives lifecycle, authoritative record or creation values, execution purpose, transaction handle, and effect run/attempt context. It is mutually exclusive with both configured storage and the legacy `parameters` registration callback. Synchronous `runtime.parameters()` and `lifecycleDescriptionView()` retain legacy defaults/overrides and do not resolve async configuration. Trigger timeouts remain on the synchronous path and stay in code.

These are the open-source runtime contracts. Adoption by a separate approval plugin requires its own installed-version, action replay, scoped preview and task/opinion reuse compatibility verification.
