import { databaseManagerToken } from '@nocobase/db';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';
import type { JobExecutor } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';
import { EXPORTS_TOPIC } from '../../shared/business.js';
import {
  TaskExportService,
  taskExportServiceToken,
} from '../export-service.js';

export class TaskExportsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-realtime-example/exports';
  private executor: JobExecutor | undefined;
  private topic: RealtimeUserTopic<{ changed: true }> | undefined;
  public override register(): void {
    this.app.container.singleton(taskExportServiceToken, () => {
      this.topic = this.app.container
        .resolve(realtimeServiceToken)
        .defineTopic<{ changed: true }, 'user'>(EXPORTS_TOPIC, {
          audience: 'user',
        });
      this.executor = this.app.container
        .resolve(jobExecutorServiceToken)
        .getJobExecutor('@nocobase/app-plugin-realtime-example');
      return new TaskExportService(
        this.app.container.resolve(databaseManagerToken),
        this.executor,
        this.topic,
      );
    });
  }
  public override async start(): Promise<void> {
    const service = this.app.container.resolve(taskExportServiceToken);
    this.executor!.registerJob(service.job);
    await this.executor!.setup();
    await service.recover();
  }
  public override async shutdown(): Promise<void> {
    await this.executor?.shutdown();
    this.topic?.close();
  }
}
