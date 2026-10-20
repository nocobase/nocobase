import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import type {
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelSendResult,
  ChannelCapabilities,
  NotificationI18nText,
} from '@nocobase/app-plugin-notification';
import { inAppNotificationStoreToken } from './tokens.js';
import type {
  NotificationTestAdapter,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import { validateNotificationTarget } from '@nocobase/app-plugin-notification';
import {
  type NotificationChannelDefinition,
  type NotificationProviderDefinition,
} from '@nocobase/app-plugin-notification';
import { inAppNotificationText } from './i18n.js';
import type { InAppStore } from './store.js';
import type { InAppMessage, InAppRecipient } from './types.js';

export interface InAppProviderConfig {
  readonly provider: 'in-app';
  readonly enabled?: boolean;
}
export type InAppChannelConfig = InAppProviderConfig;

export interface PreparedInAppMessage {
  readonly deliveryId: string;
  readonly notificationId: string;
  readonly recipient: InAppRecipient;
  readonly content: InAppMessage;
}

export const inAppTestAdapter: NotificationTestAdapter = {
  label: inAppNotificationText('test.channels.inApp', 'In-app'),
  fields: [
    {
      name: 'recipient',
      label: inAppNotificationText(
        'test.fields.recipientUserId',
        'Recipient user ID',
      ),
      type: 'text',
      required: true,
      placeholder: inAppNotificationText(
        'test.placeholders.currentUser',
        'Application user ID',
      ),
      maxLength: 255,
    },
    {
      name: 'title',
      label: inAppNotificationText('test.fields.title', 'Title'),
      type: 'text',
      required: true,
      defaultValue: inAppNotificationText(
        'test.defaults.title',
        'NocoBase notification test',
      ),
      maxLength: 200,
    },
    {
      name: 'body',
      label: inAppNotificationText('test.fields.message', 'Message'),
      type: 'textarea',
      required: true,
      defaultValue: inAppNotificationText(
        'test.defaults.body',
        'This is a test notification from NocoBase.',
      ),
      maxLength: 2000,
    },
    {
      name: 'route',
      label: inAppNotificationText(
        'test.fields.route',
        'Internal route (without deployment prefix)',
      ),
      type: 'text',
      maxLength: 2000,
    },
    {
      name: 'url',
      label: inAppNotificationText('test.fields.url', 'Full HTTP(S) URL'),
      type: 'text',
      maxLength: 2000,
    },
  ],
  toSendInput({ values }) {
    const title = values.title?.trim();
    const body = values.body?.trim();
    if (!title || !body) throw new Error('Title and Message are required.');
    const route = values.route?.trim();
    const url = values.url?.trim();
    if (route && url)
      throw new Error('Choose either an internal route or a full URL.');
    const target = validateNotificationTarget(
      route
        ? { type: 'route', path: route }
        : url
          ? { type: 'url', url }
          : undefined,
    );
    return {
      to: values.recipient?.trim(),
      title,
      body,
      ...(target ? { target } : {}),
    };
  },
};

export function validateInAppMessage(
  value: unknown,
): ValidatedChannelMessage<InAppMessage, InAppRecipient> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('In-app message is required.');
  for (const key of Object.keys(value)) {
    if (!['to', 'title', 'body', 'target', 'actionUrl'].includes(key))
      throw new Error(`Unsupported In-app message field "${key}".`);
  }
  const message = value as InAppMessage;
  const ids = typeof message.to === 'string' ? [message.to] : message.to;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.some(
      (id: unknown) => typeof id !== 'string' || !id.trim() || id !== id.trim(),
    )
  )
    throw new Error('In-app to must contain application user IDs.');
  if (
    typeof message.title !== 'string' ||
    !message.title.trim() ||
    typeof message.body !== 'string' ||
    !message.body.trim()
  )
    throw new Error('In-app title and body are required.');
  return {
    message: {
      to: message.to,
      title: message.title,
      body: message.body,
      target: validateNotificationTarget(message.target),
    },
    recipients: ids.map((userId: string) => ({ userId })),
  };
}

