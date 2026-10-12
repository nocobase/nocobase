import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import locales from './locales/index.js';
import serviceProviders from './providers/index.js';
import routes from './routes/index.js';
import type { AuthenticationProviderConfig } from './providers/authentication.js';

const authenticationPlugin: AppServerPlugin<AuthenticationProviderConfig> =
  defineServerPlugin<AuthenticationProviderConfig>({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-authentication',
    serviceProviders,
    locales,
    routes,
    database: {
      migrations: './database/migrations',
      seeds: './database/seeds',
    },
  });

export default authenticationPlugin;
