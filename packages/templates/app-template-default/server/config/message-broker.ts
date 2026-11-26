import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import {
  validateAppMessageBrokerConfig,
  type AppMessageBrokerConfig,
} from '@nocobase/app-server/message-broker';

/** In-process broker for development and tests. Replace the backend here to integrate with a real middleware. */
const messageBroker: AppConfigFactory<AppMessageBrokerConfig> = defineAppConfig(
  {
    defaults: () => ({
      default: 'memory',
      backends: { memory: { adapter: 'inMemory' } },
    }),
    validate: validateAppMessageBrokerConfig,
  },
);

export default messageBroker;
