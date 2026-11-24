import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { NotificationAuthorizationProvider } from './authorization.js';
import {
  NotificationProvider,
  type NotificationProviderApplicationConfig,
} from './notification.js';

const serviceProviders: readonly AppPluginProviderConstructor<NotificationProviderApplicationConfig>[] =
  [NotificationProvider, NotificationAuthorizationProvider];

export default serviceProviders;
