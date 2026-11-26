import type { BrokerImplementation } from './runtime.js';

/** Message headers. Values are strings so that every middleware can carry them. */
export type MessageHeaders = Readonly<Record<string, string>>;

/** A message as a handler receives it: the body is decoded by the subscription's codec. */
export interface BrokerMessage<T = unknown> {
  readonly body: T;
  readonly contentType?: string;
  readonly headers: MessageHeaders;
  /** Stable across redeliveries and outbox retries; receivers deduplicate on it. */
  readonly messageId: string;
  /** The partition or ordering key: messages with the same key keep their order on backends that declare `orderedByKey`. */
  readonly key?: string;
  readonly correlationId?: string;
  readonly replyTo?: string;
  readonly type?: string;
  readonly timestamp: Date;
}

/** A message to publish. `messageId` defaults to a random UUID and `timestamp` to now. */
export interface OutgoingMessage<T = unknown> {
  readonly body: T;
  /** Overrides the codec's content type. */
  readonly contentType?: string;
  readonly headers?: MessageHeaders;
  readonly messageId?: string;
  readonly key?: string;
  readonly correlationId?: string;
  readonly replyTo?: string;
  readonly type?: string;
  readonly timestamp?: Date;
}

/** What a backend transports and an outbox stores: the body is already encoded. */
export interface EncodedMessage {
  readonly body: Buffer;
  readonly contentType?: string;
  readonly headers: MessageHeaders;
  readonly messageId: string;
  readonly key?: string;
  readonly correlationId?: string;
  readonly replyTo?: string;
  readonly type?: string;
  readonly timestamp: Date;
}

/** Turns bodies into bytes and back. */
export interface Codec<T = unknown> {
  readonly contentType: string;
  encode(value: T): Buffer;
  decode(body: Buffer, contentType: string | undefined): T;
}

/**
 * The subset of the Standard Schema interface (https://standardschema.dev) an inbound subscription validates with.
 * zod, valibot and arktype schemas implement it.
 */
export interface StandardSchema<T = unknown> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    validate(
      value: unknown,
    ): StandardSchemaResult<T> | Promise<StandardSchemaResult<T>>;
  };
}

export type StandardSchemaResult<T> =
  | { readonly value: T; readonly issues?: undefined }
  | {
      readonly issues: readonly { readonly message: string }[];
    };

/** What a handler returns. Returning nothing acknowledges; throwing retries. */
export type MessageResult =
  | { readonly kind: 'ack' }
  | { readonly kind: 'retry'; readonly delay?: number }
  | { readonly kind: 'reject'; readonly reason: string };

/**
 * A database transaction an outbox writes into. The service only needs to know when it commits; the outbox
 * implementation interprets the rest. `@nocobase/db` transaction connections satisfy it.
 */
export interface BrokerTransaction {
  afterCommit(callback: () => void | Promise<void>): void;
}

export interface HandlerContext {
  /** 1 for the first delivery. */
  readonly attempt: number;
  /** Aborted when the service shuts down. */
  readonly signal: AbortSignal;
  /** The inbox transaction when the subscription uses the inbox; write business data through it. */
  readonly transaction?: unknown;
}

export type MessageHandler<T = unknown> = (
  message: BrokerMessage<T>,
  context: HandlerContext,
) => void | MessageResult | Promise<void | MessageResult>;

/** Resolves once every call of the registration already started has settled. */
export type UnregisterHandler = () => Promise<void>;

export interface PublishOptions {
  /**
   * Writes the message into the outbox inside this transaction instead of publishing it: it is sent after the
   * transaction commits, and never when it rolls back. Needs a registered outbox.
   */
  readonly transaction?: BrokerTransaction;
}

export interface PublishReceipt {
  readonly messageId: string;
  /** `true` when the message went into the outbox and is sent after commit. */
  readonly deferred: boolean;
}

export interface Publisher<T = unknown> {
  /**
   * Without a transaction, resolves once the backend has confirmed the message. With one, resolves once the
   * outbox row is written in it.
   */
  publish(
    message: OutgoingMessage<T>,
    options?: PublishOptions,
  ): Promise<PublishReceipt>;
}

export interface PublisherOptions<T = unknown> {
  /** Defaults to `jsonCodec`. */
  readonly codec?: Codec<T>;
}

export interface SubscriptionOptions<T = unknown> {
  /** Defaults to `jsonCodec`. */
  readonly codec?: Codec<T>;
  /** Validates the decoded body; a message that fails goes to the dead letter without a retry. */
  readonly schema?: StandardSchema<T>;
  /** Skips a message whose `messageId` this subscription already processed. Needs a registered inbox. */
  readonly inbox?: boolean;
}

export interface Subscription<T = unknown> {
  /** One handler per subscription. Consuming starts at setup, or at once after it. */
  consume(handler: MessageHandler<T>): UnregisterHandler;
}

/** What a backend can do. The service rejects configurations and calls that need an undeclared capability. */
export interface BrokerCapabilities {
  /** Settles each message on its own, so a subscription may handle several at once (`concurrency > 1`). */
  readonly perMessageAck: boolean;
  /** Redelivers after a delay (`retryDelay`, `retry({ delay })`). */
  readonly delayedRetry: boolean;
  /** Delivers messages with the same key in order (`ordered: true`). */
  readonly orderedByKey: boolean;
  /** Moves a message to a dead letter (`maxAttempts`, `reject()`, schema failures). Every subscription needs it. */
  readonly deadLetter: boolean;
}

