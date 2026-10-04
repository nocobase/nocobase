import {
  normalizeEnabledModelsConfig,
  type LLMServiceEntity,
  type LLMServiceOptions as LLMServiceRegistration,
} from '@nocobase/ai-employee';
import type { AIManager } from '@nocobase/ai-employee';
import type { EnabledModelsInput } from '../route/schemas.js';
import type { LLMServiceDto } from '../types.js';
import { notFound, redactSecrets } from './utils.js';

export function llmServiceNotFound(name: string): Error {
  return notFound(
    'LLM_SERVICE_NOT_FOUND',
    `LLM service ${name} was not found.`,
  );
}

export interface LLMServiceOptions {
  readonly ai: AIManager;
}

export class LLMService {
  private readonly ai: AIManager;

  public constructor({ ai }: LLMServiceOptions) {
    this.ai = ai;
  }
  async list(_options: {}): Promise<LLMServiceDto[]> {
    return (await this.ai.llmServiceManager.listLLMServices()).map(
      serializeLLMService,
    );
  }

  async get({ name }: { name: string }): Promise<LLMServiceDto> {
    const service = await this.ai.llmServiceManager.getLLMService(name);
    if (!service) throw llmServiceNotFound(name);
    return serializeLLMService(service);
  }

  async setEnabled({
    name,
    enabled,
  }: {
    name: string;
    enabled: boolean;
  }): Promise<LLMServiceDto> {
    return this.patch(name, { enabled });
  }

  async updateEnabledModels({
    name,
    enabledModels,
  }: {
    name: string;
    enabledModels: EnabledModelsInput;
  }): Promise<LLMServiceDto> {
    return this.patch(name, {
      enabledModels: normalizeEnabledModelsConfig(enabledModels),
    });
  }

  // Changes one field of a configured service and keeps the rest as stored.
  private async patch(
    name: string,
    values: Pick<LLMServiceRegistration, 'enabled' | 'enabledModels'>,
  ): Promise<LLMServiceDto> {
    const current = await this.ai.llmServiceManager.getLLMService(name);
    if (!current) throw llmServiceNotFound(name);
    await this.ai.llmServiceManager.registerLLMService({
      name,
      provider: current.provider,
      ...values,
    });
    return this.get({ name });
  }
}

function serializeLLMService(value: LLMServiceEntity): LLMServiceDto {
  return {
    name: value.name,
    title: value.title,
    provider: value.provider,
    options: redactSecrets(value.options) as Record<string, unknown>,
    enabledModels: normalizeEnabledModelsConfig(value.enabledModels),
    enabled: value.enabled,
    modelOptions: value.modelOptions,
    sort: value.sort,
  };
}
