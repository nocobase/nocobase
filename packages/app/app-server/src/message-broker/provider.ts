import {
  createMessageBrokerService,
  type MessageBrokerLogger,
  type MessageBrokerService,
} from '@nocobase/message-broker';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';

import { loggingToken } from '../logging/index.js';
import type { AppPluginApplication } from '../plugins/index.js';
import type { AppMessageBrokerConfig } from './config.js';
import { messageBrokerServiceToken } from './token.js';

/**
 * Creates the application's message broker service from the `messageBroker` section. Register it before the plugin
 * providers that resolve `messageBrokerServiceToken`: they register backends, an outbox and handlers in `register()`
 * or `boot()`, `start()` then sets the service up — validating the configuration, opening every backend and checking
 * its topology — and `shutdown()` releases it after they have shut down.
 */
export class MessageBrokerServiceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/message-broker';

  public override register(): void {
    this.app.container.singleton(messageBrokerServiceToken, (container) =>
      this.create(container),
    );
  }

  public override async start(): Promise<void> {
    await this.app.container.resolve(messageBrokerServiceToken).setup();
  }

  public override async shutdown(): Promise<void> {
    await this.app.container
      .resolveIfCreated(messageBrokerServiceToken)
      ?.shutdown();
  }

  private create(container: ServiceResolver): MessageBrokerService {
    const logger: MessageBrokerLogger | undefined = container.has(loggingToken)
      ? container
          .resolve(loggingToken)
          .getLogger('message-broker')
          .child({ module: 'message-broker' })
      : undefined;
    return createMessageBrokerService(
      this.app.config.get<AppMessageBrokerConfig>('messageBroker'),
      { appName: this.app.appName, ...(logger ? { logger } : {}) },
    );
  }
}
