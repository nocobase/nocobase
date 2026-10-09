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

import { registerLifecycles } from '../lifecycles/index.js';
import { COLLECTIONS, OFFICE_FLOWS_SCOPE } from '../scope.js';
import { OfficeFlowsService } from '../services/office-flows.js';
import { OfficeStore } from '../services/store.js';
import { officeFlowsServiceToken } from '../tokens.js';

/** How often idle records are checked and due extraction tasks created. */
export const SWEEP_MS: number = 60_000;

/**
 * Wires the six lifecycles to the application through `createLifecycleJobs()`:
 * effects as jobs on a JobExecutor, and one ScheduleExecutor rule that sweeps
 * the triggers and creates the extraction tasks falling due. A real
 * deployment would sweep once a day; the example sweeps every minute so a new
 * request shows its first task without waiting.
 */
export class OfficeFlowsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = OFFICE_FLOWS_SCOPE;
  private jobs: LifecycleJobs | undefined;
  private runtime: LifecycleRuntime | undefined;

  public override register(): void {
    this.app.container.singleton(officeFlowsServiceToken, () => {
      const database = this.app.container.resolve(databaseManagerToken);
      return new OfficeFlowsService(
        database,
        this.lifecycleRuntime(),
        new OfficeStore(database),
      );
    });
  }

  public override async start(): Promise<void> {
    await this.effectJobs().start(this.lifecycleRuntime());
  }

  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
    this.jobs = undefined;
  }

  private lifecycleRuntime(): LifecycleRuntime {
    if (this.runtime) return this.runtime;
    const database = this.app.container.resolve(databaseManagerToken);
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('office-flows-example');
    const runtime = new LifecycleRuntime({
      store: createRepositoryLifecycleStore(database, {
        collections: {
          transitions: COLLECTIONS.transitions,
          effectRuns: COLLECTIONS.effectRuns,
        },
      }),
      dispatcher: this.effectJobs(),
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    registerLifecycles(runtime, new OfficeStore(database));
    this.runtime = runtime;
    return runtime;
  }

  /** The dispatcher, created before the runtime that uses it. */
  private effectJobs(): LifecycleJobs {
    if (this.jobs) return this.jobs;
    const executors = this.app.container.resolve(jobExecutorServiceToken);
    const logger = this.app.container
      .resolve(loggingToken)
      .getLogger('office-flows-example');
    this.jobs = createLifecycleJobs({
      jobs: executors.getJobExecutor(OFFICE_FLOWS_SCOPE),
      schedule: executors.getScheduleExecutor(OFFICE_FLOWS_SCOPE),
      // Stored with every queued task: keep it stable.
      jobName: `${OFFICE_FLOWS_SCOPE}/effect`,
      sweepName: 'sweep',
      sweepEveryMs: SWEEP_MS,
      // The extraction tasks due today, after the triggers have run.
      onSweep: () =>
        this.app.container
          .resolve(officeFlowsServiceToken)
          .runSchedule()
          .then(() => undefined),
      logger: {
        warn: (message, details) => logger.warn({ details }, message),
        error: (message, details) => logger.error({ details }, message),
      },
    });
    return this.jobs;
  }
}
