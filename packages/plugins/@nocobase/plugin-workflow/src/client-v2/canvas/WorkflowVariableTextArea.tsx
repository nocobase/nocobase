/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { TextAreaWithContextSelector, makeFormatVariablePath, type VariableDelimiters } from '@nocobase/client-v2';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';

type AutoSize = boolean | { minRows?: number; maxRows?: number };

export type WorkflowVariableTextAreaProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  rows?: number;
  maxRows?: number;
  autoSize?: AutoSize;
  delimiters?: VariableDelimiters;
  variableOptions?: UseWorkflowVariableOptions;
};

export function WorkflowVariableTextArea(props: WorkflowVariableTextAreaProps) {
  const { variableOptions, rows, maxRows, autoSize, delimiters = ['{{', '}}'], ...rest } = props;
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const treeGetter = useMemo(() => () => metaTree, [metaTree]);
  const formatPathToValue = useMemo(() => makeFormatVariablePath(delimiters), [delimiters]);

  const resolvedRows = typeof autoSize === 'object' ? autoSize.minRows ?? rows : rows;
  const resolvedMaxRows = typeof autoSize === 'object' ? autoSize.maxRows ?? maxRows : maxRows;

  return (
    <TextAreaWithContextSelector
      {...rest}
      rows={resolvedRows}
      maxRows={resolvedMaxRows}
      metaTree={treeGetter}
      formatPathToValue={(meta) => formatPathToValue(meta) ?? ''}
    />
  );
}

export default WorkflowVariableTextArea;
