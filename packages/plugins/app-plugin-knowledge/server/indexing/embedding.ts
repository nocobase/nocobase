import type { ServiceContainer } from '@nocobase/service-provider';
import type { KnowledgeEmbeddingProvider } from './types.js';
import { canonicalJson, sha256 } from './vector.js';
import { invalid } from '../errors.js';

/** Resolves only Agents' public model services and gateway, never its vector collections. */
export async function agentsEmbedding(
  container: ServiceContainer,
): Promise<KnowledgeEmbeddingProvider | null> {
  let entry: typeof import('@nocobase/app-plugin-agents/server/tokens');
  try {
    entry = await import('@nocobase/app-plugin-agents/server/tokens');
  } catch {
    return null;
  }
  if (!container.has(entry.agentsToken)) return null;
  const { models } = container.resolve(entry.agentsToken);
  const { providerOf } =
    await import('@nocobase/app-plugin-agents/shared/models');
  return {
    catalog: async () =>
      (await models.services.list())
        .filter(
          (service) =>
            service.enabled &&
            providerOf(service.provider)?.kinds.includes('embedding'),
        )
        .map((service) => ({
          name: service.name,
          title: service.title,
          provider: service.provider,
          models: service.models
            .filter((model) => model.kind === 'embedding')
            .map((model) => ({
              value: model.value,
              label: model.label,
              dimensions: model.dimensions,
            })),
        })),
    identity: async (ref) => {
      const service = (await models.services.list()).find(
        (item) => item.name === ref.modelService && item.enabled,
      );
      const model = service?.models.find((item) => item.value === ref.model);
      if (
        !service ||
        !providerOf(service.provider)?.kinds.includes('embedding') ||
        (model && model.kind !== 'embedding')
      )
        throw invalid('INDEXING_MODEL_UNKNOWN', 'Unknown Embedding model.');
      const { provider, baseUrl } = service;
      return {
        hash: sha256(
          canonicalJson({
            provider,
            baseUrl,
            ...(provider === 'alibaba'
              ? { embeddingTransport: 'openai-compatible-v1' }
              : {}),
            modelService: ref.modelService,
            model: ref.model,
            encoding: 'kb-chunk-text-v1',
            dimensions: model?.dimensions ?? null,
          }),
        ),
        dimensions: model?.dimensions ?? null,
      };
    },
    embed: async (request) =>
      models.gateway.embed({
        ...request,
        allowUnlistedModel: true,
        values: [...request.values],
      }),
  };
}
