import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type {
  MessageBrokerService,
  StandardSchema,
} from '@nocobase/message-broker';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { z } from 'zod';

/**
 * Logical names. The application's `messageBroker` configuration maps each one to a topic, an exchange or a queue;
 * this code never names a physical resource.
 *
 * `orderEvents` is published by this application. `orderShipments` and `customerOrderStats` are two independent
 * subscriptions to it: each receives every event, acknowledges, retries and dead-letters on its own. Another system
 * may subscribe to the same events through the middleware. `paymentEvents` is published by an external payment
 * provider and consumed here.
 */
export const ORDER_EVENTS: string = 'orderEvents';
export const ORDER_SHIPMENTS: string = 'orderShipments';
export const CUSTOMER_ORDER_STATS: string = 'customerOrderStats';
export const PAYMENT_EVENTS: string = 'paymentEvents';

export const ORDERS_COLLECTION = 'messageBrokerExampleOrders';
export const SHIPMENTS_COLLECTION = 'messageBrokerExampleShipments';
export const CUSTOMER_STATS_COLLECTION = 'messageBrokerExampleCustomerStats';

export interface Order {
  readonly id: string;
  readonly customer: string;
  /** In cents. */
  readonly total: number;
  readonly status: 'placed' | 'paid';
}

export interface Shipment {
  readonly orderId: string;
  readonly customer: string;
}

export interface CustomerStats {
  readonly customer: string;
  readonly orderCount: number;
  readonly totalSpent: number;
}

/** The body of `order.placed`. */
export interface OrderPlaced {
  readonly orderId: string;
  readonly customer: string;
  readonly total: number;
}

/** The body of `payment.succeeded`, sent by the external payment provider. */
export interface PaymentSucceeded {
  readonly paymentId: string;
  readonly orderId: string;
  readonly amount: number;
}

/** Inbound messages that fail a schema go to the dead letter without running the handler. */
export const orderPlacedSchema: StandardSchema<OrderPlaced> = z.object({
  orderId: z.string().min(1),
  customer: z.string().min(1),
  total: z.number().int().nonnegative(),
});

export const paymentSucceededSchema: StandardSchema<PaymentSucceeded> =
  z.object({
    paymentId: z.string().min(1),
    orderId: z.string().min(1),
    amount: z.number().int().nonnegative(),
  });

/** The event ID of `order.placed`: one business event per order, the same on every redelivery. */
export function orderPlacedMessageId(orderId: string): string {
  return `order-placed:${orderId}`;
}

export interface PlaceOrderInput {
  readonly id: string;
  readonly customer: string;
  readonly total: number;
}

export type PaymentOutcome = 'paid' | 'already-paid' | 'unknown-order';

export interface MessageBrokerExampleService {
  /**
   * Creates the order and publishes `order.placed` in one transaction: the event leaves only if the order is
   * committed. Pass `transaction` to join a larger business change; without it the service opens its own.
   */
  placeOrder(
    input: PlaceOrderInput,
    transaction?: DatabaseConnection,
  ): Promise<Order>;
  /** `orderShipments`: creates the order's shipment inside the inbox transaction. */
  createShipment(
    event: OrderPlaced,
    transaction: DatabaseConnection,
  ): Promise<void>;
  /** `customerOrderStats`: counts the order for its customer inside the inbox transaction. */
  countOrder(
    event: OrderPlaced,
    transaction: DatabaseConnection,
  ): Promise<void>;
  /** `paymentEvents`: marks the order paid inside the inbox transaction. */
  confirmPayment(
    payment: PaymentSucceeded,
    transaction: DatabaseConnection,
  ): Promise<PaymentOutcome>;
}

export class DefaultMessageBrokerExampleService implements MessageBrokerExampleService {
  public constructor(
    private readonly database: () => DatabaseManager,
    private readonly broker: () => MessageBrokerService,
  ) {}

  public async placeOrder(
    input: PlaceOrderInput,
    transaction?: DatabaseConnection,
  ): Promise<Order> {
    if (!transaction) {
      return this.database().transaction((own) => this.placeOrder(input, own));
    }
    const order: Order = { ...input, status: 'placed' };
    await transaction
      .repository<Order>(ORDERS_COLLECTION)
      .createOne({ values: order });
    // Written to the outbox in the same transaction and sent after it commits; a rollback removes both.
    await this.broker()
      .publisher<OrderPlaced>(ORDER_EVENTS)
      .publish(
        {
          body: {
            orderId: order.id,
            customer: order.customer,
            total: order.total,
          },
          messageId: orderPlacedMessageId(order.id),
          // The ordering key. Order per key holds only for a subscription configured with `ordered: true` on a backend
          // that declares `orderedByKey`; this example's subscriptions keep the default `ordered: false`. Even then,
          // the outbox does not keep strict order across its retry rounds.
          key: order.id,
          type: 'order.placed',
        },
        { transaction },
      );
    return order;
  }

  public async createShipment(
    event: OrderPlaced,
    transaction: DatabaseConnection,
  ): Promise<void> {
    await transaction.repository<Shipment>(SHIPMENTS_COLLECTION).createOne({
      values: { orderId: event.orderId, customer: event.customer },
    });
  }

  public async countOrder(
    event: OrderPlaced,
    transaction: DatabaseConnection,
  ): Promise<void> {
    // An increment is not idempotent: only the inbox, recording the message in this same transaction, keeps a
    // redelivery from counting the order twice.
    await transaction
      .repository<CustomerStats>(CUSTOMER_STATS_COLLECTION)
      .upsertOne({
        filter: { customer: event.customer },
        create: {
          customer: event.customer,
          orderCount: 1,
          totalSpent: event.total,
        },
        update: {
          orderCount: (value) => value.increment(1),
          totalSpent: (value) => value.increment(event.total),
        },
      });
  }

  public async confirmPayment(
    payment: PaymentSucceeded,
    transaction: DatabaseConnection,
  ): Promise<PaymentOutcome> {
    const orders = transaction.repository<Order>(ORDERS_COLLECTION);
    const order = await orders.findOne({ filter: { id: payment.orderId } });
    if (!order) return 'unknown-order';
    if (order.status === 'paid') return 'already-paid';
    await orders.updateOne({
      filter: { id: payment.orderId },
      values: { status: 'paid' },
    });
    return 'paid';
  }
}

export const messageBrokerExampleServiceToken: ServiceToken<MessageBrokerExampleService> =
  createServiceToken<MessageBrokerExampleService>(
    '@nocobase/app-plugin-message-broker-example/service',
  );
