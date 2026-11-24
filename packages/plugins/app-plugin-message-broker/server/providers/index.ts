import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { MessageBrokerOutboxProvider } from './message-broker.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  MessageBrokerOutboxProvider,
];

export default serviceProviders;
