/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import { arrayMove } from '@dnd-kit/sortable';
import { css } from '@emotion/css';
import { EnvVariableInput, Table, useApp } from '@nocobase/client-v2';
import type { APIClient } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useLocation } from 'react-router-dom';
import { getRecommendedModels, isRecommendedModel } from '../../common/recommended-models';
import type { LLMProviderOptions } from '../manager/ai-manager';
import { formatModelLabel } from '../llm-services/model-label';
import { useT } from '../locale';
import { useAIConfigRepository } from '../repositories/hooks/useAIConfigRepository';
import { RemoteSelect } from '../components/RemoteSelect';
import { AI_SETTINGS_DRAWER_WIDTH } from './drawerWidth';
import { useUnsavedChangesBeforeClose } from './useUnsavedChangesBeforeClose';

type APIClientLike = Pick<APIClient, 'resource'>;
type ResourceAction = (params?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
type APIResponse = {
  data?: {
    data?: unknown;
    count?: unknown;
  };
};
export type ProviderOption = {
  key: string;
  value: string;
  label: string;
  supportedModel: string[];
};
type ModelOption = {
  label: string;
  value: string;
};
export type EnabledModelsConfig = {
  mode: 'recommended' | 'provider' | 'custom';
  models: ModelOption[];
};
export type LLMServiceRecord = {
  name: string;
  title?: string;
  provider?: string;
  options?: Record<string, unknown>;
  enabledModels?: EnabledModelsConfig | string[] | null;
  enabled?: boolean;
  modelOptions?: Record<string, unknown>;
};
export type LLMServiceFormValues = LLMServiceRecord;
type LLMServicesListResult = {
  data: LLMServiceRecord[];
  total?: number;
};
type AIPluginLike = {
  aiManager?: {
    llmProviders?: Map<string, LLMProviderOptions>;
  };
};

const LLM_SERVICE_SORT_FIELD = 'sort';
const PROVIDER_SELECT_LIST_HEIGHT = 400;

const fillHeightTableClassName = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .ant-spin-nested-loading,
  .ant-spin-container,
  .ant-table,
  .ant-table-container {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ant-table-content {
    flex: 1;
    min-height: 0;
  }

  .ant-table-body {
    flex: 1;
    min-height: 0;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
  }

  .ant-pagination {
    flex: 0 0 auto;
  }
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isResourceAction = (value: unknown): value is ResourceAction => typeof value === 'function';

const readResponseData = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return undefined;
  }
  return (response as APIResponse).data?.data;
};

const readResponseCount = (response: unknown): number | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }
  const count = (response as APIResponse).data?.count;
  return typeof count === 'number' ? count : undefined;
};

const callResourceAction = async (
  apiClient: APIClientLike,
  resourceName: string,
  actionName: string,
  params?: Record<string, unknown>,
  options?: Record<string, unknown>,
): Promise<unknown> => {
  const resource = apiClient.resource(resourceName) as Record<string, unknown>;
  const action = resource[actionName];
  if (!isResourceAction(action)) {
    throw new Error(`Missing resource action: ${resourceName}.${actionName}`);
  }
  return action(params, options);
};

const isLLMServiceRecord = (value: unknown): value is LLMServiceRecord =>
  isRecord(value) && typeof value.name === 'string';

const isProviderItem = (value: unknown): value is { name: string; title?: string; supportedModel?: string[] } =>
  isRecord(value) && typeof value.name === 'string';

const isModelItem = (value: unknown): value is { id: string } => isRecord(value) && typeof value.id === 'string';

