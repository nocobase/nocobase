import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ServiceProvider,
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { TASKS_TOPIC } from '../shared/realtime.js';

export const taskInvalidationToken: ServiceToken<
  RealtimeUserTopic<{ changed: true }>
> = createServiceToken(
  '@nocobase/app-plugin-notification-example/task-invalidation',
);

export class TaskRealtimeProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-notification-example/realtime';
  public override register(): void {
    this.app.container.singleton(taskInvalidationToken, () =>
      this.app.container
        .resolve(realtimeServiceToken)
        .defineTopic<{ changed: true }, 'user'>(TASKS_TOPIC, {
          audience: 'user',
        }),
    );
  }
  public override boot(): Promise<void> {
    this.app.container.resolve(taskInvalidationToken);
    return Promise.resolve();
  }
  public override shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(taskInvalidationToken)?.close();
    return Promise.resolve();
  }
}
