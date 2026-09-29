import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';
import type { JobExecutor, Unsubscribe } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { JOBS_EXAMPLE_SCOPE } from '../scope.js';
import { ProgressJob } from './progress-job.js';
import {
  DefaultJobExampleService,
  JOB_TASKS_TOPIC,
  jobExampleServiceToken,
  type JobTask,
} from './service.js';

export class JobExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${JOBS_EXAMPLE_SCOPE}/job`;
  private executor: JobExecutor | undefined;
  private topic: RealtimeUserTopic<JobTask> | undefined;
  private unsubscribe: Unsubscribe | undefined;

  public override register(): void {
    this.app.container.singleton(
      jobExampleServiceToken,
      () =>
        new DefaultJobExampleService(
          () => this.executor,
          () => this.topic,
        ),
    );
  }

  public override async start(): Promise<void> {
    const service = this.app.container.resolve(jobExampleServiceToken);
    // A user topic: each subscriber receives only the tasks published for it.
    this.topic = this.app.container
      .resolve(realtimeServiceToken)
      .defineTopic<JobTask, 'user'>(JOB_TASKS_TOPIC, { audience: 'user' });
    // An executor of this plugin's own, under its package name. The
    // application's configuration decides the backend.
    const executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getJobExecutor(JOBS_EXAMPLE_SCOPE);
    this.unsubscribe = executor.subscribe((event) => {
      service.record(event);
    });
    // Register every class before setup(): setup() starts consuming, and a
    // task waiting from an earlier run must find its handler.
    executor.registerJob(ProgressJob);
    await executor.setup();
    // Submissions are accepted only once setup has begun.
    this.executor = executor;
  }

  public override async shutdown(): Promise<void> {
    const executor = this.executor;
    this.executor = undefined;
    // Aborts running tasks and waits for them; an interrupted one stays
    // queued for the next start. Stop listening only after they settle.
    await executor?.shutdown();
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.topic?.close();
    this.topic = undefined;
  }
}
