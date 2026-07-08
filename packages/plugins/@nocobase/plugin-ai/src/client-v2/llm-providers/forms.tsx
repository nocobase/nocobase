/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { AutoComplete, Collapse, Form, Input, InputNumber, Select, Spin } from 'antd';
import { EnvVariableInput, useApp } from '@nocobase/client-v2';
import { useT } from '../locale';

type APIResponse = {
  data?: {
    data?: unknown;
  };
};

type ModelItem = {
  id: string;
};

type ModelOption = {
  label: string;
  value: string;
};

export type OptionField = {
  name: string;
  title: string;
  description?: string;
  defaultValue?: number | string;
  step?: number;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: string }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const readModelItems = (response: unknown): ModelItem[] => {
  if (!isRecord(response)) {
    return [];
  }
  const body = (response as APIResponse).data;
  const data = body?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((item): item is ModelItem => isRecord(item) && typeof item.id === 'string');
};

export const ProviderSettingsForm: React.FC = () => {
  const t = useT();

  return (
    <Form.Item name={['options', 'apiKey']} label={t('API Key')} rules={[{ required: true }]}>
      <EnvVariableInput password />
    </Form.Item>
  );
};

export const OrcaRouterProviderSettingsForm: React.FC = () => {
  const t = useT();

  return (
    <>
      <Form.Item name={['options', 'apiKey']} label={t('API Key')} rules={[{ required: true }]}>
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item
        name={['options', 'httpReferer']}
        label={t('HTTP Referer')}
        tooltip={t('Optional. Sent as the "HTTP-Referer" header for app attribution.')}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name={['options', 'xTitle']}
        label={t('App Title')}
        tooltip={t('Optional. Sent as the "X-Title" header for app attribution.')}
      >
        <Input />
      </Form.Item>
    </>
  );
};

export const EmptyProviderSettingsForm: React.FC = () => null;

export const ModelSelect: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
}> = ({ value, onChange }) => {
  const app = useApp();
  const form = Form.useFormInstance();
  const llmService = Form.useWatch('llmService', form);
  const serviceName = Form.useWatch('name', form);
  const provider = Form.useWatch('provider', form);
  const providerOptions = Form.useWatch('options', form);
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);

  const serviceKey = typeof llmService === 'string' ? llmService : typeof serviceName === 'string' ? serviceName : '';
  const providerKey = typeof provider === 'string' ? provider : '';

  const fetchModels = async (search?: string) => {
    if (!serviceKey && !providerKey) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const response = serviceKey
        ? await app.apiClient.resource('ai').listModels({
            llmService: serviceKey,
            model: search,
          })
        : await app.apiClient.resource('ai').listProviderModels(
            {
              values: {
                provider: providerKey,
                options: isRecord(providerOptions) ? providerOptions : {},
                model: search,
              },
            },
            { skipNotify: true },
          );
      setOptions(
        readModelItems(response).map((item) => ({
          label: item.id,
          value: item.id,
        })),
      );
    } catch (error) {
      setOptions([]);
      if (process.env.NODE_ENV !== 'test') {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    fetchModels(search);
  };

  return (
    <AutoComplete
      value={value}
      options={options}
      onFocus={() => fetchModels(value)}
      onSearch={handleSearch}
      onChange={onChange}
      notFoundContent={loading ? <Spin size="small" /> : null}
    />
  );
};

export const OptionsFields: React.FC<{
  fields: OptionField[];
  namePrefix?: Array<string | number>;
}> = ({ fields, namePrefix = ['options'] }) => {
  const t = useT();

  return (
    <>
      {fields.map((field) => (
        <Form.Item
          key={field.name}
          name={[...namePrefix, field.name]}
          label={t(field.title)}
          tooltip={field.description ? t(field.description) : undefined}
          initialValue={field.defaultValue}
        >
          {field.options ? (
            <Select options={field.options.map((option) => ({ ...option, label: t(option.label) }))} />
          ) : (
            <InputNumber min={field.min} max={field.max} step={field.step} />
          )}
        </Form.Item>
      ))}
    </>
  );
};

const ModelOptions: React.FC<{
  fields: OptionField[];
}> = ({ fields }) => {
  const t = useT();

  return (
    <Collapse
      bordered={false}
      size="small"
      items={[
        {
          key: 'options',
          label: t('Options'),
          forceRender: true,
          children: <OptionsFields fields={fields} />,
        },
      ]}
    />
  );
};

export const createModelSettingsForm = (fields: OptionField[]): React.FC => {
  const ModelSettingsForm: React.FC = () => {
    const t = useT();

    return (
      <>
        <Form.Item name="model" label={t('Model')} rules={[{ required: true }]}>
          <ModelSelect />
        </Form.Item>
        <ModelOptions fields={fields} />
      </>
    );
  };
  return ModelSettingsForm;
};

const responseFormatOptions = [
  {
    label: 'Text',
    value: 'text',
  },
  {
    label: 'JSON',
    value: 'json_object',
  },
];

const responseFormatWithSchemaOptions = [
  ...responseFormatOptions,
  {
    label: 'JSON Schema',
    value: 'json_schema',
  },
];