export const normalizeEnabledModels = (value: unknown): EnabledModelsConfig => {
  if (!value) {
    return { mode: 'recommended', models: [] };
  }
  if (isRecord(value) && typeof value.mode === 'string' && Array.isArray(value.models)) {
    const mode = ['recommended', 'provider', 'custom'].includes(value.mode) ? value.mode : 'recommended';
    return {
      mode: mode as EnabledModelsConfig['mode'],
      models: value.models.filter(isRecord).map((model) => ({
        label: typeof model.label === 'string' ? model.label : String(model.value ?? ''),
        value: typeof model.value === 'string' ? model.value : String(model.label ?? ''),
      })),
    };
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return { mode: 'recommended', models: [] };
    }
    return {
      mode: 'custom',
      models: value
        .filter((item): item is string => typeof item === 'string')
        .map((model) => ({ label: model, value: model })),
    };
  }
  return { mode: 'recommended', models: [] };
};

export async function listLLMServices(apiClient: APIClientLike): Promise<LLMServicesListResult> {
  const response = await callResourceAction(apiClient, 'llmServices', 'list', {
    sort: [LLM_SERVICE_SORT_FIELD],
  });
  const data = readResponseData(response);
  return {
    data: Array.isArray(data) ? data.filter(isLLMServiceRecord) : [],
    total: readResponseCount(response),
  };
}

export async function createLLMService(apiClient: APIClientLike, values: LLMServiceFormValues) {
  await callResourceAction(apiClient, 'llmServices', 'create', {
    values,
  });
}

export async function updateLLMService(apiClient: APIClientLike, values: LLMServiceFormValues) {
  if (!values.name) {
    throw new Error('Missing LLM service name.');
  }
  await callResourceAction(apiClient, 'llmServices', 'update', {
    values,
    filterByTk: values.name,
  });
}

export async function deleteLLMService(apiClient: APIClientLike, name: string) {
  await callResourceAction(apiClient, 'llmServices', 'destroy', {
    filterByTk: name,
  });
}

export async function deleteLLMServices(apiClient: APIClientLike, names: string[]) {
  await callResourceAction(apiClient, 'llmServices', 'destroy', {
    filterByTk: names,
  });
}

export async function updateLLMServiceEnabled(apiClient: APIClientLike, name: string, enabled: boolean) {
  await callResourceAction(apiClient, 'llmServices', 'update', {
    values: { enabled },
    filterByTk: name,
  });
}

export async function moveLLMService(apiClient: APIClientLike, sourceName: string, targetName: string) {
  await callResourceAction(apiClient, 'llmServices', 'move', {
    sourceId: sourceName,
    targetId: targetName,
    sortField: LLM_SERVICE_SORT_FIELD,
  });
}

export async function listLLMProviders(
  apiClient: APIClientLike,
  compileLabel: (value: string) => string,
): Promise<ProviderOption[]> {
  const response = await callResourceAction(apiClient, 'ai', 'listLLMProviders');
  const data = readResponseData(response);
  return Array.isArray(data)
    ? data.filter(isProviderItem).map((provider) => ({
        key: provider.name,
        value: provider.name,
        label: compileLabel(provider.title || provider.name),
        supportedModel: Array.isArray(provider.supportedModel) ? provider.supportedModel : [],
      }))
    : [];
}

export async function listProviderModels(
  apiClient: APIClientLike,
  values: { provider: string; options?: Record<string, unknown>; model?: string },
): Promise<string[]> {
  const response = await callResourceAction(
    apiClient,
    'ai',
    'listProviderModels',
    {
      values,
    },
    { skipNotify: true },
  );
  const data = readResponseData(response);
  return Array.isArray(data) ? data.filter(isModelItem).map((item) => item.id) : [];
}

export async function testLLMServiceFlight(
  apiClient: APIClientLike,
  values: { provider: string; options?: Record<string, unknown>; model: string },
): Promise<{ code?: number; message?: string }> {
  const response = await callResourceAction(apiClient, 'ai', 'testFlight', {
    values,
  });
  const data = readResponseData(response);
  return isRecord(data)
    ? {
        code: typeof data.code === 'number' ? data.code : undefined,
        message: typeof data.message === 'string' ? data.message : undefined,
      }
    : {};
}

const getProviderSortIndex = (value: string) => {
  const sortOrder = [
    'google-genai',
    'openai',
    'anthropic',
    'deepseek',
    'dashscope',
    'kimi',
    'openai-completions',
    'ollama',
  ];
  const index = sortOrder.indexOf(value);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
};