export type BrokerCapability = keyof BrokerCapabilities;

/** Options every backend's subscription binding accepts besides its physical names. */
export interface SubscriptionBindingOptions {
  /** Deliveries per message, the first included, before it goes to the dead letter. Defaults to `3`. */
  readonly maxAttempts?: number;
  /** Milliseconds before a failed message is redelivered. Defaults to `0`. */
  readonly retryDelay?: number;
  /** Messages this instance handles at the same time. Defaults to `1`. */
  readonly concurrency?: number;
  /** Delivers messages with the same key in order. Defaults to `false`. */
  readonly ordered?: boolean;
}

/** One backend: its adapter, adapter options, and the physical binding of each logical name it serves. */
export interface MessageBrokerBackendEntry {
  readonly adapter: string;
  /** Logical publisher names mapped to backend-specific physical names (a topic, an exchange and routing key, …). */
  readonly publishers?: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
  /** Logical subscription names mapped to backend-specific physical names plus {@link SubscriptionBindingOptions}. */
  readonly subscriptions?: Readonly<
    Record<
      string,
      SubscriptionBindingOptions & Readonly<Record<string, unknown>>
    >
  >;
  /** Adapter options, such as a connection; validated by the implementation. */
  readonly [option: string]: unknown;
}

/**
 * The `messageBroker` configuration section. A logical name binds to the backend that declares it, otherwise to
 * `default`, which then has to accept undeclared names (only `inMemory` does).
 */
export interface MessageBrokerConfig {
  readonly default?: string;
  readonly backends?: Readonly<Record<string, MessageBrokerBackendEntry>>;
}

/**
 * The structural subset of a logger this package writes to. A pino logger, which `@nocobase/logging` provides,
 * satisfies it.
 */
export interface MessageBrokerLogger {
  debug(bindings: Record<string, unknown>, message: string): void;
  info(bindings: Record<string, unknown>, message: string): void;
  warn(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}

export interface MessageBrokerServiceOptions {
  readonly appName: string;
  /** Receives warnings and failures; `console` is used without one. */
  readonly logger?: MessageBrokerLogger;
}

/** Stores messages published inside a transaction until they are sent. */
export interface MessageOutbox {
  /** Writes the message inside `transaction`; sends it once the transaction commits. */
  enqueue(
    transaction: BrokerTransaction,
    publisher: string,
    message: EncodedMessage,
  ): Promise<void>;
}

export type InboxOutcome<T> =
  | { readonly duplicate: true }
  | { readonly duplicate: false; readonly value: T };

/** Remembers which messages a subscription processed. */
export interface MessageInbox {
  /**
   * Runs `run` in a transaction that also records `(subscription, messageId)`, unless that pair is already
   * recorded. A failure rolls both back.
   */
  process<T>(
    subscription: string,
    messageId: string,
    run: (transaction: unknown) => Promise<T>,
  ): Promise<InboxOutcome<T>>;
}

export type BrokerBackendSharing = 'local' | 'shared';

export interface BrokerBackendDescription {
  readonly name: string;
  readonly adapter: string;
  readonly registered: boolean;
  /** `unknown` until the adapter is registered. */
  readonly sharing: BrokerBackendSharing | 'unknown';
  readonly capabilities: BrokerCapabilities | null;
}

export interface MessageBrokerDescription {
  readonly default: string | null;
  readonly backends: readonly BrokerBackendDescription[];
  readonly publishers: readonly {
    readonly name: string;
    readonly backend: string;
  }[];
  readonly subscriptions: readonly {
    readonly name: string;
    readonly backend: string;
    readonly consuming: boolean;
  }[];
  readonly outbox: boolean;
  readonly inbox: boolean;
}

export interface MessageBrokerService {
  /** Registers a backend implementation. Only before setup; does no I/O. */
  registerImplementation(
    adapter: string,
    implementation: BrokerImplementation,
  ): void;
  /** Registers the outbox `publish(…, { transaction })` writes into. Only before setup. */
  registerOutbox(outbox: MessageOutbox): void;
  /** Registers the inbox subscriptions with `inbox: true` use. Only before setup. */
  registerInbox(inbox: MessageInbox): void;
  publisher<T = unknown>(
    name: string,
    options?: PublisherOptions<T>,
  ): Publisher<T>;
  subscription<T = unknown>(
    name: string,
    options?: SubscriptionOptions<T>,
  ): Subscription<T>;
  /**
   * Publishes an already encoded message on a logical publisher and resolves once the backend confirmed it. Outbox
   * relays use it; business code calls `publisher().publish()`.
   */
  publishEncoded(publisher: string, message: EncodedMessage): Promise<void>;
  /** Validates configuration, opens every backend, checks its topology and starts consuming. */
  setup(): Promise<void>;
  /** Stops consuming, waits for running handlers and closes the backends. Safe to call more than once. */
  shutdown(): Promise<void>;
  describe(): MessageBrokerDescription;
}
