/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Collapse, Form, Spin, Tabs } from 'antd';
import { useApp } from '@nocobase/client-v2';
import { RemoteSelect } from '../../../../components/RemoteSelect';
import { ModelSelect, OptionsFields } from '../../../../llm-providers/forms';
import { getBuiltinLLMProviderModelOptionFields } from '../../../../llm-providers';
import { useT } from '../../../../locale';
import { Messages } from './Messages';
import { StructuredOutput } from './StructuredOutput';

type LLMServiceRecord = {
  name: string;
  provider?: string;
};

type APIResponse = {
  data?: {
    data?: unknown;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const readLLMServiceRecord = (response: unknown): LLMServiceRecord | null => {
  if (!isRecord(response)) {
    return null;
  }
  const data = (response as APIResponse).data?.data;
  if (!isRecord(data) || typeof data.name !== 'string') {
    return null;
  }
  return {
    name: data.name,
    provider: typeof data.provider === 'string' ? data.provider : undefined,
  };
};

function useLLMServiceProvider(llmService?: string) {
  const app = useApp();
  const [provider, setProvider] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let canceled = false;
    const fetchProvider = async () => {
      if (!llmService) {
        setProvider(undefined);
        return;
      }
      setLoading(true);
      try {
        const response = await app.apiClient.resource('llmServices').get({
          filterByTk: llmService,
          fields: ['name', 'provider'],
        });
        if (!canceled) {
          setProvider(readLLMServiceRecord(response)?.provider);
        }
      } catch {
        if (!canceled) {
          setProvider(undefined);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    fetchProvider();
    return () => {
      canceled = true;
    };
  }, [app.apiClient, llmService]);

  return { provider, loading };
}

function WorkflowModelSelect() {
  const form = Form.useFormInstance();
  const configLLMService = Form.useWatch(['config', 'llmService'], form);
  const configModel = Form.useWatch(['config', 'model'], form);
  const llmService = typeof configLLMService === 'string' ? configLLMService : undefined;
  const model = typeof configModel === 'string' ? configModel : undefined;

  useEffect(() => {
    form.setFieldValue('llmService', llmService);
  }, [form, llmService]);

  useEffect(() => {
    form.setFieldValue('model', model);
  }, [form, model]);

  return (
    <ModelSelect
      value={model}
      onChange={(nextModel) => {
        form.setFieldValue('model', nextModel);
        form.setFieldValue(['config', 'model'], nextModel);
      }}
    />
  );
}

export function LLMFieldset() {
  const t = useT();
  const form = Form.useFormInstance();
  const llmServiceValue = Form.useWatch(['config', 'llmService'], form);
  const llmService = typeof llmServiceValue === 'string' ? llmServiceValue : undefined;
  const { provider, loading } = useLLMServiceProvider(llmService);
  const optionFields = useMemo(() => getBuiltinLLMProviderModelOptionFields(provider), [provider]);

  return (
    <>
      <Form.Item name={['config', 'llmService']} label={t('LLM service')} rules={[{ required: true }]}>
        <RemoteSelect
          manual={false}
          fieldNames={{
            label: 'title',
            value: 'name',
          }}
          service={{
            resource: 'llmServices',
            action: 'list',
            params: {
              fields: ['title', 'name'],
            },
          }}
          onChange={() => {
            form.setFieldValue(['config', 'model'], undefined);
          }}
        />
      </Form.Item>
      <Form.Item name={['config', 'model']} label={t('Model')} rules={[{ required: true }]}>
        <WorkflowModelSelect />
      </Form.Item>
      {loading ? (
        <Spin size="small" />
      ) : (
        <Collapse
          bordered={false}
          size="small"
          items={[
            {
              key: 'options',
              label: t('Options'),
              forceRender: true,
              children: <OptionsFields fields={optionFields} namePrefix={['config']} />,
            },
          ]}
        />
      )}
      <Tabs
        items={[
          {
            key: 'messages',
            label: t('Messages'),
            forceRender: true,
            children: <Messages />,
          },
          {
            key: 'structured-output',
            label: t('Structured output'),
            forceRender: true,
            children: <StructuredOutput />,
          },
        ]}
      />
    </>
  );
}

export default LLMFieldset;
