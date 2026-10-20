import type {
  NotificationTestAdapter,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import {
  validateNotificationTarget,
  type NotificationTarget,
} from '@nocobase/app-plugin-notification';
import { type NotificationChannelDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../i18n.js';

export interface ImRecipient {
  readonly webhook: true;
}

export interface ImMessage {
  readonly to?: never;
  readonly text: string;
  readonly title?: string;
  readonly target?: Extract<NotificationTarget, { type: 'url' }>;
  readonly format?: 'text' | 'markdown';
  readonly payloads?: {
    readonly feishu?: object;
    readonly dingtalk?: object;
  };
}

export interface PreparedImMessage {
  readonly recipient: ImRecipient;
  readonly content: ImMessage;
}

export interface ImProviderConfig {
  readonly provider: string;
  readonly enabled?: boolean;
}
export type ImChannelConfig = ImProviderConfig;

export const imTestAdapter: NotificationTestAdapter = {
  label: notificationProviderText('test.channels.im', 'IM'),
  fields: [
    {
      name: 'title',
      label: notificationProviderText('test.fields.title', 'Title'),
      type: 'text',
      defaultValue: notificationProviderText(
        'test.defaults.title',
        'NocoBase notification test',
      ),
      maxLength: 200,
    },
    {
      name: 'text',
      label: notificationProviderText('test.fields.message', 'Message'),
      type: 'textarea',
      required: true,
      defaultValue: notificationProviderText(
        'test.defaults.body',
        'This is a test notification from NocoBase.',
      ),
      maxLength: 2000,
    },
    {
      name: 'url',
      label: notificationProviderText('test.fields.url', 'Full HTTP(S) URL'),
      type: 'text',
      maxLength: 2000,
    },
  ],
  toSendInput({ values }) {
    const title = values.title?.trim();
    const text = values.text?.trim();
    if (!text) throw new Error('IM text is required.');
    return {
      title,
      text,
      ...(values.url?.trim()
        ? {
            target: validateNotificationTarget({
              type: 'url',
              url: values.url.trim(),
            }),
          }
        : {}),
    };
  },
};

export function validateImMessage(
  value: unknown,
): ValidatedChannelMessage<ImMessage, ImRecipient> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('IM message is required.');
  for (const key of Object.keys(value)) {
    if (
      ![
        'to',
        'text',
        'title',
        'target',
        'format',
        'payloads',
        'actionUrl',
      ].includes(key)
    )
      throw new Error(`Unsupported IM message field "${key}".`);
  }
  const message = value as ImMessage;
  if ('to' in message) throw new Error('Webhook messages do not accept to.');
  if (typeof message.text !== 'string' || !message.text.trim())
    throw new Error('IM text is required.');
  if (message.title !== undefined && typeof message.title !== 'string')
    throw new Error('IM title must be a string.');
  if (
    message.format !== undefined &&
    message.format !== 'text' &&
    message.format !== 'markdown'
  )
    throw new Error('Unsupported IM format.');
  if (message.payloads !== undefined) {
    if (
      !message.payloads ||
      typeof message.payloads !== 'object' ||
      Array.isArray(message.payloads)
    )
      throw new Error('IM payloads must be an object.');
    for (const payload of Object.values(message.payloads)) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        throw new Error('IM Provider payload must be an object.');
    }
  }
  const target = validateNotificationTarget(message.target);
  if (target?.type === 'route')
    throw new Error('IM notifications require a full URL target.');
  return {
    message: {
      text: message.text,
      title: message.title,
      target: message.target,
      format: message.format,
      payloads: message.payloads,
    },
    recipients: [{ webhook: true as const }],
  };
}

export async function prepareImMessage(input: {
  readonly recipient: ImRecipient;
  readonly message: ImMessage;
}): Promise<PreparedImMessage> {
  if (!input.message.text.trim() && !input.message.payloads)
    throw new Error('IM text or provider payload is required.');
  const target = validateNotificationTarget(input.message.target);
  if (target?.type === 'route')
    throw new Error('IM notifications require a full URL target.');
  return {
    recipient: input.recipient,
    content: { ...input.message, target },
  };
}

/** @deprecated Register a concrete channel class with registerChannelType. */
export function createImChannelDefinition(): NotificationChannelDefinition<
  ImChannelConfig,
  ImRecipient,
  ImMessage,
  PreparedImMessage
> {
  return {
    type: 'im',
    test: imTestAdapter,
    async createChannel() {
      return {
        type: 'im',
        validateMessage: validateImMessage,
        prepare: prepareImMessage,
      };
    },
  };
}

export function formatImText(message: ImMessage): string {
  return [message.title, message.text, message.target?.url]
    .filter((value): value is string => Boolean(value))
    .join('\n');
}

declare module '@nocobase/app-plugin-notification' {
  interface NotificationChannelSchemas {
    'feishu-webhook': {
      readonly recipient: ImRecipient;
      readonly message: ImMessage;
    };
    'dingtalk-webhook': NotificationChannelSchemas['feishu-webhook'];
  }
}

declare module '@nocobase/app-plugin-notification' {
  interface NotificationChannelSchemas {
    im: { readonly recipient: ImRecipient; readonly message: ImMessage };
  }
}
