# Versioned parameter contracts and creation snapshots

A definition version fixes its parameter contract: field set, types, meaning, units, validation and defaults. Administrators edit one complete configuration revision for that concrete definition name. Different versions may reuse field names with different contracts; they never implicitly share configuration. A contract change requires a new definition version.

`LifecycleRuntime.create()` binds the concrete definition and freezes all effective parameters in the business transaction, including for an initial business state named `draft`. Draft is a business state, not a parameter mode. Later edits, submissions, withdrawals, returns, reopening, retries, continuations and worker restarts always use the same snapshot. To use new parameters, create a new record; there is no instance parameter replacement or rebinding API.

## Declare a configurable definition

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
parameterConfiguration: { groups: [thresholds] },
```

Register `parameterConfiguration: { store, scope }`. Scope is authoritative server context, not form input. `LifecycleParameterStore.readConfiguration(scope, lifecycle, transaction)` reads one complete immutable revision for the concrete definition; do not independently read mutable group heads. Save all groups as one revision with `configurationGroup(definition.name, definition.parameterConfiguration.groups)` and `store.save(...)`; groups organize the editor, not separate revisions. `WorkflowParameterStore` uses one CAS-protected row per definition.

Creation merges defaults with that revision and validates complete values and cross-field constraints once. The record, immutable definition binding, complete snapshot, creation entry, optional creation receipt and persisted execution facts share the transaction. Creation validation, state hooks and nested same-record operations reuse that resolution. A failure rolls back everything; asynchronous effects read the committed snapshot. No independent startup marker or deferred snapshot boundary exists.

With an existing record identity, `view`, `available`, `can`, `fire`, actions, triggers, effects, retries, continuations, recovery and instance diagrams read only its snapshot. A missing snapshot raises `PARAMETER_SNAPSHOT_MISSING`, including in draft. Invalid values, identity, timestamp, revision, or field provenance raise `PARAMETER_SNAPSHOT_INVALID`. Current configuration is never a fallback, and corrupt or unreadable current configuration cannot block an instance with a valid snapshot. Identity-free configuration previews still read current configuration and write nothing.

The snapshot contains scope, concrete lifecycle name, record identity, revision, fixed time, all values including defaults, and field sources. Sources identify the group, schema version, nonnegative revision and origin. A new definition may explicitly copy compatible fields as unsaved inputs, validate against its own contract, then save independently. A never-saved version uses its own defaults.

Legacy synchronous `parameters` and asynchronous `parameterProvider` readers remain supported only for definitions without `parameterConfiguration`; do not combine them with configured snapshots. Parameterless definitions do not require parameter storage. Custom `LifecycleStore` adapters must implement `findRecords(collection, ids)` as a bounded primary-key batch read: preserve transaction and visibility semantics, omit missing IDs, issue no query for an empty list, split at dialect parameter limits and avoid individual per-ID reads. Rebuild approval-extension adapters during upgrade.

## Creation idempotency

Use `create(..., { requestId })` to retry one creation. The configurable `creationRequestsCollection` has string key `id` and fields `status`, `revision`, `actorId`, `fingerprint`, nullable `recordId` and `entryId`, and `at`. It is needed when using creation request IDs, not merely because a configured definition has a draft state. A savepoint-protected unique claim joins the business transaction. Concurrent retries return the original record and snapshot; changed input is refused. Scope, concrete definition and actor participate in the identity. `requestInput` contains trusted normalized business input, not an independently unvalidated body.

Use `fire(..., { requestId })` for transition replay. Same-record actions may use `withParameterExecution` to share values and facts with nested `tx.fire` calls. Caller-owned action replay checks precede execution. Effects keep their concrete definition, record identity and external idempotency key across retry and recovery.

## State deadlines

A configured definition declares triggers only when the business needs them, with an indexed nullable `dueAtField`. Parameters such as waiting duration freeze at creation. Each transition calculates its destination state's earliest deadline from the time that state is entered, using the same creation snapshot, and writes it atomically with state and concurrency fields. An initial-state timer uses creation as that state's entry time. Delayed submission does not move the baseline back to record creation. Self-transitions restart the wait under the existing state-entry convention; withdrawal and later reentry calculate a new deadline using the original duration. Configuration edits never recalculate existing deadlines.

Index `(stateField, dueAtField)`. Sweeps filter state, concrete definition binding and due time, page by `(dueAt, id)`, batch-load snapshots and recheck concurrency before firing the transition declared by that version. Keep the successful-fire budget and resume refused backlogs. Corrupt snapshots are reported without stopping other candidates. No implicit automatic submission, cancellation or closure is added.

## References and current facts

Snapshots fix parameter values, selected reference IDs and rule groups. Current organization membership, personnel eligibility, inventory and other external facts follow their existing business contracts. Deleted references yield no candidates, and the editor displays missing references. Required assignments reject empty eligible results. Never refresh the snapshot or substitute another reference implicitly.

## Administration and instance details

Configuration edits affect only records created afterward in the selected version; existing drafts are unaffected. Require a concrete save target and reject mismatches. Preserve Save, Discard and Cancel during version changes or navigation, keep failed saves on the original form, and discard late responses from unmounted versions. Show the selected version once. Instance details, diagrams and parameter history display the actual snapshot values, revision, sources and fixed time, including for drafts. Current configuration is shown only on identity-free definition editors/previews.

| Creation entry                                    | Handling                                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Expenses v1/v2, tickets and durable example flows | Services call `runtime.create()` with their explicit concrete definition; all configurable records freeze immediately |
| Example sample records                            | Use the same services and runtime, including sample drafts                                                            |
| Office incoming documents and data requests       | Services create through the runtime; holidays freeze with the data request                                            |
| Office clerk/team/executor dispatch               | Claim, runtime creation, binding, snapshot where configured, child link and assignees share the parent transaction    |
| Office scheduled/manual extractions               | Use runtime creation in the request's transaction; extraction is parameterless and requires no snapshot               |
| Procurement and onboarding templates              | Existing runtime creation is retained; these parameterless definitions add no parameter storage                       |
| Imports, batches and custom child creation        | Route through `runtime.create()`; direct insertion cannot satisfy the configured contract                             |

## Historical inventory, preflight and rollback

Stop every writer, worker and scheduler, take complete database/storage backups, inventory retained snapshots and creation usage, then run the migration. Keep old definitions, immutable revisions, usage and creation receipts. Do not mix old and new processes.

The full read-only preflight validates every final payload before any configuration or schema write. Validate values, scope/name/record identity, timestamp, revision, and every source's group, schema version, revision and origin. Invalid complete snapshots are conflicts even if values alone look valid. Configuration normalization applies only to future-record configuration and never supplies historical parameters.

A missing snapshot may be recovered only from the full usage fact linked to the unique valid version-one `$create` entry, with matching scope, record, definition and attempt zero. Its usage timestamp may follow the creation entry because the fact is written later in the same transaction; preserve that actual time and reject a fact predating its entry. Its original values and provenance are retained. A current draft state, creation log alone, missing submit log, old unstarted marker, current configuration or current defaults cannot prove creation parameters. A later submit usage never repairs missing creation evidence, even if it is the earliest retained submit.

Preserve valid historical creation snapshots exactly. For definitions formerly frozen on submission, compare a valid historical snapshot with reliable creation usage. Require creation provenance as well as matching values, revision and sources: a snapshot must identify the creation event time or explicit verified creation-usage recovery. A later submission freeze time remains a conflict even when values agree. Never relabel that time as creation. If creation evidence is absent, differs, or proves only a different freeze event, leave both sources intact and report `LEGACY_SUBMISSION_SNAPSHOT` or `SNAPSHOT_CREATION_CONFLICT` with choices: explicitly approve retaining the original historical semantics, recover a verified backup, or recreate the record. Those choices need an operator/product decision and are not implemented by silently modifying records. Office's older versions kept no creation usage; unresolved Office records remain conflicts.

After a clean preflight, apply bounded batches with writers still stopped. The lifecycle example uses two scan passes rather than an unbounded in-memory write plan. A data conflict leaves configuration, schema and snapshots unchanged even without transactional DDL. MySQL's DDL is not generally transactional; an unrelated DDL failure still needs the backup/recovery procedure. After new records exist, rollback to old code requires restoring the pre-upgrade backup. Do not erase snapshots or receipts to manufacture rollback. Unmerged migration renames require recreating temporary preview databases or restoring their matching source/database backup, not editing execution history.
