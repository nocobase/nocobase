import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import {
  createRepositoryLifecycleStore,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { expenseLifecycle } from '../lifecycles/expense.js';
import { createExampleServices } from '../lifecycles/services.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';
import {
  LIFECYCLE_EXAMPLE_COLLECTIONS,
  LIFECYCLE_EXAMPLE_SCOPE,
} from '../scope.js';
import { LifecycleExampleService } from '../services/lifecycle-example.js';
import { lifecycleExampleServiceToken } from '../tokens.js';

/** How often the triggers are swept and expired attempts taken back. */
export const TRIGGER_SWEEP_MS: number = 10_000;

/** How long finished effect runs are kept. */
export const RUN_RETENTION_MS: number = 7 * 86_400_000;

/**
 * Wires the lifecycles to the application: the Repository store on the
 * default connection, and `createLifecycleJobs()` for the rest — effects as
 * jobs on a JobExecutor, the sweep on a ScheduleExecutor rule, and recovery
 * once both are open, so effects a stopped process left queued run again.
 */
export class LifecycleExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = LIFECYCLE_EXAMPLE_SCOPE;
  private jobs: LifecycleJobs | undefined;
  private runtime: LifecycleRuntime | undefined;

  public override register(): void {
    this.app.container.singleton(
      lifecycleExampleServiceToken,
      () =>
        new LifecycleExampleService(
          this.app.container.resolve(databaseManagerToken),
          this.lifecycleRuntime(),
        ),
    );
  }

  public override async start(): Promise<void> {
    const runtime = this.lifecycleRuntime();
    await this.effectJobs().start(runtime);
  }

  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
    this.jobs = undefined;
  }

  /** One runtime for the service and the executors, created on first use. */
  private lifecycleRuntime(): LifecycleRuntime {
    if (this.runtime) return this.runtime;
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('lifecycle-example');
    const runtime = new LifecycleRuntime({
      store: createRepositoryLifecycleStore(
        this.app.container.resolve(databaseManagerToken),
        {
          collections: {
            transitions: LIFECYCLE_EXAMPLE_COLLECTIONS.transitions,
            effectRuns: LIFECYCLE_EXAMPLE_COLLECTIONS.effectRuns,
          },
        },
      ),
      dispatcher: this.effectJobs(),
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    const services = createExampleServices({
      info: (message, details) => logger.info(details, message),
    });
    runtime.register(ticketLifecycle, { services });
    runtime.register(expenseLifecycle, { services });
    // Another plugin would subscribe the same way, to refresh a page, keep a
    // to-do list or feed a search index; work that must happen is an effect.
    runtime.on('completed', {}, (event) => {
      logger.info(
        {
          lifecycle: event.lifecycle,
          recordId: event.entry.recordId,
          transition: event.transition,
          from: event.from,
          to: event.to,
          actor: event.actor.id,
        },
        'transition committed',
      );
    });
    this.runtime = runtime;
    return runtime;
  }

  /** The dispatcher, created before the runtime that uses it. */
  private effectJobs(): LifecycleJobs {
    if (this.jobs) return this.jobs;
    const executors = this.app.container.resolve(jobExecutorServiceToken);
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('lifecycle-example');
    this.jobs = createLifecycleJobs({
      jobs: executors.getJobExecutor(LIFECYCLE_EXAMPLE_SCOPE),
      schedule: executors.getScheduleExecutor(LIFECYCLE_EXAMPLE_SCOPE),
      // Stored with every queued task: keep it stable.
      jobName: `${LIFECYCLE_EXAMPLE_SCOPE}/effect`,
      sweepName: 'triggers',
      sweepEveryMs: TRIGGER_SWEEP_MS,
      // Succeeded and cancelled runs are kept for a week, then pruned.
      onSweep: async () => {
        await this.lifecycleRuntime().prune({
          olderThan: new Date(Date.now() - RUN_RETENTION_MS),
        });
      },
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    return this.jobs;
  }
}
