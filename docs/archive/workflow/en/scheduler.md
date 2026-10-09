---
title: 'Scheduled tasks'
description: 'Ask an Agent to use the Scheduler plugin to develop scheduled tasks that administrators can monitor, enable, and disable.'
---

# Scheduled tasks

The Scheduler plugin lets you define business actions in code that run at specified times. Administrators can view schedules, enable or disable tasks, and track the outcome of each occurrence in the UI. Developers usually do not need to write every implementation detail themselves: describe the business requirements, observability needs, and acceptance criteria to the application Agent, which uses the Scheduler Skill synchronized into the current application to implement, synchronize, and verify the code.

## When to use it

Use Scheduler when:

- Synchronization, aggregation, cleanup, reminders, or checks need to run daily, hourly, or every few minutes.
- Administrators need to see whether a task is enabled, its next run time, its execution history, and reasons for failure.
- Triggers must be idempotent so process restarts or worker retries do not duplicate business effects.

Background tasks that do not need administrators to monitor, enable, or disable them in the UI do not require Scheduler. Give recurring ones a `ScheduleExecutor` of their own from the application's jobs service, and one-off background work a `JobExecutor`. If the business requires human approval, versioned processes, execution path visibility, or node-level execution records, first ask the Agent to evaluate [Workflow](./workflow).

## Develop with an Agent

The Scheduler plugin ships the `nocobase-app-plugin-scheduler` Skill. Once the plugin is enabled, the application synchronizes it into `.agents/skills/`. If the directory is missing or clearly outdated, run this from the application root:

```bash
pnpm nocobase skills sync
```

You usually do not need to name the Skill explicitly. When a request includes scheduled execution and administrator visibility in the UI, the application Agent should discover and use it. Describe the business goal, processing rules, and results administrators need to see, for example:

> We need a daily customer follow-up reminder. At 9 AM every weekday, find customers who were still uncontacted yesterday, create a task for the responsible salesperson, and send an in-app notification. Administrators need to see whether the schedule is enabled, how many customers each execution processed, and reasons for failure. Do not create duplicate reminders for the same customer on the same day. First inspect the application's existing data, notification, and automation capabilities, choose a suitable implementation, and briefly explain the plan. After confirmation, complete development and verification.

A good request specifies:

- When to run: a Cron expression or plain-language schedule, timezone, start and end times, or an occurrence limit.
- What to execute: the business action, workflow, or external system to invoke.
- What administrators need to see: the task name, description, success criteria, and how to investigate failures.
- Acceptance evidence: which tests to run and whether a real execution must be visible in the UI.

## Prompt examples

Start with this general template:

> I need a scheduled task that administrators can monitor: run `<when>` in `<timezone>` and execute `<business action>`. Administrators need to see `<task name, description, and evidence of success or failure>`. First inspect the application and this business process, propose an implementation, and ask for confirmation. After confirmation, complete development, synchronization, and verification.

### Generate business reports

> Generate a business report every day at 2 AM in the `Asia/Shanghai` timezone. The existing business reports feature can already generate the report. Administrators need to see the next run time and whether each execution succeeded. First inspect the existing implementation and propose a plan. After confirmation, implement it and explain how to verify it in the UI.

### Check inventory and recommend replenishment

> Check inventory and generate replenishment recommendations every day at 01:00. This automation does not exist yet, so design and implement the complete solution. Administrators need to know which products were checked, how many recommendations were generated, and how to investigate failures. Processing the same inventory data again must not create duplicate recommendations. Explain the plan first, then develop and verify it after confirmation.

### Synchronize customer status

> Synchronize customer status every 10 minutes. Reuse the existing customer synchronization capability without changing its business rules. Administrators need to see whether each sync succeeded, how many customers were synchronized, and reasons for failure. Repeating a sync for the same time window must not cause duplicate updates. Explain the plan first, then develop and verify it after confirmation.

### Reconcile large batches

> Run a large batch reconciliation every night at 23:30. The data volume is large, and processing usually takes tens of minutes. Administrators need to see that the task has started, whether it is still processing, its final success or failure, and how to investigate failures. The same batch of bills must not be reconciled twice. First inspect the application's reconciliation implementation and runtime conditions, propose a plan, and ask for confirmation. Then complete development and verification.

