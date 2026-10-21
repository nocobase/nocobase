import type { NotificationExtensionRegistry } from '@nocobase/app-plugin-notification';
import {
  createEmailChannelDefinition,
  SmtpChannel,
  ResendChannel,
} from './email/index.js';
import {
  createImChannelDefinition,
  FeishuWebhookChannel,
  DingTalkWebhookChannel,
} from './im/index.js';

export function registerBuiltInNotificationProviders(
  registry: NotificationExtensionRegistry,
): void {
  // Legacy providers can still reuse the built-in message handlers.
  registry
    .registerChannel(createEmailChannelDefinition())
    .registerChannel(createImChannelDefinition())
    .registerChannelType(SmtpChannel)
    .registerChannelType(ResendChannel)
    .registerChannelType(FeishuWebhookChannel)
    .registerChannelType(DingTalkWebhookChannel);
}
