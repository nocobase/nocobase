import type { Context } from 'hono';
import { MailerProvider } from '@nocobase/app-server/mailer';
import type { Application } from '@nocobase/app-server/application';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { I18nProvider, i18nHttpMiddleware } from '@nocobase/app-server/i18n';
import { CachingProvider } from '@nocobase/app-server/caching';
import { DriveProvider } from '@nocobase/app-server/drive';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import {
  LoggingProvider,
  requestLoggingMiddleware,
} from '@nocobase/app-server/logging';
import { QueueServiceProvider } from '@nocobase/app-server/queue';
import { SecretsProvider } from '@nocobase/app-server/secrets';
import { JobExecutorServiceProvider } from '@nocobase/app-server/jobs';
import {
  SessionProvider,
  sessionHttpMiddleware,
} from '@nocobase/app-server/session';
import {
  defineHttpMiddleware,
  apiErrorHandler,
  ApiError,
  healthCheckApiRoutes,
} from '@nocobase/app-server/router';
import {
  createAppFromRuntime,
  type AppRuntimeContext,
} from '@nocobase/app-server/runtime';
import { spaRootRoutes } from '@nocobase/app-server/spa';

export function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);

  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(I18nProvider);
  app.addServiceProvider(LoggingProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServiceProvider(SecretsProvider);
  app.addServiceProvider(SessionProvider);
  app.addServiceProvider(DriveProvider);
  app.addServiceProvider(MailerProvider);
  app.addServiceProvider(QueueServiceProvider, {
    nodeEnv: runtime.env.NODE_ENV,
  });
  app.addServiceProvider(JobExecutorServiceProvider, {
    nodeEnv: runtime.env.NODE_ENV,
  });
  app.addHttpMiddleware(requestLoggingMiddleware);
  app.addHttpMiddleware(sessionHttpMiddleware);
  app.addHttpMiddleware(i18nHttpMiddleware);
  app.addHttpMiddleware(
    defineHttpMiddleware({
      name: 'studio/access-maintenance',
      register(router, application) {
        router.use('*', async (context: Context, next) => {
          const path = context.req.path;
          if (
            application.config.get<boolean>(
              'studio.accessUpgrade.maintenance',
            ) === true &&
            !['GET', 'HEAD', 'OPTIONS'].includes(context.req.method) &&
            !path.includes('/api/auth/') &&
            !path.endsWith('/api/access/upgrades/pm358/restore')
          )
            return apiErrorHandler(
              new ApiError({
                status: 'UNAVAILABLE',
                domain: 'studio',
                reason: 'STUDIO_ACCESS_MAINTENANCE',
                message: 'Studio is read-only during access maintenance.',
              }),
              context,
            );
          await next();
        });
      },
    }),
  );
  app.addRoutes(healthCheckApiRoutes);
  app.addRuntimeContributions(runtime);
  app.addRoutes(spaRootRoutes);

  return app;
}
