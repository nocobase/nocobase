import type { ApiClient } from '@nocobase/app-client';

import { aiPath, requestAI } from './api-client.js';

export interface AIEmployeeModelRef {
  llmService: string;
  model: string;
}

export interface AIEmployeeModelSettings extends Record<string, unknown> {
  enabled?: boolean;
  llmService?: string;
  model?: string;
  models?: AIEmployeeModelRef[];
}

export interface AIEmployeeKnowledgeBaseSettings extends Record<
  string,
  unknown
> {
  knowledgeBaseKeys?: string[];
  topK?: number;
  score?: number;
  retrievalStrategy?: 'always' | 'onDemand';
}

export interface AIEmployeeToolSetting extends Record<string, unknown> {
  name: string;
  autoCall?: boolean;
}

export interface AIEmployeeRecord extends Record<string, unknown> {
  username: string;
  nickname?: string;
  position?: string;
  avatar?: string;
  bio?: string;
  greeting?: string;
  about?: string | null;
  defaultPrompt?: string | null;
  enabled?: boolean;
  builtIn?: boolean;
  deprecated?: boolean;
  category?: string;
  modelSettings?: AIEmployeeModelSettings;
  enableKnowledgeBase?: boolean;
  knowledgeBasePrompt?: string | null;
  knowledgeBase?: AIEmployeeKnowledgeBaseSettings;
  missingKnowledgeBaseKeys?: string[];
  skillSettings?: {
    enabledSkills?: string[] | null;
    enabledTools?: string[] | null;
    skills?: string[];
    tools?: AIEmployeeToolSetting[];
  };
}

export interface EnabledModelOption extends AIEmployeeModelRef {
  label: string;
  serviceTitle: string;
}

export interface KnowledgeBaseOption {
  key: string;
  name: string;
  enabled: boolean;
}

export interface AIMetadataItem {
  name: string;
  i18n?: { namespace: string };
  title?: string;
  description?: string;
  about?: string;
  scope?: string;
  from?: string;
  defaultPermission?: string;
  tools?: string[];
}

export interface AIEmployeeEditableValues {
  enabled: boolean;
  about: string | null;
  modelSettings: AIEmployeeModelSettings;
  skillSettings: {
    enabledSkills?: string[] | null;
    enabledTools?: string[] | null;
    skills: string[];
    tools: AIEmployeeToolSetting[];
  };
  enableKnowledgeBase: boolean;
  knowledgeBasePrompt: string;
  knowledgeBase: AIEmployeeKnowledgeBaseSettings;
}

export function hasKnowledgeBaseDataPlaceholder(value: string): boolean {
  return value.includes('{knowledgeBaseData}');
}

export function buildEditableValues(
  employee: AIEmployeeRecord,
): AIEmployeeEditableValues {
  return {
    enabled: employee.enabled !== false,
    about: employee.about ?? null,
    modelSettings: { ...(employee.modelSettings ?? {}) },
    skillSettings: {
      ...(employee.skillSettings?.enabledSkills !== undefined
        ? {
            enabledSkills:
              employee.skillSettings.enabledSkills === null
                ? null
                : [...employee.skillSettings.enabledSkills],
          }
        : {}),
      ...(employee.skillSettings?.enabledTools !== undefined
        ? {
            enabledTools:
              employee.skillSettings.enabledTools === null
                ? null
                : [...employee.skillSettings.enabledTools],
          }
        : {}),
      skills: [...(employee.skillSettings?.skills ?? [])],
      tools: (employee.skillSettings?.tools ?? []).map((tool) => ({ ...tool })),
    },
    enableKnowledgeBase: employee.enableKnowledgeBase === true,
    knowledgeBasePrompt: employee.knowledgeBasePrompt ?? '',
    knowledgeBase: {
      ...(employee.knowledgeBase ?? {}),
      retrievalStrategy:
        employee.knowledgeBase?.retrievalStrategy === 'onDemand'
          ? 'onDemand'
          : 'always',
    },
  };
}

