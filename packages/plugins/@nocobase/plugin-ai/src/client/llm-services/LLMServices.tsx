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
import React, { useContext, useMemo, useState } from 'react';
import { useT } from '../locale';
import { Button, Dropdown, App, Tag } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import llmServices from '../../collections/llm-services';
import { llmsSchema, createLLMSchema } from '../schemas/llms';
import { LLMProviderContext, LLMProvidersContext, useLLMProviders } from './llm-providers';
import { Schema, useForm, observer } from '@formily/react';
import { createForm } from '@formily/core';
import { uid } from '@formily/shared';
import PluginAIClient from '..';

const useCreateFormProps = () => {
  const { provider } = useContext(LLMProviderContext);
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          name: `v_${uid()}`,
          provider,
        },
      }),
    [provider],
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
  const form = useForm();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
      form.reset();
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
      form.reset();
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
const AddNew = () => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [provider, setProvider] = useState('');
  const providers = useLLMProviders();
  const items = providers.map((item) => ({
    ...item,
    label: (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 35 }}>
          <span>{item.label}</span>
          <div>
            {item.supportedModel.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </div>
      </>
    ),
    onClick: () => {
      setVisible(true);
      setProvider(item.value);
    },
  }));

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <LLMProviderContext.Provider value={{ provider }}>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ setProvider, useCreateFormProps }} schema={createLLMSchema} />
      </LLMProviderContext.Provider>
    </ActionContextProvider>
  );
};

export const useProviderSettingsForm = (provider: string) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  const p = plugin.aiManager.llmProviders.get(provider);
  return p?.components?.ProviderSettingsForm;
};

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
    <LLMProvidersContext.Provider value={{ providers }}>
      <ExtendCollectionsProvider collections={[llmServices]}>
        <SchemaComponent
          schema={llmsSchema}
          components={{ AddNew, Settings }}
          scope={{ t, providers, useEditFormProps, useCancelActionProps, useCreateActionProps, useEditActionProps }}
        />
      </ExtendCollectionsProvider>
    </LLMProvidersContext.Provider>
  );
};
