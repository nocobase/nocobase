import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { MessageBrokerService } from '@nocobase/message-broker';

/**
 * The application's message broker service. Plugins resolve it here rather than creating a token of their own: a
 * token with the same name is a different key.
 */
export const messageBrokerServiceToken: ServiceToken<MessageBrokerService> =
  createServiceToken<MessageBrokerService>('@nocobase/message-broker/service');
