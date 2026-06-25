/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, Space, theme } from 'antd';
import { css } from '@emotion/css';
import { FlowContextSelector, type MetaTreeNode } from '@nocobase/flow-engine';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client-v2';
import { RemoteSelect } from '../../../../components/RemoteSelect';
import { useT } from '../../../../locale';

type UserInputValue = string | number | Array<string | number>;

type CollectionFieldLike = {
  collectionName?: string;
  isForeignKey?: boolean;
  name?: string;
  target?: string;
};

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

function isUserKeyField(field: CollectionFieldLike) {
  if (field.isForeignKey) {
    return field.target === 'users';
  }
  return field.collectionName === 'users' && field.name === 'id';
}

function formatWorkflowPathToValue(item?: MetaTreeNode) {
  const path = item?.paths ?? [];
  return path.length ? `{{${path.join('.')}}}` : '';
}

function parseWorkflowValueToPath(value?: string) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
  if (!match) {
    return undefined;
  }
  return match[1].split('.');
}

export function UserInput({ value, onChange }: UserInputProps) {
  const { token } = theme.useToken();
  const variableValue = isWorkflowVariable(value) ? toInputValue(value) : undefined;
  const metaTree = useWorkflowVariableOptions({ types: [isUserKeyField] });
  const compactClassName = css`
    display: flex;
    width: 100%;

    .ant-select {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ant-btn {
      flex-shrink: 0;
      margin-inline-start: -${token.lineWidth}px;
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }

    .ant-btn:hover,
    .ant-btn:focus {
      z-index: 2;
    }
  `;

  return (
    <Space.Compact className={compactClassName}>
      <RemoteSelect
        manual={false}
        fieldNames={{
          label: 'nickname',
          value: 'id',
        }}
        service={{
          resource: 'users',
        }}
        value={variableValue ? undefined : value}
        onChange={(nextValue) => onChange?.(nextValue as UserInputValue)}
      />
      <FlowContextSelector
        value={variableValue}
        metaTree={metaTree}
        parseValueToPath={parseWorkflowValueToPath}
        formatPathToValue={formatWorkflowPathToValue}
        onlyLeafSelectable
        dropdownFooter={null}
        onChange={(nextValue) => {
          if (nextValue) {
            onChange?.(nextValue);
          }
        }}
      />
    </Space.Compact>
  );
}

export const WorkflowUserSelect = UserInput;

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
