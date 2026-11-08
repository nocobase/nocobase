# Migrating task discovery and reassignment

This breaking API change removes `ApprovalService.tasksOf(person, statuses, page)`, its reader implementation, and `ApprovalService.reassign({ from, to, actor, reason, override })`. `ReassignReport` is also removed. There is no replacement global assignee scan in the plugin.

`tasksFor(lifecycle, recordId)` and `runsFor(lifecycle, recordId)` remain available. The `reassign` action on an explicit `taskId`, `perform()` and `performBatch()` retain their authorization, qualification, current-state, concurrency, transaction and audit rules. `ReassignInput` still describes the single-task action. Existing `transfer({ taskId, via: 'reassign', ... })` also remains available.

Previously a host could call `await approvals.tasksOf(from)` or `await approvals.reassign({ from, to, actor, reason })` and let the plugin discover tasks across records. The host must now own the discovery scope and completeness check. Task Center projections provide candidates, not authoritative ownership or proof that every task was handed over. Page through candidates, supplement them from the owning business records even when projections are missing or delayed, deduplicate records and verify their authoritative tasks and runs.

The following host-side sketch assumes `discoverBusinessRecords()` exhausts the authorized business scope, including candidate pagination and business record supplementation. It is host code, not a new plugin helper:

```ts
async function targetsFor(from: string) {
  const targets = new Map<string, { taskId: string }>();
  for (const { lifecycle, recordId } of await discoverBusinessRecords(from)) {
    const tasks = await approvals.tasksFor(lifecycle, recordId);
    const runs = await approvals.runsFor(lifecycle, recordId);
    for (const task of tasks) {
      if (
        task.assigneeId !== from ||
        task.kind === 'copy' ||
        task.role === 'info' ||
        !OPEN.includes(task.status)
      )
        continue;
      const run = runs.find((run) => run.id === task.runId);
      if (
        !run ||
        !isOpenRun(run) ||
        run.lifecycle !== task.lifecycle ||
        run.recordId !== task.recordId ||
        run.source !== task.source ||
        run.status !== task.stage ||
        run.lifecycleVersion !== task.enteredVersion
      )
        continue;
      targets.set(task.id, { taskId: task.id });
    }
  }
  return [...targets.values()];
}

// Persist this command's targets and payload with its durable key before
// executing it; retries use exactly that saved command.
const report = await approvals.performBatch({
  action: 'reassign',
  targets: await targetsFor(from),
  actor,
  input: { to, override: false },
  comment: reason,
  batchId: durableCommandKey,
});
// A business owner with additional hooks/permissions should instead invoke
// its own action entry for each explicit task, with a durable requestId.
const remaining = await discoverAndCheckRemainingResponsibilities(from);
```

The host's remaining check must rediscover the complete business scope and read authoritative facts again. Missing runs or inconsistent current identities require investigation and must not silently count as successful handover. The sketch's `targetsFor()` selects executable targets only; it is not a completeness check. New tasks may appear while earlier tasks commit. A successful batch report alone does not certify completion.

`performBatch()` returns `succeeded` and `failed`, rather than the removed facade's `moved` and `failed.reason`. Targets in one stay share a transaction; independent stays can partially succeed. Retain the durable batch identity and original target/payload set to replay a command; changed commands require new identities. Inspect failures and rediscover remaining responsibilities before a subsequent command. The action pipeline still validates facts at execution time, so preflight reads never bypass concurrent-state checks.

For owners with their own business entry, pass the explicit task to that entry so its fresh directory, record permissions and audit hooks still run:

```ts
await owner.action(
  recordId,
  {
    action: 'reassign',
    target: { taskId },
    input: { to, override: false },
    comment: reason,
    requestId: durableTaskCommandKey,
  },
  actor.id,
);
// Rediscover the complete scope and read tasksFor()/runsFor() again.
```

This migration covers this repository's consumers and the inspected OA handover implementation. It does not claim compatibility with uninspected external applications.
