import path from 'node:path';
import { CachingProvider } from '@nocobase/app-server/caching';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { LoggingProvider } from '@nocobase/app-server/logging';
import { JobExecutorServiceProvider } from '@nocobase/app-server/jobs';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import notificationPlugin from '@nocobase/app-plugin-notification/server';
import providersPlugin from '@nocobase/app-plugin-notification-providers/server';
import baseRuntime from './runtime.js';

const appRuntime = defineAppRuntime({
  ...baseRuntime,
  plugins: defineServerPlugins([
    ...baseRuntime.plugins.plugins,
    { ...notificationPlugin, routes: [] },
    providersPlugin,
  ]),
});

const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, '..'),
  appRuntime,
  async createServer(scope) {
    const runtime = await resolveAppRuntime(appRuntime, scope);
    const app = createAppFromRuntime(runtime);
    app.addServiceProvider(DatabaseProvider);
    app.addServiceProvider(CachingProvider);
    app.addServiceProvider(IdGeneratorProvider);
    app.addServiceProvider(LoggingProvider);
    app.addServiceProvider(JobExecutorServiceProvider, {
      nodeEnv: 'development',
    });
    app.addRuntimeContributions(runtime);
    return startApplicationInScope(scope, app);
  },
});

export const createNotificationServer: typeof standalone.create =
  standalone.create;
