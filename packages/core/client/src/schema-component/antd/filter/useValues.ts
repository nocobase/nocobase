import { useField } from '@formily/react';
import { merge } from '@formily/shared';
import flat, { unflatten } from 'flat';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { useContext, useEffect } from 'react';
import { FilterContext } from './context';
import { useCollection, useCollectionManager } from '../../../collection-manager';

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

export const useValues = () => {
  const field = useField<any>();
  const { name } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const ctx: any = useContext(FilterContext) || {};
  const { options } = ctx;
  const data2value = () => {
    field.value = flat.unflatten({
      [`${field.data.dataIndex?.join('.')}.${field.data?.operator?.value}`]: field.data?.value,
    });
  };
  const value2data = () => {
    field.data = field.data || {};
    const values: object = flat(field.value || {});
    const path = Object.keys(values).shift() || '';
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
      ctx.field.collectionName = targetField?.target;
    } else {
      ctx.field.collectionName = null;
    }
    field.data.operators = operators;
    field.data.operator = operator;
    field.data.schema = merge(option?.schema, operator?.schema);
    field.data.value = get(unflatten(field.value), `${fieldPath}.$${operatorValue}`);
  };
  useEffect(value2data, [field.path]);
  return {
    fields: options,
    ...(field?.data || {}),
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
      if (dataIndex?.length > 1) {
        const fieldNames = dataIndex.concat();
        fieldNames.pop();
        const targetField = getCollectionJoinField(`${name}.${fieldNames.join('.')}`);
        ctx.field.collectionName = targetField?.target;
      } else {
        ctx.field.collectionName = null;
      }
      field.data.value = operator?.noValue ? operator.default || true : undefined;
      data2value();
    },
    setOperator(operatorValue) {
      const operator = field.data?.operators?.find?.((item) => item.value === operatorValue);
      field.data.operator = operator;
      const option = findOption(field.data.dataIndex, options);
      const s1 = cloneDeep(option?.schema);
      const s2 = cloneDeep(operator?.schema);
      field.data.schema = merge(s1, s2);
      field.data.value = operator.noValue ? operator.default || true : undefined;
      data2value();
    },
    setValue(value) {
      field.data.value = value;
      data2value();
    },
  };
};
