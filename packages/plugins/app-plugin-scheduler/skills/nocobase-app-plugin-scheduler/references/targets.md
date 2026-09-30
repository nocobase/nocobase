# Target Extensions and Execution Protocol

A schedule points at a target, and a target is the plugin's one extension point: `scheduler.registerTarget(target)` declares how a configuration is validated, how a firing starts, and — for work that finishes later — how a run is inspected and reported. Register targets in their owning Provider's `boot()`: all Providers have registered services, and Scheduler has not yet synchronized the manifest in `start()`. Do not resolve the container during module import or depend on another Provider's boot order to create services. Duplicate target types throw.

## Add an Ordinary Scheduled Task

This short task example can be used independently. Create `server/providers/scheduled-log.ts` in the application and add the Provider to its existing Provider array:

```ts
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { ServiceProvider } from '@nocobase/service-provider';

export default class ScheduledLogProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'app/scheduled-log';

  public override async boot(): Promise<void> {
    const scheduler = this.app.container.resolve(schedulerServiceToken);
    const logger = this.app.container.resolve(loggingToken).getLogger();
    scheduler.registerTarget({
      type: 'app.scheduled-log',
      title: 'Scheduled time report',
      validate(config) {
        return config !== null &&
          typeof config === 'object' &&
          !Array.isArray(config) &&
          typeof (config as { message?: unknown }).message === 'string'
          ? { valid: true }
          : { valid: false, reason: 'message-must-be-a-string' };
      },
      async start(config, context) {
        logger.info(
          {
            message: config.message,
            scheduleId: context.scheduleId,
            occurrenceId: context.occurrenceId,
          },
          'Scheduled log',
        );
        return { state: 'completed', outcome: 'succeeded' };
      },
    });
  }
}
```

Use target `{ type: 'app.scheduled-log', config: { message: 'Time report' } }`. For business work, replace logging with a domain Service call and validate the complete config. Resolve Scheduler directly when it is required; use `container.has()` to skip registration only for a truly optional integration.

Namespace the type so it cannot collide with another plugin's: `app.` for an application's own tasks, the plugin name for a plugin's. Two registrations of the same type throw at boot.

Short operations may complete inside `start()`, but occupy the schedule worker. Hand lengthy work to a `JobExecutor` and return `accepted`, as the next section shows. Do not let config select arbitrary module paths, job names, queue names or channels.

## Run Lengthy Work on a JobExecutor and Track Its Completion

A target whose work runs elsewhere returns `accepted` with a reference, and the schedule occurrence waits until that run reaches a terminal state. For work the application runs itself, hand it to a `JobExecutor` of the Provider that registers the target — from `jobExecutorServiceToken` in `@nocobase/app-server/jobs`, under the application's or plugin's package name as the scope — and make the reference the occurrence's own execution record: `{ type: '<target type>', id: occurrenceId }`. A recovered `start()` of the same occurrence then returns the same reference without depending on the executor, which assigns every submission a new `jobId` and cannot look one up.

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import {
  Job,
  JobInterruptedError,
  type JobClass,
  type JobExecutionContext,
  type JobExecutor,
} from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { maintenanceServiceToken } from './maintenance.js';

interface MaintenancePayload {
  readonly occurrenceId: string;
  readonly area: string;
}

const reference = (occurrenceId: string) => ({
  type: 'app.maintenance',
  id: occurrenceId,
});

