/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { useField } from '@formily/react';
import { Select } from '@formily/antd-v5';
import { observer, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';

import {
  resolveCustomFieldOperatorList,
  resolveDefaultCustomFieldOperator,
  toOperatorSelectOptions,
} from './customFieldOperators';

export const FieldOperatorSelect = observer((props: any) => {
  const { fieldModel, source = [], fieldModelProps = {}, value, onChange, ...others } = props;
  const currentField = useField<any>();
  const flowEngine = useFlowEngine();
  const ctx = useFlowContext();
  const formValues = currentField?.form?.values || {};
  const resolvedFieldModel = fieldModel || formValues?.fieldModel;
  const resolvedSource = source.length ? source : formValues?.source || [];
  const resolvedFieldModelProps =
    formValues?.fieldModelProps && Object.keys(formValues.fieldModelProps).length > 0
      ? formValues.fieldModelProps
      : fieldModelProps;

  const sourceKey = Array.isArray(resolvedSource) ? resolvedSource.join('.') : '';
  const fieldModelPropsMode = resolvedFieldModelProps?.mode;
  const fieldModelPropsAllowMultiple = resolvedFieldModelProps?.allowMultiple;
  const fieldModelPropsMultiple = resolvedFieldModelProps?.multiple;
  const fieldModelPropsDataSourceKey = resolvedFieldModelProps?.recordSelectDataSourceKey;
  const fieldModelPropsTargetCollection = resolvedFieldModelProps?.recordSelectTargetCollection;
  const fieldModelPropsValueField = resolvedFieldModelProps?.recordSelectValueField;

  const operatorList = useMemo(() => {
    return resolveCustomFieldOperatorList({
      flowEngine,
      fieldModel: resolvedFieldModel,
      source: resolvedSource,
      fieldModelProps: resolvedFieldModelProps,
    });
  }, [
    flowEngine,
    resolvedFieldModel,
    sourceKey,
    fieldModelPropsMode,
    fieldModelPropsAllowMultiple,
    fieldModelPropsMultiple,
    fieldModelPropsDataSourceKey,
    fieldModelPropsTargetCollection,
    fieldModelPropsValueField,
  ]);

  const options = useMemo(() => toOperatorSelectOptions(operatorList, (text) => ctx.t(text)), [operatorList, ctx]);

  useEffect(() => {
    if (!options.length) {
      if (value !== undefined) {
        onChange?.(undefined);
      }
      return;
    }
    const hasCurrentValue = options.some((item) => item.value === value);
    if (hasCurrentValue) return;
    const nextValue = resolveDefaultCustomFieldOperator({
      flowEngine,
      fieldModel: resolvedFieldModel,
      source: resolvedSource,
      fieldModelProps: resolvedFieldModelProps,
    });
    if (nextValue !== value) {
      onChange?.(nextValue);
    }
  }, [
    flowEngine,
    resolvedFieldModel,
    onChange,
    options,
    sourceKey,
    value,
    fieldModelPropsMode,
    fieldModelPropsAllowMultiple,
    fieldModelPropsMultiple,
    fieldModelPropsDataSourceKey,
    fieldModelPropsTargetCollection,
    fieldModelPropsValueField,
  ]);

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder={ctx.t('Please select')}
      {...others}
      options={options}
      value={value}
      onChange={onChange}
      disabled={options.length === 0}
    />
  );
});
