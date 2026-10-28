import type { NotificationExtensionRegistry } from '@nocobase/app-plugin-notification';
import { EmailChannel, SmtpChannel, ResendChannel } from './email/index.js';
import { FeishuWebhookChannel, DingTalkWebhookChannel } from './im/index.js';
import { installLegacyMessageHandlers } from './compatibility.js';

export function registerBuiltInNotificationProviders(
  registry: NotificationExtensionRegistry,
): void {
  installLegacyMessageHandlers(registry);
  registry
    .registerChannelType(EmailChannel)
    .registerChannelType(SmtpChannel)
    .registerChannelType(ResendChannel)
    .registerChannelType(FeishuWebhookChannel)
    .registerChannelType(DingTalkWebhookChannel);
}
