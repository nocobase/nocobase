/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowSettingsContext } from '@nocobase/flow-engine';
import React from 'react';
import { EditableFieldModel } from '../models/fields/EditableField/EditableFieldModel';
import { VariableFieldInput } from './VariableFieldInput';

interface VariableEditableValueProps {
  value: any;
  onChange: (value: any) => void;
}

export const VariableEditableValue = (props: VariableEditableValueProps) => {
  const { value, onChange } = props;
  const ctx = useFlowSettingsContext<EditableFieldModel>();
  const model = ctx.model;
  const metaTree = ctx.getPropertyMetaTree();

  return <VariableFieldInput model={model} key={model.uid} metaTree={metaTree} value={value} onChange={onChange} />;
};
