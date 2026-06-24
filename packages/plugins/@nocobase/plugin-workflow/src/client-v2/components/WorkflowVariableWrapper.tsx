/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { FlowContextSelector, VariableTag, type MetaTreeNode } from '@nocobase/flow-engine';
import type { FlowContextSelectorProps } from '@nocobase/flow-engine';
import { Space } from 'antd';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from '../canvas/useWorkflowVariableOptions';
import { formatWorkflowPathToValue, parseWorkflowValueToPath } from '../canvas/workflowVariableConverters';
import { useHideVariable } from './HideVariableContext';

type BaseWrapperRenderProps<TValue> = {
  value?: TValue | undefined;
  onChange?: (value: TValue | null) => void;
};

export type WorkflowVariableWrapperProps<TValue> = {
  value?: TValue | string | null;
  onChange?: (value: TValue | string | null) => void;
  variableOptions?: UseWorkflowVariableOptions;
  render: (props: BaseWrapperRenderProps<TValue>) => React.ReactNode;
  clearValue?: TValue | null;
  selectorProps?: Partial<FlowContextSelectorProps>;
};

function isWorkflowVariableValue(value: unknown): value is string {
  return typeof value === 'string' && /^\{\{\s*[^{}]+?\s*\}\}$/.test(value);
}

export function WorkflowVariableWrapper<TValue>({
  value,
  onChange,
  variableOptions,
  render,
  clearValue = null,
  selectorProps,
}: WorkflowVariableWrapperProps<TValue>) {
  const hideVariable = useHideVariable();
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const [selectedMetaTreeNode, setSelectedMetaTreeNode] = useState<MetaTreeNode | undefined>();
  const isVariable = isWorkflowVariableValue(value);
  const translatedMetaTree = useMemo(() => metaTree, [metaTree]);
  const hasVariableOptions = !hideVariable && translatedMetaTree.length > 0;

  if (!hasVariableOptions) {
    return (
      <>
        {render({
          value: (value as TValue | null | undefined) ?? undefined,
          onChange: (nextValue) => onChange?.(nextValue),
        })}
      </>
    );
  }

  return (
    <Space.Compact block>
      {isVariable ? (
        <VariableTag
          value={value}
          metaTree={translatedMetaTree}
          metaTreeNode={selectedMetaTreeNode}
          onClear={() => onChange?.(clearValue)}
        />
      ) : (
        render({
          value: (value as TValue | null | undefined) ?? undefined,
          onChange: (nextValue) => onChange?.(nextValue),
        })
      )}
      <FlowContextSelector
        metaTree={translatedMetaTree}
        value={isVariable ? value : undefined}
        parseValueToPath={parseWorkflowValueToPath}
        formatPathToValue={formatWorkflowPathToValue}
        onChange={(nextValue, metaTreeNode) => {
          setSelectedMetaTreeNode(metaTreeNode);
          onChange?.(nextValue);
        }}
        {...selectorProps}
      />
    </Space.Compact>
  );
}

export default WorkflowVariableWrapper;
