import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { createKnowledgeIndexingRegistry } from './server/indexing/registry.js';
import { parseIndexingInstances } from './server/indexing/config.js';
import {
  KnowledgeIndexingValidationError,
  type KnowledgeIndexingExtension,
} from './server/indexing/types.js';
import { sqliteVecIndexingExtension } from './server/extension/sqlite-vec/index.js';
import { pgvectorIndexingExtension } from './server/extension/pgvector/index.js';
import type { KnowledgeConfig } from './server/providers/knowledge.js';
export type { KnowledgeConfig };

/** Pure deployment validation: no database, model call, credentials or native loading. */
export function defineKnowledgeConfig(
  options: {
    readonly indexingExtensions?: readonly KnowledgeIndexingExtension[];
  } = {},
): AppConfigFactory<KnowledgeConfig> {
  const registry = createKnowledgeIndexingRegistry();
  registry.register(sqliteVecIndexingExtension);
  registry.register(pgvectorIndexingExtension);
  for (const extension of options.indexingExtensions ?? [])
    registry.register(extension);
  registry.seal();
  return defineAppConfig<KnowledgeConfig>({
    defaults: { indexing: {} },
    public: [],
    validate(value, context) {
      try {
        parseIndexingInstances(value.indexing ?? {}, registry);
      } catch (error) {
        if (!(error instanceof KnowledgeIndexingValidationError)) throw error;
        for (const issue of error.issues)
          context.error(issue.field, issue.message);
      }
      if (
        value.jobs !== undefined &&
        (typeof value.jobs !== 'string' ||
          !/^\S{1,100}$/.test(value.jobs.trim()))
      )
        context.error(
          'jobs',
          'Expected a host jobs configuration key without whitespace.',
        );
    },
  });
}
