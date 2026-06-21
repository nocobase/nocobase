/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LLMProvider,
  LLMProviderOptions,
  EmbeddingProvider,
  EmbeddingProviderOptions,
} from '../llm-providers/provider';
import PluginAIServer from '../plugin';
import _ from 'lodash';
import { ToolManager } from './tool-manager';
import type { Model } from '@nocobase/database';
import { getRecommendedModels } from '../../common/recommended-models';

export type LLMProviderMeta = {
  title: string;
  supportedModel?: SupportedModel[];
  models?: Partial<Record<SupportedModel, string[]>>;
  provider: new (opts: LLMProviderOptions) => LLMProvider;
  embedding?: new (opts: EmbeddingProviderOptions) => EmbeddingProvider;
  supportWebSearch?: boolean;
};

export enum SupportedModel {
  LLM = 'LLM',
  EMBEDDING = 'EMBEDDING',
}

export type LLMModelOptions = {
  llmService: string;
  model: string;
  webSearch?: boolean;
};

export type EnabledLLMModel = {
  label: string;
  value: string;
};

export type EnabledLLMService = {
  llmService: string;
  llmServiceTitle: string;
  provider: string;
  providerTitle?: string;
  enabledModels: EnabledLLMModel[];
  supportWebSearch: boolean;
  isToolConflict: boolean;
};

export class AIManager {
  llmProviders = new Map<string, LLMProviderMeta>();
  toolManager = new ToolManager();
  constructor(protected plugin: PluginAIServer) {}

  registerLLMProvider(name: string, meta: LLMProviderMeta) {
    this.llmProviders.set(name, meta);
  }

  listLLMProviders() {
    const providers = this.llmProviders.entries();
    return Array.from(providers).map(([name, { title, supportedModel, supportWebSearch }]) => ({
      name,
      title,
      supportedModel: supportedModel ?? [SupportedModel.LLM],
      supportWebSearch: supportWebSearch ?? false,
    }));
  }

  getSupportedProvider(model: SupportedModel): string[] {
    return Array.from(this.llmProviders.entries())
      .filter(([_, { supportedModel }]) => supportedModel && supportedModel.includes(model))
      .map(([name]) => name);
  }

  async listAllEnabledModels(): Promise<EnabledLLMService[]> {
    const services = await this.plugin.db.getRepository('llmServices').find({ sort: 'sort' });
    return services
      .filter((service) => service.enabled !== false)
      .map((service) => this.toEnabledLLMService(service))
      .filter(Boolean);
  }

  async resolveModel(model?: LLMModelOptions | null): Promise<LLMModelOptions> {
    if (model?.llmService && model?.model) {
      return model;
    }

    const services = await this.listAllEnabledModels();
    const service = services.find((service) => service.enabledModels.length);
    const firstModel = service?.enabledModels[0]?.value;
    if (service?.llmService && firstModel) {
      return {
        llmService: service.llmService,
        model: firstModel,
      };
    }

    throw new Error('LLM service not configured');
  }

  private toEnabledLLMService(service: Model): EnabledLLMService | null {
    const provider = service.get?.('provider') || (service as any).provider;
    const providerMeta = this.llmProviders.get(provider);
    if (!providerMeta) {
      return null;
    }

    const enabledModels = this.getEnabledModels(service);
    if (!enabledModels.length) {
      return null;
    }

    const Provider = providerMeta.provider;
    const providerClient = new Provider({ app: this.plugin.app });
    return {
      llmService: service.get?.('name') || (service as any).name,
      llmServiceTitle: service.get?.('title') || (service as any).title,
      provider,
      providerTitle: providerMeta.title,
      enabledModels,
      supportWebSearch: providerMeta.supportWebSearch ?? false,
      isToolConflict: providerClient.isToolConflict(),
    };
  }

  private getEnabledModels(service: Model): EnabledLLMModel[] {
    const provider = service.get?.('provider') || (service as any).provider;
    const raw = service.get?.('enabledModels') || (service as any).enabledModels;

    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.mode) {
      if (raw.mode === 'recommended') {
        return getRecommendedModels(provider);
      }
      return (raw.models || [])
        .filter((model: { value: string }) => model.value)
        .map((model: { label?: string; value: string }) => ({
          label: model.label || model.value,
          value: model.value,
        }));
    }

    if (Array.isArray(raw)) {
      if (!raw.length) {
        return getRecommendedModels(provider);
      }
      return raw.map((id: string) => ({ label: id, value: id }));
    }

    return getRecommendedModels(provider);
  }

  async getLLMService(options: LLMModelOptions) {
    const { llmService, model, webSearch } = options ?? {};

    // model is required - it's set by the frontend ModelSwitcher
    if (!llmService || !model) {
      throw new Error('LLM service not configured');
    }

    // Build model options from model
    const modelOptions: Record<string, any> = {
      llmService,
      model,
    };

    if (webSearch === true) {
      modelOptions.builtIn = { webSearch: true };
    }

    const service = await this.plugin.db.getRepository('llmServices').findOne({
      filter: {
        name: llmService,
      },
    });

    if (!service) {
      throw new Error('LLM service not found');
    }

    const providerOptions = this.llmProviders.get(service.provider);
    if (!providerOptions) {
      throw new Error('LLM service provider not found');
    }

    const Provider = providerOptions.provider;
    const provider = new Provider({
      app: this.plugin.app,
      serviceOptions: service.options,
      modelOptions,
    });

    return { provider, model, service };
  }
}
