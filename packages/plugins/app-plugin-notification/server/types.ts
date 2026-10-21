import type { DatabaseManager } from '@nocobase/db';
import type { JobExecutor } from '@nocobase/jobs';
import type { Logger } from '@nocobase/logging';
import type { ServiceContainer } from '@nocobase/service-provider';
import type { ChannelConfig, ChannelTypeClass } from './channel-type.js';
import type { NotificationRegistry } from './registry.js';
import type { NotificationDeliveryStatus, NotificationStore } from './store.js';

export interface NotificationChannelSchema {
  readonly recipient: object;
  readonly message: object;
}

/** Providers extend this interface with their recipient/message schema, keyed by Provider identifier. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Public declaration-merging registry populated by Channel packages.
export interface NotificationChannelSchemas {}

type ChannelSchemaForType<T extends string> =
  T extends keyof NotificationChannelSchemas
    ? NotificationChannelSchemas[T] & NotificationChannelSchema
    : NotificationChannelSchema;

export type ConfiguredNotificationChannels<
  T extends Readonly<Record<string, NotificationChannelConfigInput>>,
> = {
  [N in keyof T]: ChannelSchemaForType<
    T[N] extends { readonly type: infer K extends string }
      ? K
      : T[N] extends { readonly provider: infer K extends string }
        ? K
        : string
  >;
};

export type NotificationChannelMap = Record<string, NotificationChannelSchema>;

export interface NotificationService {
  /** Sends a sensitive message once, in memory only: no history, queue, retries, or durable deduplication. */
  sendTransient(input: {
    readonly channel: string;
    readonly message: object;
  }): Promise<readonly ProviderSendResult[]>;
  send(
    input: NotificationSendInput<NotificationChannelMap>,
  ): Promise<NotificationSendResult>;
  getByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<NotificationStatusSnapshot | undefined>;
  getNotification(
    notificationId: string,
  ): Promise<NotificationStatusSnapshot | undefined>;
  retryDelivery(
    input: NotificationRetryDeliveryInput,
  ): Promise<NotificationDeliveryStatusSnapshot>;
  onStatusChanged(
    filter: NotificationStatusChangedFilter,
    listener: NotificationStatusChangedListener,
  ): () => void;
}

export interface NotificationExtensionRegistry {
  registerChannelType<
    TConfig extends ChannelConfig,
    TMessage extends object,
    TRecipient extends object,
    TPrepared extends object,
  >(
    Channel: ChannelTypeClass<TConfig, TMessage, TRecipient, TPrepared>,
  ): NotificationExtensionRegistry;
  /** @deprecated Register a ChannelInstance class with registerChannelType instead. */
  registerChannel(
    definition: NotificationChannelDefinition,
  ): NotificationExtensionRegistry;
  /** @deprecated Register a ChannelInstance class with registerChannelType instead. */
  registerProvider(
    definition: NotificationProviderDefinition,
  ): NotificationExtensionRegistry;
}

export interface NotificationProviderIdentity {
  readonly type: string;
}

export const NOTIFICATION_NAMESPACE: string =
  '@nocobase/app-plugin-notification';

export interface NotificationI18nText {
  readonly ns: string;
  readonly key: string;
  readonly defaultValue: string;
}

export function notificationI18nText(
  key: string,
  defaultValue: string,
): NotificationI18nText {
  return { ns: NOTIFICATION_NAMESPACE, key, defaultValue };
}

export interface NotificationSendInput<
  TChannels extends NotificationChannelMap,
> {
  readonly idempotencyKey: string;
  readonly source?: { readonly type: string; readonly referenceId?: string };
  readonly messages: Partial<{
    readonly [N in keyof TChannels]: TChannels[N]['message'];
  }>;
}

export interface NotificationSendResult {
  readonly notificationId: string;
  readonly idempotencyKey: string;
  readonly deduplicated: boolean;
  readonly status: NotificationStatus;
  readonly deliveries: readonly NotificationDeliveryStatusSnapshot[];
}

export type NotificationStatus =
  'pending' | 'processing' | 'completed' | 'partial' | 'failed' | 'unknown';

export interface NotificationErrorSnapshot {
  readonly code?: string;
  readonly message: string;
  readonly category?: NotificationProviderErrorCategory;
}

