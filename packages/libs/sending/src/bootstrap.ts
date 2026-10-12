import type { SendingRegistry } from './registry.js';

import {
  createEmailChannelDefinition,
  createResendProviderDefinition,
  createSmtpProviderDefinition,
} from './email/index.js';
import {
  createDingTalkWebhookProviderDefinition,
  createFeishuWebhookProviderDefinition,
  createImChannelDefinition,
} from './im/index.js';

export function registerBuiltInSendingProviders(
  registry: SendingRegistry,
): void {
  registry
    .registerChannel(createEmailChannelDefinition())
    .registerProvider(createSmtpProviderDefinition())
    .registerProvider(createResendProviderDefinition())
    .registerChannel(createImChannelDefinition())
    .registerProvider(createFeishuWebhookProviderDefinition())
    .registerProvider(createDingTalkWebhookProviderDefinition());
}
