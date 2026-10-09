import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { MailExampleProvider } from './mail-example.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  MailExampleProvider,
];

export default serviceProviders;
