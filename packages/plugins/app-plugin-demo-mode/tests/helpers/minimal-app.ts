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

function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addRuntimeContributions(runtime);
  return app;
}
import appRuntime from './minimal-runtime.js';

async function createServer(scope: AppScope): Promise<Application> {
  const runtime = await resolveAppRuntime(appRuntime, scope);
  return startApplicationInScope(scope, createApp(runtime));
}

const standalone = defineStandaloneServer({
  rootDir: path.resolve(
    import.meta.dirname,
    '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo',
  ),
  appRuntime,
  createServer,
});

export const createStandaloneServer: (
  options?: StandaloneServerOptions,
) => Promise<StandaloneServer> = standalone.create;
