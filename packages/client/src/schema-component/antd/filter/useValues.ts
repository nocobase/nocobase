import { useField } from '@formily/react';
import { Input } from 'antd';
import flat from 'flat';
import { useContext } from 'react';
import { FilterContext } from './context';

export const useValues = () => {
  const { options } = useContext(FilterContext);
  const field = useField<any>();
  const obj = flat(field.value || {});
  const key = Object.keys(obj).shift() || '';
  const [path, others = ''] = key.split('.$');
  let [operator] = others.split('.');
  const dataIndex = path.split('.');
  let maxDepth = dataIndex.length;
  if (operator) {
    operator = '$' + operator;
    ++maxDepth;
  }
  const values = flat(field.value || {}, { maxDepth });
  const value = Object.values<any>(values).shift();
  const findOption = (dataIndex = []) => {
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
  const option = findOption(dataIndex);
  const operators = option?.operators;
  return {
    option,
    dataIndex,
    options,
    operators,
    operator,
    value,
    component: [Input, {}],
    // 当 dataIndex 变化，value 清空
    setDataIndex(di: string[]) {
      if (!di) {
        field.value = {};
        return;
      }
      const option = findOption(di);
      const op = option?.operators?.[0]?.value || '$eq';
      field.value = flat.unflatten({
        [`${di.join('.')}.${op}`]: null,
      });
    },
    // 如果只是 Operator 变化，value 要保留
    setOperator(op: string) {
      field.value = flat.unflatten({
        [`${dataIndex.join('.')}.${op}`]: value,
      });
    },
    setValue(v: any) {
      field.value = flat.unflatten({
        [`${dataIndex.join('.')}.${operator || '$eq'}`]: v,
      });
    },
  };
};
