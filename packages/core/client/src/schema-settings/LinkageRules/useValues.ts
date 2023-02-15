import { useField } from '@formily/react';
import flat from 'flat';
import { useContext, useEffect } from 'react';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { FilterLogicContext } from './context';

const findOption = (dataIndex = [], options) => {
  let items = options;
  let option;
  dataIndex?.forEach?.((name, index) => {
    const item = items.find((v) => v.name === name[0]);
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

  // const options=[]
  const data2value = () => {
    field.value = flat.unflatten({
      [`${field.data.dataIndex?.join('.')}.${field.data?.operator?.value}`]: field.data?.value,
    });
  };
  const value2data = () => {
    field.data = { ...field.initialValue };
    const dataIndex = field.initialValue?.targetFields;
    const option = dataIndex&&findOption(dataIndex, options)||{};
    field.data.schema = option?.schema;
  };
  useEffect(value2data, [logic]);
  return {
    fields: options,
    ...field.data,
    setDataIndex(dataIndex) {
      const option = findOption(dataIndex, options);
      field.data = field.data || {};
      field.data.schema = option?.schema;
      field.value = field.value || [];
      field.value = { ...field.value, targetFields: dataIndex };
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
