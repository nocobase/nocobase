import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import {
  reject,
  type HandlerContext,
  type UnregisterHandler,
} from '@nocobase/message-broker';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  CUSTOMER_ORDER_STATS,
  DefaultMessageBrokerExampleService,
  messageBrokerExampleServiceToken,
  ORDER_SHIPMENTS,
  orderPlacedSchema,
  PAYMENT_EVENTS,
  paymentSucceededSchema,
  type OrderPlaced,
  type PaymentSucceeded,
} from '../service.js';

/**
 * The transaction the inbox opened for this message. Business writes go through it, so they commit together with the
 * inbox record: either both are kept, or a failure rolls both back and the message is retried.
 */
function inboxTransaction(context: HandlerContext): DatabaseConnection {
  if (context.transaction === undefined) {
    throw new Error(
      'The subscription needs `inbox: true` and the @nocobase/app-plugin-message-broker plugin.',
    );
  }
  return context.transaction as DatabaseConnection;
}

export class MessageBrokerExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-message-broker-example';
  private readonly unregister: UnregisterHandler[] = [];

  public override register(): void {
    this.app.container.singleton(
      messageBrokerExampleServiceToken,
      (container) =>
        new DefaultMessageBrokerExampleService(
          () => container.resolve(databaseManagerToken),
          () => container.resolve(messageBrokerServiceToken),
        ),
    );
  }

  public override boot(): Promise<void> {
    const container = this.app.container;
    const service = container.resolve(messageBrokerExampleServiceToken);
    const broker = container.resolve(messageBrokerServiceToken);
    // Registered before the broker is set up, so each subscription's options are checked against its backend's
    // capabilities at startup. Returning acknowledges a message; throwing rolls back the inbox transaction and
    // retries it up to the subscription's maxAttempts, then dead-letters it.
    this.unregister.push(
      broker
        .subscription<OrderPlaced>(ORDER_SHIPMENTS, {
          schema: orderPlacedSchema,
          inbox: true,
        })
        .consume((message, context) =>
          service.createShipment(message.body, inboxTransaction(context)),
        ),
      broker
        .subscription<OrderPlaced>(CUSTOMER_ORDER_STATS, {
          schema: orderPlacedSchema,
          inbox: true,
        })
        .consume((message, context) =>
          service.countOrder(message.body, inboxTransaction(context)),
        ),
      // External integration: the payment provider publishes to a resource the configuration maps to
      // `paymentEvents`. Its message IDs identify payments, so the inbox drops a payment the provider sends twice.
      broker
        .subscription<PaymentSucceeded>(PAYMENT_EVENTS, {
          schema: paymentSucceededSchema,
          inbox: true,
        })
        .consume(async (message, context) => {
          const outcome = await service.confirmPayment(
            message.body,
            inboxTransaction(context),
          );
          // Nothing will make an unknown order appear; dead-letter it for an operator instead of retrying.
          if (outcome === 'unknown-order') {
            return reject(`unknown order ${message.body.orderId}`);
          }
          return undefined;
        }),
    );
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    await Promise.all(this.unregister.splice(0).map((stop) => stop()));
  }
}