export interface NotificationDeliveryStatusSnapshot {
  readonly id: string;
  readonly channelName: string;
  readonly channelType: string;
  readonly provider: NotificationProviderIdentity;
  readonly attemptCount: number;
  readonly status: NotificationDeliveryStatus;
  readonly nextRunAt?: string;
  readonly error?: NotificationErrorSnapshot;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationStatusSummary {
  readonly total: number;
  readonly pending: number;
  readonly processing: number;
  readonly retrying: number;
  readonly accepted: number;
  readonly failed: number;
  readonly unknown: number;
}

export interface NotificationStatusSnapshot {
  readonly notificationId: string;
  readonly idempotencyKey?: string;
  readonly status: NotificationStatus;
  readonly terminal: boolean;
  readonly requiresAction: boolean;
  readonly updatedAt: string;
  readonly summary: NotificationStatusSummary;
  readonly deliveries: readonly NotificationDeliveryStatusSnapshot[];
}

export interface NotificationStatusChangedEvent extends NotificationStatusSnapshot {
  readonly idempotencyKey: string;
}

export interface NotificationStatusChangedFilter {
  readonly notificationId?: string;
  readonly idempotencyKey?: string;
}

export type NotificationStatusChangedListener = (
  event: NotificationStatusChangedEvent,
) => void | Promise<void>;

export interface NotificationRetryDeliveryInput {
  readonly deliveryId: string;
  readonly reason: string;
}

export interface NotificationProviderConfig {
  readonly provider: string;
  readonly enabled?: boolean;
}

export type NotificationChannelConfig = NotificationProviderConfig;

/** Named channel configuration before normalization for class or legacy extensions. */
export type NotificationChannelConfigInput =
  NotificationChannelConfig | ChannelConfig;

export interface NotificationConfig {
  readonly channels: Readonly<Record<string, NotificationChannelConfigInput>>;
  /**
   * The `jobs` configuration Delivery tasks run on. Omitted, they follow
   * `jobs.default`, like every other consumer of the jobs service.
   */
  readonly jobs?: string;
  readonly retry?: {
    readonly maxAttempts?: number;
    readonly intervalMs?: number;
  };
}

export interface NotificationProviderSendError {
  readonly code?: string;
  readonly message: string;
  readonly category?: NotificationProviderErrorCategory;
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

export type NotificationProviderErrorCategory =
  (typeof NOTIFICATION_PROVIDER_ERROR_CATEGORIES)[number];

export function isNotificationProviderErrorCategory(
  value: unknown,
): value is NotificationProviderErrorCategory {
  return NOTIFICATION_PROVIDER_ERROR_CATEGORIES.some(
    (category) => category === value,
  );
}

export type NotificationRetryDisposition = 'never' | 'same_provider';

export type ProviderSendResult =
  | {
      readonly status: 'accepted';
      readonly providerMessageId?: string;
    }
  | {
      readonly status: 'failed';
      readonly error: NotificationProviderSendError;
      readonly disposition: NotificationRetryDisposition;
      readonly retryAfterMs?: number;
    }
  | {
      readonly status: 'submission_unknown';
      readonly error: NotificationProviderSendError;
    };

export interface NotificationProviderSendInput<TMessage = object> {
  readonly message: TMessage;
  readonly notificationId: string;
  readonly deliveryId: string;
  readonly attemptId: string;
  readonly deadline: string;
  readonly signal: AbortSignal;
}

export interface NotificationProvider<TMessage = object> {
  readonly type: string;
  readonly capabilities?: NotificationProviderCapabilities;
  send(
    input: NotificationProviderSendInput<TMessage>,
  ): Promise<ProviderSendResult>;
  close?(): Promise<void>;
}

export interface NotificationProviderCapabilities {
  readonly idempotency:
    | { readonly supported: false }
    | {
        readonly supported: true;
        readonly retentionMs?: number;
      };
}

export interface NotificationChannel<
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
    readonly provider: NotificationProviderIdentity;
    readonly signal: AbortSignal;
  }): Promise<TPrepared>;
}

export interface NotificationProviderContext {
  readonly logger: Logger;
  now(): Promise<string>;
}

export interface NotificationChannelContext {
  readonly logger: Logger;
}

/** @deprecated Implement ChannelInstance and register the class with registerChannelType instead. */
export interface NotificationProviderDefinition<
  TConfig extends NotificationProviderConfig = NotificationProviderConfig,
  TPrepared = object,
> {
  readonly type: TConfig['provider'];
  readonly messageType: string;
  readonly label?: string | NotificationI18nText;
  readonly capabilities?: NotificationProviderCapabilities;
  validateConfig?(config: TConfig): void;
  createProvider(
    context: NotificationProviderContext,
    config: TConfig,
  ): Promise<NotificationProvider<TPrepared>>;
}

/** @deprecated Implement ChannelInstance and register the class with registerChannelType instead. */
export interface NotificationChannelDefinition<
  TConfig extends NotificationChannelConfig = NotificationChannelConfig,
  TRecipient = object,
  TMessage = object,
  TPrepared = object,
> {
  readonly type: string;
  validateConfig?(config: TConfig): void;
  createChannel(
    context: NotificationChannelContext,
    config: TConfig,
  ): Promise<NotificationChannel<TRecipient, TMessage, TPrepared>>;
}

export interface NotificationManagerOptions<
  TChannels extends {
    readonly [TType in keyof TChannels]: NotificationChannelSchema;
  },
> {
  readonly database: DatabaseManager;
  /**
   * Runs Delivery tasks. The Manager owns its lifecycle: it registers the
   * Delivery job and sets the executor up on activation, and shuts it down on
   * close.
   */
  readonly executor: JobExecutor;
  readonly logger: Logger;
  readonly config: NotificationConfig;
  readonly registry?: NotificationRegistry;
  readonly container?: ServiceContainer;
  readonly store?: NotificationStore;
  readonly reconcileIntervalMs?: number;
  readonly reconcileBatchSize?: number;
  readonly providerTimeoutMs?: number;
  readonly leaseMs?: number;
}
