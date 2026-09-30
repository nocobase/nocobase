---
name: nocobase-app-plugin-scheduler
description: Develop scheduled tasks in NocoBase 3 that business administrators need to view and track through the application UI. Define schedules in code, register the target a schedule points at, integrate execution status, and report completion. Do not use Scheduler to manage tasks that do not need UI visibility.
metadata:
  short-description: Define scheduled tasks with administrator-facing execution history
---

# Develop Scheduled Tasks in an Application

Use the installed version's public exports, without importing plugin internals. The application owns business logic, schedule declarations, Providers, permissions, and deployment timing. Scheduler owns scheduling projections, trigger history, and execution state. The plugin's `skills/` directory is the source of truth; do not edit the synchronized application copy under `.agents/skills/`.

## Decide Whether to Use Scheduler

The primary reason to define tasks through Scheduler is **UI observability for business administrators**. Developers define schedules and execution logic in code. Business administrators use the application's task list and detail pages to view schedules, track individual executions, and enable or disable tasks when authorized.

Tasks that do not need to be viewed and tracked through the UI must not be managed by the Scheduler plugin. Give recurring ones a `ScheduleExecutor` of their own from the application's jobs service (`jobExecutorServiceToken` in `@nocobase/app-server/jobs`), and one-off background work a `JobExecutor`; the application development Skill describes both. For administrator-visible tasks, deliver Client registration, access permissions, meaningful task names, and accurate final execution status together; successful server-side dispatch alone is incomplete.

## Then Choose the Execution Model

After deciding to use Scheduler, choose according to business complexity:

| Scenario                                                                                  | Choice          | Implementation boundary                                                                                    |
| ----------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| Periodic cleanup, cache refresh, a single report, or one business Service call            | Own target type | Short operations may complete directly; hand lengthy work to a `JobExecutor`                               |
| Staged processing, branches, persisted node state, or node-level diagnostics              | `workflow`      | Scheduler determines when to trigger; Workflow orchestrates the process and nodes call typed business code |
| A simple operation that happens hourly                                                    | Own target type | Cron alone is not a reason to introduce Workflow                                                           |
| Immediate asynchronous execution                                                          | `JobExecutor`   | No Cron Schedule is needed                                                                                 |
| A one-time delay, such as ten minutes after a request                                     | Queue `delay`   | No Cron Schedule is needed; `JobExecutor` has no delay                                                     |
| Another execution system with its own references, status queries, and completion protocol | Own target type | The same `registerTarget()` call, with `inspect()` and completion reporting for work that finishes later   |

Every schedule points at a registered target; `registerTarget()` is the target extension surface, and there is no built-in target type. `workflow` means `target.type: 'workflow'`, registered by the Workflow plugin, not an additional job wrapping a workflow. An application's own targets do not depend on the Workflow plugin. Neither approach guarantees exactly-once external business effects; design business idempotency for both.

## Read by Task

- To create or change a schedule, read [Definitions, Registration, and Synchronization](references/definitions.md), including application-owned and Workflow declarations.
- To register or review a target, hand its work to a `JobExecutor`, report completion, or diagnose a historical occurrence after retargeting, read [Target Extensions and Execution Protocol](references/targets.md).
- To integrate or review the UI/API and permissions, interpret status, or diagnose missing definitions, read [Operations and Verification](references/operations.md), including the complete management route table, separate status dimensions, and application identity checks.
- To review Workflow readiness or recover a scheduled Workflow execution, read the Workflow integration section in [Definitions, Registration, and Synchronization](references/definitions.md); it covers built-in completion reporting and stable event identity.
- To author the workflow itself, use the installed Workflow plugin's `nocobase-app-plugin-workflow` skill. Confirm supported Instructions instead of inventing nodes from business terminology.

## Development Loop

1. Establish which tasks and execution records administrators need to see. Check Server/Client/CLI registration, page permissions, the application's `jobs` configuration (a `redis` adapter for more than one instance; `memory` serves one process) and `JobExecutorServiceProvider` composition, and target availability, then choose an application-owned target type or `workflow`.
2. Implement business logic and Providers in application source, and call `schedulerServiceToken.defineSchedule(definition)` with an application-wide stable key from that Provider's `register()`/`boot()`.
3. Validate payload/input, timezone, idempotency, and the full asynchronous chain: submission, actual job execution, terminal notification, and recovery from persisted execution state. Obtain credentials through secure business Service configuration, never `target.config`.
4. Run application type checks, relevant tests, and build. Synchronize definitions and, in development, use an administrator account to find the task in the UI and track a real execution to its final state. Confirm the business result.
5. Report the schedule key, execution model, timezone, validation evidence, and unverified runtime boundaries. Use `--finalize` in production only when the complete manifest is visible.

Schedules are defined in code. There is no management API for creating or editing Cron definitions, but the UI and API support enabling and disabling tasks. Do not modify `schedule_definitions`, `schedule_occurrences`, or the schedule backend's rules (BullMQ job schedulers, or the memory adapter's state file) directly, and do not add jobs under Scheduler's `@nocobase/app-plugin-scheduler` scope.
