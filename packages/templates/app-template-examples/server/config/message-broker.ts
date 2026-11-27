import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import {
  validateAppMessageBrokerConfig,
  type AppMessageBrokerConfig,
} from '@nocobase/app-server/message-broker';

/**
 * In-process broker for development and tests: nothing survives a restart and nothing is shared between instances.
 * Replace the backend here to use a real middleware; plugins keep using the same logical names.
 *
 * The message broker example plugin's two subscriptions read the topic its `orderEvents` publisher writes, so each
 * receives every order event independently.
 */
const messageBroker: AppConfigFactory<AppMessageBrokerConfig> = defineAppConfig(
  {
    defaults: () => ({
      default: 'memory',
      backends: {
        memory: {
          adapter: 'inMemory',
          subscriptions: {
            orderShipments: { topic: 'orderEvents' },
            customerOrderStats: { topic: 'orderEvents' },
          },
        },
      },
    }),
    validate: validateAppMessageBrokerConfig,
  },
);

export default messageBroker;
