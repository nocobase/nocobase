import path from 'node:path';

import type { Application } from '@nocobase/app-server/application';
import {
  defineStandaloneServer,
  type StandaloneServer,
  type StandaloneServerOptions,
} from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
  type AppScope,
} from '@nocobase/app-server/runtime';

import {
  createAppFromRuntime,
  type AppRuntimeContext,
} from '@nocobase/app-server/runtime';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { CachingProvider } from '@nocobase/app-server/caching';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { I18nProvider, i18nHttpMiddleware } from '@nocobase/app-server/i18n';

function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(I18nProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addHttpMiddleware(i18nHttpMiddleware);
  app.addRuntimeContributions(runtime);
  return app;
}
import appRuntime from './minimal-runtime.js';

export function createMinimalServerFactory(
  configure?: (app: Application) => void,
): (options?: StandaloneServerOptions) => Promise<StandaloneServer> {
  return defineStandaloneServer({
    rootDir: path.resolve(
      import.meta.dirname,
      '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo',
    ),
    appRuntime,
    async createServer(scope: AppScope): Promise<Application> {
      const runtime = await resolveAppRuntime(appRuntime, scope);
      const app = createApp(runtime);
      configure?.(app);
      return startApplicationInScope(scope, app);
    },
  }).create;
}

export const createStandaloneServer = createMinimalServerFactory();
