import { createDingTalkWebhookProviderDefinition as createSendingDefinition } from '@nocobase/sending/im';
import type {
  DingTalkWebhookProviderConfig,
  PreparedImMessage,
} from '@nocobase/sending/im';
import type { NotificationProviderDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';
export {
  type DingTalkWebhookProviderConfig,
  defineDingTalkWebhookProviderConfig,
} from '@nocobase/sending/im';
export function createDingTalkWebhookProviderDefinition(): NotificationProviderDefinition<
  DingTalkWebhookProviderConfig,
  PreparedImMessage
> {
  return {
    ...createSendingDefinition(),
    label: notificationProviderText(
      'test.providers.dingtalkWebhook',
      'DingTalk webhook',
    ),
  };
}
