import type { ApiClient } from '@nocobase/app-client';

import { requestAIAction } from './api-client.js';

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

function dataOf(value: unknown): unknown {
  if (value && typeof value === 'object' && 'data' in value) return value.data;
  return value;
}

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

export async function listLLMServices(api: ApiClient): Promise<LLMService[]> {
  const response = await requestAIAction<unknown>(api, 'llmServices', 'list', {
    method: 'GET',
  });
  const value = dataOf(response);
  return (Array.isArray(value) ? value : [])
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object'),
    )
    .map((item) => ({
      name: String(item.name ?? ''),
      title: String(item.title ?? item.name ?? ''),
      provider: String(item.provider ?? ''),
      enabled: item.enabled !== false,
      enabledModels: normalizeEnabledModels(item.enabledModels),
      options: item.options as Record<string, unknown> | undefined,
    }));
}

export async function listLLMProviders(api: ApiClient): Promise<LLMProvider[]> {
  const response = await requestAIAction<unknown>(
    api,
    'ai',
    'listLLMProviders',
    { method: 'GET' },
  );
  const value = dataOf(response);
  return (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const provider = item as Record<string, unknown>;
    return [
      {
        name: String(provider.name ?? ''),
        supportedModel: Array.isArray(provider.supportedModel)
          ? provider.supportedModel.filter(
              (item): item is 'LLM' | 'EMBEDDING' =>
                item === 'LLM' || item === 'EMBEDDING',
            )
          : ['LLM'],
        title: String(provider.title ?? provider.name ?? ''),
      },
    ];
  });
}

export function updateLLMServiceEnabled(
  api: ApiClient,
  name: string,
  enabled: boolean,
): Promise<LLMService> {
  return updateLLMServiceField(api, 'updateEnabled', { name, enabled });
}

export function updateLLMServiceEnabledModels(
  api: ApiClient,
  name: string,
  enabledModels: EnabledModelsConfig,
): Promise<LLMService> {
  return updateLLMServiceField(api, 'updateEnabledModels', {
    name,
    enabledModels,
  });
}

async function updateLLMServiceField(
  api: ApiClient,
  action: 'updateEnabled' | 'updateEnabledModels',
  body: { name: string } & Record<string, unknown>,
): Promise<LLMService> {
  const response = await requestAIAction<unknown>(api, 'llmServices', action, {
    method: 'POST',
    body,
  });
  const value = dataOf(response);
  if (!value || typeof value !== 'object')
    throw new Error('LLM service response is invalid.');
  const item = value as Record<string, unknown>;
  return {
    name: String(item.name ?? body.name),
    title: String(item.title ?? body.name),
    provider: String(item.provider ?? ''),
    enabled: item.enabled !== false,
    enabledModels: normalizeEnabledModels(item.enabledModels),
    options: item.options as Record<string, unknown> | undefined,
  };
}

export async function listProviderModels(
  api: ApiClient,
  llmService: string,
  search?: string,
): Promise<EnabledModel[]> {
  const response = await requestAIAction<unknown>(
    api,
    'ai',
    'listProviderModels',
    {
      method: 'POST',
      body: { llmService, search },
    },
  );
  const value = dataOf(response);
  return (Array.isArray(value) ? value : []).flatMap((item) =>
    typeof item === 'object' &&
    item &&
    typeof (item as { id?: unknown }).id === 'string'
      ? [
          {
            label: (item as { id: string }).id,
            value: (item as { id: string }).id,
          },
        ]
      : [],
  );
}
