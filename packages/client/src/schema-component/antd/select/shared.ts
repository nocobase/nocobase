import { toArr } from '@formily/shared';

export const defaultFieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
  options: 'children',
};

export const getCurrentOptions = (values, dataSource, fieldNames) => {
  values = toArr(values).map((val) => (typeof val === 'object' ? val[fieldNames.value] : val));
  const findOptions = (options: any[]) => {
    let current = [];
    for (const option of options) {
      if (values.includes(option[fieldNames.value])) {
        current.push(option);
      }
      const children = option[fieldNames.options];
      if (Array.isArray(children)) {
        current.push(...findOptions(children));
      }
    }
    return current;
  };
  return findOptions(dataSource);
};
