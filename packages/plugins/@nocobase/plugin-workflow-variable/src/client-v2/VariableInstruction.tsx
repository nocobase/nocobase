/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { FunctionOutlined } from '@ant-design/icons';
import { Form, Radio, Select, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';
import {
  defaultFieldNames,
  Instruction,
  useAvailableUpstreams,
  useNodeContext,
  WorkflowTypedVariableInput,
  type UseVariableOptions,
  type VariableOption,
} from '@nocobase/plugin-workflow/client-v2';
import { tExpr, useT } from './locale';

type WorkflowVariableNode = {
  id?: string | number;
  key: string;
  title?: string;
  type?: string;
  config?: {
    target?: string | null;
  };
  upstream?: WorkflowVariableNode | null;
};

type VariableTargetSelectProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
};

type VariableTargetOption = {
  label: string;
  value: string;
  node: WorkflowVariableNode;
};

function VariableTargetSelect({ value, onChange, disabled }: VariableTargetSelectProps) {
  const t = useT();
  const declaring = value == null;
  const current = useNodeContext() as WorkflowVariableNode | undefined;
  const variables = useAvailableUpstreams(
    current,
    (node: WorkflowVariableNode) => node.type === 'variable' && !node.config?.target,
  ) as WorkflowVariableNode[];

  const options = useMemo<VariableTargetOption[]>(
    () =>
      variables.map((node) => ({
        label: node.title ?? `#${node.id}`,
        value: node.key,
        node,
      })),
    [variables],
  );

  const onRadioChange = useCallback(
    (event: RadioChangeEvent) => {
      if (event.target.value) {
        onChange?.(null);
        return;
      }
      if (variables.length) {
        onChange?.(variables[0].key);
      }
    },
    [onChange, variables],
  );

  const filterOption = useCallback((input: string, option?: VariableTargetOption) => {
    const label = option?.label ?? '';
    const id = option?.node.id;
    return label.toLowerCase().includes(input.toLowerCase()) || (id != null && `#${id}`.includes(input));
  }, []);

  return (
    <fieldset disabled={disabled}>
      <Radio.Group value={declaring} onChange={onRadioChange}>
        <Space direction="vertical">
          <Radio value={true}>{t('Declare a new variable')}</Radio>
          <Space>
            <Radio value={false} disabled={disabled || !variables.length}>
              {t('Assign value to an existing variable')}
            </Radio>
            {!declaring && (
              <Select<string, VariableTargetOption>
                options={options}
                value={value ?? undefined}
                onChange={(nextValue) => onChange?.(nextValue)}
                allowClear
                showSearch
                filterOption={filterOption}
                disabled={disabled || !variables.length}
              />
            )}
          </Space>
        </Space>
      </Radio.Group>
    </fieldset>
  );
}

export function VariableFieldset() {
  const t = useT();

  return (
    <>
      <Form.Item name={['config', 'target']} label={t('Mode')} initialValue={null}>
        <VariableTargetSelect />
      </Form.Item>
      <Form.Item name={['config', 'value']} label={t('Value')} initialValue="">
        <WorkflowTypedVariableInput />
      </Form.Item>
    </>
  );
}

export default class VariableInstruction extends Instruction {
  title = tExpr('Variable');
  type = 'variable';
  group = 'control';
  description = tExpr('Assign value to a variable, for later use.');
  icon = (<FunctionOutlined />);

  FieldsetLoader = async () => ({ default: VariableFieldset });

  useVariables(
    { key, title, config }: WorkflowVariableNode,
    { fieldNames = defaultFieldNames }: UseVariableOptions = {},
  ): VariableOption | null {
    if (config?.target) {
      return null;
    }

    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
}