const getProviderDescription = (provider: string, t: ReturnType<typeof useT>) => {
  const descriptions: Record<string, string> = {
    'google-genai': 'Gemini',
    openai: 'GPT',
    'openai-completions': 'Recommended for third-party OpenAI-compatible APIs (OpenRouter, Groq, Together AI, etc.)',
    anthropic: 'Claude',
    deepseek: 'DeepSeek',
    dashscope: 'Qwen (Tongyi)',
    kimi: 'Kimi',
    gigachat: 'GigaChat by Sber',
    xai: 'Grok models by xAI',
    ollama: 'Local models',
    mimo: 'Xiaomi MIMO',
  };
  return descriptions[provider] ? t(descriptions[provider]) : '';
};

const getProviderOptions = (app: ReturnType<typeof useApp>, provider?: string) => {
  const plugin = app.pm.get('ai') as AIPluginLike | undefined;
  return provider && plugin?.aiManager?.llmProviders ? plugin.aiManager.llmProviders.get(provider) : undefined;
};

const labelWithColon = (label: string) => `${label}:`;

export const getInitialLLMServiceFormValues = (): LLMServiceFormValues => ({
  name: randomId('v_'),
  enabled: true,
  enabledModels: {
    mode: 'recommended',
    models: [],
  },
});

export const shouldAutoOpenAddNew = (state: unknown): state is { autoOpenAddNew: true } =>
  isRecord(state) && state.autoOpenAddNew === true;

const ProviderSelect: React.FC<{
  providers: ProviderOption[];
  value?: string;
  onChange?: (value: string) => void;
}> = ({ providers, value, onChange }) => {
  const t = useT();
  const options = useMemo(
    () =>
      [...providers]
        .sort((a, b) => getProviderSortIndex(a.value) - getProviderSortIndex(b.value))
        .map((provider) => {
          const capabilities = [
            provider.supportedModel.includes('LLM') ? 'LLM' : null,
            provider.supportedModel.includes('EMBEDDING') ? 'EMBEDDING' : null,
          ].filter((item): item is string => !!item);
          return {
            value: provider.value,
            selectedLabel: provider.label,
            label: (
              <Flex vertical gap="small">
                <Typography.Text strong>{provider.label}</Typography.Text>
                <Flex align="center" justify="space-between" gap="small">
                  <Typography.Text type="secondary">{getProviderDescription(provider.value, t)}</Typography.Text>
                  <Space size="small" wrap>
                    {capabilities.map((capability) => (
                      <Tag key={capability} bordered={false} color="default">
                        {capability}
                      </Tag>
                    ))}
                  </Space>
                </Flex>
              </Flex>
            ),
          };
        }),
    [providers, t],
  );
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      optionLabelProp="selectedLabel"
      style={{ width: '100%' }}
      listHeight={PROVIDER_SELECT_LIST_HEIGHT}
    />
  );
};

const ProviderDisplay: React.FC<{ provider?: string; providers: ProviderOption[] }> = ({ provider, providers }) => {
  return <span>{providers.find((item) => item.value === provider)?.label || provider}</span>;
};

