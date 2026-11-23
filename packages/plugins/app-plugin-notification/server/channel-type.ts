import type { ServiceContainer } from '@nocobase/service-provider';
import type { NotificationTarget } from '../shared/target.js';
import type {
  NotificationI18nText,
  NotificationProviderCapabilities,
  NotificationProviderSendInput,
  ProviderSendResult,
} from './types.js';

export interface ChannelConfig {
  readonly type: string;
  readonly enabled?: boolean;
}

export interface ChannelContext {
  readonly channelName: string;
  readonly container: ServiceContainer;
}

export interface ValidatedChannelMessage<
  TMessage = object,
  TRecipient = object,
> {
  readonly message: TMessage;
  readonly recipients: readonly TRecipient[];
}

export interface ChannelPreparationInput<
  TMessage = object,
  TRecipient = object,
> {
  readonly notificationId: string;
  readonly deliveryId: string;
  readonly message: TMessage;
  readonly recipient: TRecipient;
  readonly signal: AbortSignal;
}

export type ChannelSendInput<TPrepared = object> =
  NotificationProviderSendInput<TPrepared>;
export type ChannelSendResult = ProviderSendResult;
export type ChannelCapabilities = NotificationProviderCapabilities;

/**
 * What `notify()` asks a channel to deliver: one notification of a kind, already rendered, before the channel turns it
 * into its own message with `compose()`.
 */
export interface NotificationContent {
  /** The notification kind, such as `approval.requested`. */
  readonly kind: string;
  /** The kind's category key, such as `approval`; absent for a channel test send. */
  readonly category?: string;
  readonly title: string;
  readonly body: string;
  readonly html?: string;
  /** Where opening the notification leads. */
  readonly target?: NotificationTarget;
  /** The record the notification is about. */
  readonly source?: { readonly type: string; readonly referenceId?: string };
  /** The logical send's idempotency key, for a channel that deduplicates on its own (a push `dedupeKey`). */
  readonly key: string;
}

export interface ChannelInstance<
  TMessage = object,
  TRecipient = object,
  TPrepared = object,
> {
  readonly capabilities?: ChannelCapabilities;
  initialize?(): Promise<void>;
  /**
   * This channel's recipients for application users, for `notify()`: an in-app inbox is the user, email the account
   * address, push the user's enabled devices. One call for every user of a send; a user with no recipient (no address,
   * no device) is left out of the map or maps to an empty list, and is skipped on this channel. A channel without it,
   * such as a group webhook, takes no part in `notify()`.
   */
  resolveUsers?(
    userIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly TRecipient[]>>;
  /**
   * This channel's message carrying `content` to `recipients`, as `send()` takes it. `recipients` is empty for a test
   * send on a channel without `resolveUsers()`, which composes a message to its fixed audience (a group).
   */
  compose?(
    content: NotificationContent,
    recipients: readonly TRecipient[],
  ): TMessage;
  /**
   * The text the delivery log files `recipient` under, which administrators filter deliveries by: the address or id a
   * person would search for, such as a push device's id. Without it the log takes the recipient's `userId`, `address`,
   * `email` or `id`, in that order.
   */
  recipientKey?(recipient: TRecipient): string;
  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<TMessage, TRecipient>;
  prepare(
    input: ChannelPreparationInput<TMessage, TRecipient>,
  ): Promise<TPrepared>;
  send(input: ChannelSendInput<TPrepared>): Promise<ChannelSendResult>;
  close?(): Promise<void>;
}

/** One line of a channel's configuration summary: a label and a value safe to show. */
export interface ChannelConfigSummaryItem {
  readonly label: string | NotificationI18nText;
  readonly value: string;
}

/** The constructor and static contract checked by registerChannelType(). */
export interface ChannelTypeClass<
  TConfig extends ChannelConfig = ChannelConfig,
  TMessage extends object = object,
  TRecipient extends object = object,
  TPrepared extends object = object,
> {
  readonly type: TConfig['type'];
  readonly label?: string | NotificationI18nText;
  /** The package that registers the type, shown beside each channel of it. */
  readonly contributor?: string;
  /**
   * A short, safe description of one channel's configuration for administrators, such as its mailer or webhook host.
   * Never return a credential, a token or a full webhook URL: the result is shown to everyone who may view the
   * notification settings. Without it the settings page shows only the type.
   */
  summarize?(config: TConfig): readonly ChannelConfigSummaryItem[];
  validateConfig?(config: TConfig): void;
  new (
    context: ChannelContext,
    config: TConfig,
  ): ChannelInstance<TMessage, TRecipient, TPrepared>;
}
