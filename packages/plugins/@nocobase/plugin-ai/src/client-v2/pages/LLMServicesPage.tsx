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
  Drawer,
  Flex,
  Form,
  Input,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import { EnvVariableInput, useApp } from '@nocobase/client-v2';
import type { APIClient } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';
import { getRecommendedModels, isRecommendedModel } from '../../common/recommended-models';
import type { LLMProviderOptions } from '../manager/ai-manager';
import { formatModelLabel } from '../llm-services/model-label';
import { useT } from '../locale';
import { useAIConfigRepository } from '../repositories/hooks/useAIConfigRepository';

type APIClientLike = Pick<APIClient, 'resource'>;
type ResourceAction = (params?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
type APIResponse = {
  data?: {
    data?: unknown;
    count?: unknown;
  };
};
type ProviderOption = {
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
type LLMServiceFormValues = LLMServiceRecord;
type LLMServicesListResult = {
  data: LLMServiceRecord[];
  total?: number;
};
type AIPluginLike = {
  aiManager?: {
    llmProviders?: Map<string, LLMProviderOptions>;
  };
};

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
  const response = await callResourceAction(apiClient, 'llmServices', 'list');
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

const getInitialValues = (): LLMServiceFormValues => ({
  name: randomId('v_'),
  enabled: true,
  enabledModels: {
    mode: 'recommended',
    models: [],
  },
});

const ProviderSelect: React.FC<{
  providers: ProviderOption[];
}> = ({ providers }) => {
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
  return <Select options={options} optionLabelProp="selectedLabel" />;
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
  const form = Form.useFormInstance<LLMServiceFormValues>();
  const provider = Form.useWatch('provider', form);
  const providerOptions = Form.useWatch('options', form);
  const providerKey = typeof provider === 'string' ? provider : '';
  const pluginProvider = getProviderOptions(app, providerKey);
  const labelFormatter = pluginProvider?.formatModelLabel || formatModelLabel;
  const config = normalizeEnabledModels(value);
  const hasRecommended = !!providerKey && getRecommendedModels(providerKey).length > 0;
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
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

  const fetchModels = async (search?: string) => {
    if (!providerKey) {
      setModelOptions([]);
      return;
    }
    setLoading(true);
    try {
      const models = await listProviderModels(app.apiClient, {
        provider: providerKey,
        options: isRecord(providerOptions) ? providerOptions : {},
        model: search,
      });
      setModelOptions(
        models
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
          }),
      );
    } catch (error) {
      setModelOptions([]);
      message.error(error instanceof Error ? error.message : t('Failed to fetch models'));
    } finally {
      setLoading(false);
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
    <Radio.Group value={config.mode} onChange={(event) => changeMode(event.target.value)}>
      <Flex vertical gap="middle">
        {hasRecommended ? (
          <>
            <Radio value="recommended">{t('Recommended models')}</Radio>
            {config.mode === 'recommended' ? (
              <Typography.Text type="secondary">
                {`${t('Use recommended models:')} ${getRecommendedModels(providerKey)
                  .map((model) => model.label)
                  .join(', ')}`}
              </Typography.Text>
            ) : null}
          </>
        ) : null}
        <Radio value="provider">{t('Select models')}</Radio>
        {config.mode === 'provider' ? (
          <Select
            mode="multiple"
            options={modelOptions}
            loading={loading}
            notFoundContent={loading ? <Spin size="small" /> : null}
            value={config.models.map((model) => model.value)}
            onChange={(selectedValues: string[]) => {
              changeModels(
                selectedValues.map((model) => ({
                  value: model,
                  label: modelOptions.find((option) => option.value === model)?.label || labelFormatter(model),
                })),
              );
            }}
            onDropdownVisibleChange={(open) => {
              if (open) {
                fetchModels().catch((error: unknown) => {
                  console.error(error);
                });
              }
            }}
            placeholder={t('Select models to enable')}
            optionRender={(option) => {
              const recommended = isRecommendedModel(providerKey, String(option.value));
              return (
                <Space>
                  <span>{option.label}</span>
                  {recommended ? <Tag color="blue">{t('Recommended')}</Tag> : null}
                </Space>
              );
            }}
          />
        ) : null}
        <Radio value="custom">{t('Manual input')}</Radio>
        {config.mode === 'custom' ? (
          <Flex vertical gap="small">
            {config.models.map((model, index) => (
              <Flex key={`${model.value}:${index}`} gap="small" align="baseline">
                <Input
                  placeholder={t('Model id')}
                  value={model.value}
                  onChange={(event) => {
                    const nextModels = [...config.models];
                    nextModels[index] = { ...nextModels[index], value: event.target.value };
                    changeModels(nextModels);
                  }}
                />
                <Input
                  placeholder={t('Display name')}
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
  return Component ? <Component /> : null;
};

const LLMServiceForm: React.FC<{
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
      <Form.Item name="provider" label={t('Provider')} rules={[{ required: true }]}>
        {editing ? (
          <ProviderDisplay providers={providers} provider={providerKey} />
        ) : (
          <ProviderSelect providers={providers} />
        )}
      </Form.Item>
      <Form.Item name="title" label={t('Title')}>
        <Input />
      </Form.Item>
      {providerKey ? <ProviderSettingsForm /> : null}
      {providerKey ? (
        <Form.Item name={['options', 'baseURL']} label={t('Base URL')}>
          <EnvVariableInput placeholder={t('Base URL is optional, leave blank to use default (recommended)')} />
        </Form.Item>
      ) : null}
      {providerKey ? (
        <Form.Item name="enabledModels" label={t('Enabled Models')}>
          <EnabledModelsInput />
        </Form.Item>
      ) : null}
    </>
  );
};

const LLMTestFlightButton: React.FC = () => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const form = Form.useFormInstance<LLMServiceFormValues>();
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
  const t = useT();
  const { message } = App.useApp();
  const repo = useAIConfigRepository();
  const [form] = Form.useForm<LLMServiceFormValues>();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [services, setServices] = useState<LLMServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LLMServiceRecord | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    listLLMProviders(app.apiClient, t)
      .then(setProviders)
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [app.apiClient, t]);

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

  const openCreateDrawer = () => {
    setEditingRecord(undefined);
    form.setFieldsValue(getInitialValues());
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: LLMServiceRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      enabledModels: normalizeEnabledModels(record.enabledModels),
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values: LLMServiceFormValues) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await updateLLMService(app.apiClient, values);
      } else {
        await createLLMService(app.apiClient, values);
      }
      message.success(t('Saved successfully'));
      closeDrawer();
      await refresh();
      await repo.refreshLLMServices();
    } finally {
      setSaving(false);
    }
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

  const columns: TableProps<LLMServiceRecord>['columns'] = [
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
        <Space split="|">
          <Button type="link" onClick={() => openEditDrawer(record)}>
            {t('Edit')}
          </Button>
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
            <Button type="link" danger>
              {t('Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Flex vertical gap="middle">
        <Flex justify="space-between" wrap="wrap" gap="middle">
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
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            {t('Add new')}
          </Button>
        </Flex>
        <Table<LLMServiceRecord>
          rowKey="name"
          loading={loading}
          columns={columns}
          dataSource={services}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Flex>
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingRecord ? t('Edit record') : t('Add new')}
        footer={
          <Flex justify="space-between" gap="small">
            <LLMTestFlightButton />
            <Space>
              <Button onClick={closeDrawer}>{t('Cancel')}</Button>
              <Button type="primary" loading={saving} onClick={() => form.submit()}>
                {t('Submit')}
              </Button>
            </Space>
          </Flex>
        }
      >
        <Spin spinning={saving}>
          <Form<LLMServiceFormValues> form={form} layout="vertical" onFinish={handleFinish}>
            <LLMServiceForm providers={providers} editing={!!editingRecord} />
          </Form>
        </Spin>
      </Drawer>
    </Card>
  );
};

export default LLMServicesPage;
