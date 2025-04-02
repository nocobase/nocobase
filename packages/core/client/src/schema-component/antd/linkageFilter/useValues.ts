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
import { cloneDeep, last, get } from 'lodash';
import { useCallback, useContext, useEffect } from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
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

const findOption = (str, options) => {
  // 使用正则表达式提取 $mainKey 和 childKey
  const match = str.match(/\{\{\$(.*?)\}\}/); // 提取 $mainKey
  if (!match) return null;

  const fullKey = match[1]; // 完整的 key 例如 nForm.select 或 nRole
  const [mainKey, childKey] = fullKey.split('.'); // 通过 '.' 分割，mainKey 为分割前部分，childKey 为分割后的部分

  const mainValue = `$${mainKey}`;

  const option = options.find((option) => option.value === mainValue);
  if (!option) return null;

  if (childKey && option.isLeaf === false && option.children.length > 0) {
    return option.children.find((child) => child.value === childKey) || null;
  }

  return option;
};

export const useValues = (): UseValuesReturn => {
  const { name } = useCollection_deprecated();
  const field = useField<any>();
  const { scopes } = useContext(FilterContext) || {};
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
    setTimeout(() => {
      const option = findOption(leftVar, scopes);
      field.data = field.data || {};
      if (!field.value) {
        return;
      }

      field.data.operators = option?.operators;
      field.data.leftVar = leftVar;
      field.data.rightVar = rightVar;
      const operator = option?.operators?.find((v) => v.value === op);
      field.data.operator = operator;
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
    });
  };

  useEffect(value2data, [field.path, leftVar, scopes]);

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
    [data2value, field],
  );

  const setOperator = useCallback(
    (operatorValue) => {
      const operator = field.data?.operators?.find?.((item) => item.value === operatorValue);
      field.data.operator = operator;
      const s1 = cloneDeep(field.data.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.value = operator.noValue ? operator.default || true : undefined;
      data2value();
    },
    [data2value, field.data],
  );

  const setRightValue = useCallback(
    (rightVar) => {
      field.data.rightVar = rightVar;
      data2value();
    },
    [data2value, field.data],
  );
  return {
    ...(field?.data || {}),
    setLeftValue,
    setOperator,
    setRightValue,
  };
};
