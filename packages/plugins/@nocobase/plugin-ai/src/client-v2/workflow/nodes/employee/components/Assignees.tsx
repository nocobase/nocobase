/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Form, Popover, Space } from 'antd';
import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { FilterDynamicComponent, WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';
import { RemoteSelect } from '../../../../components/RemoteSelect';
import type { AIEmployeeApprovalMode } from '../../../types';
import { useT } from '../../../../locale';

type AssigneeValue = string | number | Array<string | number> | { filter?: Record<string, unknown> };

type AssigneeInputProps = {
  value?: AssigneeValue;
  onChange?: (value?: AssigneeValue) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isQueryAssignee(value: unknown): value is { filter?: Record<string, unknown> } {
  return isRecord(value);
}

function toInputValue(value?: AssigneeValue) {
  if (Array.isArray(value)) {
    const [first] = value;
    return first == null ? undefined : String(first);
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function isWorkflowVariable(value?: AssigneeValue) {
  return toInputValue(value)?.includes('{{') ?? false;
}

function AssigneeInput({ value, onChange }: AssigneeInputProps) {
  if (isQueryAssignee(value)) {
    return (
      <FilterDynamicComponent
        collection="users"
        value={value.filter ?? {}}
        onChange={(filter) => onChange?.({ filter: filter ?? {} })}
      />
    );
  }

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
        onChange={(nextValue) => onChange?.(nextValue as AssigneeValue)}
      />
      <WorkflowVariableInput value={toInputValue(value)} onChange={(nextValue) => onChange?.(nextValue)} />
    </Space>
  );
}

export function Assignees() {
  const t = useT();
  const form = Form.useFormInstance();
  const [open, setOpen] = useState(false);
  const watchedRequiresApproval = Form.useWatch(['config', 'requiresApproval'], form) as
    | AIEmployeeApprovalMode
    | undefined;
  const requiresApproval =
    watchedRequiresApproval ??
    (form.getFieldValue(['config', 'requiresApproval']) as AIEmployeeApprovalMode | undefined);
  const visible = requiresApproval && requiresApproval !== 'no_required';

  if (!visible) {
    return null;
  }

  return (
    <Form.Item label={t('Assignees')} required>
      <Form.List
        name={['config', 'assignees']}
        rules={[
          {
            validator: async (_, value?: AssigneeValue[]) => {
              if (!Array.isArray(value) || value.length === 0) {
                throw new Error(t('Assignees is required'));
              }
            },
          },
        ]}
      >
        {(fields, operations, meta) => (
          <Space direction="vertical">
            {fields.map((field, index) => (
              <Space key={field.key} align="start">
                <Button
                  type="text"
                  size="small"
                  aria-label="move-up"
                  icon={<UpOutlined />}
                  disabled={index === 0}
                  onClick={() => operations.move(index, index - 1)}
                />
                <Button
                  type="text"
                  size="small"
                  aria-label="move-down"
                  icon={<DownOutlined />}
                  disabled={index === fields.length - 1}
                  onClick={() => operations.move(index, index + 1)}
                />
                <Form.Item name={[field.name]} noStyle>
                  <AssigneeInput />
                </Form.Item>
                <Button
                  type="text"
                  size="small"
                  aria-label="delete"
                  icon={<DeleteOutlined />}
                  onClick={() => operations.remove(field.name)}
                />
              </Space>
            ))}
            <Form.ErrorList errors={meta.errors} />
            <Popover
              trigger="click"
              open={open}
              onOpenChange={setOpen}
              placement="bottom"
              content={
                <Space direction="vertical">
                  <Button
                    type="text"
                    onClick={() => {
                      operations.add(null);
                      setOpen(false);
                    }}
                  >
                    {t('Select users')}
                  </Button>
                  <Button
                    type="text"
                    onClick={() => {
                      operations.add({ filter: {} });
                      setOpen(false);
                    }}
                  >
                    {t('Query users')}
                  </Button>
                </Space>
              }
            >
              <Button block type="dashed" aria-label={t('Add assignee')} icon={<PlusOutlined />}>
                {t('Add assignee')}
              </Button>
            </Popover>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}

export default Assignees;
