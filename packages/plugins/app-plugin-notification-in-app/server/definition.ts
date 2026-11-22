import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import type {
  ChannelCapabilities,
  ChannelConfigSummaryItem,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelSendResult,
  NotificationContent,
  NotificationI18nText,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification';
import {
  validateNotificationTarget,
  type NotificationChannelDefinition,
  type NotificationProviderDefinition,
} from '@nocobase/app-plugin-notification';
import { inAppNotificationText } from './i18n.js';
import type { InAppStore } from './store.js';
import { inAppNotificationStoreToken } from './tokens.js';
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

export function validateInAppMessage(
  value: unknown,
): ValidatedChannelMessage<InAppMessage, InAppRecipient> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('In-app message is required.');
  for (const key of Object.keys(value)) {
    if (
      ![
        'to',
        'title',
        'body',
        'target',
        'actionUrl',
        'kind',
        'category',
        'source',
      ].includes(key)
    )
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
  const text = (value: unknown, field: string, length: number) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !value.trim() || value.length > length)
      throw new Error(`In-app ${field} must be a non-empty string.`);
    return value;
  };
  const kind = text(message.kind, 'kind', 200);
  const category = text(message.category, 'category', 100);
  const sourceType = text(message.source?.type, 'source type', 100);
  const sourceId = text(message.source?.id, 'source id', 191);
  if (message.source !== undefined && sourceType === undefined)
    throw new Error('In-app source must have a type.');
  return {
    message: {
      to: message.to,
      title: message.title,
      body: message.body,
      target: validateNotificationTarget(message.target),
      ...(kind ? { kind } : {}),
      ...(category ? { category } : {}),
      ...(sourceType
        ? {
            source: { type: sourceType, ...(sourceId ? { id: sourceId } : {}) },
          }
        : {}),
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

/** @deprecated Use registerChannelType(InAppChannel) instead. */
export function createInAppChannelDefinition(): NotificationChannelDefinition<
  InAppChannelConfig,
  InAppRecipient,
  InAppMessage,
  PreparedInAppMessage
> {
  return {
    type: 'in-app',
    async createChannel() {
      return {
        type: 'in-app',
        validateMessage: validateInAppMessage,
        prepare: prepareInAppMessage,
      };
    },
  };
}

/** @deprecated Use registerChannelType(InAppChannel) instead. */
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
    label: inAppNotificationText('providers.builtIn', 'Built-in'),
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
    'providers.builtIn',
    'Built-in',
  );
  static readonly contributor = '@nocobase/app-plugin-notification-in-app';
  /** The inbox has no configuration to summarize. */
  static summarize(): readonly ChannelConfigSummaryItem[] {
    return [];
  }
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
  /** Every application user has an inbox; a user that no longer exists fails at delivery. */
  resolveUsers(
    userIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly InAppRecipient[]>> {
    return Promise.resolve(
      new Map(userIds.map((userId) => [userId, [{ userId }]])),
    );
  }
  compose(
    content: NotificationContent,
    recipients: readonly InAppRecipient[],
  ): InAppMessage {
    const [first, ...rest] = recipients.map(({ userId }) => userId);
    return {
      to: [first, ...rest],
      title: content.title,
      body: content.body.trim() ? content.body : content.title,
      ...(content.target ? { target: content.target } : {}),
      kind: content.kind,
      category: content.category,
      ...(content.source
        ? {
            source: {
              type: content.source.type,
              ...(content.source.referenceId
                ? { id: content.source.referenceId }
                : {}),
            },
          }
        : {}),
    };
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
