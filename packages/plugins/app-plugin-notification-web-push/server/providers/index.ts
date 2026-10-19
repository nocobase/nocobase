import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import WebPushProvider from './web-push.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  WebPushProvider,
];

export default serviceProviders;