export default class MaintenanceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'app/maintenance';
  private jobClass: JobClass<MaintenancePayload> | undefined;
  private ready: Promise<JobExecutor> | undefined;

  public override boot(): void {
    const maintenance = this.app.container.resolve(maintenanceServiceToken);
    const handle = this.app.container
      .resolve(schedulerServiceToken)
      .registerTarget({
        type: 'app.maintenance',
        title: 'Maintenance',
        validate: validateMaintenanceConfig,
        start: async (config, { occurrenceId }) => {
          const executor = await this.executor();
          await executor.addJob(
            new this.jobClass!({ ...config, occurrenceId }),
          );
          return { state: 'accepted', reference: reference(occurrenceId) };
        },
        // Reads the execution record maintenance.run() keeps per occurrence.
        inspect: (ref) => maintenance.observe(ref.id),
      });

    // The job reaches the Service and the handle by closure: a job receives only its payload.
    this.jobClass = class MaintenanceJob extends Job<MaintenancePayload> {
      public static readonly jobName = 'app.maintenance';

      public async execute({ signal }: JobExecutionContext): Promise<void> {
        let completion;
        try {
          // Idempotent per occurrence: returns the recorded outcome when it already ran.
          await maintenance.run(this.payload, signal);
          completion = { status: 'succeeded' as const };
        } catch (error) {
          // Shutdown: the task returns to waiting and runs again after the restart.
          if (signal.aborted) throw new JobInterruptedError();
          completion = {
            status: 'failed' as const,
            reason: 'maintenance-failed',
          };
        }
        const { occurrenceId } = this.payload;
        await handle.reportCompletion(
          occurrenceId,
          reference(occurrenceId),
          completion,
        );
      }
    };
  }

  public override async start(): Promise<void> {
    await this.executor();
  }

  public override async shutdown(): Promise<void> {
    const executor = await this.ready?.catch(() => undefined);
    this.ready = undefined;
    await executor?.shutdown();
  }

  // Scheduler may fire before this Provider's start(): both share one setup.
  private executor(): Promise<JobExecutor> {
    this.ready ??= (async () => {
      const executor = this.app.container
        .resolve(jobExecutorServiceToken)
        .getJobExecutor('@acme/crm');
      executor.registerJob(this.jobClass!);
      await executor.setup();
      return executor;
    })();
    return this.ready;
  }
}
```

The business Service, not Scheduler or the executor, is the authority on the run: `maintenance.run()` records the occurrence's execution state in the application's database — started, succeeded, failed — and returns early when the occurrence already finished, and `maintenance.observe()` maps that record to `pending`, `running` or `completed` for `inspect()`. A repeated `start()` of the same occurrence may submit a second task; the record makes it harmless. Carry `occurrenceId` in the payload for exactly this reason.

Decide the terminal outcome inside the job, as above, and complete the task rather than throwing: the executor's `attempts` belongs to the application's `jobs` configuration, and a job cannot tell which attempt is the last, so a thrown failure never tells you when retries are exhausted. Retry transient failures inside `maintenance.run()` when the business needs it. Throw only `JobInterruptedError`, and only when the shutdown signal aborted unfinished work.

Review the complete execution chain: submission → job execution → terminal notification → persisted-state recovery. Scheduler runs its own schedule executor only; the target's executor must be consuming on an instance, and a deployment of more than one instance needs `jobs.default` on Redis. Reconciliation observes execution state and cannot run the job.

In addition to submission and execution, an asynchronous target needs all of the following:

1. **Terminal notification:** `registerTarget()` returns a handle; call `handle.reportCompletion(occurrenceId, reference, completion)` once the run reaches its real terminal outcome, never for an attempt that will be retried. The handle only completes occurrences its own target started, so keep it with the Provider and pass it to the job by closure rather than re-deriving it.
2. **Recovery queries:** implement `inspect(reference)` on the target and query persisted execution state. Reconciliation routes by the target type the occurrence recorded when it started, so a definition later retargeted elsewhere still inspects through the target that began the run.
3. **Reliable references:** notifications and inspection use the same `{ type, id }`, recoverable across processes. Do not use an in-process Map as the authoritative terminal state. Another execution system with its own identifiers uses its own stable, non-conflicting reference type.

A job's success does not automatically mark Scheduler success. Returning `accepted` alone is incomplete. A notification can be lost or arrive before acceptance is persisted; inspection compensates for these cases. Nothing observes a job for you.

Work that must wait before it starts, such as a follow-up an hour after the firing, is the one case for `@nocobase/queue` instead: publish with `delay` and a job ID derived from the occurrence. The same reference, idempotency, terminal-notification and inspection rules apply.

## Historical Occurrences After Retargeting

Changing a definition's target affects later executions; it does not transfer ownership of an existing occurrence. For example, if a definition changes from `app.export` to `workflow` while an export is waiting, that occurrence still belongs to `app.export`.

A valid completion requires all three conditions together:

1. Use the handle registered for the original target type recorded on the occurrence, not the new definition target's handle. Keep the original target integration available while its executions remain outstanding; a process restart can register that same type again.
2. Supply the original occurrenceId and its accepted reference, matching both `reference.type` and `reference.id`. Knowing the occurrenceId or original target type alone is insufficient. An ownership or reference mismatch is rejected with `REFERENCE_MISMATCH`.
3. Report the real executor's terminal outcome, after success or final failure rather than an attempt that will retry. A duplicate report of the same terminal status is idempotent; a conflicting terminal status is rejected with `COMPLETION_CONFLICT`.

If notification arrives before the accepted reference is persisted, it can return without completing the occurrence. Verify persisted history and let `inspect()` recover the original execution's state. Recovery routes through the occurrence's recorded target type and reference; do not launch replacement work or rewrite history to make a callback match.

## The Target Contract

`ScheduleTargetType<TConfig>` is exported from `@nocobase/app-plugin-scheduler/server`, where TConfig is a JSON object:

| Member                      | Implementation requirements                                                                                                                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type` / `title`            | Stable, unique namespaced type name / display name; registering an existing type throws                                                                                                                                                                                                               |
| `validate(config: unknown)` | Synchronously validate JSON structure and return `{ valid, reason? }`; called during synchronization and execution startup                                                                                                                                                                            |
| `describe(config)`          | Optional; asynchronously return `{ targetLabel, description?, href?, state? }`, with state `ready/disabled/missing/invalid`; prefer an explicit state and perform no business side effects. Omitted, a target reads as its own title in the `ready` state, which suits a task that is always runnable |
| `start(config, context)`    | Start execution asynchronously, follow the result union below, and deduplicate using occurrenceId. Context carries only `scheduleId` and `occurrenceId` — no request user, container, scheduled time, or credentials                                                                                  |
| `inspect(reference)`        | Optional interface, but implement for asynchronous execution to recover actual executor state                                                                                                                                                                                                         |
| `referenceHref(reference)`  | Optional controlled detail path; encode ids and avoid unvalidated external URLs                                                                                                                                                                                                                       |

