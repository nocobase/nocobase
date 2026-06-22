/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { FlowContextSelector, useFlowEngine, VariableTag, type MetaTreeNode } from '@nocobase/flow-engine';
import {
  TriggerCollectionRecordSelect,
  useWorkflowVariableOptions,
  type UseWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client-v2';
import { Form, Space } from 'antd';
import React, { useMemo, useState } from 'react';

import { useT } from './locale';

type RemoteWorkflowVariableSelectProps<TRecord, TValue extends string | number> = {
  value?: TValue | string | null;
  onChange?: (value?: TValue | string | null) => void;
  request: () => Promise<TRecord[] | undefined>;
  mapOptions: (item: TRecord) => { label: React.ReactNode; value: TValue };
  cacheKey: string;
  variableOptions: UseWorkflowVariableOptions;
};

type WorkflowField = {
  isForeignKey?: boolean;
  type?: string;
  target?: string;
  collectionName?: string;
  name?: string;
};

function isVariableValue(value: unknown): value is string {
  return typeof value === 'string' && /^\{\{\s*[^{}]+?\s*\}\}$/.test(value);
}

function formatVariablePath(item?: MetaTreeNode) {
  const path = item?.paths ?? [];
  return path.length ? `{{${path.join('.')}}}` : '';
}

function parseVariableValue(value?: string) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
  return match ? match[1].split('.') : undefined;
}

function RemoteWorkflowVariableSelect<TRecord, TValue extends string | number>({
  value,
  onChange,
  request,
  mapOptions,
  cacheKey,
  variableOptions,
}: RemoteWorkflowVariableSelectProps<TRecord, TValue>) {
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const [selectedMetaTreeNode, setSelectedMetaTreeNode] = useState<MetaTreeNode | undefined>();
  const isVariable = isVariableValue(value);
  const selectValue = isVariable ? undefined : value;
  const translatedMetaTree = useMemo(() => metaTree, [metaTree]);

  return (
    <Space.Compact block>
      {isVariable ? (
        <VariableTag
          value={value}
          metaTree={translatedMetaTree}
          metaTreeNode={selectedMetaTreeNode}
          onClear={() => onChange?.(null)}
        />
      ) : (
        <RemoteSelect<TRecord, TRecord[], TValue>
          value={selectValue as TValue | undefined}
          onChange={(nextValue) => onChange?.(nextValue)}
          request={request}
          mapOptions={mapOptions}
          cacheKey={cacheKey}
        />
      )}
      <FlowContextSelector
        metaTree={translatedMetaTree}
        value={isVariable ? value : undefined}
        parseValueToPath={parseVariableValue}
        formatPathToValue={formatVariablePath}
        onChange={(nextValue, metaTreeNode) => {
          setSelectedMetaTreeNode(metaTreeNode);
          onChange?.(nextValue);
        }}
      />
    </Space.Compact>
  );
}

export default function TriggerActionConfig() {
  const t = useT();
  const flowEngine = useFlowEngine();

  const userVariableOptions = useMemo<UseWorkflowVariableOptions>(
    () => ({
      types: [
        (field: WorkflowField) => {
          if (field.isForeignKey || field.type === 'context') {
            return field.target === 'users';
          }
          return field.collectionName === 'users' && field.name === 'id';
        },
      ],
    }),
    [],
  );

  const roleVariableOptions = useMemo<UseWorkflowVariableOptions>(
    () => ({
      types: [
        (field: WorkflowField) => {
          if (field.isForeignKey) {
            return field.target === 'roles';
          }
          return field.collectionName === 'roles' && field.name === 'name';
        },
      ],
    }),
    [],
  );

  return (
    <>
      <Form.Item
        name="data"
        label={t('Trigger data', { ns: 'workflow' })}
        extra={t('Choose a record or primary key of a record in the collection to trigger.', { ns: 'workflow' })}
        rules={[{ required: true }]}
      >
        <TriggerCollectionRecordSelect />
      </Form.Item>
      <Form.Item name="userId" label={t('User acted')} initialValue={null} rules={[{ required: true }]}>
        <RemoteWorkflowVariableSelect<{ id: number; nickname?: string }, number>
          request={async () => {
            const response = await flowEngine.context.api.resource('users').list({ pageSize: 50 });
            return response?.data?.data ?? [];
          }}
          mapOptions={(item) => ({ label: item.nickname ?? item.id, value: item.id })}
          cacheKey="workflow-action-trigger:users"
          variableOptions={userVariableOptions}
        />
      </Form.Item>
      <Form.Item name="roleName" label={t('Role of user acted')} initialValue={null}>
        <RemoteWorkflowVariableSelect<{ name: string; title?: string }, string>
          request={async () => {
            const response = await flowEngine.context.api.resource('roles').list({ pageSize: 50 });
            return response?.data?.data ?? [];
          }}
          mapOptions={(item) => ({ label: item.title ? t(item.title) : item.name, value: item.name })}
          cacheKey="workflow-action-trigger:roles"
          variableOptions={roleVariableOptions}
        />
      </Form.Item>
    </>
  );
}
