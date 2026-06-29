/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { FlowContextSelector } from '@nocobase/flow-engine';
import { Input, Space } from 'antd';
import { formatWorkflowPathToValue, parseWorkflowValueToPath } from './workflowVariableConverters';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';
import { useHideVariable } from '../components/HideVariableContext';
import { WorkflowVariableTag, isWorkflowVariableValue, type WorkflowVariableTagProps } from './WorkflowVariableTag';

export type WorkflowVariableSelectProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  status?: WorkflowVariableTagProps['status'];
  variableOptions?: UseWorkflowVariableOptions;
};

/**
 * Pure workflow variable selector: the left side is read-only and only shows
 * the selected variable tag (with clear) or an empty placeholder input. Users
 * must select from the workflow variable cascader and cannot type freeform
 * content after choosing a variable.
 */
export function WorkflowVariableSelect(props: WorkflowVariableSelectProps) {
  const { value, onChange, disabled, placeholder, className, style, status, variableOptions } = props;
  const hideVariable = useHideVariable();
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const translatedMetaTree = useMemo(() => metaTree, [metaTree]);
  const isVariable = isWorkflowVariableValue(value);
  const hasVariableOptions = !hideVariable && translatedMetaTree.length > 0;

  return (
    <Space.Compact block className={className} style={style}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {isVariable ? (
          <WorkflowVariableTag
            value={value}
            metaTree={translatedMetaTree}
            disabled={disabled}
            status={status}
            onClear={() => onChange?.(null)}
          />
        ) : (
          <Input
            value={undefined}
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            status={status}
            style={{ width: '100%' }}
          />
        )}
      </div>
      {hasVariableOptions ? (
        <FlowContextSelector
          metaTree={translatedMetaTree}
          value={isVariable ? value : undefined}
          active={isVariable}
          disabled={disabled}
          parseValueToPath={parseWorkflowValueToPath}
          formatPathToValue={formatWorkflowPathToValue}
          onChange={(nextValue, _metaTreeNode) => {
            onChange?.(nextValue || null);
          }}
        />
      ) : null}
    </Space.Compact>
  );
}

export default WorkflowVariableSelect;
