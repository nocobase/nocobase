import type {
  AppPluginApplication,
  AppPluginProviderConstructor,
} from '@nocobase/app-server/plugins';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
} from '@nocobase/service-provider';
import {
  knowledgeToken,
  knowledgeIndexingToken,
  knowledgeIndexingExtensionsToken,
} from '../tokens.js';
import { createKnowledgeIndexingRegistry } from '../indexing/registry.js';
import { createKnowledgeIndexing } from '../indexing/runtime.js';
import { agentsEmbedding } from '../indexing/embedding.js';
import type {
  KnowledgeIndexingExtension,
  KnowledgeIndexingRuntime,
} from '../indexing/types.js';
import type { KnowledgeConfig } from './knowledge.js';

const runtimeToken = createServiceToken<KnowledgeIndexingRuntime>(
  'knowledge/indexing-runtime',
);
const SCOPE = '@nocobase/app-plugin-knowledge';
export function indexingProvider(
  extensions: readonly KnowledgeIndexingExtension[],
): AppPluginProviderConstructor {
  return class KnowledgeIndexingProvider extends ServiceProvider<AppPluginApplication> {
    public readonly name = '@nocobase/app-plugin-knowledge/indexing';
    private runtime?: KnowledgeIndexingRuntime;
    private onError = (reason: string): void => {
      if (this.app.container.has(loggingToken))
        this.app.container
          .resolve(loggingToken)
          .getLogger('knowledge')
          .error(reason);
      else console.error(reason);
    };
    public override register(): void {
      const { container } = this.app;
      container.singleton(knowledgeIndexingExtensionsToken, () =>
        createKnowledgeIndexingRegistry(),
      );
      container.singleton(runtimeToken, () =>
        createKnowledgeIndexing({
          database: container.resolve(databaseManagerToken),
          knowledge: container.resolve(knowledgeToken),
          registry: container.resolve(knowledgeIndexingExtensionsToken),
          indexing:
            this.app.config.get<KnowledgeConfig>('knowledge')?.indexing ?? {},
          embedding: () => agentsEmbedding(container),
          jobs: () => {
            if (!container.has(jobExecutorServiceToken)) return null;
            const name = this.app.config
              .get<KnowledgeConfig>('knowledge')
              ?.jobs?.trim();
            if (name !== undefined) {
              const jobs = this.app.config.get<Record<string, unknown>>('jobs');
              const selected = jobs?.[name];
              if (
                !/^[^\s]{1,100}$/.test(name) ||
                !selected ||
                typeof selected !== 'object' ||
                Array.isArray(selected)
              )
                return null;
            }
            const service = container.resolve(jobExecutorServiceToken);
            return {
              executor: service.getJobExecutor(SCOPE, name),
              schedule: service.getScheduleExecutor(SCOPE, name),
            };
          },
          newId: () => container.resolve(idGeneratorToken).generateString(),
          storagePath: this.app.paths.storage(),
          onError: this.onError,
        }),
      );
      container.singleton(
        knowledgeIndexingToken,
        () => container.resolve(runtimeToken).service,
      );
    }
    public override async boot(): Promise<void> {
      const registry = this.app.container.resolve(
        knowledgeIndexingExtensionsToken,
      );
      for (const extension of extensions) registry.register(extension);
    }
    public override async start(): Promise<void> {
      try {
        this.runtime = this.app.container.resolve(runtimeToken);
        await this.runtime.start();
      } catch {
        this.onError('INDEXING_UNAVAILABLE');
      }
    }
    public override async shutdown(): Promise<void> {
      await this.runtime?.close();
    }
  };
}
