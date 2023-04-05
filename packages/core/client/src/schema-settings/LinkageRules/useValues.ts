import { useField } from '@formily/react';
import { useEffect, useContext } from 'react';
import { LinkageLogicContext } from './context';

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
  const logic = useContext(LinkageLogicContext);

  const value2data = () => {
    field.data = { ...(field.initialValue || field.value) };
    const dataIndex = field.data?.targetFields;
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
