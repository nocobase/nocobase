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
    .registerChannel(createEmailChannelDefinition(), { fallback: true })
    .registerProvider(createSmtpProviderDefinition(), { fallback: true })
    .registerProvider(createResendProviderDefinition(), { fallback: true })
    .registerChannel(createImChannelDefinition(), { fallback: true })
    .registerProvider(createFeishuWebhookProviderDefinition(), {
      fallback: true,
    })
    .registerProvider(createDingTalkWebhookProviderDefinition(), {
      fallback: true,
    });
}
