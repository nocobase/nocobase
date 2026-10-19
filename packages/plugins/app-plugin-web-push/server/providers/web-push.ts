import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import {
  createSecretsTableStore,
  secretsServiceToken,
} from '@nocobase/app-server/secrets';
import {
  notificationExtensionRegistryToken,
  notificationServiceToken,
} from '@nocobase/app-plugin-notification/server';
import { createSubscriptions, PUSH_SECRET_PURPOSE } from '../subscriptions.js';
import { createWebPushService } from '../service.js';
import { webPushServiceToken } from '../tokens.js';
import { registerWebPushChannel } from '../channel.js';
import { sendPush } from '../transport.js';
import { PushError } from '../subscriptions.js';
import type { PushConfig } from '../config.js';

export default class WebPushProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = '@nocobase/app-plugin-web-push';
  public override register(): void {
    const { container } = this.app;
    container.singleton(webPushServiceToken, (resolver) =>
      createWebPushService({
        subscriptions: createSubscriptions(
          () => resolver.resolve(databaseManagerToken).connection(),
          resolver.resolve(secretsServiceToken),
        ),
        notifications: () => resolver.resolve(notificationServiceToken),
        base: this.app.config.get<string>('app.publicBasePath') ?? '/',
        channel: this.app.config.get<string>('push.channel') ?? 'webPush',
        transport: (subscription, payload, signal) => {
          const config = this.app.config.get<PushConfig>('push');
          if (!config?.privateKey) throw new PushError('unavailable');
          return sendPush(subscription, payload, config, signal);
        },
      }),
    );
    container.resolve(secretsServiceToken).registerStore(
      createSecretsTableStore({
        name: 'web-push/subscriptions',
        table: 'webPushSubscriptions',
        columns: [
          {
            column: 'subscriptionSealed',
            purpose: PUSH_SECRET_PURPOSE,
            aad: (row) => [String(row.id), String(row.userId)],
          },
        ],
        connection: () => container.resolve(databaseManagerToken).connection(),
      }),
    );
    registerWebPushChannel(
      container.resolve(notificationExtensionRegistryToken),
      () => container.resolve(webPushServiceToken),
    );
  }
}
