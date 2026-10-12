import { createResendProviderDefinition as createSendingDefinition } from '@nocobase/sending/email';
import type {
  PreparedEmailMessage,
  ResendProviderConfig,
} from '@nocobase/sending/email';
import type { NotificationProviderDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';
export { defineResendProviderConfig } from '@nocobase/sending/email';
export function createResendProviderDefinition(): NotificationProviderDefinition<
  ResendProviderConfig,
  PreparedEmailMessage
> {
  return {
    ...createSendingDefinition(),
    label: notificationProviderText('test.providers.resend', 'Resend'),
  };
}
