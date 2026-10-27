import type { ServiceContainer } from '@nocobase/service-provider';
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

export interface ChannelInstance<
  TMessage = object,
  TRecipient = object,
  TPrepared = object,
> {
  readonly capabilities?: ChannelCapabilities;
  initialize?(): Promise<void>;
  validateMessage(
    input: unknown,
  ): ValidatedChannelMessage<TMessage, TRecipient>;
  prepare(
    input: ChannelPreparationInput<TMessage, TRecipient>,
  ): Promise<TPrepared>;
  send(input: ChannelSendInput<TPrepared>): Promise<ChannelSendResult>;
  close?(): Promise<void>;
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
  validateConfig?(config: TConfig): void;
  new (
    context: ChannelContext,
    config: TConfig,
  ): ChannelInstance<TMessage, TRecipient, TPrepared>;
}
