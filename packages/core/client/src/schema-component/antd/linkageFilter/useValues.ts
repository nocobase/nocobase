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
import { cloneDeep, last, uniqBy } from 'lodash';
import { useCallback, useEffect } from 'react';

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
  if (!str) return null;
  const match = str.match(/\{\{\$(.*?)\}\}/);
  if (!match) return null;

  const [firstKey, ...subKeys] = match[1].split('.'); // 拆分层级
  const keys = [`$${firstKey}`, ...subKeys]; // 第一层保留 `$`，后续不带 `$`
  let currentOptions = options;
  let option = null;
  for (const key of keys) {
    option = currentOptions.find((opt) => opt.value === key || opt.name === key);
    if (!option) return null;

    // 进入下一层 children 查找
    if (Array.isArray(option.children) || option.isLeaf === false) {
      currentOptions = option.children || option?.field?.children || [];
    } else {
      return option; // 没有 children 直接返回
    }
  }

  return option;
};
const operators = [
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];
export const useValues = (scopes): UseValuesReturn => {
  const field = useField<any>();
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
    /**
     * 等待获取最新的scopes
     */
    setTimeout(() => {
      const option = findOption(leftVar, scopes);
      field.data = field.data || {};
      if (!field.value) {
        return;
      }
      const combOperators = uniqBy([...(field.data.operators || []), ...(option?.operators || [])], 'value');
      field.data.operators = combOperators.length ? combOperators : operators;
      field.data.leftVar = leftVar;
      field.data.rightVar = rightVar;
      const operator = combOperators?.find((v) => v.value === op);
      field.data.operator = field.data.operator || operator;
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = field.data?.schema || merge(s1, s2);
    }, 100);
  };

  useEffect(value2data, [field.value.leftVar, scopes]);

  const setLeftValue = useCallback(
    (leftVar, paths) => {
      const option: any = last(paths);
      field.data = field.data || {};
      field.data.operators = option?.operators || operators;
      const operator = field.data.operators?.[0];
      field.data.operator = operator;
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.leftVar = leftVar;
      field.data.rightVar = operator?.noValue ? operator.default || true : undefined;
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
      if (!operator.noValue) {
        setRightValue(undefined);
      }
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