const EnabledModelsInput: React.FC<{
  value?: EnabledModelsConfig | string[] | null;
  onChange?: (value: EnabledModelsConfig) => void;
}> = ({ value, onChange }) => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const form = Form.useFormInstance<LLMServiceFormValues>();
  const provider = Form.useWatch('provider', form);
  const providerOptions = Form.useWatch('options', form);
  const providerKey = typeof provider === 'string' ? provider : '';
  const pluginProvider = getProviderOptions(app, providerKey);
  const labelFormatter = pluginProvider?.formatModelLabel || formatModelLabel;
  const config = normalizeEnabledModels(value);
  const hasRecommended = !!providerKey && getRecommendedModels(providerKey).length > 0;
  const enabledModelsIndent = token.paddingLG + token.paddingSM;
  const customModelInputWidth = token.controlHeight * 7 + token.paddingXXS;
  const modelsCache = useRef<Record<EnabledModelsConfig['mode'], ModelOption[]>>({
    recommended: [],
    provider: [],
    custom: [],
  });

  useEffect(() => {
    modelsCache.current[config.mode] = config.models;
  }, [config.mode, config.models]);

  useEffect(() => {
    if (!providerKey) {
      return;
    }
    if (!hasRecommended && config.mode === 'recommended') {
      onChange?.({ mode: 'provider', models: modelsCache.current.provider || [] });
    }
  }, [config.mode, hasRecommended, onChange, providerKey]);

  const loadProviderModelOptions = async (search?: string): Promise<ModelOption[]> => {
    if (!providerKey) {
      return [];
    }
    try {
      const models = await listProviderModels(app.apiClient, {
        provider: providerKey,
        options: isRecord(providerOptions) ? providerOptions : {},
        model: search,
      });
      return models
        .map((model) => ({
          label: labelFormatter(model),
          value: model,
        }))
        .sort((a, b) => {
          const aRecommended = isRecommendedModel(providerKey, a.value);
          const bRecommended = isRecommendedModel(providerKey, b.value);
          if (aRecommended && !bRecommended) {
            return -1;
          }
          if (!aRecommended && bRecommended) {
            return 1;
          }
          return 0;
        });
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('Failed to fetch models'));
      return [];
    }
  };

  const changeMode = (mode: EnabledModelsConfig['mode']) => {
    modelsCache.current[config.mode] = config.models;
    onChange?.({ mode, models: modelsCache.current[mode] || [] });
  };
  const changeModels = (models: ModelOption[]) => {
    onChange?.({ mode: config.mode, models });
  };

  return (
    <Radio.Group value={config.mode} onChange={(event) => changeMode(event.target.value)} style={{ width: '100%' }}>
      <Flex vertical gap="middle" style={{ width: '100%' }}>
        {hasRecommended ? (
          <>
            <Radio value="recommended">{t('Recommended models')}</Radio>
            {config.mode === 'recommended' ? (
              <Typography.Text type="secondary" style={{ paddingInlineStart: enabledModelsIndent }}>
                {`${t('Use recommended models:')} ${getRecommendedModels(providerKey)
                  .map((model) => model.label)
                  .join(', ')}`}
              </Typography.Text>
            ) : null}
          </>
        ) : null}
        <Radio value="provider">{t('Select models')}</Radio>
        {config.mode === 'provider' ? (
          <div style={{ paddingInlineStart: enabledModelsIndent, width: '100%' }}>
            <RemoteSelect<string[]>
              mode="multiple"
              request={loadProviderModelOptions}
              popupMatchSelectWidth
              placeholder={t('Select models to enable')}
              style={{ width: '100%' }}
              optionRender={(option) => {
                const recommended = isRecommendedModel(providerKey, String(option.value));
                return (
                  <Space>
                    <span>{option.label}</span>
                    {recommended ? <Tag color="blue">{t('Recommended')}</Tag> : null}
                  </Space>
                );
              }}
              value={config.models.map((model) => model.value)}
              onChange={(selectedValues: string[]) => {
                changeModels(
                  selectedValues.map((model) => ({
                    value: model,
                    label: labelFormatter(model),
                  })),
                );
              }}
            />
          </div>
        ) : null}
        <Radio value="custom">{t('Manual input')}</Radio>
        {config.mode === 'custom' ? (
          <Flex vertical gap="small" style={{ paddingInlineStart: enabledModelsIndent }}>
            {config.models.map((model, index) => (
              <Flex key={`${model.value}:${index}`} gap="small" align="baseline">
                <Input
                  placeholder={t('Model id')}
                  style={{ width: customModelInputWidth }}
                  value={model.value}
                  onChange={(event) => {
                    const nextModels = [...config.models];
                    nextModels[index] = { ...nextModels[index], value: event.target.value };
                    changeModels(nextModels);
                  }}
                />
                <Input
                  placeholder={t('Display name')}
                  style={{ width: customModelInputWidth }}
                  value={model.label}
                  onChange={(event) => {
                    const nextModels = [...config.models];
                    nextModels[index] = { ...nextModels[index], label: event.target.value };
                    changeModels(nextModels);
                  }}
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label={t('Delete')}
                  onClick={() => changeModels(config.models.filter((_, currentIndex) => currentIndex !== index))}
                />
              </Flex>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
              onClick={() => changeModels([...config.models, { label: '', value: '' }])}
            >
              {t('Add model')}
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </Radio.Group>
  );
};

const ProviderSettingsForm: React.FC = () => {
  const app = useApp();
  const form = Form.useFormInstance<LLMServiceFormValues>();
  const provider = Form.useWatch('provider', form);
  const providerKey = typeof provider === 'string' ? provider : '';
  const Component = getProviderOptions(app, providerKey)?.components?.ProviderSettingsForm;
  return Component ? <Component key={providerKey} /> : null;
};

export const LLMServiceForm: React.FC<{
  editing: boolean;
  providers: ProviderOption[];
}> = ({ editing, providers }) => {
  const t = useT();
  const form = Form.useFormInstance<LLMServiceFormValues>();
  const provider = Form.useWatch('provider', form);
  const providerKey = typeof provider === 'string' ? provider : '';
  const selectedProvider = providers.find((item) => item.value === providerKey);

  useEffect(() => {
    if (!editing && selectedProvider && !form.isFieldTouched('title')) {
      form.setFieldValue('title', selectedProvider.label);
    }
  }, [editing, form, selectedProvider]);

  return (
    <>
      <Form.Item name="name" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        name="provider"
        label={labelWithColon(t('Provider'))}
        rules={editing ? undefined : [{ required: true }]}
      >
        {editing ? (
          <ProviderDisplay providers={providers} provider={providerKey} />
        ) : (
          <ProviderSelect providers={providers} />
        )}
      </Form.Item>
      {editing || providerKey ? (
        <Form.Item name="title" label={labelWithColon(t('Title'))}>
          <Input />
        </Form.Item>
      ) : null}
      {providerKey ? <ProviderSettingsForm /> : null}
      {providerKey ? (
        <Form.Item name={['options', 'baseURL']} label={labelWithColon(t('Base URL'))}>
          <EnvVariableInput placeholder={t('Base URL is optional, leave blank to use default (recommended)')} />
        </Form.Item>
      ) : null}
      {providerKey ? (
        <Form.Item name="enabledModels" label={labelWithColon(t('Enabled Models'))}>
          <EnabledModelsInput />
        </Form.Item>
      ) : null}
    </>
  );
};

export const LLMTestFlightButton: React.FC<{ form: FormInstance<LLMServiceFormValues> }> = ({ form }) => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    const values = form.getFieldsValue(true);
    const provider = values.provider;
    if (!provider) {
      message.warning(t('Please select a provider first'));
      return;
    }
    if (provider !== 'ollama' && !values.options?.apiKey) {
      message.warning(t('Please fill in the API Key first'));
      return;
    }
    const config = normalizeEnabledModels(values.enabledModels);
    const model = config.mode === 'recommended' ? getRecommendedModels(provider)[0]?.value : config.models[0]?.value;
    if (!model) {
      message.warning(t('Please configure enabled models first'));
      return;
    }
    setLoading(true);
    try {
      const result = await testLLMServiceFlight(app.apiClient, {
        provider,
        options: values.options,
        model,
      });
      if (result.code !== 0) {
        message.error(result.message || t('Failure'));
        return;
      }
      message.success(t('Successful'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('Failure'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={t('Test connection with the configured API Key')}>
      <Button icon={<RocketOutlined />} loading={loading} onClick={handleTest}>
        {t('Test flight')}
      </Button>
    </Tooltip>
  );
};

const EnabledSwitch: React.FC<{
  record: LLMServiceRecord;
  onUpdated: () => Promise<void>;
}> = ({ record, onUpdated }) => {
  const app = useApp();
  const repo = useAIConfigRepository();
  const [loading, setLoading] = useState(false);

  const handleChange = async (enabled: boolean) => {
    setLoading(true);
    try {
      await updateLLMServiceEnabled(app.apiClient, record.name, enabled);
      await onUpdated();
      await repo.refreshLLMServices();
    } finally {
      setLoading(false);
    }
  };

  return <Switch size="small" checked={record.enabled !== false} loading={loading} onChange={handleChange} />;
};

export const LLMServicesPage: React.FC = () => {
  const app = useApp();
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const location = useLocation();
  const { message } = App.useApp();
  const repo = useAIConfigRepository();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [services, setServices] = useState<LLMServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const autoOpenHandledRef = useRef(false);
  const tRef = useRef(t);
  const actionLinkStyle = useMemo<React.CSSProperties>(
    () => ({
      color: token.colorPrimary,
      marginInline: -token.paddingSM,
      paddingBlock: token.paddingSM,
      paddingInlineEnd: token.paddingXS + token.paddingSM,
      paddingInlineStart: token.paddingSM,
    }),
    [token.colorPrimary, token.paddingSM, token.paddingXS],
  );

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    listLLMProviders(app.apiClient, (value) => tRef.current(value))
      .then(setProviders)
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [app.apiClient]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listLLMServices(app.apiClient);
      setServices(result.data);
    } finally {
      setLoading(false);
    }
  }, [app.apiClient]);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      console.error(error);
      setLoading(false);
    });
  }, [refresh]);

  const openCreateDrawer = useCallback(() => {
    ctx.viewer.open({
      type: 'drawer',
      width: AI_SETTINGS_DRAWER_WIDTH,
      closable: true,
      content: (
        <LLMServiceDrawerContent
          providers={providers}
          onSubmitted={async () => {
            await refresh();
            await repo.refreshLLMServices();
          }}
        />
      ),
    });
  }, [ctx.viewer, providers, refresh, repo]);

  useEffect(() => {
    if (autoOpenHandledRef.current || !shouldAutoOpenAddNew(location.state)) {
      return;
    }
    autoOpenHandledRef.current = true;
    openCreateDrawer();
    window.history.replaceState({}, document.title);
  }, [location.state, openCreateDrawer]);

  const openEditDrawer = (record: LLMServiceRecord) => {
    ctx.viewer.open({
      type: 'drawer',
      width: AI_SETTINGS_DRAWER_WIDTH,
      closable: true,
      content: (
        <LLMServiceDrawerContent
          providers={providers}
          record={record}
          onSubmitted={async () => {
            await refresh();
            await repo.refreshLLMServices();
          }}
        />
      ),
    });
  };

  const handleBulkDelete = async () => {
    const names = selectedRowKeys.filter((key): key is string => typeof key === 'string');
    if (!names.length) {
      return;
    }
    await deleteLLMServices(app.apiClient, names);
    setSelectedRowKeys([]);
    message.success(t('Saved successfully'));
    await refresh();
    await repo.refreshLLMServices();
  };

  const handleSortEnd = async (from: LLMServiceRecord, to: LLMServiceRecord) => {
    if (!from.name || !to.name || from.name === to.name) {
      return;
    }
    const previousServices = services;
    const fromIndex = services.findIndex((service) => service.name === from.name);
    const toIndex = services.findIndex((service) => service.name === to.name);
    if (fromIndex >= 0 && toIndex >= 0) {
      setServices(arrayMove(services, fromIndex, toIndex));
    }
    try {
      await moveLLMService(app.apiClient, from.name, to.name);
      message.success(t('Saved successfully'));
      await refresh();
      await repo.refreshLLMServices();
    } catch (error) {
      console.error(error);
      setServices(previousServices);
      message.error(t('Failed to update'));
    }
  };

  const columns: ColumnsType<LLMServiceRecord> = [
    {
      title: t('UID'),
      dataIndex: 'name',
    },
    {
      title: t('Title'),
      dataIndex: 'title',
    },
    {
      title: t('Provider'),
      dataIndex: 'provider',
      render: (provider?: string) => <ProviderDisplay provider={provider} providers={providers} />,
    },
    {
      title: t('Enabled'),
      dataIndex: 'enabled',
      render: (_, record) => <EnabledSwitch record={record} onUpdated={refresh} />,
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size={token.marginXS}>
          <a style={actionLinkStyle} onClick={() => openEditDrawer(record)}>
            {t('Edit')}
          </a>
          <Popconfirm
            title={t('Delete record')}
            description={t('Are you sure you want to delete it?')}
            onConfirm={async () => {
              await deleteLLMService(app.apiClient, record.name);
              message.success(t('Saved successfully'));
              await refresh();
              await repo.refreshLLMServices();
            }}
          >
            <a style={actionLinkStyle}>{t('Delete')}</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
      styles={{
        body: {
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
        },
      }}
    >
      <Flex vertical gap="middle" style={{ flex: 1, minHeight: 0 }}>
        <Flex justify="end" wrap="wrap" gap="middle">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
              {t('Refresh')}
            </Button>
            <Popconfirm
              title={t('Delete record')}
              description={t('Are you sure you want to delete it?')}
              disabled={!selectedRowKeys.length}
              onConfirm={handleBulkDelete}
            >
              <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length}>
                {t('Delete')}
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
              {t('Add new')}
            </Button>
          </Space>
        </Flex>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
          <Table<LLMServiceRecord>
            rowKey="name"
            loading={loading}
            columns={columns}
            dataSource={services}
            className={fillHeightTableClassName}
            isDraggable
            onSortEnd={handleSortEnd}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              defaultPageSize: 20,
              showTotal: (total) => t('Total {{count}} items', { count: total }),
            }}
            scroll={{ x: 'max-content', y: '100%' }}
          />
        </div>
      </Flex>
    </Card>
  );
};

