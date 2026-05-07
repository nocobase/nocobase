/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Spin, Select } from 'antd';
import { observer, tExpr } from '@nocobase/flow-engine';
import { Schema, useField } from '@formily/react';
import { ObjectField } from '@formily/core';
import { SchemaComponent } from '@nocobase/client';
import { buildProviderGroupedModelOptions } from '../../../../llm-services/utils';
import { useLLMServiceCatalog } from '../../../../llm-services/hooks/useLLMServiceCatalog';
import { useLLMProviders } from '../../../../llm-services/llm-providers';
import { namespace, useT } from '../../../../locale';

const ModelSelect: React.FC = observer(() => {
  const t = useT();
  const field = useField<ObjectField>();
  const { services, loading } = useLLMServiceCatalog();
  const providers = useLLMProviders();
  const options = useMemo(
    () => buildProviderGroupedModelOptions(services, providers, (label) => Schema.compile(label, { t })),
    [services, providers, t],
  );

  const selectedValue =
    field.value?.llmService && field.value?.model ? `${field.value.llmService}:${field.value.model}` : undefined;

  const handleChange = (value?: string) => {
    if (!value) {
      field.value = null;
      return;
    }
    const [llmService, model] = value.split(':');
    field.value = { llmService, model };
  };

  return (
    <Select
      allowClear={true}
      showSearch={true}
      value={selectedValue}
      placeholder={t('Use default model')}
      options={options}
      onChange={handleChange}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : null}
      optionFilterProp="label"
    />
  );
});

export const ModelOptions: React.FC = () => {
  return (
    <SchemaComponent
      components={{ ModelSelect }}
      schema={{
        type: 'void',
        properties: {
          model: {
            type: 'object',
            title: tExpr('Model', { ns: namespace }),
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: tExpr('Select the LLM to be used for the task', {
                ns: namespace,
              }),
            },
            'x-component': ModelSelect,
            required: true,
          },
        },
      }}
    />
  );
};
