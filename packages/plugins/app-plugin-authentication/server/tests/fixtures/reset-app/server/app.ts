import { CachingProvider } from '@nocobase/app-server/caching';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { MailerProvider } from '@nocobase/app-server/mailer';
import type { Application } from '@nocobase/app-server/application';
import { DatabaseProvider } from '@nocobase/app-server/database';
import {
  createAppFromRuntime,
  type AppRuntimeContext,
} from '@nocobase/app-server/runtime';

export function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServiceProvider(MailerProvider);
  app.addRuntimeContributions(runtime);
  return app;
}
