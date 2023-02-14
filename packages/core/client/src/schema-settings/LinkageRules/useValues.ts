import { useField } from '@formily/react';
import flat from 'flat';
import { useContext, useEffect } from 'react';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { FilterLogicContext } from './context';

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
  };
  useEffect(value2data, [logic]);
  return {
    fields: options,
    ...field.data,
    setDataIndex(dataIndex) {
      field.data = field.data || {};
      field.data.value = dataIndex;
      field.value = field.value || [];
      field.value = { ...field.value, targetFields: dataIndex };
    },
    setOperator(operatorValue) {
      field.data.operator = operatorValue;
      field.value = { ...field.value, operator: operatorValue };
    },
    setValue(value) {
      field.data.value = value;
      data2value();
    },
  };
};