export function buildAIEmployeeUpdatePayload(
  employee: AIEmployeeRecord,
  editable: AIEmployeeEditableValues,
): AIEmployeeEditableValues {
  return {
    enabled: editable.enabled,
    about: editable.about,
    modelSettings: {
      ...(employee.modelSettings ?? {}),
      ...editable.modelSettings,
    },
    skillSettings: {
      ...(editable.skillSettings.enabledSkills !== undefined
        ? {
            enabledSkills:
              editable.skillSettings.enabledSkills === null
                ? null
                : [...editable.skillSettings.enabledSkills],
          }
        : {}),
      ...(editable.skillSettings.enabledTools !== undefined
        ? {
            enabledTools:
              editable.skillSettings.enabledTools === null
                ? null
                : [...editable.skillSettings.enabledTools],
          }
        : {}),
      skills: [...editable.skillSettings.skills],
      tools: editable.skillSettings.tools.map((tool) => ({ ...tool })),
    },
    enableKnowledgeBase: editable.enableKnowledgeBase,
    knowledgeBasePrompt: editable.knowledgeBasePrompt,
    knowledgeBase: {
      ...(employee.knowledgeBase ?? {}),
      ...editable.knowledgeBase,
      knowledgeBaseKeys: editable.knowledgeBase.knowledgeBaseKeys ?? [],
    },
  };
}

export async function listAIEmployees(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<AIEmployeeRecord[]> {
  const employees = await requestAI<AIEmployeeRecord[]>(
    api,
    aiPath('aiEmployees'),
    { signal },
  );
  return employees.filter((employee) => !employee.deprecated);
}

export function getAIEmployee(
  api: ApiClient,
  username: string,
  signal?: AbortSignal,
): Promise<AIEmployeeRecord> {
  return requestAI<AIEmployeeRecord>(api, aiPath('aiEmployees', username), {
    signal,
  });
}

export function updateAIEmployee(
  api: ApiClient,
  employee: AIEmployeeRecord,
  editable: AIEmployeeEditableValues,
): Promise<AIEmployeeRecord> {
  return requestAI<AIEmployeeRecord>(
    api,
    aiPath('aiEmployees', employee.username),
    {
      method: 'PATCH',
      body: buildAIEmployeeUpdatePayload(employee, editable),
    },
  );
}

interface EnabledLLMService {
  llmService: string;
  llmServiceTitle?: string;
  enabledModels?: Array<{ label?: string; value: string }>;
}

export async function listEnabledModels(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<EnabledModelOption[]> {
  const services = await requestAI<EnabledLLMService[]>(
    api,
    aiPath('aiEmployee', 'models'),
    { signal },
  );
  return services.flatMap((service) =>
    (service.enabledModels ?? []).map((model) => ({
      llmService: service.llmService,
      model: model.value,
      label: model.label ?? model.value,
      serviceTitle: service.llmServiceTitle ?? service.llmService,
    })),
  );
}

/**
 * The enabled knowledge bases an employee may use. They belong to the commercial knowledge base plugin, which serves
 * them at `/api/aiKnowledgeBases`; without that plugin the request fails, and the page offers none.
 */
export async function listEnabledKnowledgeBases(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<KnowledgeBaseOption[]> {
  const items = await requestAI<Array<Record<string, unknown>>>(
    api,
    aiPath('aiKnowledgeBases'),
    { query: { pageSize: 100 }, signal },
  );
  // Only a real `true` counts as enabled: a knowledge base whose flag is missing or not a boolean is not offered.
  return (Array.isArray(items) ? items : []).flatMap((item) =>
    typeof item.key === 'string' && item.enabled === true
      ? [
          {
            key: item.key,
            name: String(item.name ?? item.key),
            enabled: true,
          },
        ]
      : [],
  );
}

interface ManagedMetadataItem {
  name: string;
  i18n?: { namespace: string };
  title: string;
  description: string;
  about: string;
  scope: string;
  source: string;
  defaultPermission?: string;
  tools?: Array<{ name: string }>;
}

async function listMetadata(
  api: ApiClient,
  resource: 'skills' | 'tools',
  signal?: AbortSignal,
): Promise<AIMetadataItem[]> {
  const items = await requestAI<ManagedMetadataItem[]>(
    api,
    aiPath('aiEmployee', resource),
    { signal },
  );
  return items.map((item) => ({
    name: item.name,
    i18n:
      typeof item.i18n?.namespace === 'string'
        ? { namespace: item.i18n.namespace }
        : undefined,
    title: item.title,
    description: item.description,
    about: item.about || undefined,
    scope: item.scope,
    from: item.source,
    ...(resource === 'tools'
      ? { defaultPermission: item.defaultPermission }
      : { tools: (item.tools ?? []).map((tool) => tool.name) }),
  }));
}

export const listAISkills = (
  api: ApiClient,
  signal?: AbortSignal,
): Promise<AIMetadataItem[]> => listMetadata(api, 'skills', signal);
export const listAITools = (
  api: ApiClient,
  signal?: AbortSignal,
): Promise<AIMetadataItem[]> => listMetadata(api, 'tools', signal);
