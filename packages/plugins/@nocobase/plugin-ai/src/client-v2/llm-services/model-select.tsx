/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Select, Spin, Tag } from 'antd';
import type { SelectProps } from 'antd';
import type { LLMServiceItem } from '../repositories/AIConfigRepository';

export type LLMModelSelectOptionGroup = {
  label: string;
  options: Array<{
    label: string;
    value: string;
  }>;
};

export const getLLMModelValue = (model: { llmService?: string; model?: string }) =>
  model.llmService && model.model ? `${model.llmService}:${model.model}` : undefined;

export const parseLLMModelValue = (value: string) => {
  const [llmService, ...modelParts] = value.split(':');
  return {
    llmService,
    model: modelParts.join(':'),
  };
};

export const getLLMModelSelectOptions = (services: LLMServiceItem[]): LLMModelSelectOptionGroup[] =>
  services.map((service) => ({
    label: service.llmServiceTitle,
    options: service.enabledModels.map((model) => ({
      label: `${service.llmServiceTitle} / ${model.label}`,
      value: `${service.llmService}:${model.value}`,
    })),
  }));

export const getLLMModelSelectLabelMap = (options: LLMModelSelectOptionGroup[]) => {
  const map = new Map<string, string>();
  options.forEach((group) => {
    group.options.forEach((option) => map.set(option.value, option.label));
  });
  return map;
};

export const createLLMModelTagRender = (
  labelMap: Map<string, string>,
): NonNullable<SelectProps<string[]>['tagRender']> => {
  return (props) => (
    <Tag closable={props.closable} onClose={props.onClose}>
      {labelMap.get(String(props.value)) || props.label}
    </Tag>
  );
};

export type LLMModelMultiSelectProps = Omit<SelectProps<string[]>, 'mode' | 'options' | 'tagRender'> & {
  services: LLMServiceItem[];
};

export const LLMModelMultiSelect: React.FC<LLMModelMultiSelectProps> = ({ services, loading, ...props }) => {
  const options = useMemo(() => getLLMModelSelectOptions(services), [services]);
  const labelMap = useMemo(() => getLLMModelSelectLabelMap(options), [options]);

  return (
    <Select
      allowClear
      mode="multiple"
      notFoundContent={loading ? <Spin size="small" /> : null}
      optionFilterProp="label"
      options={options}
      showSearch
      tagRender={createLLMModelTagRender(labelMap)}
      loading={loading}
      {...props}
    />
  );
};
