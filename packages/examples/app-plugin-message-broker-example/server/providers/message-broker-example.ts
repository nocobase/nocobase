import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { UnregisterHandler } from '@nocobase/message-broker';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  DefaultMessageBrokerExampleService,
  messageBrokerExampleServiceToken,
  ORDER_EVENTS,
  orderPlacedSchema,
  type OrderPlaced,
} from '../service.js';

export class MessageBrokerExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-message-broker-example';
  private unregister: UnregisterHandler | undefined;

  public override register(): void {
    this.app.container.singleton(
      messageBrokerExampleServiceToken,
      (container) =>
        new DefaultMessageBrokerExampleService(
          container.resolve(messageBrokerServiceToken),
        ),
    );
  }

  public override boot(): Promise<void> {
    const service = this.app.container.resolve(
      messageBrokerExampleServiceToken,
    );
    // Registered before the broker is set up, so the subscription's options are checked against the backend's
    // capabilities at startup. `inbox: true` needs @nocobase/app-plugin-message-broker: a redelivered messageId is
    // acknowledged without running the handler again.
    this.unregister = this.app.container
      .resolve(messageBrokerServiceToken)
      .subscription<OrderPlaced>(ORDER_EVENTS, {
        schema: orderPlacedSchema,
        inbox: true,
      })
      .consume((message) => {
        // Returning acknowledges the message; throwing retries it up to the subscription's maxAttempts, then
        // dead-letters it.
        service.record(message.body);
      });
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    await this.unregister?.();
    this.unregister = undefined;
  }
}
