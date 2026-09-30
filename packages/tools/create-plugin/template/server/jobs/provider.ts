import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { JobExecutor } from '@nocobase/jobs';
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { __NOCOBASE_SYMBOL_NAME__Job } from './__NOCOBASE_SHORT_NAME__.js';

export interface __NOCOBASE_SYMBOL_NAME__JobsApplication {
  readonly container: ServiceContainer;
}

/**
 * Owns this plugin's JobExecutor, taken from the application's jobs service under the package name as its scope.
 * The application's `jobs` configuration decides the backend. Submit tasks with
 * `executor.addJob(new __NOCOBASE_SYMBOL_NAME__Job(payload))` once `start()` has run, for example from a Service this
 * plugin registers.
 */
export class __NOCOBASE_SYMBOL_NAME__JobsProvider extends ServiceProvider<__NOCOBASE_SYMBOL_NAME__JobsApplication> {
  public readonly name: string = __NOCOBASE_JOBS_PROVIDER_NAME_LITERAL__;
  private executor: JobExecutor | undefined;

  public override async start(): Promise<void> {
    const executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getJobExecutor(__NOCOBASE_PACKAGE_NAME_LITERAL__);
    // Register every class before setup(): setup() starts consuming, and a task waiting from an earlier run must
    // find its handler.
    executor.registerJob(__NOCOBASE_SYMBOL_NAME__Job);
    await executor.setup();
    this.executor = executor;
  }

  public override async shutdown(): Promise<void> {
    const executor = this.executor;
    this.executor = undefined;
    // Aborts running tasks and waits for them; an interrupted task stays queued for the next start.
    await executor?.shutdown();
  }
}
