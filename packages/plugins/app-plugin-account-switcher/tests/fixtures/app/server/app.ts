import type { Application } from '@nocobase/app-server/application';
import { CachingProvider } from '@nocobase/app-server/caching';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { I18nProvider } from '@nocobase/app-server/i18n';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { LoggingProvider } from '@nocobase/app-server/logging';
import {
  createAppFromRuntime,
  type AppRuntimeContext,
} from '@nocobase/app-server/runtime';
import { SecretsProvider } from '@nocobase/app-server/secrets';

export function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServiceProvider(I18nProvider);
  app.addServiceProvider(LoggingProvider);
  app.addServiceProvider(SecretsProvider);
  app.addRuntimeContributions(runtime);
  return app;
}
