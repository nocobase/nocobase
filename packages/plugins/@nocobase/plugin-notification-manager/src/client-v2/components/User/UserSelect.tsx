/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { VariableInput, type MetaTreeNode, useFlowContext } from '@nocobase/flow-engine';
import { theme } from 'antd';
import React, { useMemo } from 'react';
import { FilterDynamicComponent, useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client-v2';
import { useNotificationTranslation } from '../../locale';

type UserOption = { id: number | string; nickname?: string };
type ReceiverQueryValue = { filter?: Record<string, unknown> };
type ReceiverValue = string | ReceiverQueryValue;
type UsersListResponse = { data?: { data?: UserOption[] } };

export type UserSelectProps = {
  value?: ReceiverValue | null;
  onChange?: (next: ReceiverValue) => void;
  variableOptions?: MetaTreeNode[];
};

const WORKFLOW_VARIABLE_REGEXP = /\{\{\s*([^{}]+?)\s*\}\}/g;

type WorkflowFieldLike = {
  collectionName?: string;
  isForeignKey?: boolean;
  name?: string;
  target?: string;
};

function isUserKeyField(field: WorkflowFieldLike) {
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

function UserPickerInput(props: { value?: string; onChange?: (next: string) => void }) {
  const { value, onChange } = props;
  const ctx = useFlowContext();

  return (
    <RemoteSelect<UserOption>
      value={value}
      onChange={(next) => onChange?.(next == null ? '' : String(next))}
      request={async () => {
        const response = await ctx.api.resource('users').list();
        const payload = (response as UsersListResponse)?.data?.data;
        return Array.isArray(payload) ? payload : [];
      }}
      mapOptions={(item) => ({ label: item.nickname || String(item.id), value: String(item.id) })}
      style={{ width: '100%' }}
    />
  );
}

function WorkflowUserSelectInput(props: { value?: string | null; onChange?: (next: string) => void }) {
  const { value, onChange } = props;
  const { t } = useNotificationTranslation();
  const workflowVariableOptions = useWorkflowVariableOptions({ types: [isUserKeyField] });
  const metaTree = useMemo<MetaTreeNode[]>(
    () => [
      {
        name: 'constant',
        title: t('Select users'),
        type: 'string',
        paths: ['constant'],
      },
      ...workflowVariableOptions,
    ],
    [t, workflowVariableOptions],
  );

  const converters = useMemo(
    () => ({
      formatPathToValue(item?: MetaTreeNode) {
        if (item?.paths?.[0] === 'constant') {
          return '';
        }
        return formatWorkflowPathToValue(item);
      },
      parseValueToPath: parseWorkflowValueToPath,
      variableRegExp: WORKFLOW_VARIABLE_REGEXP,
      renderInputComponent(meta?: MetaTreeNode) {
        if (meta?.paths?.[0] === 'constant') {
          return UserPickerInput;
        }
        return null;
      },
      resolveValueFromPath(meta?: MetaTreeNode) {
        if (meta?.paths?.[0] === 'constant') {
          return '';
        }
        return undefined;
      },
      resolvePathFromValue(next?: string) {
        return parseWorkflowValueToPath(next) ?? ['constant'];
      },
    }),
    [],
  );

  return (
    <VariableInput
      value={value ?? ''}
      onChange={onChange}
      metaTree={metaTree}
      converters={converters}
      clearValue=""
      style={{ width: '100%' }}
    />
  );
}

function UsersQuery(props: { value: ReceiverQueryValue; onChange?: (next: ReceiverQueryValue) => void }) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        border: `${token.lineWidth}px dashed ${token.colorBorder}`,
        padding: token.paddingSM,
      }}
    >
      <FilterDynamicComponent
        collection="users"
        value={props.value.filter ?? {}}
        onChange={(filter) => props.onChange?.({ filter: (filter ?? {}) as Record<string, unknown> })}
      />
    </div>
  );
}

export function UserSelect(props: UserSelectProps) {
  if (props.value && typeof props.value === 'object') {
    return <UsersQuery value={props.value} onChange={props.onChange} />;
  }

  return (
    <WorkflowUserSelectInput value={typeof props.value === 'string' ? props.value : ''} onChange={props.onChange} />
  );
}

export default UserSelect;
