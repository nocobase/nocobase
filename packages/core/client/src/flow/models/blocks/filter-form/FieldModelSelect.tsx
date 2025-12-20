/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { FilterableItemModel, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { Select } from '@formily/antd-v5';

export function FieldModelSelect(props) {
  const { source = [], onChange } = props;
  const flowEngine = useFlowEngine();
  const ctx = useFlowContext();

  const defaultValue = useMemo(() => {
    if (!source.length) return undefined;
    const collectionField = flowEngine.dataSourceManager.getCollectionField(source.join('.'));
    const binding = FilterableItemModel.getDefaultBindingByField(ctx.model.context, collectionField);
    if (!binding) {
      return;
    }
    return binding.modelName;
  }, [source.join('.')]);

  useEffect(() => {
    if (!props.value && defaultValue) {
      onChange?.(defaultValue);
    }
  }, [defaultValue, onChange, props.value]);

  return <Select allowClear {...props} value={props.value ?? defaultValue} />;
}
