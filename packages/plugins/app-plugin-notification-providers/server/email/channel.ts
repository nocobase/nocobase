import { createEmailChannelDefinition as createSendingDefinition } from '@nocobase/sending/email';
import { type NotificationChannelDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../i18n.js';

import type {
  EmailChannelConfig,
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage,
} from './types.js';

export function createEmailChannelDefinition(): NotificationChannelDefinition<
  EmailChannelConfig,
  EmailRecipient,
  EmailMessage,
  PreparedEmailMessage
> {
  return {
    type: 'email',
    test: {
      label: notificationProviderText('test.channels.email', 'Email'),
      fields: [
        {
          name: 'recipient',
          label: notificationProviderText('test.fields.recipient', 'Recipient'),
          type: 'email',
          required: true,
          placeholder: notificationProviderText(
            'test.placeholders.email',
            'name@example.com',
          ),
          maxLength: 320,
        },
        {
          name: 'subject',
          label: notificationProviderText('test.fields.subject', 'Subject'),
          type: 'text',
          required: true,
          defaultValue: notificationProviderText(
            'test.defaults.title',
            'NocoBase notification test',
          ),
          maxLength: 200,
        },
        {
          name: 'text',
          label: notificationProviderText('test.fields.text', 'Text'),
          type: 'textarea',
          defaultValue: notificationProviderText(
            'test.defaults.body',
            'This is a test notification from NocoBase.',
          ),
          maxLength: 2000,
        },
        {
          name: 'html',
          label: notificationProviderText('test.fields.html', 'HTML'),
          type: 'textarea',
          maxLength: 10000,
        },
      ],
      toSendInput({ values }) {
        const address = values.recipient?.trim();
        if (!address || !isEmail(address)) {
          throw new Error('Recipient must be a valid email address.');
        }
        return {
          to: address,
          subject: values.subject?.trim(),
          text: values.text?.trim(),
          ...(values.html?.trim() ? { html: values.html.trim() } : {}),
        };
      },
    },
    createChannel: createSendingDefinition().createChannel,
  };
}

function isEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+$/.test(value);
}

declare module '@nocobase/app-plugin-notification' {
  interface NotificationChannelSchemas {
    smtp: {
      readonly recipient: EmailRecipient;
      readonly message: EmailMessage;
    };
    resend: NotificationChannelSchemas['smtp'];
  }
}
