import type { NotificationExtensionRegistry } from '@nocobase/app-plugin-notification';
import { SmtpChannel, ResendChannel } from './email/index.js';
import { FeishuWebhookChannel, DingTalkWebhookChannel } from './im/index.js';

export function registerBuiltInNotificationProviders(
  registry: NotificationExtensionRegistry,
): void {
  registry
    .registerChannelType(SmtpChannel)
    .registerChannelType(ResendChannel)
    .registerChannelType(FeishuWebhookChannel)
    .registerChannelType(DingTalkWebhookChannel);
}
