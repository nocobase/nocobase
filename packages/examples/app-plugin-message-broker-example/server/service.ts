import type {
  BrokerTransaction,
  MessageBrokerService,
  PublishReceipt,
  StandardSchema,
} from '@nocobase/message-broker';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { z } from 'zod';

/**
 * The logical name the example publishes and consumes. The application's `messageBroker` configuration maps it to a
 * topic, an exchange or a queue; this code never names one.
 */
export const ORDER_EVENTS: string = 'orderEvents';

/** Handled events kept for `handled()`; older ones are dropped. */
const MAX_HANDLED = 50;

export interface OrderPlaced {
  readonly orderId: string;
  readonly total: number;
}

/** Inbound messages that fail this schema go to the dead letter without running the handler. */
export const orderPlacedSchema: StandardSchema<OrderPlaced> = z.object({
  orderId: z.string().min(1),
  total: z.number().nonnegative(),
});

export interface MessageBrokerExampleService {
  /**
   * Publishes `order.placed`. Inside `transaction` the message is written to the outbox and sent only after the
   * transaction commits; without one it is sent at once.
   */
  publishOrderPlaced(
    order: OrderPlaced,
    transaction?: BrokerTransaction,
  ): Promise<PublishReceipt>;
  record(order: OrderPlaced): void;
  /** Orders the subscription handled since the application started, newest first. */
  handled(): readonly OrderPlaced[];
}

export class DefaultMessageBrokerExampleService implements MessageBrokerExampleService {
  private readonly orders: OrderPlaced[] = [];

  public constructor(private readonly broker: MessageBrokerService) {}

  public publishOrderPlaced(
    order: OrderPlaced,
    transaction?: BrokerTransaction,
  ): Promise<PublishReceipt> {
    return this.broker.publisher<OrderPlaced>(ORDER_EVENTS).publish(
      {
        body: order,
        // A stable ID derived from the business event lets every consumer drop a redelivery.
        messageId: `order-placed:${order.orderId}`,
        // Messages with the same key stay in order on backends that declare `orderedByKey`.
        key: order.orderId,
        type: 'order.placed',
      },
      transaction ? { transaction } : {},
    );
  }

  public record(order: OrderPlaced): void {
    this.orders.unshift(order);
    this.orders.length = Math.min(this.orders.length, MAX_HANDLED);
  }

  public handled(): readonly OrderPlaced[] {
    return [...this.orders];
  }
}

export const messageBrokerExampleServiceToken: ServiceToken<MessageBrokerExampleService> =
  createServiceToken<MessageBrokerExampleService>(
    '@nocobase/app-plugin-message-broker-example/service',
  );
