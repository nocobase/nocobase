import type { Application } from '@nocobase/app-server/application';
import { SecretsProvider } from '@nocobase/app-server/secrets';
import { LoggingProvider } from '@nocobase/app-server/logging';
import { I18nProvider } from '@nocobase/app-server/i18n';
import { QueueServiceProvider } from '@nocobase/app-server/queue';
import { JobExecutorServiceProvider } from '@nocobase/app-server/jobs';
import { CachingProvider } from '@nocobase/app-server/caching';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { MailerProvider } from '@nocobase/app-server/mailer';
import {
  createAppFromRuntime,
  type AppRuntimeContext,
} from '@nocobase/app-server/runtime';
import { ServiceProvider } from '@nocobase/service-provider';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';

export function createApp(runtime: AppRuntimeContext): Application {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServiceProvider(MailerProvider);
  app.addServiceProvider(I18nProvider);
  app.addServiceProvider(LoggingProvider);
  app.addServiceProvider(SecretsProvider);
  app.addServiceProvider(QueueServiceProvider, { nodeEnv: 'test' });
  app.addServiceProvider(JobExecutorServiceProvider, { nodeEnv: 'test' });
  app.addRuntimeContributions(runtime);
  if (runtime.scope.env.KNOWLEDGE_INDEXING_PROCESS_MODE) {
    app.addServiceProvider(
      class extends ServiceProvider<Application> {
        public override boot(): void {
          const gateway =
            this.app.container.resolve(agentsToken).models.gateway;
          gateway.embed = async ({ values }) => {
            if (runtime.scope.env.KNOWLEDGE_INDEXING_PROCESS_MODE === 'hold') {
              console.info('KB_PROCESS_EMBEDDING_STARTED');
              await new Promise<void>(() => {});
            }
            return {
              embeddings: values.map(() => [1, 0, 0]),
              dimension: 3,
              model: 'embed',
              tokens: 0,
            };
          };
        }
      },
    );
  }
  return app;
}
