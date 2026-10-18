import type { RealtimeMessageData } from '../protocol.js';

/** The application owns the socket and adapts it to this structural contract. */
export interface RealtimeTransport {
  readonly readyState: number;
  readonly bufferedAmount?: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export interface RealtimePrincipal {
  readonly userId: string;
  readonly sessionId?: string;
}

export interface RealtimeConnectionContext {
  readonly request?: Request;
  readonly principal?: RealtimePrincipal;
  /** Revalidates the original identity, without adopting a different session. */
  readonly validatePrincipal?: (signal: AbortSignal) => Promise<boolean>;
}

export interface RealtimeConnection extends RealtimeConnectionContext {
  readonly id: string;
  readonly ws: RealtimeTransport;
  readonly connectedAt: Date;
  readonly subscriptions: Set<string>;
}

export interface RealtimeSubscription {
  readonly id: string;
  readonly connectionId: string;
  readonly topic: string;
  readonly userId?: string;
  readonly createdAt: Date;
}

export interface RealtimePublishResult {
  readonly eventId: string;
  readonly topic: string;
}

export type RealtimeTopicAudience = 'public' | 'user';

export interface RealtimeAuthorizationContext<
  Params = Readonly<Record<string, string>>,
> {
  readonly principal?: RealtimePrincipal;
  readonly topic: string;
  readonly params: Params;
  readonly signal: AbortSignal;
}

export interface RealtimeTopicOptions<
  Payload = unknown,
  Params = Readonly<Record<string, string>>,
> {
  readonly audience: RealtimeTopicAudience;
  readonly authenticated?: boolean;
  /** Checked on subscription and before each protected delivery. Errors deny access. */
  readonly authorize?: (
    context: RealtimeAuthorizationContext<Params>,
  ) => boolean | Promise<boolean>;
  readonly parsePayload?: (value: unknown) => Payload;
}

export interface RealtimePublishOptions {
  readonly userId?: string;
}

export interface RealtimeTopicBase {
  readonly name: string;
  close(): void;
}

export interface RealtimePublicTopic<Payload> extends RealtimeTopicBase {
  readonly audience: 'public';
  publish(payload: Payload): Promise<RealtimePublishResult>;
}

export interface RealtimeUserTopic<Payload> extends RealtimeTopicBase {
  readonly audience: 'user';
  publishFor(userId: string, payload: Payload): Promise<RealtimePublishResult>;
}

export type DefinedRealtimeTopic<
  Payload,
  Audience extends RealtimeTopicAudience,
> = Audience extends 'user'
  ? RealtimeUserTopic<Payload>
  : RealtimePublicTopic<Payload>;

export interface RealtimeTopicFamily<Params, Payload> {
  readonly pattern: string;
  topic(params: Params): string;
  publish(params: Params, payload: Payload): Promise<RealtimePublishResult>;
  close(): void;
}

export interface RealtimeBrokerEvent {
  readonly eventId: string;
  readonly origin: string;
  readonly namespace: string;
  readonly topic: string;
  readonly userId?: string;
  readonly payload: unknown;
  readonly publishedAt: string;
}

/** Each service owns one adapter; implementations must not retry ambiguous publishes. */
export interface RealtimeBroker {
  setup(receive: (event: RealtimeBrokerEvent) => Promise<void>): Promise<void>;
  publish(event: RealtimeBrokerEvent): Promise<void>;
  shutdown(): Promise<void>;
}

export interface RealtimeDiagnostics {
  readonly connections: number;
  readonly subscriptions: number;
  readonly pendingSubscriptions: number;
}

export interface RealtimeService {
  setup(): Promise<void>;
  connect(
    ws: RealtimeTransport,
    context?: RealtimeConnectionContext,
  ): RealtimeConnection;
  disconnect(connection: RealtimeConnection): void;
  disconnectUser(userId: string): Promise<number>;
  subscribe(
    connection: RealtimeConnection,
    topic: string,
    requestId?: string,
  ): Promise<RealtimeSubscription>;
  unsubscribe(
    connection: RealtimeConnection,
    selector: { subscriptionId?: string; topic?: string },
  ): RealtimeSubscription[];
  handleClientMessage(
    connection: RealtimeConnection,
    data: RealtimeMessageData,
  ): Promise<void>;
  registerTopic(topic: string, options: RealtimeTopicOptions): () => void;
  defineTopic<Payload, Audience extends RealtimeTopicAudience>(
    topic: string,
    options: RealtimeTopicOptions<Payload> & { readonly audience: Audience },
  ): DefinedRealtimeTopic<Payload, Audience>;
  defineTopicFamily<Params extends Record<string, string>, Payload>(
    pattern: string,
    options: RealtimeTopicOptions<Payload, Params> & {
      readonly audience: 'public';
    },
  ): RealtimeTopicFamily<Params, Payload>;
  publish(
    topic: string,
    payload: unknown,
    options?: RealtimePublishOptions,
  ): Promise<RealtimePublishResult>;
  /** Local subscribers only; never use this to suppress cluster publication. */
  subscriptionCount(topic: string): number;
  onTopicSubscriptionChange(
    topic: string,
    listener: (count: number) => void,
  ): () => void;
  diagnostics(): RealtimeDiagnostics;
  close(): Promise<void>;
}
