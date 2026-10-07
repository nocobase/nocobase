# Execution Diagnostics

## Contents

- [Status model](#status-model)
- [Diagnostic sequence](#diagnostic-sequence)
- [Definition and version checks](#definition-and-version-checks)
- [Run and node-run checks](#run-and-node-run-checks)
- [Payload and log handling](#payload-and-log-handling)
- [Common symptoms](#common-symptoms)
- [Diagnostic report](#diagnostic-report)

## Status model

Workflow Run status:

| Stored value | Name       | Meaning                                        |
| -----------: | ---------- | ---------------------------------------------- |
|       `null` | `QUEUEING` | Accepted/persisted but not started by a worker |
|          `0` | `STARTED`  | Active execution                               |
|          `1` | `RESOLVED` | Completed successfully                         |
|         `-1` | `FAILED`   | Business/instruction failure state             |
|         `-2` | `ERROR`    | Execution/infrastructure error                 |
|         `-3` | `ABORTED`  | Aborted, including timeout handling            |

Node Run status uses `0 PENDING`, `1 RESOLVED`, `-1 FAILED`, `-2 ERROR`, and `-3 ABORTED`. Run reason `timeout` indicates timeout termination.

Do not infer success from a service call alone. `trigger()` may return `{ status: 'skipped', reason: 'not-found' | 'disabled' }`; an accepted receipt only confirms scheduling and supplies an event key. Do not infer the current attempt from the first matching node run: reruns create multiple attempts.

## Diagnostic sequence

Follow this order so evidence remains tied to the executed revision:

1. Inspect the service trigger receipt first. For `skipped`, diagnose key/current/enabled state and do not poll for a run. For `accepted`, record its event key and resolve the run by that identity. In the ordinary path the run is created before the receipt returns; a concurrent duplicate call can briefly observe the shared accepted identity before the first call finishes creating it.
2. Resolve the workflow key/definition and list revisions.
3. Inspect the run, capturing workflow id/key, workflow version, artifact hash, event key, input, timestamps, manual flag, parent relationship where available, status, and reason.
4. Use the run's definition id/hash, not merely the current workflow, to understand its code and topology.
5. Inspect `getRun(id).nodeRuns` for the latest attempt per node key and reconstruct the visible executed path.
6. Call `nodeRuns(runId, nodeKey?)` when reruns or repeated attempts are possible; compare ids/timestamps/statuses in ascending order.
7. Fetch `nodeRunPayload(runId, nodeRunId)` only for relevant attempts. Record result, error, log, and `truncated`.
8. Correlate structured server logs by run/execution id, node id/key, artifact digest, and module. Run-node logs include duration and `success/error/aborted`.
9. Compare the failing node's config, resolved parameters/input, expected result contract, timeout, and artifact module specifier.
10. Separate root cause from propagated failure. A condition parent can fail because its selected branch child failed.
11. Recommend a source or setting fix, a deliberately new authorized invocation, manual execution of a selected revision, or compensation. Reusing the same event key only deduplicates an uncertain submission; it does not rerun a confirmed failed execution. Do not erase history.

## Definition and version checks

Inspect:

- Is the requested key present and is a current revision selected?
- Is it enabled for normal `trigger()` calls?
- Does the run point to the expected definition id/version/hash?
- Was a new revision loaded but not activated, or activated but disabled?
- Did administrator input overrides change after this run? Remember the run uses the snapshot created at invocation.
- Is the artifact available on the configured private filesystem drive and does its digest match the run hash?

Use `list()`, `getWorkflow(id)`, `revisions(id)`, and `getParameters(id)`. Current definition nodes show materialized config and tree links (`upstreamKey`, `downstreamKey`, `branchKey`), but historical execution interpretation must follow the run's fixed version/hash.

## Run and node-run checks

For `QUEUEING`:

- Confirm the workflow runtime has initialized in some process. It sets its jobs executor up as a consumer, and recovers runs left undispatched, on the first trigger that process receives, not at application start.
- Identify the `jobs` configuration tasks run on: `workflow.jobs`, otherwise `jobs.default`. On `memory` a task is consumed only by the process that published it, so more than one instance needs `redis`.
- Look for failed task evidence in that backend (BullMQ failed jobs on `redis`, the executor's `JobError` logs) and for event-key deduplication.
- An accepted receipt without a run can occur briefly when another concurrent call with the same event key is still creating it; otherwise inspect persistence or invocation errors rather than attributing the gap to normal queue scheduling.

For `STARTED`:

- Check latest node status and timestamps.
- `PENDING` is expected while a `run` script executes in the background. The checkpoint that suspends the node also stores an `executing` resume request for the script; a worker claims it, runs the script, and turns the request into the result the node resumes with. When a process stops before or during the script, recovery runs it again within about a minute, so a script runs at least once; after five interrupted attempts the node fails with an error saying so. A Run node that stays `PENDING` far longer than its script takes points to a worker that is not running recovery, or to a script that is still running.
- Compare workflow timeout/reaper behavior, abort signal handling, and external I/O.
- Look for a crashed worker leaving stale started state and timeout-reaper recovery evidence.

For `FAILED` or `ERROR`:

- Fetch the failing leaf node attempt before its parent/ancestor propagation record.
- A thrown `run` script error is execution error; a returned `{ status: 'failed' }` is successful business data and will not fail the node.
- Check module resolution/artifact errors, invalid runtime result serialization, missing named `run` export, and business-service exceptions.
- For condition errors, verify the condition's handler module returns a boolean and that the data it reads from `{ input, parameters, nodeResults }` exists with the expected type.

For `ABORTED`:

- Check `reason === 'timeout'`, the configured deadline, reaper logs, and whether the script honored `options.signal`.
- Distinguish an intended cancellation from timeout or shutdown.

For an unexpected path:

- Read the condition Node Run result (`true`/`false`) and the handler module its config names, then read that module.
- Compare persisted input and input snapshot, not current external records/settings.
- Confirm template typing: an exact template preserves number/boolean/object, while interpolation produces a string.
- Confirm the referenced node result was declared and actually returned the matching runtime shape. Result schemas are compile-time contracts, not a universal runtime validator.

## Payload and log handling

`nodeRunPayload()` returns `{ id, result, error, log, truncated }`.

- Result, error, and log are capped around 64 KiB; oversized content is truncated.
- Payloads/logs pass through redaction of common secret material. Current routes require authentication but do not enforce separate payload/log permissions.
- A `null` log means no captured log after redaction.
- If `truncated` is true, use correlated structured server logs or reproduce safely with smaller diagnostic data. Do not weaken redaction or copy secrets into a new log.
- Node Run summary currently reports `branchKey: null`; reconstruct branch topology from the definition and condition result rather than relying on that summary field.
- A terminal Workflow Run may contain a `PENDING` condition ancestor when a `terminate` node ended execution from inside its selected branch. Treat the persisted `terminate` Node Run and terminal Workflow Run status as intentional early termination, not as a stuck execution.

## Common symptoms

| Symptom                          | Likely checks                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| trigger `skipped: not-found`     | wrong directory-derived key, no current revision, source not loaded                        |
| trigger `skipped: disabled`      | current revision disabled; enable separately if authorized, never poll for this trigger    |
| manual run of disabled revision  | valid for authorized `run(definitionId, ...)`; verify selected version/hash and permission |
| `INVALID_INPUT`                  | root/field type, missing required field, undeclared extra field, unsupported assumption    |
| `INPUT_TOO_LARGE`                | serialized UTF-8 input exceeds 65,536 bytes; pass identifiers rather than documents        |
| duplicate-looking trigger        | caller generated different event keys for the same event                                   |
| no second run                    | same event key was intentionally deduplicated                                              |
| failed run unchanged after retry | same event key identifies the existing run; public APIs do not replay it                   |
| stuck queueing                   | runtime not initialized, wrong `jobs` configuration, failed jobs task                      |
| run node module error            | module omitted from artifact, bad relative specifier, missing named `run`, digest mismatch |
| source check passes, build fails | inspect package scan and the default server build's package-relative output                |
| run node serialization error     | BigInt, model/class instance, circular reference, function/symbol, non-finite number       |
| condition type error             | the handler module returned a non-boolean value                                            |
| unexpected empty arg             | missing path resolved to `undefined`; embedded template converted it to empty string       |
| node result not visible at check | reference is self/later/sibling-branch/branch-internal or node has no result schema        |
| apparent old settings            | run correctly uses its invocation-time input snapshot                                      |
| rerun disagreement               | inspected an old attempt; enumerate all node runs by node key                              |

## Diagnostic report

Report at least:

- Workflow key, definition id, version, artifact hash, and enabled/current state.
- Event key, run id, status name/value, reason, manual flag, and timestamps.
- Input/input facts relevant to the decision, with sensitive values omitted.
- Executed node keys in attempt order and the first failing leaf attempt.
- Node type, handler module, status, duration/timestamps, error, and log availability.
- Whether any result/error/log was redacted or truncated.
- Trigger receipt status/reason; omit event key/run claims for a skipped receipt.
- Root-cause category: source/compile, activation/config, invocation contract, jobs executor, artifact/module, business script, timeout/cancellation, or authorization/observability.
- Safest recovery: source revision, configuration correction, idempotent retry, new invocation, or explicit compensation.

The current management routes require authentication and the `manage` action on `{ type: 'settings', id: 'workflow' }`. A 403 response can indicate a missing Workflow Manage grant; the routes do not provide separate per-workflow permissions or audit hooks.

## Installed implementation discovery

Resolve `@nocobase/app-plugin-workflow/server` and `@nocobase/app-plugin-workflow` through the project's package manager when current implementation details are needed. Inspect the installed declarations for status constants, service methods, route permissions, run-node logging, and timeout behavior; do not assume a monorepo sibling source path exists in an initialized project.
