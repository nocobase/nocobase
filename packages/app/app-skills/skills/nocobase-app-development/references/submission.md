# Preventing duplicate submissions

New Default and Examples applications register `SubmissionProvider`: standard Repository `createOne`, `updateOne` and `deleteOne` endpoints require `Idempotency-Key`. The receipt migration must be installed on the same managed connection as the business write. A missing key is rejected. Native user account administration (including role assignment, deletion, password reset and session revocation), Permission Set create/update/delete, and default-access create/update/delete also use the same receipt contract and retain their native authorization checks. Reads and unadapted custom HTTP routes are unchanged. The standard form pattern uses `useSubmission` from `@nocobase/app-client`; disabling a button or relying on React Hook Form's `isSubmitting` alone does not coordinate Enter, an external footer, confirmation and programmatic entry points.

## One form, one operation

Create one `useSubmission({ scope })` controller for a form, scoped by the server-authenticated identity, action, target and stable form instance. All entry points call its `run(snapshot, execute)` before asynchronous validation. `submitting` drives buttons, spinners and close guards. Run `form.handleSubmit` inside `execute`; return without sending if invalid. Unlike `trigger()`, `handleSubmit` records a submission attempt, so React Hook Form revalidates corrected fields on change after a failed submission. Do not generate ids or timestamps afresh on a retry: derive them from the operation key or retain them in the original snapshot. Use a separate controller for an independent form.

```tsx
const submission = useSubmission({ scope: `${userId}:orders:${formId}` });
const submit = async () => {
  const snapshot = { name: form.getValues('name'), id: order?.id };
  try {
    const saved = await submission.run(snapshot, async (key, signal, input) => {
      let valid = false;
      await form.handleSubmit(() => { valid = true; })();
      if (!valid) return;
      const values = { name: input.name.trim() };
      return input.id
        ? api.repository('orders').updateOne({ filter: { id: input.id }, values, idempotencyKey: key, signal })
        : api.repository('orders').createOne({ values, idempotencyKey: key, signal });
    });
    if (!saved) return; // Another entry owns the lock, or validation failed.
    showSuccess(saved.record);
    // Refetch or navigation errors are handled separately after the confirmed write.
    onSaved(saved.record);
  } catch (error) {
    showSubmissionError(error); // Translate a reason; never display raw server errors.
  }
};
// Enter and the footer button both submit this same form.
<form id={formId} onSubmit={(event) => { event.preventDefault(); void submit(); }} />
<Button type='submit' form={formId} disabled={submission.submitting}>Save</Button>
```

The foreground wait defaults to 30 seconds (`timeoutMs` can be configured for the supported operation). A timeout aborts the supplied signal, releases the busy display and retains the same operation key and digest. Forward the callback's signal to the Repository options or custom API request; timeout means the server outcome remains unknown, so only the original operation may be retried.

The controller retains a cloned input snapshot in memory and gives each attempt an isolated clone as its third callback argument. Only the operation key and digest reach session storage; passwords and file selections are never persisted there. Use `deriveSubmissionKey(groupKey, fixedStepLabel)` for each write of a retryable multi-request action; preserve the group snapshot and derive generated record IDs from the original group key. Partial group failure must retain the group key, including a known rejection after an earlier step committed. A successful response clears the operation. The next intentional action gets a fresh timestamp/UUID, including an identical new record. A definitive first-attempt client error releases the operation for correction. A lost response, opaque server failure or timeout retains its key and digest; retry exactly the original snapshot. While its result is unknown, changing the snapshot throws `PendingSubmissionError`. A later permission refusal during recovery does not discard the uncertain operation. Offer a translated explanation and a retry action, retain input, and never automatically switch to a new key. After an authoritative business read or explicit manual reconciliation confirms the original result, `acknowledgeOutcome('committed' | 'not-committed')` releases that operation; then show its known result or let the person deliberately start a new operation. For a `not-committed` outcome, confirm a definite rollback or reconcile the original attempt first; an ordinary read finding no row while its transaction may still be running is insufficient. Never call this acknowledgement from a generic error handler or merely because the retry window expired.

The controller stores only the key and SHA-256 request digest in session storage, never complete form data or passwords. Supply a stable `scope` for refresh recovery. If a page cannot reconstruct the same snapshot after a reload, ask the person to check the original result; do not silently begin another operation. Browser storage may be unavailable, so also keep the form mounted during an unresolved operation. Sign-out and user switching must use a different identity scope. Time is taken from the browser: a clock more than one minute ahead is refused. Correct the clock before retrying.

## Server contract and custom actions

