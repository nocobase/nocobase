import type { ApiClient } from '@nocobase/app-client';

import { aiPath, requestAI } from './api-client.js';

export type EnabledModel = { label: string; value: string };
export type EnabledModelsConfig = {
  mode: 'provider' | 'custom';
  models: EnabledModel[];
};
export type LLMProvider = {
  name: string;
  title: string;
  supportedModel: Array<'LLM' | 'EMBEDDING'>;
};
export type LLMService = {
  name: string;
  title: string;
  provider: string;
  enabled: boolean;
  enabledModels: EnabledModelsConfig;
  options?: Record<string, unknown>;
};

export function normalizeEnabledModels(value: unknown): EnabledModelsConfig {
  if (Array.isArray(value))
    return {
      mode: 'custom',
      models: normalizeModels(value),
    };
  if (!value || typeof value !== 'object')
    return { mode: 'provider', models: [] };
  const record = value as { mode?: unknown; models?: unknown };
  if (record.mode !== 'provider' && record.mode !== 'custom') {
    return { mode: 'provider', models: [] };
  }
  return { mode: record.mode, models: normalizeModels(record.models) };
}

function normalizeModels(value: unknown): EnabledModel[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (typeof item === 'string') {
      const model = item.trim();
      if (!model || seen.has(model)) return [];
      seen.add(model);
      return [{ label: model, value: model }];
    }
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as { value?: unknown }).value !== 'string'
    )
      return [];
    const model = item as { label?: unknown; value: string };
    const normalized = model.value.trim();
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [
      {
        label:
          typeof model.label === 'string' && model.label.trim()
            ? model.label.trim()
            : normalized,
        value: normalized,
      },
    ];
  });
}

export function prepareEnabledModels(
  config: EnabledModelsConfig,
): EnabledModelsConfig {
  const seen = new Set<string>();
  const models = config.models.map((model) => {
    const value = model.value.trim();
    if (!value) throw new Error('Model ID is required.');
    if (seen.has(value)) throw new Error(`Duplicate Model ID: ${value}`);
    seen.add(value);
    const label = model.label.trim() || value;
    return { label, value };
  });
  return { mode: config.mode, models };
}

function toLLMService(item: Record<string, unknown>, name = ''): LLMService {
  return {
    name: String(item.name ?? name),
    title: String(item.title ?? item.name ?? name),
    provider: String(item.provider ?? ''),
    enabled: item.enabled !== false,
    enabledModels: normalizeEnabledModels(item.enabledModels),
    options: item.options as Record<string, unknown> | undefined,
  };
}

export async function listLLMServices(api: ApiClient): Promise<LLMService[]> {
  const services = await requestAI<Array<Record<string, unknown>>>(
    api,
    aiPath('aiEmployee', 'llmServices'),
  );
  return services.map((item) => toLLMService(item));
}

export async function listLLMProviders(api: ApiClient): Promise<LLMProvider[]> {
  const providers = await requestAI<Array<Record<string, unknown>>>(
    api,
    aiPath('aiEmployee', 'llmProviders'),
  );
  return providers.map((provider) => ({
    name: String(provider.name ?? ''),
    supportedModel: Array.isArray(provider.supportedModel)
      ? provider.supportedModel.filter(
          (item): item is 'LLM' | 'EMBEDDING' =>
            item === 'LLM' || item === 'EMBEDDING',
        )
      : ['LLM'],
    title: String(provider.title ?? provider.name ?? ''),
  }));
}

export async function updateLLMServiceEnabled(
  api: ApiClient,
  name: string,
  enabled: boolean,
): Promise<LLMService> {
  const service = await requestAI<Record<string, unknown>>(
    api,
    aiPath('aiEmployee', 'llmServices', name, enabled ? 'enable' : 'disable'),
    { method: 'POST' },
  );
  return toLLMService(service, name);
}

export async function updateLLMServiceEnabledModels(
  api: ApiClient,
  name: string,
  enabledModels: EnabledModelsConfig,
): Promise<LLMService> {
  const service = await requestAI<Record<string, unknown>>(
    api,
    aiPath('aiEmployee', 'llmServices', name, 'enabledModels'),
    { method: 'PUT', body: enabledModels },
  );
  return toLLMService(service, name);
}

export async function listProviderModels(
  api: ApiClient,
  llmService: string,
  search?: string,
): Promise<EnabledModel[]> {
  const models = await requestAI<Array<{ id: string }>>(
    api,
    aiPath('aiEmployee', 'llmServices', llmService, 'providerModels'),
    { query: { q: search || undefined } },
  );
  return models.map((model) => ({ label: model.id, value: model.id }));
}
