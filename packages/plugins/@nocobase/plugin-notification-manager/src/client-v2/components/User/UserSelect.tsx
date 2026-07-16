/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { RemoteSelect } from '@nocobase/client-v2';
import {
  buildContextSelectorItems,
  type ContextSelectorItem,
  loadMetaTreeChildren,
  type MetaTreeNode,
  useFlowContext,
  useResolvedMetaTree,
} from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Button, Cascader, Space, theme, Tooltip } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  FilterDynamicComponent,
  WorkflowVariableTag,
  useWorkflowVariableOptions,
} from '@nocobase/plugin-workflow/client-v2';
import { useNotificationTranslation } from '../../locale';

type UserOption = { id: number; nickname?: string };
type ReceiverScalarValue = number | string;
type ReceiverQueryValue = { filter?: Record<string, unknown> };
type ReceiverValue = ReceiverScalarValue | ReceiverQueryValue;
type UsersListResponse = { data?: { data?: UserOption[] } };
type MetaNodeTooltipOptions = { tooltip?: React.ReactNode };

export type UserSelectProps = {
  value?: ReceiverValue | null;
  onChange?: (next: ReceiverValue) => void;
  variableOptions?: MetaTreeNode[];
};

type WorkflowFieldLike = {
  collectionName?: string;
  isForeignKey?: boolean;
  name?: string;
  target?: string;
};

const WORKFLOW_VARIABLE_ROOTS = {
  null: 'null',
  scopes: '$scopes',
  nodeResult: '$jobsMapByNodeKey',
  trigger: '$context',
  system: '$system',
  env: '$env',
} as const;

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

function parseWorkflowValueToPath(value?: ReceiverScalarValue | null) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().match(/^\{\{\s*(.+?)\s*\}\}$/);
  if (!match) {
    return undefined;
  }
  return match[1].split('.');
}

function getMetaNodeTooltip(meta?: MetaTreeNode): React.ReactNode {
  if (!meta) {
    return undefined;
  }

  const metaWithTooltip = meta as MetaTreeNode & MetaNodeTooltipOptions;
  const options = meta.options as MetaNodeTooltipOptions | undefined;
  return metaWithTooltip.tooltip ?? options?.tooltip;
}

