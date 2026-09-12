/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Form, Select, Spin } from 'antd';
import { observer } from '@nocobase/flow-engine';
import { getAIEmployeeModels, getAllModels } from '../../../../ai-employees/chatbox/model';
import type { AIEmployeeModelOverride } from '../../../types';
import { useAIConfigRepository } from '../../../../repositories/hooks/useAIConfigRepository';
import { useT } from '../../../../locale';

type ModelSelectProps = {
  value?: AIEmployeeModelOverride | null;
  onChange?: (value: AIEmployeeModelOverride | null) => void;
};

function toModelValue(value?: AIEmployeeModelOverride | null) {
  return value?.llmService && value.model ? `${value.llmService}:${value.model}` : undefined;
}

export const ModelSelect: React.FC<ModelSelectProps> = observer(({ value, onChange }) => {
  const t = useT();
  const form = Form.useFormInstance();
  const username = Form.useWatch(['config', 'username'], form);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployee = typeof username === 'string' ? aiConfigRepository.getAIEmployeesMap()[username] : undefined;
  const services = aiConfigRepository.llmServices;
  const loading = aiConfigRepository.llmServicesLoading || aiConfigRepository.aiEmployeesLoading;

  useEffect(() => {
    aiConfigRepository.getLLMServices();
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const options = useMemo(() => {
    const allowedModelKeys = new Set(
      getAIEmployeeModels(aiEmployee, getAllModels(services)).map((model) => `${model.llmService}:${model.model}`),
    );
    return services
      .map((service) => ({
        label: service.llmServiceTitle,
        options: service.enabledModels
          .filter((model) => allowedModelKeys.has(`${service.llmService}:${model.value}`))
          .map((model) => ({
            label: `${service.llmServiceTitle} / ${model.label}`,
            value: `${service.llmService}:${model.value}`,
          })),
      }))
      .filter((service) => service.options.length > 0);
  }, [aiEmployee, services]);

  const optionValues = useMemo(
    () => new Set(options.flatMap((group) => group.options.map((option) => option.value))),
    [options],
  );
  const selectedValue = toModelValue(value);

  useEffect(() => {
    if (selectedValue && !optionValues.has(selectedValue)) {
      onChange?.(null);
    }
  }, [onChange, optionValues, selectedValue]);

  return (
    <Select
      allowClear
      showSearch
      value={selectedValue}
      placeholder={t('Use default model')}
      options={options}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : null}
      optionFilterProp="label"
      onChange={(nextValue?: string) => {
        if (!nextValue) {
          onChange?.(null);
          return;
        }
        const [llmService, model] = nextValue.split(':');
        onChange?.({ llmService, model });
      }}
    />
  );
});

export function ModelOptions() {
  const t = useT();

  return (
    <Form.Item
      name={['config', 'model']}
      label={t('Model')}
      tooltip={t('Leave empty to use AI employee or global default model.')}
    >
      <ModelSelect />
    </Form.Item>
  );
}

export default ModelOptions;
