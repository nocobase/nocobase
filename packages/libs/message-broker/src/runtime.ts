import type {
  BrokerBackendSharing,
  BrokerCapabilities,
  EncodedMessage,
  MessageBrokerBackendEntry,
  MessageBrokerLogger,
} from './types.js';

/** A logical publisher bound to one backend. `options` is its entry under the backend's `publishers`. */
export interface PublisherBinding {
  readonly name: string;
  /** `{}` for a name the backend binds implicitly. */
  readonly options: Readonly<Record<string, unknown>>;
}

/** A logical subscription bound to one backend, with the common options resolved. */
export interface SubscriptionBinding {
  readonly name: string;
  /** Its entry under the backend's `subscriptions`, `{}` for a name the backend binds implicitly. */
  readonly options: Readonly<Record<string, unknown>>;
  readonly maxAttempts: number;
  readonly retryDelay: number;
  readonly concurrency: number;
  readonly ordered: boolean;
}

/** A backend's configuration after the service checked the common fields. */
export interface ResolvedBackendConfig {
  readonly name: string;
  readonly entry: MessageBrokerBackendEntry;
  readonly publishers: readonly PublisherBinding[];
  readonly subscriptions: readonly SubscriptionBinding[];
}

/** A physical resource a binding needs that the middleware does not have. */
export interface MissingResource {
  /** The backend's own word for it: `topic`, `exchange`, `queue`, … */
  readonly kind: string;
  readonly name: string;
  /** For example `publisher "order-events"`. */
  readonly usedBy: string;
}

/**
 * The outcome the runtime carries out for one delivery. `deadLetter` marks a final failure that the runtime
 * settles according to the subscription's configuration.
 * A missing handler or shutdown interruption can return an immediate `retry` regardless of the attempt limit.
 * If the subscription has no application retry route, leave that delivery eligible for broker redelivery
 * at the same attempt.
 */
export type DeliveryOutcome =
  | { readonly kind: 'ack' }
  | { readonly kind: 'retry'; readonly delay: number }
  | { readonly kind: 'deadLetter'; readonly reason: string };

export interface Delivery {
  /** 1 for the first delivery of the message. */
  readonly attempt: number;
}

/** Hands one received message to the service. Never rejects. */
export type DeliverMessage = (
  message: EncodedMessage,
  delivery: Delivery,
) => Promise<DeliveryOutcome>;

/** Stops one subscription and resolves once its running deliveries have settled. */
export type StopConsuming = () => Promise<void>;

export interface BrokerRuntimeContext {
  readonly config: ResolvedBackendConfig;
  readonly appName: string;
  readonly logger: MessageBrokerLogger;
}

/**
 * One backend at runtime. The service calls `open` once, then `checkTopology`, then publishes and consumes, and
 * `close` at shutdown or after a failed setup.
 */
export interface BrokerRuntime {
  /** Connects. */
  open(): Promise<void>;
  /** Reports what the bindings need and the middleware lacks; creates nothing. */
  checkTopology(bindings: {
    readonly publishers: readonly PublisherBinding[];
    readonly subscriptions: readonly SubscriptionBinding[];
  }): Promise<readonly MissingResource[]>;
  /** Resolves once the middleware confirmed the message. */
  publish(publisher: PublisherBinding, message: EncodedMessage): Promise<void>;
  /** Starts delivering the subscription's messages to `deliver`. */
  startConsuming(
    subscription: SubscriptionBinding,
    deliver: DeliverMessage,
  ): Promise<StopConsuming>;
  /** Releases what `open` acquired. Safe after a failed or unfinished `open`. */
  close(): Promise<void>;
}

export interface BrokerImplementation {
  readonly sharing: BrokerBackendSharing;
  readonly capabilities: BrokerCapabilities;
  /**
   * Whether a logical name that no backend declares may bind to this backend when it is the default. Only an
   * in-process backend should: a real middleware needs its physical names spelled out.
   */
  readonly implicitBindings?: boolean;
  /**
   * Returns a positive integer from raw subscription options when `maxAttempts` is omitted. Called synchronously
   * before `validateConfig`. If the method is absent, the service uses 3.
   */
  defaultMaxAttempts?(options: SubscriptionBinding['options']): number;
  /** Checks adapter options and binding options synchronously, without connecting. Throws on an error. */
  validateConfig(config: ResolvedBackendConfig): void;
  createRuntime(context: BrokerRuntimeContext): BrokerRuntime;
}