const LLMServiceDrawerContent: React.FC<{
  providers: ProviderOption[];
  record?: LLMServiceRecord;
  onSubmitted: () => Promise<void>;
}> = ({ providers, record, onSubmitted }) => {
  const app = useApp();
  const ctx = useFlowContext();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<LLMServiceFormValues>();
  const [saving, setSaving] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const selectedProvider = Form.useWatch('provider', form);
  const selectedFormProvider = useMemo(() => getProviderOptions(app, selectedProvider), [app, selectedProvider]);
  const initialValues = useMemo(
    () =>
      record
        ? {
            ...record,
            enabledModels: normalizeEnabledModels(record.enabledModels),
          }
        : getInitialLLMServiceFormValues(),
    [record],
  );
  const { Header, Footer } = ctx.view;

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const requestClose = useUnsavedChangesBeforeClose({
    view: ctx.view,
    form,
    initialValues,
    dirty: formDirty,
    title: t('Unsaved changes'),
    content: t("Are you sure you don't want to save?"),
  });

  const handleFinish = async (values: LLMServiceFormValues) => {
    setSaving(true);
    try {
      if (record) {
        await updateLLMService(app.apiClient, values);
      } else {
        await createLLMService(app.apiClient, values);
      }
      message.success(t('Saved successfully'));
      await onSubmitted();
      await ctx.view.close(undefined, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title={record ? t('Edit record') : t('Add new')} />
      <Spin spinning={saving}>
        <Form<LLMServiceFormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={() => setFormDirty(true)}
        >
          <LLMServiceForm providers={providers} editing={!!record} />
        </Form>
      </Spin>
      <Footer>
        <Flex justify="end" gap="small">
          <Space>
            {selectedFormProvider ? <LLMTestFlightButton form={form} /> : null}
            <Button onClick={requestClose}>{t('Cancel')}</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {t('Submit')}
            </Button>
          </Space>
        </Flex>
      </Footer>
    </>
  );
};

export default LLMServicesPage;
