import { createImChannelDefinition as createSendingDefinition } from '@nocobase/sending/im';
import { validateNotificationTarget } from '@nocobase/app-plugin-notification';
import { type NotificationChannelDefinition } from '@nocobase/app-plugin-notification';
import { notificationProviderText } from '../i18n.js';

import type {
  ImRecipient,
  ImMessage,
  PreparedImMessage,
  ImChannelConfig,
} from '@nocobase/sending/im';
export type {
  ImRecipient,
  ImMessage,
  PreparedImMessage,
  ImProviderConfig,
  ImChannelConfig,
} from '@nocobase/sending/im';

export function createImChannelDefinition(): NotificationChannelDefinition<
  ImChannelConfig,
  ImRecipient,
  ImMessage,
  PreparedImMessage
> {
  return {
    type: 'im',
    test: {
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
          label: notificationProviderText(
            'test.fields.url',
            'Full HTTP(S) URL',
          ),
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
    },
    createChannel(context, config) {
      return createSendingDefinition().createChannel(context, config);
    },
  };
}

export { formatImText } from '@nocobase/sending/im';

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
