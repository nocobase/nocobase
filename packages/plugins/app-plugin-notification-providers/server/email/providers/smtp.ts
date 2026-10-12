import { createSmtpProviderDefinition as createSendingDefinition } from '@nocobase/sending/email';
import type {
  PreparedEmailMessage,
  SmtpProviderConfig,
} from '@nocobase/sending/email';
import type { NotificationProviderDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../../i18n.js';
export { defineSmtpProviderConfig } from '@nocobase/sending/email';
export function createSmtpProviderDefinition(): NotificationProviderDefinition<
  SmtpProviderConfig,
  PreparedEmailMessage
> {
  return {
    ...createSendingDefinition(),
    label: notificationProviderText('test.providers.smtp', 'SMTP'),
  };
}
