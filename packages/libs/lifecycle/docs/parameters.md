# Versioned parameter contracts and instance snapshots

A definition version fixes its parameter contract: field set, type, meaning, unit, validation and defaults. Administrators edit values for that concrete definition name. A change to the contract needs a new definition version. Different versions can reuse field names with different contracts; they never implicitly share configuration.

An instance freezes its complete effective parameter values at its explicit business start. Every later guard, route, setter, state hook, action, trigger, effect, retry, continuation and recovery reads that snapshot. Administrator edits affect only instances of that definition started afterward. There is no general instance-parameter editing API.

## Declare the business start

```ts
const thresholds: ParameterGroup = {
  key: 'thresholds', title: 'Approval amounts (yuan)', schemaVersion: 1,
  fields: {
    limit: { type: 'number', title: 'Limit (yuan)', parse(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Expected a non-negative amount.');
      return value;
    } },
  },
};
// In the definition:
parameters: { limit: 5000 },
parameterConfiguration: { startTransition: 'submit', groups: [thresholds] },
```

Omit `startTransition` only when creation is the formal start. A string or explicit array identifies transitions that can formally start a saved draft. Do not select the first arbitrary transition merely for convenience. Return for information, withdrawal to draft, resubmission, payment retries and reopening the same instance preserve its existing snapshot. A genuinely new initiation needs a new record identity, not an overwrite of the old snapshot.

Before start, `resolveParameters` reads current configuration for preview. It writes nothing. Without a snapshot, a creation-start instance fails with `PARAMETER_SNAPSHOT_MISSING`; a transition-start instance checks its history. A successful start entry without a snapshot also fails. Absence of creation evidence fails with `PARAMETER_START_UNKNOWN`, even if the record is currently in an initial state. Invalid, incomplete or incompatible snapshots fail with `PARAMETER_SNAPSHOT_INVALID`; they never fall back to current configuration.

## Store one complete configuration revision

Register `parameterConfiguration: { store, scope }`. Scope is authoritative server context, not form input. `LifecycleParameterStore.readConfiguration(scope, lifecycle, transaction)` reads one complete revision for one concrete definition name. It must not independently read mutable group heads. `StoredLifecycleParameters` reads the head once and then its immutable revision. Save all groups as one revision with `configurationGroup(definition.name, definition.parameterConfiguration.groups)` and `store.save(...)`; group boundaries organize the editor only. `WorkflowParameterStore` uses one CAS-protected row per concrete definition.

Every save validates the complete version, including cross-field constraints, and compares the expected revision. Current values may be partial overrides of code defaults; start normalizes and persists the complete result, including every default. The snapshot contains scope, concrete lifecycle name, record identity, revision, fixed time, values and field sources. Execution validates that snapshot directly before considering current configuration. Invalid current configuration cannot block a valid existing snapshot.

New versions may explicitly copy matching fields from an older configuration as initial values. Validate against the target contract, report incompatible fields, and save independently. A never-saved configuration uses that version's own defaults. There is no synchronization, inheritance or cross-version group compatibility restriction.

Synchronous `parameters` and asynchronous `parameterProvider` registrations remain deprecated for definitions without `parameterConfiguration`; do not use them for a new configurable process. They cannot be combined with snapshot configuration.

## Atomic start and idempotency

The start resolution, snapshot, record change, transition entry and queued execution facts commit in the same transaction. A failed start rolls them all back. One same-record action can use `withParameterExecution` to share a resolution with nested `tx.fire` calls. Caller-owned action replay checks still happen before executing the action.

Use `fire(..., { requestId })` for retries of one submission. Use `create(..., { requestId })` for creation-start flows. The owned creation-receipt table has a string primary key and fields `status`, `revision`, `actorId`, `fingerprint`, nullable `recordId` and `entryId`, and `at`; configure `creationRequestsCollection` on the runtime. A savepoint-protected unique insert claims the request in the business transaction. Concurrent database requests wait for that claim and return the original instance; changed input is refused. Scope, concrete definition and actor participate in the identity. `requestInput` is trusted, normalized business input for fingerprinting when the server also generates values such as timestamps; never populate it from an unvalidated request body independently of the validated creation values.

