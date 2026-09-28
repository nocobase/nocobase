# Operations and Verification

## The Business Administrator's Workflow

Developers maintain schedule definitions and execution logic. Business administrators use the application's task list and detail pages to track executions. Use meaningful business titles and descriptions, and reflect actual progress and final outcomes. Do not display asynchronous work as successful merely because it was queued. Workflow tasks can link to their associated run for further inspection.

Validate using an administrator account with the appropriate permissions: the task must be discoverable, execution records accessible, and final status consistent with business results. Background logs or successful dispatch receipts alone do not deliver this observability requirement.

## Management Entry Points

The list page is `/settings/schedules`; details are at `/settings/schedules/:scheduleId`. Definitions are maintained in source. The UI supports viewing and enabling/disabling tasks, with no API for creating or editing Cron definitions.

All routes below require authentication and authorization for `{ resource: { type: 'page', id: 'scheduler.schedules' }, action: 'access' }`. Enabling/disabling currently uses the same permission, not a separate update action.

| Method and path                      | Response / effect                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/schedules`                 | `{ data: ScheduleListItem[] }`                                                                                |
| `GET /api/schedules/:id/occurrences` | `{ data: ScheduleOccurrenceView[] }`; currently at most the latest 100 records, with no pagination parameters |
| `POST /api/schedules/:id/enable`     | `{ data: ScheduleListItem }`; enables the task, no request body                                               |
| `POST /api/schedules/:id/disable`    | `{ data: ScheduleListItem }`; pauses the task, no request body                                                |

Use the id returned by list for `:id`, not the definition key or workflowKey. Enabling/disabling affects future scheduling; it does not cancel already dispatched Queue Jobs or workflows.

`schedulerServiceToken` from `@nocobase/app-plugin-scheduler/server/tokens` is the plugin's one public service, and it is a contribution surface rather than an administration one:

```ts
registerTarget<TConfig extends JsonObject>(
  target: ScheduleTargetType<TConfig>,
): ScheduleTargetHandle;

