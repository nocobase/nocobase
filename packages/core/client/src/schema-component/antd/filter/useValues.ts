/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import { merge } from '@formily/shared';
import flat, { unflatten } from 'flat';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { FilterContext } from './context';

interface UseValuesReturn {
  fields: any[];
  collectionField: any;
  dataIndex: string[];
  operators: any[];
  operator: any;
  schema: any;
  value: any;
  setDataIndex: (dataIndex: string[]) => void;
  setOperator: (operatorValue: string) => void;
  setValue: (value: any) => void;
}

// import { useValues } from './useValues';
const findOption = (dataIndex = [], options) => {
  let items = options;
  let option;
  dataIndex?.forEach?.((name) => {
    const item = items.find((item) => item.name === name);
    if (item) {
      option = item;
    }
    items = item?.children || [];
  });
  return option;
};

export const useValues = (): UseValuesReturn => {
  const { name } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const field = useField<any>();
  const { options, collectionName, field: ctxField } = useContext(FilterContext) || {};
  const values: object = flat(field.value || {});
  const path = Object.keys(values).shift() || '';

  const collectionField = useMemo(() => {
    const [fieldPath = ''] = path.split('.$');
    return getCollectionJoinField(`${collectionName || name}.${fieldPath}`);
  }, [name, path]);

  const data2value = useCallback(() => {
    field.value = field.data.dataIndex
      ? flat.unflatten({
          [`${field.data.dataIndex?.join('.')}.${field.data?.operator?.value}`]: field.data?.value,
        })
      : {};
  }, [field]);

  const value2data = () => {
    field.data = field.data || {};
    if (!path || !options) {
      return;
    }
    const [fieldPath = '', otherPath = ''] = path.split('.$');
    const [operatorValue] = otherPath.split('.', 2);
    const dataIndex = fieldPath.split('.');
    const option = findOption(dataIndex, options);
    const operators = option?.operators;
    const operator = operators?.find?.((item) => item.value === `$${operatorValue}`);
    field.data.dataIndex = dataIndex;
    if (dataIndex?.length > 1) {
      const fieldNames = dataIndex.concat();
      fieldNames.pop();
      const targetField = getCollectionJoinField(`${name}.${fieldNames.join('.')}`);
      ctxField.collectionName = targetField?.target;
    } else {
      ctxField.collectionName = null;
    }
    field.data.operators = operators;
    field.data.operator = operator;
    field.data.schema = merge(option?.schema, operator?.schema);
    field.data.value = get(unflatten(field.value), `${fieldPath}.$${operatorValue}`);
  };

  useEffect(value2data, [field.path]);

  const setDataIndex = useCallback(
    (dataIndex) => {
      const option = findOption(dataIndex, options);
      const operator = option?.operators?.[0];
      field.data = field.data || {};
      field.data.operators = option?.operators;
      field.data.operator = operator;
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.dataIndex = dataIndex;
      if (dataIndex?.length > 1) {
        const fieldNames = dataIndex.concat();
        fieldNames.pop();
        const targetField = getCollectionJoinField(`${name}.${fieldNames.join('.')}`);
        ctxField.collectionName = targetField?.target;
      } else {
        ctxField.collectionName = null;
      }
      field.data.value = operator?.noValue ? operator.default || true : undefined;
      data2value();
    },
    [data2value, field, options],
  );

  const setOperator = useCallback(
    (operatorValue) => {
      const operator = field.data?.operators?.find?.((item) => item.value === operatorValue);
      field.data.operator = operator;
      const option = findOption(field.data.dataIndex, options);
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.value = operator.noValue ? operator.default || true : undefined;
      data2value();
    },
    [data2value, field.data, options],
  );

  const setValue = useCallback(
    (value) => {
      field.data.value = value;
      data2value();
    },
    [data2value, field.data],
  );

  return {
    fields: options,
    ...(field?.data || {}),
    collectionField,
    setDataIndex,
    setOperator,
    setValue,
  };
};
