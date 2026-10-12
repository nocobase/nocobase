import type { Logger } from '@nocobase/logging';

export interface SendingProviderConfig {
  readonly provider: string;
  readonly enabled?: boolean;
}
export type SendingChannelConfig = SendingProviderConfig;
export interface SendingConfig {
  readonly channels: Readonly<Record<string, SendingChannelConfig>>;
}
export interface SendingProviderIdentity {
  readonly type: string;
}
export interface SendingProviderSendError {
  readonly code?: string;
  readonly message: string;
  readonly category?: SendingProviderErrorCategory;
}

export const NOTIFICATION_PROVIDER_ERROR_CATEGORIES: readonly [
  'authentication',
  'channel',
  'configuration',
  'content',
  'network',
  'provider',
  'rate_limit',
  'recipient',
  'storage',
  'timeout',
  'unknown',
] = [
  'authentication',
  'channel',
  'configuration',
  'content',
  'network',
  'provider',
  'rate_limit',
  'recipient',
  'storage',
  'timeout',
  'unknown',
];

export type SendingProviderErrorCategory =
  (typeof NOTIFICATION_PROVIDER_ERROR_CATEGORIES)[number];

export function isSendingProviderErrorCategory(
  value: unknown,
): value is SendingProviderErrorCategory {
  return NOTIFICATION_PROVIDER_ERROR_CATEGORIES.some(
    (category) => category === value,
  );
}

export type SendingRetryDisposition = 'never' | 'same_provider';

export type ProviderSendResult =
  | {
      readonly status: 'accepted';
      readonly providerMessageId?: string;
    }
  | {
      readonly status: 'failed';
      readonly error: SendingProviderSendError;
      readonly disposition: SendingRetryDisposition;
      readonly retryAfterMs?: number;
    }
  | {
      readonly status: 'submission_unknown';
      readonly error: SendingProviderSendError;
    };

export interface SendingProviderSendInput<TMessage = object> {
  readonly message: TMessage;
  readonly notificationId: string;
  readonly deliveryId: string;
  readonly attemptId: string;
  readonly deadline: string;
  readonly signal: AbortSignal;
}

export interface SendingProvider<TMessage = object> {
  readonly type: string;
  readonly capabilities?: SendingProviderCapabilities;
  send(input: SendingProviderSendInput<TMessage>): Promise<ProviderSendResult>;
  close?(): Promise<void>;
}

export interface SendingProviderCapabilities {
  readonly idempotency:
    | { readonly supported: false }
    | {
        readonly supported: true;
        readonly retentionMs?: number;
      };
}

export interface SendingChannel<
  TRecipient = object,
  TMessage = object,
  TPrepared = object,
> {
  readonly type: string;
  validateMessage(message: unknown): {
    readonly message: TMessage;
    readonly recipients: readonly TRecipient[];
  };
  prepare(input: {
    readonly deliveryId: string;
    readonly notificationId: string;
    readonly recipient: TRecipient;
    readonly message: TMessage;
    readonly provider: SendingProviderIdentity;
    readonly signal: AbortSignal;
  }): Promise<TPrepared>;
}

export interface SendingProviderContext {
  readonly logger: Logger;
  now(): Promise<string>;
}

export interface SendingChannelContext {
  readonly logger: Logger;
}

export interface SendingProviderDefinition<
  TConfig extends SendingProviderConfig = SendingProviderConfig,
  TPrepared = object,
> {
  readonly type: TConfig['provider'];
  readonly messageType: string;
  readonly capabilities?: SendingProviderCapabilities;
  validateConfig?(config: TConfig): void;
  createProvider(
    context: SendingProviderContext,
    config: TConfig,
  ): Promise<SendingProvider<TPrepared>>;
}

export interface SendingChannelDefinition<
  TConfig extends SendingChannelConfig = SendingChannelConfig,
  TRecipient = object,
  TMessage = object,
  TPrepared = object,
> {
  readonly type: string;
  validateConfig?(config: TConfig): void;
  createChannel(
    context: SendingChannelContext,
    config: TConfig,
  ): Promise<SendingChannel<TRecipient, TMessage, TPrepared>>;
}