const baseCompletionFields: OptionField[] = [
  {
    name: 'frequencyPenalty',
    title: 'Frequency penalty',
    description: 'Frequency penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'maxCompletionTokens',
    title: 'Max completion tokens',
    description: 'Max completion tokens description',
    defaultValue: -1,
  },
  {
    name: 'presencePenalty',
    title: 'Presence penalty',
    description: 'Presence penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'temperature',
    title: 'Temperature',
    description: 'Temperature description',
    defaultValue: 1,
    step: 0.1,
    min: 0,
    max: 1,
  },
  {
    name: 'topP',
    title: 'Top P',
    description: 'Top P description',
    defaultValue: 1,
    step: 0.5,
    min: 0,
    max: 1,
  },
  {
    name: 'responseFormat',
    title: 'Response format',
    description: 'Response format description',
    defaultValue: 'text',
    options: responseFormatWithSchemaOptions,
  },
  {
    name: 'timeout',
    title: 'Timeout (ms)',
    defaultValue: 60000,
  },
  {
    name: 'maxRetries',
    title: 'Max retries',
    defaultValue: 1,
  },
];

export const openAICompletionFields = baseCompletionFields;

export const openAIResponsesFields = baseCompletionFields.map((field) =>
  field.name === 'temperature' ? { ...field, defaultValue: 1 } : field,
);

export const qwenCompletionFields = baseCompletionFields.map((field) =>
  field.name === 'temperature' ? { ...field, defaultValue: 0.7 } : field,
);

export const deepSeekCompletionFields = baseCompletionFields.map((field) =>
  field.name === 'responseFormat' ? { ...field, options: responseFormatOptions } : field,
);

export const xAICompletionFields: OptionField[] = [
  {
    name: 'maxCompletionTokens',
    title: 'Max completion tokens',
    description: 'Max completion tokens description',
    defaultValue: -1,
  },
  {
    name: 'temperature',
    title: 'Temperature',
    description: 'Temperature description',
    defaultValue: 1,
    step: 0.1,
    min: 0,
    max: 1,
  },
  {
    name: 'topP',
    title: 'Top P',
    description: 'Top P description',
    defaultValue: 1,
    step: 0.5,
    min: 0,
    max: 1,
  },
  {
    name: 'responseFormat',
    title: 'Response format',
    description: 'Response format description',
    defaultValue: 'text',
    options: responseFormatWithSchemaOptions,
  },
  {
    name: 'timeout',
    title: 'Timeout (ms)',
    defaultValue: 60000,
  },
  {
    name: 'maxRetries',
    title: 'Max retries',
    defaultValue: 1,
  },
];

export const orcaRouterCompletionFields: OptionField[] = [
  {
    name: 'frequencyPenalty',
    title: 'Frequency penalty',
    description: 'Frequency penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'maxCompletionTokens',
    title: 'Max completion tokens',
    description: 'Max completion tokens description',
    defaultValue: -1,
  },
  {
    name: 'presencePenalty',
    title: 'Presence penalty',
    description: 'Presence penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'temperature',
    title: 'Temperature',
    description: 'Temperature description',
    defaultValue: 1,
    step: 0.1,
    min: 0,
    max: 2,
  },
  {
    name: 'topP',
    title: 'Top P',
    description: 'Top P description',
    defaultValue: 1,
    step: 0.1,
    min: 0,
    max: 1,
  },
  {
    name: 'responseFormat',
    title: 'Response format',
    description: 'Response format description',
    defaultValue: 'text',
    options: responseFormatWithSchemaOptions,
  },
  {
    name: 'timeout',
    title: 'Timeout (ms)',
    defaultValue: 60000,
  },
  {
    name: 'maxRetries',
    title: 'Max retries',
    defaultValue: 1,
  },
];

export const mistralCompletionFields: OptionField[] = [
  {
    name: 'temperature',
    title: 'Temperature',
    description: 'Temperature description',
    defaultValue: 0.7,
    step: 0.1,
    min: 0,
    max: 2,
  },
  {
    name: 'topP',
    title: 'Top P',
    description: 'Top P description',
    defaultValue: 1,
    step: 0.1,
    min: 0,
    max: 1,
  },
  {
    name: 'maxTokens',
    title: 'Max tokens',
    description: 'Maximum number of tokens to generate',
    defaultValue: -1,
    min: -1,
  },
  {
    name: 'frequencyPenalty',
    title: 'Frequency penalty',
    description: 'Frequency penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'presencePenalty',
    title: 'Presence penalty',
    description: 'Presence penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'responseFormat',
    title: 'Response format',
    description: 'Response format description',
    defaultValue: 'text',
    options: responseFormatOptions,
  },
  {
    name: 'timeout',
    title: 'Timeout (ms)',
    defaultValue: 60000,
  },
  {
    name: 'maxRetries',
    title: 'Max retries',
    defaultValue: 1,
  },
];

export const googleGenAICompletionFields: OptionField[] = baseCompletionFields.map((field) => {
  if (field.name === 'maxCompletionTokens') {
    return {
      ...field,
      name: 'maxOutputTokens',
      title: 'Max output tokens',
    };
  }
  if (field.name === 'temperature') {
    return {
      ...field,
      defaultValue: 0.7,
    };
  }
  return field;
});

export const ollamaCompletionFields: OptionField[] = [
  {
    name: 'temperature',
    title: 'Temperature',
    description: 'Temperature description',
    defaultValue: 0.8,
    step: 0.1,
    min: 0,
    max: 1,
  },
  {
    name: 'topP',
    title: 'Top P',
    description: 'Top P description',
    defaultValue: 0.9,
    step: 0.5,
    min: 0,
    max: 1,
  },
  {
    name: 'topK',
    title: 'Top K',
    defaultValue: 40,
    min: 0,
  },
  {
    name: 'numPredict',
    title: 'Num predict',
    defaultValue: -1,
  },
];

export const createDefaultModelSettingsForm = () => createModelSettingsForm(baseCompletionFields);
