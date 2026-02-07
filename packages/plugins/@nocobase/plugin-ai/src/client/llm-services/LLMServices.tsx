/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  ExtendCollectionsProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  usePlugin,
  useRequest,
} from '@nocobase/client';
import React, { useMemo, useState, useEffect, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from '../locale';

// Context for auto-open drawer functionality
const AutoOpenContext = createContext<{ autoOpen: boolean; setAutoOpen: (v: boolean) => void }>({
  autoOpen: false,
  setAutoOpen: () => {},
});
import { Button, App, Tag, theme, Select, Space, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import llmServices from '../../collections/llm-services';
import { llmsSchema, createLLMSchema } from '../schemas/llms';
import { LLMProvidersContext, useLLMProviders } from './llm-providers';
import { Schema, useForm, observer, useField } from '@formily/react';
import { createForm, Field } from '@formily/core';
import { uid } from '@formily/shared';
import PluginAIClient from '..';
import { LLMTestFlight } from './component/LLMTestFlight';
import { EnabledModelsSelect } from './component/EnabledModelsSelect';
import { ModelOptionsSettings } from './component/ModelOptionsSettings';

const useCreateFormProps = () => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          name: `v_${uid()}`,
        },
      }),
    [],
  );
  return {
    form,
  };
};

const useEditFormProps = () => {
  const record = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: record,
      }),
    [record],
  );
  return {
    form,
  };
};

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.create({
        values,
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
    },
  };
};

const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const collection = useCollection();
  const filterTk = collection.getFilterTargetKey();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.update({
        values,
        filterByTk: values[filterTk],
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};
const providerHints: Record<string, string> = {
  anthropic: 'Claude',
  'google-genai': 'Gemini',
  openai: 'GPT',
  'openai-completions': 'GPT (Completions, Legacy)',
  dashscope: 'Qwen',
  deepseek: 'DeepSeek',
  ollama: 'Local models',
};

const ProviderDisplay: React.FC = () => {
  const field = useField<Field>();
  const providers = useLLMProviders();
  const provider = providers.find((p) => p.value === field.value);
  return <span>{provider?.label || field.value}</span>;
};

export const ProviderSelect: React.FC = () => {
  const { token } = theme.useToken();
  const field = useField<Field>();
  const providers = useLLMProviders();

  const options = providers.map((item) => {
    const hint = providerHints[item.value];
    return {
      value: item.value,
      label: (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{item.label}</span>
            <span style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>{hint}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {item.supportedModel.map((model: string) => (
              <Tag
                key={model}
                style={{
                  color: token.colorTextTertiary,
                  backgroundColor: token.colorFillTertiary,
                  borderColor: token.colorBorderSecondary,
                  fontSize: token.fontSizeSM,
                }}
              >
                {model}
              </Tag>
            ))}
          </div>
        </Space>
      ),
      selectedLabel: item.label,
    };
  });

  return (
    <Select
      value={field.value}
      onChange={(val) => (field.value = val)}
      options={options}
      optionLabelProp="selectedLabel"
      style={{ width: '100%' }}
      listHeight={400}
    />
  );
};

const EnabledSwitch: React.FC = observer(
  () => {
    const field = useField<Field>();
    const record = useCollectionRecordData();
    const resource = useDataBlockResource();
    const { refresh } = useDataBlockRequest();
    const collection = useCollection();
    const filterTk = collection.getFilterTargetKey();
    const checked = field.value !== false;

    return (
      <Switch
        size="small"
        checked={checked}
        onChange={async (val) => {
          field.value = val;
          await resource.update({
            values: { enabled: val },
            filterByTk: record[filterTk],
          });
          refresh();
        }}
      />
    );
  },
  { displayName: 'EnabledSwitch' },
);

const AddNew = () => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const providers = useLLMProviders();
  const { autoOpen, setAutoOpen } = useContext(AutoOpenContext);

  useEffect(() => {
    if (autoOpen) {
      setFormKey((k) => k + 1);
      setVisible(true);
      setAutoOpen(false);
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [autoOpen, setAutoOpen]);

  const handleClick = () => {
    setFormKey((k) => k + 1);
    setVisible(true);
  };

  const $getProviderLabel = (providerValue: string) => {
    const provider = providers.find((p) => p.value === providerValue);
    return provider?.label || providerValue;
  };

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Button icon={<PlusOutlined />} type="primary" onClick={handleClick}>
        {t('Add new')}
      </Button>
      <SchemaComponent
        key={formKey}
        components={{ LLMTestFlight, EnabledModelsSelect, ProviderSelect, ModelOptionsSettings }}
        scope={{ useCreateFormProps, providers, $getProviderLabel }}
        schema={createLLMSchema}
      />
    </ActionContextProvider>
  );
};

// Get the ProviderSettingsForm component for the current provider
export const useProviderSettingsForm = (provider: string) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  const p = plugin.aiManager.llmProviders.get(provider);
  return p?.components?.ProviderSettingsForm;
};

// Render the ProviderSettings component for the current provider
export const Settings = observer(
  () => {
    const form = useForm();
    const record = useCollectionRecordData();
    const Component = useProviderSettingsForm(form.values.provider || record.provider);
    return Component ? <Component /> : null;
  },
  { displayName: 'LLMProviderSettings' },
);

export const LLMServices: React.FC = () => {
  const t = useT();
  const [providers, setProviders] = useState([]);
  const api = useAPIClient();
  const location = useLocation();
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    const state = location.state as { autoOpenAddNew?: boolean } | null;
    if (state?.autoOpenAddNew) {
      setAutoOpen(true);
    }
  }, [location.state]);

  useRequest(
    () =>
      api
        .resource('ai')
        .listLLMProviders()
        .then((res) => {
          const providers = res?.data?.data || [];
          return providers.map((provider: { name: string; title?: string; supportedModel: string[] }) => ({
            key: provider.name,
            label: Schema.compile(provider.title || provider.name, { t }),
            value: provider.name,
            supportedModel: provider.supportedModel,
          }));
        }),
    {
      onSuccess: (providers) => {
        setProviders(providers);
      },
    },
  );

  return (
    <AutoOpenContext.Provider value={{ autoOpen, setAutoOpen }}>
      <LLMProvidersContext.Provider value={{ providers }}>
        <ExtendCollectionsProvider collections={[llmServices]}>
          <SchemaComponent
            schema={llmsSchema}
            components={{
              AddNew,
              Settings,
              LLMTestFlight,
              EnabledModelsSelect,
              ProviderDisplay,
              ModelOptionsSettings,
              EnabledSwitch,
            }}
            scope={{ t, providers, useEditFormProps, useCancelActionProps, useCreateActionProps, useEditActionProps }}
          />
        </ExtendCollectionsProvider>
      </LLMProvidersContext.Provider>
    </AutoOpenContext.Provider>
  );
};
