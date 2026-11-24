import { concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import type { MessageBrokerLogger } from '@nocobase/message-broker';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  resolveMessageBrokerOutboxConfig,
  type MessageBrokerOutboxConfig,
} from '../config.js';
import { OutboxRelay, type RelayExclusion } from '../relay.js';
import { MessageBrokerStore } from '../store.js';
import { messageBrokerOutboxRelayToken } from '../tokens.js';

/** The lock that keeps one outbox round running across every instance. */
const RELAY_LOCK = 'message-broker:outbox';

/**
 * Registers the outbox and inbox with the application's message broker service in `boot()`, before the service is
 * set up, and runs the outbox relay from `start()` to `shutdown()`.
 */
export class MessageBrokerOutboxProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-message-broker';
  private relay: OutboxRelay | undefined;

  public override register(): void {
    this.app.container.singleton(messageBrokerOutboxRelayToken, (container) => {
      const config = resolveMessageBrokerOutboxConfig(
        this.app.config.get<MessageBrokerOutboxConfig>('messageBrokerOutbox'),
      );
      const logger: MessageBrokerLogger = container.has(loggingToken)
        ? container
            .resolve(loggingToken)
            .getLogger('message-broker')
            .child({ module: 'message-broker-outbox' })
        : {
            debug: () => undefined,
            info: () => undefined,
            warn: (bindings, message) => console.warn(message, bindings),
            error: (bindings, message) => console.error(message, bindings),
          };
      let executor: Promise<RelayExclusion> | undefined;
      const exclusive: RelayExclusion = async (tick) => {
        executor ??= (async (): Promise<RelayExclusion> => {
          if (!container.has(concurrencyServiceToken)) {
            return async (run) => {
              await run();
              return true;
            };
          }
          const manager = await container
            .resolve(concurrencyServiceToken)
            .getManager();
          const synchronous = await manager.createSynchronous(RELAY_LOCK);
          return async (run) => (await synchronous.tryRun(run, 0)).acquired;
        })();
        return (await executor)(tick);
      };
      return new OutboxRelay({
        database: () => container.resolve(databaseManagerToken),
        broker: () => container.resolve(messageBrokerServiceToken),
        exclusive,
        logger,
        ...config,
      });
    });
  }

  public override boot(): Promise<void> {
    const container = this.app.container;
    const relay = container.resolve(messageBrokerOutboxRelayToken);
    const store = new MessageBrokerStore({
      database: () => container.resolve(databaseManagerToken),
      generateId: () => container.resolve(idGeneratorToken).generate(),
      onCommitted: () => relay.kick(),
    });
    const broker = container.resolve(messageBrokerServiceToken);
    broker.registerOutbox(store);
    broker.registerInbox(store);
    return Promise.resolve();
  }

  public override start(): Promise<void> {
    this.relay = this.app.container.resolve(messageBrokerOutboxRelayToken);
    this.relay.start();
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    await this.relay?.stop();
    this.relay = undefined;
  }
}
