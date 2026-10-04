import { SupportedModel } from '@nocobase/ai-employee';
import type { AIManager } from '@nocobase/ai-employee';
import type {
  EnabledLLMServiceDto,
  ProviderModelDto,
  ProviderModelListRequest,
} from '../types.js';
import { preconditionError, unavailableError } from '../types.js';
import { llmServiceNotFound } from './llm-service.js';

/**
 * LLM service / model service — uses the provider manager and shared in-memory `llmServices` store.
 */
export interface ModelServiceOptions {
  readonly ai: AIManager;
}

export class ModelService {
  private readonly ai: AIManager;

  public constructor({ ai }: ModelServiceOptions) {
    this.ai = ai;
  }
  async listEnabled(_options: {}): Promise<EnabledLLMServiceDto[]> {
    const list = await this.ai.llmProviderManager.listAllEnabledModels();
    return list.map((service) => ({
      llmService: service.llmService,
      llmServiceTitle: service.llmServiceTitle,
      provider: service.provider,
      providerTitle: service.providerTitle,
      enabledModels: service.enabledModels,
      supportWebSearch: service.supportWebSearch,
      webSearchModels: service.webSearchModels,
      isToolConflict: service.isToolConflict,
    }));
  }

  listLLMProviders(_options: {}): ReturnType<
    AIManager['llmProviderManager']['listLLMProviders']
  > {
    return this.ai.llmProviderManager.listLLMProviders();
  }

  /**
   * The embedding models each enabled service suggests, from its provider's metadata, grouped as the enabled chat
   * models are. A service whose provider has no embedding support is left out.
   */
  async listEmbeddingModels(_options: {}): Promise<EnabledLLMServiceDto[]> {
    const services = await this.ai.llmServiceManager.listLLMServices({
      enabled: true,
    });
    return services.flatMap((service) => {
      const provider = this.ai.llmProviderManager.llmProviders.get(
        service.provider,
      );
      if (!provider?.supportedModel?.includes(SupportedModel.EMBEDDING))
        return [];
      return [
        {
          llmService: service.name,
          llmServiceTitle: service.title,
          provider: service.provider,
          providerTitle: provider.title,
          enabledModels: (
            provider.models?.[SupportedModel.EMBEDDING] ?? []
          ).map((id) => ({ label: id, value: id })),
          supportWebSearch: false,
          isToolConflict: false,
        },
      ];
    });
  }

  async listProviderModels({
    input,
  }: {
    input: ProviderModelListRequest;
  }): Promise<ProviderModelDto[]> {
    const { llmService } = input;
    const service = await this.ai.llmServiceManager.getLLMService(llmService);
    if (!service) throw llmServiceNotFound(llmService);
    const providerMeta = this.ai.llmProviderManager.llmProviders.get(
      service.provider,
    );
    if (!providerMeta) {
      throw preconditionError(
        `LLM service ${llmService} uses provider ${service.provider}, which is not installed.`,
        'LLM_PROVIDER_NOT_FOUND',
      );
    }
    const Provider = providerMeta.provider;
    const provider = new Provider({ serviceOptions: service.options });
    let result: Awaited<ReturnType<typeof provider.listModels>>;
    try {
      result = await provider.listModels();
    } catch (error) {
      throw unavailableError(
        `Failed to load models for LLM service "${llmService}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        'PROVIDER_MODELS_UNAVAILABLE',
        error,
      );
    }
    if (result.errMsg) {
      // The provider refused or failed; whatever status it answered is the provider's, not this request's.
      throw unavailableError(
        `Failed to load models for LLM service "${llmService}": ${result.errMsg}`,
        'PROVIDER_MODELS_UNAVAILABLE',
      );
    }
    const search = input.search?.trim().toLowerCase();
    const seen = new Set<string>();
    return (result.models ?? []).flatMap((model) => {
      const id = typeof model?.id === 'string' ? model.id.trim() : '';
      if (
        !id ||
        seen.has(id) ||
        (search && !id.toLowerCase().includes(search))
      ) {
        return [];
      }
      seen.add(id);
      return [{ id }];
    });
  }
}