export async function prepareInAppMessage(input: {
  readonly deliveryId: string;
  readonly notificationId: string;
  readonly recipient: InAppRecipient;
  readonly message: InAppMessage;
  readonly signal: AbortSignal;
}): Promise<PreparedInAppMessage> {
  if (!input.recipient.userId)
    throw new Error('In-app recipient userId is required.');
  return {
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    recipient: input.recipient,
    content: {
      ...input.message,
      target: validateNotificationTarget(input.message.target),
    },
  };
}

/** @deprecated Register a concrete channel class with registerChannelType. */
export function createInAppChannelDefinition(): NotificationChannelDefinition<
  InAppChannelConfig,
  InAppRecipient,
  InAppMessage,
  PreparedInAppMessage
> {
  return {
    type: 'in-app',
    test: inAppTestAdapter,
    async createChannel() {
      return {
        type: 'in-app',
        validateMessage: validateInAppMessage,
        prepare: prepareInAppMessage,
      };
    },
  };
}

export function createDatabaseProviderDefinition(options: {
  readonly store: InAppStore;
  readonly recipientExists: (userId: string) => Promise<boolean>;
}): NotificationProviderDefinition<InAppProviderConfig, PreparedInAppMessage> {
  return {
    type: 'in-app',
    messageType: 'in-app',
    capabilities: {
      idempotency: { supported: true },
    },
    label: inAppNotificationText('test.providers.builtIn', 'Built-in'),
    async createProvider(context) {
      return {
        type: 'in-app',
        capabilities: {
          idempotency: { supported: true },
        },
        send: ({ message }) =>
          deliverInApp(options, () => context.now(), message),
      };
    },
  };
}

declare module '@nocobase/app-plugin-notification' {
  interface NotificationChannelSchemas {
    'in-app': {
      readonly recipient: InAppRecipient;
      readonly message: InAppMessage;
    };
  }
}

async function deliverInApp(
  options: {
    readonly store: InAppStore;
    readonly recipientExists: (userId: string) => Promise<boolean>;
  },
  now: () => Promise<string>,
  message: PreparedInAppMessage,
): Promise<ChannelSendResult> {
  const { store } = options;
  try {
    if (!(await options.recipientExists(message.recipient.userId))) {
      return {
        status: 'failed',
        disposition: 'never',
        error: {
          code: 'IN_APP_NOTIFICATION_RECIPIENT_NOT_FOUND',
          category: 'recipient',
          message: 'In-app notification recipient does not exist.',
        },
      };
    }
    await store.deliver({
      deliveryId: message.deliveryId,
      notificationId: message.notificationId,
      userId: message.recipient.userId,
      message: message.content,
      createdAt: await now(),
    });
    return { status: 'accepted' };
  } catch (error) {
    return {
      status: 'failed',
      disposition: 'same_provider',
      error: {
        category: 'storage',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export class InAppChannel implements ChannelInstance<
  InAppMessage,
  InAppRecipient,
  PreparedInAppMessage
> {
  static readonly type = 'in-app';
  static readonly label: NotificationI18nText = inAppNotificationText(
    'test.providers.builtIn',
    'Built-in',
  );
  static readonly test: NotificationTestAdapter = inAppTestAdapter;
  readonly capabilities: ChannelCapabilities = {
    idempotency: { supported: true },
  };
  private readonly store: InAppStore;
  private readonly recipientExists: (userId: string) => Promise<boolean>;
  constructor(context: ChannelContext) {
    this.store = context.container.resolve(inAppNotificationStoreToken);
    const users = context.container.resolve(userAdministrationServiceToken);
    this.recipientExists = async (userId) => Boolean(await users.get(userId));
  }
  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<InAppMessage, InAppRecipient> {
    return validateInAppMessage(input);
  }
  prepare(
    input: ChannelPreparationInput<InAppMessage, InAppRecipient>,
  ): Promise<PreparedInAppMessage> {
    return prepareInAppMessage(input);
  }
  send({
    message,
  }: ChannelSendInput<PreparedInAppMessage>): Promise<ChannelSendResult> {
    return deliverInApp(
      { store: this.store, recipientExists: this.recipientExists },
      async () => new Date().toISOString(),
      message,
    );
  }
}
