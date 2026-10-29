import { SecretsProvider } from '@nocobase/app-server/secrets';
import { LoggingProvider } from '@nocobase/app-server/logging';
import { I18nProvider } from '@nocobase/app-server/i18n';
import { QueueServiceProvider } from '@nocobase/app-server/queue';
import { JobExecutorServiceProvider } from '@nocobase/app-server/jobs';
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
  app.addServiceProvider(I18nProvider);
  app.addServiceProvider(LoggingProvider);
  app.addServiceProvider(SecretsProvider);
  app.addServiceProvider(QueueServiceProvider, { nodeEnv: 'test' });
  app.addServiceProvider(JobExecutorServiceProvider, { nodeEnv: 'test' });
  app.addRuntimeContributions(runtime);
  return app;
}