defineSchedule(definition: ScheduleDefinition): void;
```

The returned handle carries `reportCompletion(occurrenceId, reference, completion)`, and completes only occurrences its own target started. `defineSchedule` has no return value; it validates and stores the definition in the in-memory manifest consumed by the next sync.

Reading and changing schedules — list, occurrences, enable and disable — is reachable through the HTTP API above, and synchronization through `pnpm nocobase scheduler sync`. Neither is exposed as a resolvable service: the store, the target registry and the schedule executor are private to the plugin, so an application cannot bypass the authorization its Routes enforce by resolving them from the container.

## Interpret Permissions and State Separately

List items include appName, id, key, cron, timezone, enabled, lifecycleState, scheduleStatus, targetState, targetSummary, runCount, completedCount, and nextRunAt. Page access authorizes the management routes above; it does not make a target runnable or grant business credentials to its executor.

| Dimension                      | Meaning and diagnostic boundary                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                      | Administrator enable/disable setting, preserved by normal synchronization; `true` alone does not prove execution is possible.                                                                                                                                                                                                                                                                                                 |
| `lifecycleState`               | `active` or `inactive`; finalization marks definitions removed from code inactive while retaining history. This is separate from temporary administrator disabling.                                                                                                                                                                                                                                                           |
| `scheduleStatus`               | `active` when the definition is both enabled and `active` in its lifecycle, otherwise `paused`. It is derived rather than stored, and it is not a business execution result.                                                                                                                                                                                                                                                  |
| Target readiness               | `targetState` and `targetSummary.state` describe `ready`, `disabled`, `missing`, or `invalid`. This is the target's readiness description, not proof that a worker is running or that every execution prerequisite passed. Workflow Artifact availability and input schema still need checking.                                                                                                                               |
| Occurrence and business result | An occurrence's status/reason describes one execution. `waiting` means accepted asynchronous work; verify its real executor's terminal outcome and the resulting business data. `runCount` counts firings started, once per occurrence even when a start is redelivered, not successes; `completedCount` counts occurrences recorded as `succeeded`, which still depends on the adapter reporting truthful business outcomes. |

When reviewing status or permissions, report these dimensions separately; neither access permission, `enabled: true`, `scheduleStatus: active`, nor target readiness proves business success.

Execution history includes status, reason, executionCount, timestamps, controlled target references/receipts, and result summaries. List/API responses do not expose raw Job payloads or Workflow input. Workflow references can link to the associated run.

## Verify Behavior

Validate according to the change, beyond comparing synchronized Skill files:

- The definition module imports, typechecks, and builds. Synchronization succeeds, and the list shows the expected key, timezone, and next execution.
- In development, use a short Cron interval to observe an execution: a short target produces its business result and succeeds; asynchronous Queue Jobs or Workflows wait first and eventually reflect the real outcome.
- Check actual status and reason for invalid payloads and missing/disabled targets. Successful synchronization does not prove input validity.
- For asynchronous adapters, cover duplicate dispatch, the same reference for the same occurrence, successful completion, terminal failure after retries, and recovery through inspection after a lost notification. Verify a real business worker loads and consumes the Job on the selected connection/queue and produces the expected business result; Job discovery alone is insufficient.
- Confirm enable/disable settings survive normal synchronization. Test finalization of removed definitions only in an authorized test environment.
- For custom pages or Routes, verify anonymous, unauthorized, and authorized access. Run relevant application lint, typecheck, tests, and build, and report unverified external-system boundaries.

Do not trigger production business effects merely to validate integration. Use a development environment or the application's existing test adapter.

## Diagnose Problems

- **Command missing:** check the Scheduler CLI contribution in `cli/plugins.ts`.
- **Definition absent:** first confirm the target application root, actual running `appName`, environment/database, and UI/API endpoint are the same ones used for synchronization. In that application, call `GET /api/schedules`, match `appName` and the exact schedule `key`, and use the returned `id` for history and enable/disable routes. A renamed application or key has a different persistent identity; environment selects the deployment/database rather than adding a field to that identity. If the row is still absent, check that the registering Provider actually runs — it is listed in `server/providers/index.ts` or its plugin's `serviceProviders`, the `.has(schedulerServiceToken)` guard did not skip it because Scheduler is not installed, and `defineSchedule()` is called from `register()`/`boot()` rather than `start()` or later.
- **Startup failure:** check that the application composes `JobExecutorServiceProvider`, which `jobs` configuration applies — `scheduler.jobs` when it is set, otherwise `jobs.default`; a `scheduler.jobs` naming no `jobs` configuration stops the start — (the Redis connection for `redis`; for `memory`, whether `storage/jobs` is readable and its state file valid, which the error names), migrations, duplicate keys/types, Provider boot registration, and manifest validation errors.
- **No trigger:** check nextRunAt, timezone, from/to, limit, enablement, and lifecycleState, then confirm the application and worker are running. The sync-only command is not a background daemon. The `memory` adapter serves one process: every process or instance fires its own copy, and one that was killed rather than stopped lost the changes since it started, so a deployment of several instances needs the `redis` adapter.
- **Warning "A schedule fired that this instance has no definition for":** the backend held a rule this instance has no definition for, such as during a rolling deployment or after a definition was removed from code. No occurrence is recorded and the firing is not retried. Run `--finalize` once the complete manifest is deployed; the rule is removed then, and every later start removes it again should that removal have been lost. A definition that is still active in the database keeps its rule until then.
- **Workflow does not execute:** read the Workflow integration section in [Definitions, Registration, and Synchronization](definitions.md); check its directory key, current definition enablement, Artifact availability, and inputSchema, then trace the stable eventKey and original run. Schedule synchronization does not validate the entire workflow's readiness.
- **Stuck waiting:** follow the target reference and inspect the real executor, completion notification, and observer. Scheduler's periodic reconciliation does not perform the business worker's execution.
- **Historical occurrence after retargeting:** use the occurrence's recorded target type and reference, not the definition's current target. Follow [Historical Occurrences After Retargeting](targets.md#historical-occurrences-after-retargeting) before assessing a completion callback.
- **Historical triggered status:** this only indicates that a target previously accepted a request, not successful completion. runCount is not a success count either.
