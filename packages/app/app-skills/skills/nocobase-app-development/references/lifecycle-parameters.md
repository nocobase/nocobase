# Configurable lifecycle parameters

Apply this by default whenever building or iterating on a process with administrator-owned business policy, including approval departments, reviewers, thresholds or reopening windows. Inspect the business rules and proactively declare suitable configuration even when the user never asks for configurability; follow [system settings delivery](system-settings.md#discover-configurable-business-rules-by-default). Developers keep the workflow structure in source. Read [record lifecycles](lifecycle.md) first. This capability belongs to `@nocobase/lifecycle`; verify that the installed package exports `StoredLifecycleParameters` and `normalizeReviewerSelections` before using it. An older installation needs a compatible release upgrade rather than invented APIs.

## Code declaration and storage

Declare defaults in `parameters` and a code-owned `parameterConfiguration` with groups. Every group has key, title, schemaVersion and fields; every field has type, title and a parse function returning its complete normalized JSON value. Optional field bindings name a state or transition. The flow declares readMode and snapshotTransition, and individual fields can override readMode. Groups can declare a validate function and sameReadMode arrays for joint invariants.

```ts
import { StoredLifecycleParameters, type ParameterGroup } from '@nocobase/lifecycle';
import { z } from 'zod';

const thresholds: ParameterGroup = {
  key: 'approvalThresholds', title: 'Approval thresholds', schemaVersion: 1,
  fields: {
    automaticLimit: {
      type: 'number', title: 'Automatic approval limit',
      parse: (value) => z.number().finite().nonnegative().parse(value),
      bindings: [{ transition: 'submit' }],
    },
    financeLimit: {
      type: 'number', title: 'Finance review limit',
      parse: (value) => z.number().finite().nonnegative().parse(value),
      bindings: [{ state: 'financeReview' }],
    },
  },
  sameReadMode: [['automaticLimit', 'financeLimit']],
  validate: (values) => {
    if (Number(values.automaticLimit) > Number(values.financeLimit))
      throw new Error('Automatic approval cannot exceed the finance limit.');
  },
};

// In the definition:
parameters: { automaticLimit: 500, financeLimit: 5000 },
parameterConfiguration: {
  readMode: 'snapshot', snapshotTransition: 'submit', groups: [thresholds],
},

// Register on the application's existing lifecycle runtime:
runtime.register(expenseLifecycle, {
  parameterConfiguration: {
    store: new StoredLifecycleParameters(lifecycleStore, collectionNames),
    scope: ({ record }) => scopeFromAuthoritativeRecord(record),
    legacyRecord: (record) => record.parameterContract !== 1,
    snapshotRequired: (record) => record.status !== 'draft',
  },
});
```

Create six collections with an immutable migration, using application-owned names: heads (string id, scope, groupKey, status, integer revision; unique scope/groupKey); versions (string id, JSON payload, JSON selectionCounts); selections (string id, versionId, ruleKey, integer group, type, referenceId; index versionId); requests (string id, actorId, text fingerprint, integer revision); snapshots (string id, JSON payload); usages (string id, JSON payload, recordKey, zoned timestamp at; index recordKey/at/id). Pass names as `{ heads, versions, selections, requests, snapshots, usages }`. Existing LifecycleStore implementations are unchanged; custom parameter adapters implement the separate LifecycleParameterStore interface, including read/save/snapshot/saveSnapshot/usage/saveUsage/listUsage.

Resolve scope and record identity from server-owned context. Authenticate and authorize configuration read/write before validators or record lookup. In the save transaction validate referenced entities in that scope, then call `store.save({ scope, group, values, expectedRevision, requestId, actorId, at }, transactionHandle)`. Save exactly the complete declared group: never accept undeclared fields, schemaVersion, modes, workflow structure or client-provided effective values. A stale revision is a 409 configuration conflict; the same request and values replay its immutable version. Reused request IDs with different input fail. Only an absent configuration uses code defaults; read errors and incompatible schemas fail.

## Snapshot, live and execution consistency

Snapshot fixes all declared snapshot fields at the first successful formal submission, before routing, setters and hooks, in the business transaction. Draft preview writes nothing. Return, withdrawal and resubmission keep the original snapshot. Snapshot rules fix their choices, not organization membership. New snapshot fields missing from an old submitted record require a migration; never fabricate historical values using current settings. Define an explicit legacyRecord policy when introducing the contract to existing records, and use a version marker on newly created records.

Live reads current complete values for every execution, effect retry and continuation transition. A same-record execution shares one resolution through guard, execute, route, set, hooks and nested tx.fire calls; different records have independent resolutions. For business actions use `runtime.withParameterExecution(name, recordId, async (parameters, tx) => { ... }, { actionId, transaction })` after the application's action replay check. This helper writes an identified action's usage fact but does not deduplicate the business action. Query services in guards and callbacks must use tx.handle.

Use `runtime.view()` for record availability and effective parameterValues from one authoritative preview. Use `lifecycleDescriptionViewAsync(runtime, name, { record: null, purpose: 'preview', transactionHandle: undefined })` for an authorized current configuration description. Record-aware previews pass the authoritative record. Preview is informative; actual execution rechecks guards.

Transitions, identified actions and each effect attempt record actual values and per-field revision/schema/origin/mode. Effect facts persist before external execution and are fenced against the active attempt. `store.snapshot()`, `store.usage()` and `store.listUsage(scope, lifecycle, recordId)` expose history. Pruning effect runs preserves configuration facts. Display “Not recorded” for missing historical usage and show current effective values separately.

Do not change payment amounts, accounts or recipients through live configuration while retaining an effect run's idempotency key. Those identities come from persisted business facts. Simulated notification copy is a safe demonstration of fresh live values on retry. Trigger timeouts remain code-owned.

## Reviewer rules and task boundaries

Use `type: 'reviewers'`, parsed with `normalizeReviewerSelections(value, ['department', 'role', 'user'])`. Persist flat choices `{ group, type, referenceId }`, never arbitrary expression JSON or scripts. Same-group conditions intersect, separate groups union and deduplicate. Alternative people belong in separate groups.

Register selectors with `resolveReviewerSelections(choices, { scope, applicantId, transactionHandle }, { selectors, eligible })`. Each selector returns IDs for its code-declared reference type; eligible uniformly filters every result, including explicit users. Departments use exact membership unless code explicitly provides another named selector, roles respect scope, and inactive users and the applicant are filtered. Code determines a zero-candidate failure and the node's decision policy. Custom types may resolve positions, contextual department references or named queries without accepting arbitrary scripts.

On task creation resolve the snapshot or live rule against current organization data and persist candidates on the task. Existing candidates stay fixed. A single approver field is not a multi-person approval system. To demonstrate multiple candidates, declare a separate finite “any candidate can decide” workflow and use version checks so only one concurrent decision succeeds. Real approval plugins need their own compatibility verification for action replay, settings previews, task construction and opinion reuse; fixed current-round tasks or inherited opinions cannot stand in for rule configuration.

## Management pages and contextual editors

When application requirements include a process to develop, deliver workflow management pages by default as [Lifecycle UI](lifecycle-ui.md) describes, reusing the existing management area when present. Insert declared parameter forms into the `workflow-management` block's definition-detail parameter slot; users do not need to request these pages separately. Follow the scope exceptions in [system administration](system-administration.md#default-delivery); API-only work and explicitly excluded UI need no configuration page or diagram. Declared, authorized bindings receive contextual configuration by default; management pages do not introduce a second workflow-design system.

For workflow management pages, prefer a visible parameter form beside the process diagram, grouped by business state or transition. Show shared fields once without changing their storage/save boundaries. Use the [Lifecycle UI reference](lifecycle-ui.md) for list, detail and administration composition. Provide contextual node or transition editing for declared, authorized bindings without requiring an explicit user request; keep the same editor and save contract and do not make diagram icons the only way to discover settings.

For save request IDs, follow the [browser request ID guidance](lifecycle.md#5-the-page): use an HTTP-compatible generator and retain the key for retries of the same save.

The example plugin exports `ParameterEditor`, `parameterApi` and `boundParameterGroups` from `@nocobase/app-plugin-lifecycle-example/client`. They illustrate a shared editor with an injected API, complete-version CAS saves, read-only mode and preserved drafts on conflicts. They are example exports, not an automatically installed platform settings service. Applications can implement the same contracts in their own UI.

For a working management page in the NocoBase source repository, inspect `packages/templates/app-template-examples/client/pages/workflows/definition.tsx`, `parameters.tsx` and `parameter-sections.ts` in that directory. They place the parameter editor beside the diagram and map bound fields into business sections. The example plugin's `client/components/parameter-binding-editor.tsx` remains a reference for a diagram-bound dialog. These source paths are examples, not installed application imports.

For click-to-edit diagrams, derive groups from description.parameterConfiguration.groups and bindings referencing the clicked state or transition name. One entry can bind several fields or groups. Intercept only bound entries; unbound entries retain the component's ordinary details. In the example, ProcessDiagram's onParameterBinding(kind, name) returns true when the shared editor handles the click. Clicking opens configuration and never fires a transition. Use the diagram component's actual node/edge callbacks rather than assuming an event API.

Show field titles, units, validation, read mode and effective timing. Snapshot changes affect new submissions; live changes affect subsequent executions/retries. Read-only viewers see disabled fields and no save control. On 409 keep draft inputs, fetch the current revision and values, then require a deliberate retry against that revision. Label an editor opened from history as current configuration; never rewrite an old snapshot, actual usage fact or candidate list.

## Validate the integration

Test complete schemas and cross-field constraints, CAS/replay, reference scope and authorization before validation. Prove draft previews create no facts, first submission freezes every snapshot field, failed transactions/savepoints remove it, resubmission retains it, and missing historical fields fail. Check same-record actions/nested transitions share values while different records do not. Prove fresh live retries preserve business idempotency and record each attempt's facts.

Exercise reviewer intersections/unions, duplicate and inactive/applicant filtering, changed department choices, changed organization membership and fixed existing candidates. Test simultaneous decisions. For the delivered UI entry points verify shared save behavior, read-only rendering, preserved conflict drafts, multi-field bindings, untouched unbound entries and distinct current/history labels in the running application. Use the normal testing helpers and run skills sync after installation so this reference is reachable from the normal Skill entry.

## Contextual entry defaults

When a declared business parameter has a state/transition binding and the administrator may update it, connect `LifecycleDiagram.configuration` by default to the same authoritative editor used by the management form. Follow [the default diagram contract](lifecycle-ui.md#default-diagram-and-configuration-contract). The filtered callback selection identifies fields to focus, not a complete replacement group: preserve other values through an authorized read/merge/save with the expected revision. The server independently checks field/group permissions and validates the complete group. A node button is never evidence of runtime configurability without storage and a real consumer.

When reviewers resolve from an existing organization relationship or role membership, provide an authorized `stateActions` entry on that approval node to the existing profile/role editor, as [Lifecycle UI](lifecycle-ui.md#default-diagram-and-configuration-contract) describes. Keep those identities in their authoritative service; do not duplicate them as workflow parameters. Verify the saved relationship/membership changes the candidates for an eligible new record/task while existing fixed candidates remain unchanged.
