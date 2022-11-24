import { castArray } from 'lodash';

export const defaultFieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
  options: 'children',
};

export const getCurrentOptions = (values, dataSource, fieldNames) => {
  values = castArray(values)
    .filter((item) => item != null)
    .map((val) => (typeof val === 'object' ? val[fieldNames.value] : val));
  const findOptions = (options: any[]) => {
    let current = [];
    for (const value of values) {
      const option = options.find((v) => v[fieldNames.value] === value) || { value: value, label: value };
      current.push(option);
    }
    for (const option of options) {
      const children = option[fieldNames.options];
      if (Array.isArray(children)) {
        current.push(...findOptions(children));
      }
    }
    return current;
  };
  return findOptions(dataSource);
};