### Change an existing schedule

> Change the existing daily business report from 02:00 to 03:30 every day, keeping the `Asia/Shanghai` timezone. Find and update the existing implementation without creating a duplicate task. Afterwards, confirm that the next run time has updated in the administrator UI.

<!--
### Deactivate a task removed from code

> The old customer synchronization feature has been retired. Confirm that the administrator UI no longer shows it as an active task while preserving past execution records for auditing. Do not delete historical data, and explain the outcome.

### Diagnose a failed scheduled task

> Diagnose the most recent failure of the daily business report. Read existing records only; do not change code or rerun the task. Explain when it started, how far it progressed, the specific failure reason, and what administrators should watch next. If the related business process also needs inspection, include those findings.
-->

### Review the Agent's plan

> Do not change code yet. We want to generate last week's sales analysis every Monday morning and notify each regional manager. Based on the application's existing capabilities, propose an implementation covering the schedule, business steps, results administrators can see, failure handling, information I need to confirm, and how to verify the completed work.

The Agent should report its chosen execution model, stable schedule key, timezone, target type, synchronization command, verification commands, and runtime boundaries it has not verified. Ask for actual verification evidence rather than accepting a claim that implementation is complete.

## Recommended development process

1. **Confirm whether Scheduler is needed.** The key question is whether administrators need to view tasks, enable or disable them, and track execution records in the UI. Otherwise, a `ScheduleExecutor` of the application's own is more appropriate.
2. **Choose the execution type based on the business.** Use a workflow job for multiple process steps, node-level visibility, human intervention, or long-running work. Use an ordinary job for a single action that needs neither node-level visibility nor human intervention. The business scenario should determine whether to use a workflow, regardless of whether one already exists.
3. **Define the task.** In the application or business plugin Provider, resolve `schedulerServiceToken` and call `defineSchedule(definition)`. Use a stable, application-wide unique `key`, preferably with a business namespace such as `sales.daily-report`.
4. **Synchronize and verify.** Run `pnpm nocobase scheduler sync --json`, then sign in as an administrator and open **Settings → Automation → Scheduled Tasks** to check the task, next run time, and execution records.
5. **Finalize during deployment.** Once the complete plugin manifest is loaded in production, run `pnpm nocobase scheduler sync --finalize --json` once per application to soft-deactivate definitions removed from code.

## Common service API

The main developer API is `defineSchedule()` on the Scheduler service instance. It registers which scheduled tasks the application should have. During synchronization, Scheduler writes these code definitions to the schedule tables while preserving the enabled or disabled state set by administrators in the UI.

```ts
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';

export default class DailyReportScheduleProvider extends ServiceProvider<Application> {
  public readonly name = 'app/daily-report-schedule';

  public override async boot(): Promise<void> {
    if (!this.app.container.has(schedulerServiceToken)) return;

    const scheduler = this.app.container.resolve(schedulerServiceToken);
    scheduler.defineSchedule({
      key: 'daily-analytics-report',
      title: 'Daily business report',
      description: 'Trigger the business report workflow every day at 02:00.',
      schedule: { cron: '0 2 * * *', timezone: 'Asia/Shanghai' },
      target: {
        type: 'workflow',
        config: { workflowKey: 'example-analytics-report', input: {} },
      },
    });
  }
}
```

`key` is a stable, application-wide unique identifier. The application name and `key` together form the persistent identity; renaming a key creates a new definition instead of updating the existing one. Multiple business modules can use namespaced keys such as `sales.daily-report` and `inventory.daily-report`.

Both `register()` and `boot()` finish before Scheduler reads the manifest in its own `start()`. Defining tasks during either lifecycle usually requires no extra coordination of plugin startup order. Tasks defined after `start()` take effect at the next synchronization.

Definition fields:

