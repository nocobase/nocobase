import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
  type AppPluginProviderConstructor,
} from '@nocobase/app-server/plugins';

import routes from './routes/index.js';
import { WorkflowAuthorizationProvider } from './authorization.js';

import { WorkflowProvider, type WorkflowProviderConfig } from './provider.js';
import locales from './locales/index.js';

const serviceProviders: readonly AppPluginProviderConstructor<WorkflowProviderConfig>[] =
  [WorkflowAuthorizationProvider, WorkflowProvider];

const workflowPlugin: AppServerPlugin<WorkflowProviderConfig> =
  defineServerPlugin<WorkflowProviderConfig>({
    baseDir: path.resolve(import.meta.dirname, '..'),
    packageName: '@nocobase/app-plugin-workflow',
    locales,
    serviceProviders,
    routes,
    database: {
      migrations: './database/migrations',
    },
  });

export default workflowPlugin;
