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
import { cloneDeep, last, get } from 'lodash';
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
  setRightValue: (value: any) => void;
  setLeftValue: (value: any) => void;
  leftVar: any;
  rightVar: any;
}

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
  const field = useField<any>();
  const { options } = useContext(FilterContext) || {};
  const { op, leftVar, rightVar } = field.value || {};

  const data2value = useCallback(() => {
    field.value = field.data.leftVar
      ? {
          op: field.data.operator?.value,
          leftVar: field.data.leftVar,
          rightVar: field.data?.rightVar,
        }
      : {};
  }, [field]);

  const value2data = () => {
    field.data = field.data || {};
    if (!field.value) {
      return;
    }

    // field.data.operators = operators;
    field.data.operator = op;
    field.data.leftVar = leftVar;
    field.data.rightVar = rightVar;
  };

  useEffect(value2data, [field.path]);

  const setLeftValue = useCallback(
    (leftVar, paths) => {
      const option: any = last(paths);
      const operator = option?.operators?.[0];
      field.data = field.data || {};
      field.data.operators = option?.operators;
      field.data.operator = operator;
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.leftVar = leftVar;
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
      // data2value();
    },
    [data2value, field.data, options],
  );

  const setRightValue = useCallback(
    (rightVar) => {
      field.data.rightVar = rightVar;
      data2value();
    },
    [data2value, field.data],
  );
  return {
    fields: options,
    ...(field?.data || {}),
    setLeftValue,
    setOperator,
    setRightValue,
  };
};
