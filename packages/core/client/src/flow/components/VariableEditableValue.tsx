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

  console.log('🏁 VariableEditableValue render:', { value });

  // 通过 ctx = useFlowSettingsContext<EditableFieldModel>() 获取上下文
  const ctx = useFlowSettingsContext<EditableFieldModel>();
  // 进一步通过 ctx.model 和 ctx.getPropertyMetaTree() 获取 metaTree 和 model
  const model = ctx.model;
  const metaTree = ctx.getPropertyMetaTree();

  return (
    <VariableFieldInput
      model={model}
      metaTree={metaTree}
      value={value}
      onChange={(newValue) => {
        console.log('🚀 VariableEditableValue onChange:', { oldValue: value, newValue });
        onChange(newValue);
      }}
    />
  );
};
