import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor, Unsubscribe } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  DefaultScheduleExampleService,
  HEARTBEAT_JOB,
  SCHEDULE_EXAMPLE_SCOPE,
  scheduleExampleServiceToken,
} from '../service.js';

/** The jobs this version of the plugin defines. */
const DEFINED_JOBS: ReadonlySet<string> = new Set([HEARTBEAT_JOB]);

export class ScheduleExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = SCHEDULE_EXAMPLE_SCOPE;
  private executor: ScheduleExecutor | undefined;
  private unsubscribe: Unsubscribe | undefined;

  public override register(): void {
    this.app.container.singleton(
      scheduleExampleServiceToken,
      () => new DefaultScheduleExampleService(() => this.executor),
    );
  }

  public override async start(): Promise<void> {
    const service = this.app.container.resolve(scheduleExampleServiceToken);
    // An executor of this plugin's own, under its package name. The
    // application's configuration decides the backend.
    const executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(SCHEDULE_EXAMPLE_SCOPE);
    this.executor = executor;
    this.unsubscribe = executor.subscribe((event) => {
      service.record(event);
      return Promise.resolve();
    });
    // Register every job before setup(): setup() writes the rules and only
    // then starts executing, so a due firing always finds its handler. An
    // unchanged rule is left as it is, so this is safe on every start.
    await executor.addJob(service.heartbeatJob());
    await executor.setup();
    // The scope is this plugin's alone, so any other rule under it belongs to
    // a job an earlier version defined. Removing it is the owner's job.
    for (const rule of await executor.listJob(0, -1)) {
      if (!DEFINED_JOBS.has(rule.jobName)) {
        await executor.removeJob(rule.jobName);
      }
    }
  }

  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    // Waits for a running heartbeat and keeps the rule for the next start.
    // Never removeJob here: that would remove it for every instance.
    await this.executor?.shutdown();
    this.executor = undefined;
  }
}
