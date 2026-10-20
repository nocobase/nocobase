import type {
  NotificationTestAdapter,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import { type NotificationChannelDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../i18n.js';

import type {
  EmailChannelConfig,
  EmailMessage,
  EmailRecipient,
  PreparedEmailMessage,
} from './types.js';

export const emailTestAdapter: NotificationTestAdapter = {
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
};

export function validateEmailMessage(
  value: unknown,
): ValidatedChannelMessage<EmailMessage, EmailRecipient> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Email message is required.');
  for (const key of Object.keys(value)) {
    if (
      ![
        'to',
        'subject',
        'text',
        'html',
        'from',
        'replyTo',
        'actionUrl',
      ].includes(key)
    )
      throw new Error(`Unsupported Email message field "${key}".`);
  }
  const message = value as EmailMessage;
  const addresses = typeof message.to === 'string' ? [message.to] : message.to;
  if (
    !Array.isArray(addresses) ||
    !addresses.length ||
    addresses.some(
      (address: unknown) => typeof address !== 'string' || !isEmail(address),
    )
  )
    throw new Error('Email to must contain valid email addresses.');
  if (
    typeof message.subject !== 'string' ||
    !message.subject.trim() ||
    (message.text !== undefined && typeof message.text !== 'string') ||
    (message.html !== undefined && typeof message.html !== 'string') ||
    (!message.text?.trim() && !message.html?.trim())
  )
    throw new Error('Email subject and text or html are required.');
  for (const key of ['from', 'replyTo'] as const)
    if (
      message[key] !== undefined &&
      (typeof message[key] !== 'string' || !isEmail(message[key]))
    )
      throw new Error(`Email ${key} must be an email address.`);
  return {
    message: {
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      from: message.from,
      replyTo: message.replyTo,
    },
    recipients: addresses.map((address: string) => ({ address })),
  };
}

export async function prepareEmailMessage(input: {
  readonly deliveryId: string;
  readonly notificationId: string;
  readonly recipient: EmailRecipient;
  readonly message: EmailMessage;
  readonly signal: AbortSignal;
}): Promise<PreparedEmailMessage> {
  return { to: input.recipient.address, content: input.message };
}

/** @deprecated Register a concrete channel class with registerChannelType. */
export function createEmailChannelDefinition(): NotificationChannelDefinition<
  EmailChannelConfig,
  EmailRecipient,
  EmailMessage,
  PreparedEmailMessage
> {
  return {
    type: 'email',
    test: emailTestAdapter,
    async createChannel() {
      return {
        type: 'email',
        validateMessage: validateEmailMessage,
        prepare: prepareEmailMessage,
      };
    },
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
