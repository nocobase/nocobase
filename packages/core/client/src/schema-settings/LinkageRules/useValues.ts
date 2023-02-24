import { useField } from '@formily/react';
import { useContext, useEffect } from 'react';
import { FilterLogicContext } from './context';

const findOption = (dataIndex = [], options) => {
  let items = options;
  let option;
  dataIndex?.forEach?.((name, index) => {
    const item = items.find((v) => v.name === name);
    if (item) {
      option = item;
    }
    items = item?.children || [];
  });
  return option;
};

export const useValues = (options) => {
  const field = useField<any>();
  const logic = useContext(FilterLogicContext);

  const value2data = () => {
    field.data = { ...field.initialValue };
    const dataIndex = field.initialValue?.targetFields;
    const option = (dataIndex && findOption(dataIndex, options)) || {};
    const operators = option?.operators || [];
    field.data.operators = operators;
    field.data.schema = option?.schema;
  };
  useEffect(value2data, [logic]);
  return {
    fields: options,
    ...field.data,
    setDataIndex(dataIndex) {
      const option = findOption(dataIndex, options);
      field.data = field.data || {};
      const operators = option?.operators;
      field.data.operators = operators?.filter((v) => {
        // if (dataIndex.length > 1) {
        //   return v.value !== 'value';
        // }
        return true;
      });
      field.data.schema = option?.schema;
      field.value = field.value || [];
      field.data.operator = undefined;
      field.data.value = undefined;
      field.value = { ...field.value, targetFields: dataIndex, operator: undefined, value: undefined };
    },
    setOperator(operatorValue) {
      field.data.operator = operatorValue;
      field.value = { ...field.value, operator: operatorValue };
    },
    setValue(value) {
      field.data.value = value;
      field.value = { ...field.value, value };
    },
  };
};
