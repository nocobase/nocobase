import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  grantBacked,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { createNotificationManager } from '../manager.js';
import { createNotificationRegistry } from '../registry.js';
import { notificationRuntimeToken } from '../runtime.js';
import {
  notificationExtensionRegistryToken,
  notificationServiceToken,
} from '../tokens.js';
import type { NotificationChannelMap, NotificationConfig } from '../types.js';

export interface NotificationProviderApplicationConfig {
  readonly app: {
    readonly publicBasePath: string;
  };
  readonly notification?: NotificationConfig;
}

export type NotificationProviderApplication =
  AppPluginApplication<NotificationProviderApplicationConfig>;

export class NotificationProvider<
  TApplication extends NotificationProviderApplication =
    NotificationProviderApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = '@nocobase/app-plugin-notification';
  public override register(): void {
    if (!this.app.container.has(databaseManagerToken))
      throw new Error(
        'Notification core requires the database manager dependency.',
      );
    if (!this.app.container.has(jobExecutorServiceToken))
      throw new Error(
        'Notification core requires the jobs service dependency.',
      );
    if (!this.app.container.has(loggingToken))
      throw new Error('Notification core requires the logging dependency.');
    const jobsConfiguration = this.jobsConfiguration();
    const registry = createNotificationRegistry();
    this.app.container.instance(notificationExtensionRegistryToken, registry);
    this.app.container.singleton(notificationRuntimeToken, (container) =>
      createNotificationManager<NotificationChannelMap>({
        database: container.resolve(databaseManagerToken),
        executor: container
          .resolve(jobExecutorServiceToken)
          .getJobExecutor(this.name, jobsConfiguration),
        logger: container
          .resolve(loggingToken)
          .getLogger('notification')
          .child({
            module: 'notification',
          }),
        config: this.app.config.get<NotificationConfig>('notification')!,
        registry,
      }),
    );
    this.app.container.singleton(notificationServiceToken, (container) =>
      container.resolve(notificationRuntimeToken),
    );
  }

  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) {
      throw new Error(
        'Notification core requires the authorization dependency.',
      );
    }
    registerNotificationAuthorization(
      this.app.container.resolve(authorizationToken),
    );
  }

  public override async start(): Promise<void> {
    // Install mode starts providers before notification tables are migrated,
    // so this sets the executor up without touching them.
    await this.app.container.resolve(notificationRuntimeToken).activate();
  }

  public override async shutdown(): Promise<void> {
    await this.app.container
      .resolveIfCreated(notificationRuntimeToken)
      ?.close();
  }

  /**
   * The `jobs` configuration `notification.jobs` names. The jobs service would
   * fall back to `jobs.default` for a name it does not know, which would put
   * Deliveries on another backend without a word, so an unknown name refuses
   * to start instead.
   */
  private jobsConfiguration(): string | undefined {
    const name = this.app.config.get<NotificationConfig>('notification')?.jobs;
    if (name === undefined) return undefined;
    const jobs = this.app.config.get<Record<string, unknown>>('jobs');
    // `jobs.default` holds a key, not a configuration, so it is rejected too.
    const selected = jobs?.[name];
    if (!selected || typeof selected !== 'object') {
      throw new Error(
        `notification.jobs names "${name}", which is not a jobs configuration.`,
      );
    }
    return name;
  }
}

export function registerNotificationAuthorization(
  authorization: Pick<Authorization, 'resourceTypes'>,
): void {
  // A record type: only `send` exists, and only the `test` notification sends.
  authorization.resourceTypes.add({
    type: 'notification',
    actions: ['send'],
    authorize: grantBacked({
      also: async (request) => request.resource.id === 'test',
    }),
  });
}
