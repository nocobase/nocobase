/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, Space } from 'antd';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';
import { RemoteSelect } from '../../../../components/RemoteSelect';
import { useT } from '../../../../locale';

type UserInputValue = string | number | Array<string | number>;

type UserInputProps = {
  value?: UserInputValue;
  onChange?: (value?: UserInputValue) => void;
};

function toInputValue(value?: UserInputValue) {
  if (Array.isArray(value)) {
    const [first] = value;
    return first == null ? undefined : String(first);
  }
  return value == null ? undefined : String(value);
}

function isWorkflowVariable(value?: UserInputValue) {
  const inputValue = toInputValue(value);
  return typeof inputValue === 'string' && inputValue.includes('{{');
}

export function UserInput({ value, onChange }: UserInputProps) {
  return (
    <Space direction="vertical">
      <RemoteSelect
        manual={false}
        fieldNames={{
          label: 'nickname',
          value: 'id',
        }}
        service={{
          resource: 'users',
        }}
        value={isWorkflowVariable(value) ? undefined : value}
        onChange={(nextValue) => onChange?.(nextValue as UserInputValue)}
      />
      <WorkflowVariableInput value={toInputValue(value)} onChange={(nextValue) => onChange?.(nextValue)} />
    </Space>
  );
}

export function UserInputFormItem() {
  const t = useT();

  return (
    <Form.Item
      name={['config', 'userId']}
      label={t('Operator')}
      tooltip={t('Complete the task using operator permissions')}
      rules={[{ required: true }]}
    >
      <UserInput />
    </Form.Item>
  );
}

export default UserInputFormItem;