An operation key is `<13-digit Unix milliseconds>.<UUID>`. A receipt is scoped by the validated identity and server-owned operation name on one database connection; the canonical request digest detects changed values and selections within the same target filter. Different canonical target filters are separate operation scopes; the controller still refuses any changed request snapshot during recovery. The server checks authentication and current permissions before lookup. First execution claims the unique receipt key, runs the policy-bound write and saves the response inside one transaction. Concurrent attempts contend only on that key; a losing transaction rolls back before reading the winner. A rollback leaves no committed receipt or business effect. A replay answers the original wire result with `Idempotency-Replayed: true` and does not run write hooks again.

`executeIdempotentMutation` from `@nocobase/app-server/router` is the explicit adapter for custom actions. Pass `connection`, `key`, a server-validated `principal` (include the application namespace when sharing a database), a stable `operation` including the target, `input`, mandatory current `authorize` and `authorizeReplay` callbacks, and `execute(transaction)`. Every database side effect must use that transaction. A lifecycle action calls its existing `runtime.fire(..., { requestId: key, transaction, actor, input })`; its own transition history and durable effect execution remain authoritative. The outer receipt also compares the original custom action payload. Do not re-run the old transition's state guard to authorize a replay: authorize current access to that action and result instead. See the synthetic borrowing fixture in the template's `tests/fixtures/submission` for a lifecycle transition that also inserts one inventory entry atomically.

Current route middleware runs on every replay. Repository replays require the same effective Policy and current result visibility; a changed policy or inaccessible result returns `REPLAY_FORBIDDEN` instead of exposing a historical response. A key is never authorization, a business uniqueness constraint, or an optimistic version check. Different users, targets, actions and deliberately new keys remain separate operations.

The retry window is 24 hours from the embedded timestamp, with one minute of future clock tolerance. `OPERATION_EXPIRED` explicitly refuses an old key even after cleanup; check the original result before creating a new operation. `OPERATION_CONFLICT` rejects a changed request under the same key. `IDEMPOTENCY_UNAVAILABLE` means the server has not been integrated: never remove the key and retry silently. Keep dependency and server versions coordinated.

New applications require keys on standard Repository writes. During an old application's source upgrade, register the provider with `required: false` first if older callers still exist: keyed writes are protected, unkeyed writes retain their former behavior. Switch to `required: true` only after enumerating and migrating every standard write caller. Unadapted custom HTTP endpoints, cross-connection writes and external effects without a durable execution mechanism and an idempotent receiver are outside this guarantee. Users, role and default-access settings are standard template writes, including their plugin-owned HTTP APIs; they are covered and must be merged during upgrades. Invitation email delivery, unrelated plugin APIs and external effects require their own explicit transaction/effect integration.

A receipt stores its internal root-row locator independently of the public projection. A client may select only permitted fields, without adding a primary key for replay. Current row visibility and effective field policy are checked before replay; internal locators never appear in the HTTP result.

## Operations and cost

The receipt schema is `mutationReceipts(id primary key, digest, result, expiresAt indexed)`. It is internal storage, never an exposed Repository API. Keep it on each writable managed connection; external databases need an explicitly supported same-connection receipt store before opting in. `pruneMutationReceipts(connection, limit)` deletes at most a bounded batch, called hourly by the templates' existing jobs service. No cleanup runs from a read request. Receipts are short-lived recovery data, not permanent audit history.

A fresh successful write adds one indexed lookup, one insert and one result update, in one enclosing transaction; existing Repository transactions become savepoints. A normal replay adds one lookup and no business writes; authentication and result visibility can add their normal queries. A concurrent losing claim adds a failed insert/rollback and one winner lookup. Cleanup adds one bounded expiry select and one delete per nonempty batch. Runner claims, heartbeats, polling and other reads add no receipt work. Configure database lock/statement limits and application request timeouts for the deployment's slowest supported write; a timeout is an unknown outcome and must retain the original key.

## Verify both installation paths

Create an application from the updated template and separately upgrade a baseline application with custom fields, validation, permission checks, lifecycle hooks, styling and preexisting synthetic records. Use native authentication and a disposable database. Repeat double click, Enter plus click, gated slow requests, validation and server rejection, response loss after a confirmed commit, identical intentional new records, update, deletion, permission revocation and a representative lifecycle side effect. Assert business rows, history and effects, rather than only HTTP counts. Preserve pre-upgrade ids and data, and repeat customization assertions after source reconciliation. The template fixture and Playwright test document the synthetic equipment-borrowing replacement when the real application is unavailable.