After registration, declare `target: { type: 'your-stable-type', config: { ... } }`. The extension owner handles parameters, business permissions, credentials, and the executor. Application integration does not require changing Scheduler's private registry, tables, or dispatch Job.

`registerTarget()` is the target extension surface. The target registry, the schedule store and the occurrence history are private to the plugin; read and change schedules through the HTTP API, and synchronize through `pnpm nocobase scheduler sync`.

## Shared Result Protocol

`start()` must return one of these four `ScheduleTargetStartResult` variants:

| Return value                                                           | Meaning                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `{ state: 'completed', outcome: 'succeeded', result?: JsonObject }`    | Business execution has succeeded; never use for merely queued work |
| `{ state: 'accepted', reference: { type, id }, receipt?: JsonObject }` | Accepted; Scheduler enters waiting until terminal completion       |
| `{ state: 'skipped', reason: string }`                                 | This execution should be skipped                                   |
| `{ state: 'failed', reason: string }`                                  | Startup or synchronous execution failed                            |

`inspect()` returns `ScheduleTargetObservation`: `{ state: 'pending' }`, `{ state: 'running' }`, `{ state: 'completed', completion }`, or `{ state: 'unknown', reason }`. Unknown is not success; a missing record is not proof of completion.

Completion has shape `{ status: 'succeeded' | 'failed' | 'cancelled' | 'timed_out', reason?: string, result?: JsonObject, finishedAt?: Date }`, reported through the handle `registerTarget()` returned. Report the real terminal outcome without reversing an already completed state.

Keep receipts, results, reasons, references, and display information controlled and non-sensitive. Do not persist full business responses, inputs, or stack traces in these summaries.

Scheduler does not impose an observation deadline. Pending, running, or temporarily unobservable targets remain waiting until a terminal outcome is reported or observed. Execution timeouts belong to the target; report `timed_out` only when the target actually times out.
