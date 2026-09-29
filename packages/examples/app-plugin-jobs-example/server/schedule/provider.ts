import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  realtimeServiceToken,
  type RealtimePublicTopic,
} from '@nocobase/app-server/realtime';
import type { ScheduleExecutor, Unsubscribe } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { JOBS_EXAMPLE_SCOPE } from '../scope.js';
import {
  DefaultScheduleExampleService,
  SCHEDULE_CHANGES_TOPIC,
  SCHEDULE_SLOTS,
  scheduleExampleServiceToken,
} from './service.js';

/** The rules this version of the plugin can hold. */
const DEFINED_JOBS: ReadonlySet<string> = new Set(
  SCHEDULE_SLOTS.map((slot) => slot.name),
);

export class ScheduleExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${JOBS_EXAMPLE_SCOPE}/schedule`;
  private executor: ScheduleExecutor | undefined;
  private topic: RealtimePublicTopic<{ readonly name: string }> | undefined;
  private unsubscribe: Unsubscribe | undefined;

  public override register(): void {
    this.app.container.singleton(
      scheduleExampleServiceToken,
      () =>
        new DefaultScheduleExampleService(
          () => this.executor,
          () => this.topic,
        ),
    );
  }

  public override async start(): Promise<void> {
    const service = this.app.container.resolve(scheduleExampleServiceToken);
    this.topic = this.app.container
      .resolve(realtimeServiceToken)
      .defineTopic<{ readonly name: string }, 'public'>(
        SCHEDULE_CHANGES_TOPIC,
        { audience: 'public' },
      );
    // An executor of this plugin's own, under its package name. The
    // application's configuration decides the backend.
    const executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(JOBS_EXAMPLE_SCOPE);
    this.executor = executor;
    this.unsubscribe = executor.subscribe((event) => {
      service.record(event);
      return Promise.resolve();
    });
    // Register every slot's handler before setup(): setup() starts executing,
    // and a rule a user started before this restart is still in the backend.
    // Only the built-in heartbeat writes its rule here; the others are
    // registered alone and keep whatever state the page left them in.
    for (const slot of SCHEDULE_SLOTS)
      await executor.addJob(service.job(slot.name), !slot.builtIn);
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
    // Waits for running firings and keeps the rules for the next start.
    // Never removeJob here: that would remove them for every instance.
    await this.executor?.shutdown();
    this.executor = undefined;
    this.topic?.close();
    this.topic = undefined;
  }
}