Effect jobs carry the concrete definition and record identity, not a mutable configuration reference. Restarting a worker, retrying an effect or continuing its recorded outcome reuses the same snapshot and external idempotency key.

## Per-instance deadlines

A configured definition with triggers declares an indexed nullable `dueAtField`. Runtime owns it alongside the binding, state and concurrency fields. Create and every transition calculate the earliest deadline of the destination state's triggers from that instance's parameters and write it atomically with the state. No separate runtime backfill writes occur.

Index `(stateField, dueAtField)` on the business table. A sweep filters state, definition binding and `dueAt <= now`, pages by `(dueAt, id)` and batch-loads snapshots. It verifies each trigger's delay against each record's snapshot and checks the record version again when firing. Corrupt snapshots are logged without blocking the rest of the page. Each trigger has a bounded successful-fire count; an overdue guard refusal can recur on a later sweep but does not starve later candidates in the current sweep. Migrations calculate old deadlines once during a stopped-writer deployment. A direct business-table write that bypasses the runtime cannot manufacture a valid deadline.

## References and current business facts

A snapshot fixes selected reference IDs and rule groups. Current department/role membership and person eligibility remain external facts resolved at execution. Deleted references resolve to no candidates; the editor displays the missing reference. Assignments that require candidates must reject an empty result with an explicit `NO_ELIGIBLE_REVIEWER` precondition; the existing reviewer demonstration only previews candidates. Do not silently replace a selected reference or change an instance snapshot. Inventory, personnel validity and other current business facts are distinct from versioned parameters.

## Administration and instance detail

Show the concrete version being configured and state that changes affect its future starts. Require a version on parameter APIs and a concrete definition identity in saves; reject a target mismatch. Preserve unsaved inputs when switching versions with Save, Discard and Cancel. Save must succeed before navigation; failures stay on the original form. Key forms and requests by definition version and discard responses from an unmounted version. Display an instance's actual snapshot, revision, sources and fixed time; a draft displays a clearly labelled current-configuration preview.

## Example start inventory

| Definition                        | Formal start       | Same-instance continuation           |
| --------------------------------- | ------------------ | ------------------------------------ |
| `expenses`, `expenses-v2`         | `submit`           | Return, withdrawal and resubmission  |
| `tickets`                         | Create             | Reopen and reply                     |
| `orders`                          | First `checkout`   | Checkout retry after payment failure |
| `invoices`, `exports`             | `submit`           | Failure retry and continuation       |
| `subscriptions`                   | Create             | Renewals and dunning                 |
| Office `incoming`, `dataRequests` | `submit`           | Return and resubmission              |
| Office `clerkTasks`, `teamTasks`  | Create by dispatch | Further dispatch and feedback        |

The parameterless purchase, fulfilment, extraction, executor, procurement and onboarding definitions do not need snapshots. Office holidays remain fixed process parameters; organization membership is a current fact.

## Upgrade and rollback

Stop every writer, worker and scheduler, back up the database, migrate, inspect the conflict report, then start only the new code. Do not mix old and new processes. Keep old definitions, immutable revisions, snapshots, usage evidence, creation receipts and queued jobs.

Split shared configuration into independent definition-name configurations. Revision zero uses each version's own defaults; saved overrides are extracted and validated per target contract. Report values differing from target defaults. Preserve complete historical snapshots exactly. For an incomplete snapshot, only the usage fact associated with the earliest successful start entry, transition kind and attempt zero proves the missing startup values. Preserve existing fields and reject disagreements. Never recover from a later arbitrary usage fact, current configuration or current state. A record without reliable start history is a conflict, not an assumed draft.

Unrecoverable instances fail migration with definition, record, state, missing/conflicting fields and available start evidence. Resolve them with reliable business history before retrying; a migration-time baseline or temporary dynamic execution requires a separate explicit product decision. Old dynamic instances become fixed at their recovered start values, which may differ from what they used just before upgrade, especially long-lived subscriptions. Report that impact. After new instances start, rollback to dynamic-reading code would break their promise; restore the entire pre-upgrade database backup instead. Migration down operations retain snapshot evidence and populated receipt tables.
