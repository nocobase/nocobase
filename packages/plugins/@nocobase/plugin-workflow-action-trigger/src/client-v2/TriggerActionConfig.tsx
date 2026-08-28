/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { useFlowEngine } from '@nocobase/flow-engine';
import {
  TriggerCollectionRecordSelect,
  WorkflowVariableWrapper,
  type UseWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client-v2';
import { Form } from 'antd';
import React, { useMemo } from 'react';

import { useT } from './locale';

type WorkflowField = {
  isForeignKey?: boolean;
  type?: string;
  target?: string;
  collectionName?: string;
  name?: string;
};

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
        <WorkflowVariableWrapper<number>
          variableOptions={userVariableOptions}
          render={({ value, onChange }) => (
            <RemoteSelect<{ id: number; nickname?: string }, { id: number; nickname?: string }[], number>
              value={value}
              onChange={onChange}
              request={async () => {
                const response = await flowEngine.context.api.resource('users').list({ pageSize: 200 });
                return response?.data?.data ?? [];
              }}
              mapOptions={(item) => ({ label: item.nickname ?? item.id, value: item.id })}
              cacheKey="workflow-action-trigger:users"
            />
          )}
        />
      </Form.Item>
      <Form.Item name="roleName" label={t('Role of user acted')} initialValue={null}>
        <WorkflowVariableWrapper<string>
          variableOptions={roleVariableOptions}
          render={({ value, onChange }) => (
            <RemoteSelect<{ name: string; title?: string }, { name: string; title?: string }[], string>
              value={value}
              onChange={onChange}
              request={async () => {
                const response = await flowEngine.context.api.resource('roles').list({ pageSize: 200 });
                return response?.data?.data ?? [];
              }}
              mapOptions={(item) => ({ label: item.title ? t(item.title) : item.name, value: item.name })}
              cacheKey="workflow-action-trigger:roles"
            />
          )}
        />
      </Form.Item>
    </>
  );
}
