import _ from 'lodash';

/**
 * 如果 `value` 是一个数组，返回一个去重后的数组
 * @param value
 * @returns
 */
export const uniq = (value: any) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return _.uniqBy(value, (item) => {
    if (_.isObject(item)) {
      return _.get(item, 'id', JSON.stringify(item));
    }
    return item;
  });
};