| Field                   | Description                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `key`                   | Stable identifier matching `^[A-Za-z0-9][A-Za-z0-9._:-]*$`, unique across the application.                                        |
| `title` / `description` | Title and description shown in the administrator UI. The title is required.                                                       |
| `schedule.cron`         | Five- or six-field Cron expression. `*/5 * * * *` means every five minutes; `*/10 * * * * *` means every ten seconds.             |
| `schedule.timezone`     | Defaults to `UTC`. Explicitly use an IANA timezone such as `Asia/Shanghai` for local business time.                               |
| `schedule.from` / `to`  | Optional inclusive boundaries, using `Date` values with an explicit timezone. `from` must not be later than `to`.                 |
| `schedule.limit`        | Optional positive integer limiting how many firings start, not successful completions.                                            |
| `target.type`           | A registered execution target type, such as `workflow` provided by the Workflow plugin or a type registered by a business plugin. |
| `target.config`         | JSON object. Do not include functions, Service instances, passwords, API keys, access tokens, or other secrets.                   |

`defineSchedule()` validates the Cron expression, timezone, sensitive configuration fields, and target type, then normalizes the definition and calculates its hash. Do not write hashes manually or directly modify `schedule_definitions` or `schedule_occurrences`.

## Use the built-in Workflow target

Most complex scheduled business processes that need UI visibility can be split into two layers: Scheduler decides when to trigger, and Workflow defines the steps that follow. The Workflow plugin registers the built-in `workflow` target, so the schedule only needs to reference the workflow's source directory name:

```ts
scheduler.defineSchedule({
  key: 'nightly-inventory-check',
  title: 'Nightly inventory check',
  schedule: { cron: '0 1 * * *', timezone: 'Asia/Shanghai' },
  target: {
    type: 'workflow',
    config: {
      workflowKey: 'inventory-replenishment',
      input: { source: 'schedule' },
    },
  },
});
```

`workflowKey` is the directory name of the workflow source root, not its title or database version ID. The workflow target starts a run using the schedule occurrence as its idempotency source. If the workflow is missing, disabled, or receives input that does not meet the current version's requirements, the execution record shows a failure or skip reason.

When asking an Agent to implement both a workflow and a schedule, ask it to report the workflow directory, input contract, schedule key, Cron expression, timezone, synchronization result, and how to inspect at least one execution record.

## Extension development: custom targets

Register a custom target only when the built-in `workflow` target cannot express the execution boundary, or when integrating an application-owned Service, a `JobExecutor`, or an external execution system. This API is an extension point, not something every schedule requires.

```ts
const handle = scheduler.registerTarget({
  type: 'app.customer-sync',
  title: 'Customer sync',
  validate: validateCustomerSyncConfig,
  async start(config, context) {
    // executor is the target owner's JobExecutor, set up with CustomerSyncJob registered.
    await executor.addJob(
      new CustomerSyncJob({ ...config, occurrenceId: context.occurrenceId }),
    );
    // The reference is the occurrence's own execution record, stable across repeated starts.
    return {
      state: 'accepted',
      reference: { type: 'app.customer-sync', id: context.occurrenceId },
    };
  },
  async inspect(reference) {
    return inspectCustomerSyncJob(reference.id);
  },
  referenceHref(reference) {
    return `/settings/customer-sync/jobs/${encodeURIComponent(reference.id)}`;
  },
});
```

Namespace target types to avoid conflicts with other plugins. Use `app.` for application-owned targets; plugin targets can use a plugin or package name prefix. Registering the same `type` twice causes a startup error.

Short tasks can return `{ state: 'completed', outcome: 'succeeded' }` directly from `start()`. Long-running tasks should hand work to a `JobExecutor` or an external system, return `accepted`, and meet all of these requirements:

- Use `context.occurrenceId` as the reference and the idempotency key: the job records its execution per occurrence, so a repeated dispatch of the same occurrence finds the same business execution.
- Call `handle.reportCompletion(occurrenceId, reference, completion)` after actual success, failure, cancellation, or timeout. The job decides that outcome itself and completes rather than throwing, because it cannot tell which of the executor's attempts is the last.
- Implement `inspect(reference)` so Scheduler can reconcile state when notifications are lost, a process restarts, or a notification arrives before the acceptance record is persisted.

`start()` can return four types of result:

