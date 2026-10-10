import type { ApiClient } from '@nocobase/app-client';

import type { DeliveryOutcome, DurableFlow } from '../../shared/flows.js';
import { LIFECYCLE_ROUTES } from '../../shared/routes.js';

/** One webhook a simulated system sent, and how its deliveries were answered. */
export interface WebhookEvent {
  readonly eventId: string;
  readonly source: string;
  readonly type: string;
  readonly recordId: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
  readonly createdAt: string;
  readonly status: 'held' | 'delivered';
  readonly deliveries: number;
  readonly lastDeliveredAt: string | null;
  readonly outcome: DeliveryOutcome | null;
  readonly outcomeDetail: string | null;
}

export interface CheckoutSession {
  readonly sessionId: string;
  readonly status: 'open' | 'paid' | 'declined' | 'expired';
  readonly url: string;
  readonly paymentRef: string | null;
}

export interface StockLevel {
  readonly sku: string;
  readonly available: number;
  readonly reserved: number;
}

export interface SendEvent {
  readonly source: 'payments' | 'warehouse' | 'carrier';
  readonly type: string;
  readonly recordId: string;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly occurredAt?: string;
  readonly hold: boolean;
}

const base = `${LIFECYCLE_ROUTES}/sandbox`;

/** The sandbox console's routes: a person playing the systems outside the application. */
export function sandboxApi(client: ApiClient): {
  events(flow: DurableFlow, recordId: string): Promise<WebhookEvent[]>;
  send(event: SendEvent): Promise<WebhookEvent>;
  deliver(eventId: string): Promise<WebhookEvent>;
  pay(
    orderId: string,
    outcome: 'paid' | 'declined',
    hold: boolean,
  ): Promise<WebhookEvent>;
  checkout(sessionId: string): Promise<CheckoutSession>;
  stock(): Promise<StockLevel[]>;
} {
  const data = async <T>(request: Parameters<ApiClient['request']>[0]) =>
    (await client.request<{ readonly data: T }>(request)).data;
  return {
    events: (flow, recordId) =>
      data<WebhookEvent[]>({
        path: `${base}/events`,
        query: { lifecycle: flow, recordId },
      }),
    send: (event) =>
      data<WebhookEvent>({
        method: 'POST',
        path: `${base}/events`,
        json: event,
      }),
    deliver: (eventId) =>
      data<WebhookEvent>({
        method: 'POST',
        path: `${base}/events/${encodeURIComponent(eventId)}/deliver`,
      }),
    pay: (orderId, outcome, hold) =>
      data<WebhookEvent>({
        method: 'POST',
        path: `${base}/orders/${encodeURIComponent(orderId)}/pay`,
        json: { outcome, hold },
      }),
    checkout: (sessionId) =>
      data<CheckoutSession>({
        path: `${base}/checkouts/${encodeURIComponent(sessionId)}`,
      }),
    stock: () => data<StockLevel[]>({ path: `${base}/stock` }),
  };
}
