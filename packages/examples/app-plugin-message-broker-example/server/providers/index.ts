import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { MessageBrokerExampleProvider } from './message-broker-example.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  MessageBrokerExampleProvider,
];

export default serviceProviders;
