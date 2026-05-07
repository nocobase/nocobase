/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { FilterableItemModel, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { Select } from '@formily/antd-v5';

export function FieldModelSelect(props) {
  const { source = [], onChange } = props;
  const flowEngine = useFlowEngine();
  const ctx = useFlowContext();
  const valueMap = props.valueMap || {};
  const sourceKey = source.join('.');
  const previousSourceKeyRef = useRef<string>();
  const normalizeValue = useMemo(() => {
    return (value) => (valueMap && valueMap[value] ? valueMap[value] : value);
  }, [valueMap]);

  const defaultValue = useMemo(() => {
    if (!source.length) return undefined;
    const collectionField = flowEngine.dataSourceManager.getCollectionField(sourceKey);
    const binding = FilterableItemModel.getDefaultBindingByField(ctx.model.context, collectionField);
    if (!binding) {
      return;
    }
    return normalizeValue(binding.modelName);
  }, [sourceKey, normalizeValue]);

  useEffect(() => {
    if (!defaultValue) {
      previousSourceKeyRef.current = sourceKey;
      return;
    }

    const sourceChanged = previousSourceKeyRef.current !== undefined && previousSourceKeyRef.current !== sourceKey;
    previousSourceKeyRef.current = sourceKey;

    // Migrate legacy value if mapped
    const currentNormalized = normalizeValue(props.value);
    if (props.value && props.value !== currentNormalized && currentNormalized !== defaultValue) {
      onChange?.(currentNormalized);
      return;
    }

    // Keep field model aligned with latest source metadata.
    // Users can still adjust it manually after the auto-fill.
    if ((!props.value || sourceChanged) && currentNormalized !== defaultValue) {
      onChange?.(defaultValue);
    }
  }, [defaultValue, onChange, props.value, sourceKey, normalizeValue]);

  return <Select allowClear {...props} value={normalizeValue(props.value ?? defaultValue)} />;
}
