/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { TypedVariableInput, type TypedConstantSpec, type TypedVariableInputProps } from '@nocobase/client-v2';
import { useWorkflowVariableOptions, type UseWorkflowVariableOptions } from './useWorkflowVariableOptions';
import { useHideVariable } from '../components/HideVariableContext';

export const WORKFLOW_TYPED_CONSTANT_TYPES: TypedConstantSpec[] = ['string', 'number', 'boolean', 'date', 'object'];

export type WorkflowTypedVariableInputProps = Omit<
  TypedVariableInputProps,
  'extraNodes' | 'metaTree' | 'namespaces'
> & {
  variableOptions?: UseWorkflowVariableOptions;
};

export function WorkflowTypedVariableInput({ variableOptions, ...rest }: WorkflowTypedVariableInputProps) {
  const metaTree = useWorkflowVariableOptions(variableOptions);
  const hideVariable = useHideVariable();
  return <TypedVariableInput {...rest} hideVariable={hideVariable} metaTree={metaTree} />;
}
