import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { MailAuthorizationProvider } from './authorization.js';
import { MailCoreProvider } from './mail-core.js';
import { MailBuiltinsProvider } from './mail-builtins.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  MailCoreProvider,
  MailBuiltinsProvider,
  MailAuthorizationProvider,
];

export default serviceProviders;
