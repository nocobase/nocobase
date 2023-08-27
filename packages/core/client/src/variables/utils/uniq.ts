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

  if (!_.isObject(value[0])) {
    return value;
  }

  return _.uniqBy(value, 'id');
};
