import { useField } from '@formily/react';
import { merge } from '@formily/shared';
import flat from 'flat';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { useContext, useEffect } from 'react';
import { FilterContext, FilterLogicContext } from './context';

// import { useValues } from './useValues';
const findOption = (dataIndex = [], options) => {
  let items = options;
  let option;
  dataIndex?.forEach?.((name, index) => {
    const item = items.find((item) => item.name === name);
    if (item) {
      option = item;
    }
    items = item?.children || [];
  });
  return option;
};

export const useValues = () => {
  const field = useField<any>();
  const logic = useContext(FilterLogicContext);
  const { options } = useContext(FilterContext);
  const data2value = () => {
    field.value = flat.unflatten({
      [`${field.data.dataIndex?.join('.')}.${field.data?.operator?.value}`]: field.data?.value,
    });
  };
  const value2data = () => {
    field.data = field.data || {};
    const values = flat(field.value);
    const path = Object.keys(values).shift() || '';
    if (!path) {
      return;
    }
    const [fieldPath = '', otherPath = ''] = path.split('.$');
    const [operatorValue] = otherPath.split('.', 2);
    const dataIndex = fieldPath.split('.');
    const option = findOption(dataIndex, options);
    const operators = option?.operators;
    const operator = operators?.find?.((item) => item.value === `$${operatorValue}`);
    field.data.dataIndex = dataIndex;
    field.data.operators = operators;
    field.data.operator = operator;
    field.data.schema = merge(option?.schema, operator?.schema);
    field.data.value = get(field.value, `${fieldPath}.$${operatorValue}`);
  };
  useEffect(value2data, [logic]);
  return {
    fields: options,
    ...field.data,
    setDataIndex(dataIndex) {
      const option = findOption(dataIndex, options);
      const operator = option?.operators?.[0];
      field.data = field.data || {};
      field.data.operators = option?.operators;
      field.data.operator = operator;
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.dataIndex = dataIndex;
      field.data.value = null;
      data2value();
    },
    setOperator(operatorValue) {
      const operator = field.data?.operators?.find?.((item) => item.value === operatorValue);
      field.data.operator = operator;
      const option = findOption(field.data.dataIndex, options);
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.value = operator.noValue ? operator.default || true : null;
      data2value();
    },
    setValue(value) {
      field.data.value = value;
      data2value();
    },
  };
};
