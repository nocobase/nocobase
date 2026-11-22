import { defineMailChannelsConfig } from '@nocobase/app-plugin-notification-providers/config';
import { type AppConfigFactory } from '@nocobase/app-server/config';
import type { NotificationConfig } from '@nocobase/app-plugin-notification/server';

const notification: AppConfigFactory<NotificationConfig> =
  defineMailChannelsConfig({
    // The browser push channel of @nocobase/app-plugin-notification-web-push. Nothing sends to it until the
    // application's own code does; devices subscribe from the account menu.
    defaults: { channels: { webPush: { provider: 'web-push' } } },
  });

export default notification;
