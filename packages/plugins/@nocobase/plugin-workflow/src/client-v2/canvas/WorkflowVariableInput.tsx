/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The v2 workflow variable picker (doc §5). A downstream node author drops this
 * into a `FieldsetLoader` form like any antd input — it reads the current node
 * from NodeContext and the upstream chain itself, so the author never wires
 * context.
 *
 * It reuses flow-engine's low-level `VariableHybridInput` (fed a
 * workflow-constructed `MetaTreeNode` tree from `useWorkflowVariableOptions`),
 * NOT the top-level global `VariableInput` (whose tree is the global registry).
 *
 * Workflow variables serialize as `{{$jobsMapByNodeKey.<nodeKey>.<field>}}` —
 * the adapter already builds `paths` as `['$jobsMapByNodeKey', nodeKey, …]`, so
 * the converters here just join/split that path inside `{{ }}`.
 */

import React, { useMemo } from 'react';
import { VariableHybridInput } from '@nocobase/flow-engine';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';
import { workflowVariableConverters } from './workflowVariableConverters';

export type WorkflowVariableInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Validation status (red/amber border). Usually omitted — inside a
   *  `Form.Item` the status is inherited automatically. */
  status?: 'error' | 'warning';
  /** Variable-tree options forwarded to each upstream `useVariables` (types
   *  filter, appends, depth, fieldNames). */
  variableOptions?: UseWorkflowVariableOptions;
};

export function WorkflowVariableInput(props: WorkflowVariableInputProps) {
  const { variableOptions, ...rest } = props;
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const tree = useMemo(() => metaTree, [metaTree]);
  return <VariableHybridInput {...rest} metaTree={tree} converters={workflowVariableConverters} />;
}
