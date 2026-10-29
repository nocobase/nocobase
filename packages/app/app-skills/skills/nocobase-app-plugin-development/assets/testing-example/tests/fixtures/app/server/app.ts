import type { Application } from '@nocobase/app-server/application';
import { CachingProvider } from '@nocobase/app-server/caching';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import {
  createAppFromRuntime,
  type AppRuntimeContext,
} from '@nocobase/app-server/runtime';

export function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addRuntimeContributions(runtime);
  return app;
}