| Return value                                            | Meaning                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `{ state: 'completed', outcome: 'succeeded', result? }` | Completed synchronously and successfully. Do not use this merely because work has been submitted. |
| `{ state: 'accepted', reference, receipt? }`            | Accepted by an asynchronous execution system; Scheduler waits for final completion.               |
| `{ state: 'skipped', reason }`                          | This occurrence should be skipped.                                                                |
| `{ state: 'failed', reason }`                           | Startup or synchronous execution failed.                                                          |

Completion reports use `succeeded`, `failed`, `cancelled`, or `timed_out`. Keep `receipt`, `result`, `reason`, `reference`, and display information concise, bounded, and free of sensitive data.

## Synchronization and deployment

After adding or changing a definition, run this from the target application's root:

```bash
pnpm nocobase scheduler sync --json
```

Normal synchronization loads the complete application, validates registered targets, and non-destructively upserts definitions while preserving the enabled or disabled state administrators set in the UI. Normal application startup also performs a non-destructive synchronization before Scheduler starts running its schedules.

Where schedules run is the application's `jobs` configuration. Without `jobs.default` they run on the built-in memory adapter: one process holds the state in memory, reads it from `storage/jobs` at startup and writes it back when it stops, so a process that is killed loses what changed since it started. On this adapter a running application overwrites what `scheduler sync` wrote when it stops. Nothing is lost: every start synchronizes again from the code and removes the rules of disabled and deactivated definitions again. Set `jobs.default` to `redis` in `config.yml` before running several instances; each firing then runs on exactly one of them.

To run the schedules on a configuration of their own, name it in `scheduler.jobs` (or `SCHEDULER_JOBS`); without it they follow `jobs.default`. The schedules take that configuration's `concurrency` and `attempts`. Keep `attempts` at `1`: a failed firing is already recorded as the occurrence's outcome, so a retry finds it recorded and runs nothing.

During production deployment, once all plugins are loaded, run this once per application:

```bash
pnpm nocobase scheduler sync --finalize --json
```

`--finalize` soft-deactivates definitions no longer present in the code manifest while preserving their history. Do not finalize in a process that has loaded only some plugins.

## Administrator operations

Administrators work through the UI without editing code definitions directly. Open **Settings → Automation → Scheduled Tasks** to view the list, search, filter by status or target type, and enable or disable tasks. Open a task's details to see its definition summary, target information, next run time, and the latest 100 execution records.

List statuses mean:

- **Active**: the task is enabled, its definition is still in the code manifest, and its target is available.
- **Paused**: an administrator disabled the task in the UI.
- **Inactive**: after `--finalize`, the definition is no longer present in the code manifest.
- **Target issue**: the target is missing, disabled, or configured incorrectly.

Common execution statuses:

- `pending` / `running`: Scheduler has claimed the occurrence or is dispatching it.
- `waiting`: the target accepted the request and final completion is pending.
- `succeeded`: the target completed successfully.
- `failed`: dispatch or target execution failed.
- `skipped`: the target intentionally skipped the occurrence or could not run.
- `cancelled` / `timed_out`: the asynchronous target ended through cancellation or timeout.
- `triggered`: a legacy record indicates only that the target accepted the request; the final result is unknown.

The UI can enable or disable tasks, but cannot create, edit, or delete code definitions. For target issues, inactive definitions, or persistent failures, a developer or Agent should fix the source code, synchronize again, and confirm that the target's own worker or workflow is operating correctly.

## Review the Agent's delivery

Focus on evidence when reviewing the work:

- Does it explain why Scheduler is needed instead of a `ScheduleExecutor` of its own or a workflow alone?
- Did it inspect the application's installed plugins, Providers, `jobs` configuration, and permission entry points?
- Does it use a stable, application-wide unique `key`, a Cron expression, and an IANA timezone?
- Does it distinguish the built-in `workflow` target from custom target extensions?
- Does it explain the idempotency strategy, asynchronous completion reporting, and how to observe failures?
- Did it run type checks, relevant tests, builds, or synchronization commands, and explain anything skipped?
- Can an administrator see the task and an execution record in the UI, or does it explain why live verification was not possible?