function createDisabledVariableRoot(name: string, title: string): MetaTreeNode {
  return {
    name,
    title,
    type: '',
    paths: [name],
    disabled: true,
  };
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

function UserPickerInput(props: { value?: ReceiverScalarValue; onChange?: (next: ReceiverScalarValue) => void }) {
  const { value, onChange } = props;
  const ctx = useFlowContext();
  const normalizedValue = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return (
    <RemoteSelect<UserOption, UserOption[], ReceiverScalarValue>
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

function WorkflowUserVariableInput(props: {
  metaTree: MetaTreeNode[];
  onChange?: (next: ReceiverScalarValue) => void;
  translate: (key: string) => string;
  value?: ReceiverScalarValue | null;
}) {
  const { metaTree, onChange, translate, value } = props;
  const { token } = theme.useToken();
  const { resolvedMetaTree } = useResolvedMetaTree(metaTree);
  const [updateFlag, setUpdateFlag] = useState(0);
  const variableValue = typeof value === 'string' ? value : '';
  const selectedPath = useMemo(() => parseWorkflowValueToPath(value) ?? ['constant'], [value]);
  const isVariableValue = selectedPath[0] !== 'constant';

  const renderTooltipIcon = useMemoizedFn((title: React.ReactNode, label: React.ReactNode) => {
    const labelText = typeof label === 'string' ? label : 'variable';
    return (
      <Tooltip title={typeof title === 'string' ? translate(title) : title} placement="top" destroyTooltipOnHide>
        <QuestionCircleOutlined
          aria-label={`${labelText} tooltip`}
          style={{ marginLeft: token.marginXXS, color: token.colorTextDescription }}
        />
      </Tooltip>
    );
  });

  const buildOptions = useMemoizedFn((nodes: MetaTreeNode[]): ContextSelectorItem[] => {
    const attachLabels = (items: ContextSelectorItem[]): ContextSelectorItem[] =>
      items.map((item) => {
        const meta = item.meta;
        const disabled = meta ? !!(typeof meta.disabled === 'function' ? meta.disabled() : meta.disabled) : false;
        const disabledReason = meta
          ? typeof meta.disabledReason === 'function'
            ? meta.disabledReason()
            : meta.disabledReason
          : undefined;
        const baseLabel = typeof item.label === 'string' ? translate(item.label) : item.label;
        const tooltip = getMetaNodeTooltip(meta);
        const label =
          tooltip || disabled ? (
            <span>
              {baseLabel}
              {renderTooltipIcon(tooltip || disabledReason || translate('This variable is not available'), baseLabel)}
            </span>
          ) : (
            baseLabel
          );

        return {
          ...item,
          disabled,
          label,
          children: Array.isArray(item.children) ? attachLabels(item.children) : item.children,
        };
      });

    return attachLabels(buildContextSelectorItems(nodes));
  });

  const options = useMemo(() => {
    const refreshSeq = updateFlag;
    return refreshSeq >= 0 ? buildOptions(resolvedMetaTree ?? []) : [];
  }, [buildOptions, resolvedMetaTree, updateFlag]);

  const handleLoadData = useMemoizedFn(async (selectedOptions: ContextSelectorItem[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    const targetMetaNode = targetOption?.meta;
    if (!targetOption || targetOption.children || targetOption.isLeaf || !targetMetaNode?.children) {
      return;
    }

    targetOption.loading = true;
    setUpdateFlag((prev) => prev + 1);
    try {
      const childNodes = await loadMetaTreeChildren(targetMetaNode);
      targetMetaNode.children = childNodes;
      const childOptions = buildOptions(childNodes);
      targetOption.children = childOptions;
      targetOption.isLeaf = !childOptions.length;
    } finally {
      targetOption.loading = false;
      setUpdateFlag((prev) => prev + 1);
    }
  });

  const handleVariableSelect = useMemoizedFn(
    (_selectedValues: Array<string | number>, selectedOptions?: ContextSelectorItem[]) => {
      const meta = selectedOptions?.[selectedOptions.length - 1]?.meta;
      if (!meta) {
        return;
      }
      const root = meta.paths?.[0];
      onChange?.(root === WORKFLOW_VARIABLE_ROOTS.null || root === 'constant' ? '' : formatWorkflowPathToValue(meta));
    },
  );

  const valueNode = isVariableValue ? (
    <WorkflowVariableTag
      value={variableValue}
      onClear={() => onChange?.('')}
      metaTree={resolvedMetaTree ?? metaTree}
      style={{ width: '100%', minWidth: 0 }}
    />
  ) : (
    <UserPickerInput value={value ?? ''} onChange={onChange} />
  );

  return (
    <Space.Compact style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>{valueNode}</div>
      <Cascader<ContextSelectorItem>
        value={selectedPath}
        options={options}
        loadData={handleLoadData}
        onChange={handleVariableSelect}
      >
        <Button type={selectedPath.length ? 'primary' : 'default'}>x</Button>
      </Cascader>
    </Space.Compact>
  );
}

function WorkflowUserSelectInput(props: {
  value?: ReceiverScalarValue | null;
  onChange?: (next: ReceiverScalarValue) => void;
}) {
  const { value, onChange } = props;
  const { t } = useNotificationTranslation();
  const ctx = useFlowContext();
  const workflowVariableOptions = useWorkflowVariableOptions({ types: [isUserKeyField] });
  const translateWorkflowLabel = useMemoizedFn(
    (key: string) => ctx?.t?.(key, { ns: 'workflow', nsMode: 'fallback' }) ?? t(key),
  );
  const metaTree = useMemo<MetaTreeNode[]>(() => {
    return [
      {
        name: WORKFLOW_VARIABLE_ROOTS.null,
        title: translateWorkflowLabel('Null'),
        type: 'string',
        paths: [WORKFLOW_VARIABLE_ROOTS.null],
      },
      {
        name: 'constant',
        title: translateWorkflowLabel('Constant'),
        type: 'string',
        paths: ['constant'],
      },
      ...normalizeWorkflowVariableOptions(workflowVariableOptions, translateWorkflowLabel),
    ];
  }, [translateWorkflowLabel, workflowVariableOptions]);

  return (
    <WorkflowUserVariableInput
      value={value ?? ''}
      onChange={onChange}
      metaTree={metaTree}
      translate={translateWorkflowLabel}
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
    <WorkflowUserSelectInput
      value={typeof props.value === 'string' || typeof props.value === 'number' ? props.value : ''}
      onChange={props.onChange}
    />
  );
}

export default UserSelect;
