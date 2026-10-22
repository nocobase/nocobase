import { databaseManagerToken } from '@nocobase/db';
import { notificationExtensionRegistryToken } from '@nocobase/app-plugin-notification';
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';

import { InAppChannel } from '../definition.js';
import { installLegacyMessageHandler } from '../compatibility.js';
import {
  createRealtimeInAppStore,
  IN_APP_NOTIFICATION_REALTIME_TOPIC,
  type InAppNotificationRealtimeEvent,
} from '../realtime.js';
import { createInAppStore } from '../store.js';
import { inAppNotificationStoreToken } from '../tokens.js';

export type InAppNotificationProviderApplication = AppPluginApplication;

export class InAppNotificationProvider<
  TApplication extends InAppNotificationProviderApplication =
    InAppNotificationProviderApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = '@nocobase/app-plugin-notification-in-app';

  private realtimeTopic:
    RealtimeUserTopic<InAppNotificationRealtimeEvent> | undefined;

  public override register(): void {
    if (!this.app.container.has(databaseManagerToken)) {
      throw new Error(
        'In-app notifications require the application database dependency.',
      );
    }
    this.app.container.singleton(inAppNotificationStoreToken, (container) => {
      const store = createInAppStore(container.resolve(databaseManagerToken));
      if (!container.has(realtimeServiceToken)) return store;

      this.realtimeTopic = container
        .resolve(realtimeServiceToken)
        .defineTopic<InAppNotificationRealtimeEvent, 'user'>(
          IN_APP_NOTIFICATION_REALTIME_TOPIC,
          { audience: 'user' },
        );
      return createRealtimeInAppStore(store, this.realtimeTopic);
    });
  }

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(notificationExtensionRegistryToken)) return;
    const registry = container.resolve(notificationExtensionRegistryToken);
    installLegacyMessageHandler(registry);
    registry.registerChannelType(InAppChannel);
  }

  public override shutdown(): Promise<void> {
    this.realtimeTopic?.close();
    this.realtimeTopic = undefined;
    return Promise.resolve();
  }
}
