import { useField } from '@formily/react';
import { merge } from '@formily/shared';
import flat from 'flat';
import get from 'lodash/get';
import { useContext, useEffect } from 'react';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { FilterLogicContext } from './context';

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

  // const options=[]
  const data2value = () => {
    field.value = flat.unflatten({
      [`${field.data.dataIndex?.join('.')}.${field.data?.operator?.value}`]: field.data?.value,
    });
  };
  const value2data = () => {
    console.log(field);
    field.data = { ...field.initialValue };
    // const values = (field.value && flat(field.value)) || {};
    // const path = Object.keys(values).shift() || '';
    // if (!path) {
    //   return;
    // }
    // const [fieldPath, otherPath] = path.split('.$');
    // const [operatorValue] = otherPath.split('.', 2);
    // const dataIndex = fieldPath.split('.');
    // const option = findOption(dataIndex, options);
    // const operators = option?.operators;
    // const operator = operators?.find?.((item) => item.value === `$${operatorValue}`);
    // field.data.dataIndex = dataIndex;
    // field.data.operators = operators;
    // field.data.operator = operator;
    // field.data.schema = merge(option?.schema, operator?.schema);
    // field.data.value = get(field.value, `${fieldPath}.$${operatorValue}`);
  };
  useEffect(value2data, [logic]);
  return {
    fields: options,
    ...field.data,
    setDataIndex(dataIndex) {
      // const option = findOption(dataIndex, options);
      // const operator = option?.operators?.[0];
      field.data = field.data || {};
      // field.data.operators = option?.operators;
      // field.data.operator = operator;
      // field.data.schema = merge(option?.schema, operator?.schema);
      // field.data.dataIndex = dataIndex;
      field.data.value = dataIndex;
      field.value=field.value||[]
      field.value = { targetFields: dataIndex };
      // data2value();
    },
    setOperator(operatorValue) {
      const operator = field.data?.operators?.find?.((item) => item.value === operatorValue);
      console.log(operatorValue);
      field.data.operator = operatorValue;
      // field.data.schema = merge(field.data.schema, operator.schema);
      // field.data.value = operator.noValue ? operator.default || true : null;
      // data2value();
      field.value = { ...field.value, operator: operatorValue };
    },
    setValue(value) {
      field.data.value = value;
      data2value();
    },
  };
};
