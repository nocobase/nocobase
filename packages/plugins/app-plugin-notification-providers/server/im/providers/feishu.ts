import { createFeishuWebhookProviderDefinition as createSendingDefinition } from '@nocobase/sending/im';
import type {
  FeishuWebhookProviderConfig,
  PreparedImMessage,
} from '@nocobase/sending/im';
import type { NotificationProviderDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';
export {
  type FeishuWebhookProviderConfig,
  defineFeishuWebhookProviderConfig,
} from '@nocobase/sending/im';
export function createFeishuWebhookProviderDefinition(): NotificationProviderDefinition<
  FeishuWebhookProviderConfig,
  PreparedImMessage
> {
  return {
    ...createSendingDefinition(),
    label: notificationProviderText(
      'test.providers.feishuWebhook',
      'Feishu webhook',
    ),
  };
}
