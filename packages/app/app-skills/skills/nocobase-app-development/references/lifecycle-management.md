# Administrator controls for lifecycle instances

Use this reference when an administrator needs to pause an existing record's process, resume it, reset it to its initial state, or restart it at a supported state. Default workflow management pages can inspect executions without enabling these commands. For approval-specific operations such as reassignment, follow the [approval plugin prerequisites](lifecycle.md#approval-requests-check-the-pro-plugin-first) and the installed approval Skill. When the approval integration supports lifecycle controls, use its domain adapter to coordinate approval runs and tasks with lifecycle reentry.

## Define the policy and storage

Check that the application's installed `@nocobase/lifecycle` exposes `managementDetails`, `suspend`, `resume`, `reset`, and `restartAt`. Enable the commands the business needs through the definition's `management` policy. Identify who can act on each record, allowed restart targets, entry prerequisites, values to retain or clear, and what happens to existing tasks and external work.

Determine whether the commands must cover new instances, existing instances, or both. The runtime resolves the bound definition from the process `key` and record ID and applies that definition's policy. Adding or changing `management` is a behavior change governed by the [definition version rules](lifecycle-versions.md). A new definition version only makes its policy available to instances bound to that version. For example, if tickets bound to v1 have no management policy, enabling suspension in v2 and migrating the storage leaves those tickets without a suspend command. If existing instances need controls their version lacks, surface the gap before promising coverage and preserve their definition binding.

| Command     | Preconditions                                                              | Effect                                                                                                     |
| ----------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `suspend`   | Active and enabled by the policy                                           | Preserves the business version and current stay and pauses normal transitions and trigger waits.           |
| `resume`    | Suspended                                                                  | Continues the same stay, restores the remaining trigger wait, and allows pending work to continue.         |
| `reset`     | Enabled and either suspended or permitted by `resetWhileActive`            | Starts a new round in the bound definition's initial state.                                                |
| `restartAt` | Eligible target, and either suspended or permitted by `restartWhileActive` | Starts a new round at a state declared in `management.restartAt`, including the same state when permitted. |

Reset and restart clear the suspension, advance the business version and round, cancel queued work, and fence late continuations. External work already dispatched can still complete. Use `management.canEnter` as a read-only eligibility check for the record and destination. `managementDetails` calls it with an empty `reason` when computing available commands and targets. Validate a submitted reason at the command endpoint. Use `management.set` to update business fields on reentry and `management.onReenter` to commit domain changes such as closing old tasks and creating new ones in the same transaction. Select external reentry effects explicitly with `management.onEnter`. They receive the journaled event in their `management` context.

For a Repository store, migrate the business collection to add the nullable JSON `management.field` and its nullable integer `<field>Revision` companion. Add nullable JSON `management` and non-null integer `journalRevision` with default `0` to the transition journal. Replace the unique key on `(lifecycle, recordId, version)` with `(lifecycle, recordId, version, journalRevision)` and preserve the request-key constraint. For a definition with management enabled, a record with null management data is treated as active in round one. The separate revision lets suspend and resume share the same business version while recording separate journal entries.

## Guard business writes within the current stay

For domain writes that leave the current stay open, such as a vote that does not advance an approval stage, resolve the bound definition with `runtime.boundLifecycle(key, recordId)` before opening the transaction. `tx.requireActive` takes that concrete definition name and locks the instance while checking its binding and suspension. Compare the returned record with the expected stay and write through `tx.handle` in the same transaction. In this example, the application supplies the stay check and vote write, both using the same transaction handle. The stay check must reject a vote for a task from a previous stay, including reentry into the same state.

```ts
const definitionName = await runtime.boundLifecycle(key, recordId);
await runtime.transaction(async (tx) => {
  const record = await tx.requireActive(definitionName, recordId);
  await assertCurrentApprovalStay(tx.handle, record, expectedStayId);
  await writeVote(tx.handle, vote);
});
```

If the domain adapter already requires a lock before the instance lock, acquire it inside the transaction before `tx.requireActive` and use the same lock order in `management.prepare` for runtime commands.

## Connect the API and administrator UI

1. Use `runtime.managementDetails(key, recordId, actor, authorize)` to load the record-scoped controls. Derive `actor` from the authenticated session and use a server-side `authorize` callback that checks the requested command, the bound definition, and the record's business scope. Expose management details only within that scope. An undefined result means the definition has no management policy or the actor has no management permission.
2. Add an authenticated, API-documented command endpoint using the application's [HTTP API conventions](http-api.md). Dispatch to `runtime.suspend`, `resume`, `reset`, or `restartAt` with `key`, `recordId`, and options. `restartAt` also takes the target before the options. Supply the authenticated `actor`, record-scoped `authorize`, a nonblank `reason`, the opaque detail `version` as `expectedVersion`, and a `requestId`. For a second-layer stay such as an approval run, provide `expectCurrent` to verify the expected stay in the same transaction. The runtime authorizes before replay and checks the version and stay under the instance lock for a new command.
3. Use the detail's `actions` and `targets` to render the controls in the existing execution detail or business detail page. Show the current state, suspension status, round, pending work, and management history with the actor, time, reason, and state change. When the diagram shows current progress, use `RecordView.roundStartedVersion` to select transitions for the current round and keep the full history available for inspection. Require a reason and show the destination and business consequences before reset or restart. Use only the runtime commands for these mutations so validation, storage changes, and the audit entry commit together.
4. Keep the same request ID and payload when retrying an uncertain submission. For an existing request ID on the bound instance, the runtime compares the command, actor ID, expected version, trimmed reason, and `restartAt` target when applicable. A mismatch returns a conflict. An authorized match returns the original result, and `expectCurrent` runs only for a new command. On a stale version or stay conflict, refresh the detail and let the administrator review the new state before submitting a new intent with a new request ID. Refresh the record, available business actions, and management history after success, including after a replay.

## Verify behavior with real permissions

- Check that an authorized administrator can see and run only supported actions for an in-scope record. Verify that a direct request and an idempotent replay both fail for actors without permission, including administrators outside the record's business scope.
- Verify that suspension blocks business transitions, automatic progression, and domain writes guarded by `tx.requireActive`. Check that resume continues the same stay with its remaining wait and that a task from a previous stay cannot write after reentry into the same state.
- Verify that reset and restart select the correct destination and new round, apply the expected field and task changes atomically, cancel queued work, and prevent old continuations from advancing the replacement round. Check that active reset requires `reset` and `resetWhileActive`, active restart requires `restartWhileActive` and an eligible target, and selected reentry effects can be traced to the management event.
- Check that concurrent changes reject stale commands and that replaying an identical authorized request creates only one mutation and audit entry. After migration, verify that existing records retain their binding and expose only the commands supported by their bound version.

In a NocoBase source checkout, see `packages/libs/lifecycle/docs/design.md` under “Managing a running instance” for the runtime contract. The help desk in `packages/examples/app-plugin-lifecycle-example` demonstrates the route, migration, UI, and ticket policy. Its administrator scope covers the whole demo desk. Apply the target application's own record scope when adapting it.
