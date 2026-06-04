/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Spin, Select } from 'antd';
import { observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { useField } from '@formily/react';
import { Field, ObjectField } from '@formily/core';
import { SchemaComponent } from '@nocobase/client';
import { useLLMServiceCatalog } from '../../../../llm-services/hooks/useLLMServiceCatalog';
import { namespace, useT } from '../../../../locale';
import { getAIEmployeeModels, getAllModels } from '../../../../ai-employees/chatbox/model';

const ModelSelect: React.FC = observer(() => {
  const t = useT();
  const ctx = useFlowContext();
  const field = useField<ObjectField>();
  const usernameField = field.query('.username').take() as Field;
  const { services, loading } = useLLMServiceCatalog();
  const aiConfigRepository = ctx.aiConfigRepository;

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
  const aiEmployee = aiEmployeesMap[usernameField?.value];
  const options = useMemo(() => {
    const modelKeys = new Set(
      getAIEmployeeModels(aiEmployee, getAllModels(services)).map((model) => `${model.llmService}:${model.model}`),
    );
    return services
      .map((service) => ({
        label: service.llmServiceTitle,
        options: service.enabledModels
          .filter((model) => modelKeys.has(`${service.llmService}:${model.value}`))
          .map((model) => ({
            label: `${service.llmServiceTitle} / ${model.label}`,
            value: `${service.llmService}:${model.value}`,
          })),
      }))
      .filter((service) => service.options.length);
  }, [aiEmployee, services]);
  const optionValues = useMemo(
    () => new Set(options.flatMap((group) => group.options.map((option) => option.value))),
    [options],
  );

  const selectedValue =
    field.value?.llmService && field.value?.model ? `${field.value.llmService}:${field.value.model}` : undefined;

  useEffect(() => {
    if (selectedValue && !optionValues.has(selectedValue)) {
      field.value = null;
    }
  }, [field, optionValues, selectedValue]);

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
              tooltip: tExpr('Leave empty to use AI employee or global default model.', {
                ns: namespace,
              }),
            },
            'x-component': ModelSelect,
          },
        },
      }}
    />
  );
};
