import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { OutboxRelay } from './relay.js';

/** The outbox relay of this application. Tests use it to wait until committed messages were sent. */
export const messageBrokerOutboxRelayToken: ServiceToken<OutboxRelay> =
  createServiceToken<OutboxRelay>('@nocobase/app-plugin-message-broker/relay');
