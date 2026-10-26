import { defineMailChannelsConfig } from '@nocobase/app-server/mailer';
import { type AppConfigFactory } from '@nocobase/app-server/config';
import type { NotificationConfig } from '@nocobase/app-plugin-notification/server';

const notification: AppConfigFactory<NotificationConfig> =
  defineMailChannelsConfig({ defaults: { channels: {} } });

export default notification;
