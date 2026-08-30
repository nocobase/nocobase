/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { FlowContextSelector, type MetaTreeNode, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Space, theme } from 'antd';
import React, { useMemo } from 'react';
import { useWorkflowVariableOptions } from '../canvas/useWorkflowVariableOptions';
import { WorkflowVariableTag } from '../canvas/WorkflowVariableTag';
import { useT } from '../locale';
import { FilterDynamicComponent } from './FilterDynamicComponent';

export type UserOption = { id: number | string; nickname?: string };
export type UserQueryValue = { filter?: Record<string, unknown> };
export type UserSelectValue = number | string | UserQueryValue;

type UsersListResponse = { data?: { data?: UserOption[] } };
type WorkflowFieldLike = {
  collectionName?: string;
  isForeignKey?: boolean;
  name?: string;
  target?: string;
  type?: string;
};

export type UsersSelectProps = {
  disabled?: boolean;
  dropdownFooter?: React.ReactNode;
  nullable?: boolean;
  includeDateRangeVariable?: boolean;
  onChange?: (next: UserSelectValue) => void;
  popupClassName?: string;
  transformVariableOptions?: (options: MetaTreeNode[]) => MetaTreeNode[];
  value?: UserSelectValue | null;
  variableOptions?: MetaTreeNode[];
};

const WORKFLOW_VARIABLE_ROOTS = {
  null: 'null',
  scopes: '$scopes',
  nodeResult: '$jobsMapByNodeKey',
  trigger: '$context',
  system: '$system',
  env: '$env',
} as const;

export function isUserKeyField(field: WorkflowFieldLike) {
  if (field.isForeignKey || field.type === 'context') {
    return field.target === 'users';
  }
  return field.collectionName === 'users' && field.name === 'id';
}

function formatWorkflowPathToValue(item?: MetaTreeNode) {
  const path = item?.paths ?? [];
  return path.length ? `{{${path.join('.')}}}` : '';
}

function parseWorkflowValueToPath(value?: number | string | null) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
  return match ? match[1].split('.') : undefined;
}

function createDisabledVariableRoot(name: string, title: string): MetaTreeNode {
  return { name, title, type: '', paths: [name], disabled: true };
}

function normalizeWorkflowVariableOptions(options: MetaTreeNode[], t: (key: string) => string): MetaTreeNode[] {
  const optionByName = new Map(options.map((option) => [option.name, option]));
  return [
    optionByName.get(WORKFLOW_VARIABLE_ROOTS.scopes) ??
      createDisabledVariableRoot(WORKFLOW_VARIABLE_ROOTS.scopes, t('Scope variables')),
    optionByName.get(WORKFLOW_VARIABLE_ROOTS.nodeResult) ??
      createDisabledVariableRoot(WORKFLOW_VARIABLE_ROOTS.nodeResult, t('Node result')),
    optionByName.get(WORKFLOW_VARIABLE_ROOTS.trigger),
    optionByName.get(WORKFLOW_VARIABLE_ROOTS.system),
    optionByName.get(WORKFLOW_VARIABLE_ROOTS.env),
  ].filter(Boolean) as MetaTreeNode[];
}

function UserPickerInput(props: {
  disabled?: boolean;
  onChange?: (next: number | string) => void;
  value?: number | string;
}) {
  const { disabled, onChange, value } = props;
  const ctx = useFlowContext();
  const normalizedValue = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return (
    <RemoteSelect<UserOption, UserOption[], number | string>
      disabled={disabled}
      value={normalizedValue}
      onChange={(next) => onChange?.(next == null ? '' : next)}
      request={async () => {
        const response = await ctx.api.resource('users').list();
        const payload = (response as UsersListResponse)?.data?.data;
        return Array.isArray(payload) ? payload : [];
      }}
      mapOptions={(item) => ({ label: item.nickname || String(item.id), value: item.id })}
      style={{ width: '100%' }}
    />
  );
}

function FixedUserSelect(props: {
  disabled?: boolean;
  dropdownFooter?: React.ReactNode;
  metaTree: MetaTreeNode[];
  onChange?: (next: number | string) => void;
  popupClassName?: string;
  value?: number | string | null;
}) {
  const { disabled, dropdownFooter, metaTree, onChange, popupClassName, value } = props;
  const variableValue = typeof value === 'string' ? value : '';
  const selectedPath = useMemo(() => parseWorkflowValueToPath(value) ?? ['constant'], [value]);
  const isVariableValue = selectedPath[0] !== 'constant';
  const handleVariableSelect = useMemoizedFn((_selectedValue: string, meta?: MetaTreeNode) => {
    if (!meta) return;
    const root = meta.paths?.[0];
    onChange?.(root === WORKFLOW_VARIABLE_ROOTS.null || root === 'constant' ? '' : formatWorkflowPathToValue(meta));
  });

  return (
    <Space.Compact style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isVariableValue ? (
          <WorkflowVariableTag
            disabled={disabled}
            value={variableValue}
            onClear={() => onChange?.('')}
            metaTree={metaTree}
            style={{ width: '100%', minWidth: 0 }}
          />
        ) : (
          <UserPickerInput disabled={disabled} value={value ?? ''} onChange={onChange} />
        )}
      </div>
      <FlowContextSelector
        active={isVariableValue}
        disabled={disabled}
        dropdownFooter={dropdownFooter}
        formatPathToValue={formatWorkflowPathToValue}
        metaTree={metaTree}
        onChange={handleVariableSelect}
        parseValueToPath={() => selectedPath}
        popupClassName={popupClassName}
        value={variableValue}
      />
    </Space.Compact>
  );
}

export function UsersSelect({
  disabled,
  dropdownFooter = null,
  includeDateRangeVariable = true,
  nullable = false,
  onChange,
  popupClassName,
  transformVariableOptions,
  value,
}: UsersSelectProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const workflowVariableOptions = useWorkflowVariableOptions({ types: [isUserKeyField] });
  const translate = useMemoizedFn((key: string) => ctx?.t?.(key, { ns: 'workflow', nsMode: 'fallback' }) ?? t(key));
  const metaTree = useMemo(() => {
    const roots = transformVariableOptions
      ? transformVariableOptions(workflowVariableOptions)
      : normalizeWorkflowVariableOptions(workflowVariableOptions, translate);
    return [
      ...(nullable
        ? [{ name: WORKFLOW_VARIABLE_ROOTS.null, title: translate('Null'), type: 'string', paths: ['null'] }]
        : []),
      { name: 'constant', title: translate('Constant'), type: 'string', paths: ['constant'] },
      ...roots,
    ] as MetaTreeNode[];
  }, [nullable, transformVariableOptions, translate, workflowVariableOptions]);

  if (value && typeof value === 'object') {
    return (
      <div style={{ border: `${token.lineWidth}px dashed ${token.colorBorder}`, padding: token.paddingSM }}>
        <FilterDynamicComponent
          collection="users"
          disabled={disabled}
          includeDateRangeVariable={includeDateRangeVariable}
          transformVariableOptions={transformVariableOptions}
          value={value.filter ?? {}}
          onChange={(filter) => onChange?.({ filter: filter ?? {} })}
        />
      </div>
    );
  }

  return (
    <FixedUserSelect
      disabled={disabled}
      dropdownFooter={dropdownFooter}
      metaTree={metaTree}
      onChange={onChange}
      popupClassName={popupClassName}
      value={typeof value === 'string' || typeof value === 'number' ? value : ''}
    />
  );
}

export default UsersSelect;
