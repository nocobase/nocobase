import _ from 'lodash';
import { CollectionFieldOptions } from '../../collection-manager';

interface Deps {
  /**
   * 消费当前变量值的 collection field，根据其值去判断应该怎么转换变量值
   */
  targetCollectionFiled: CollectionFieldOptions;
}

/**
 * - `对一` 赋给 `对多` 时应该转化为一个数组
 * - `对多` 赋给 `对一` 时应该取数组的第一个元素
 * - `对多` 字段赋给一个字符串字段时，应该数组拼接为一个字符串
 * - `对多` 字段赋给如 `日期` 之类的字段时，应该取数组的第一个值，防止报错
 * @param value
 * @param deps
 * @returns
 */
export const transformVariableValue = (value: any, deps: Deps) => {
  const { targetCollectionFiled } = deps;

  if (process.env.NODE_ENV !== 'production') {
    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(targetCollectionFiled.type)) {
      if (Array.isArray(value) && value.length && !_.isObject(value[0])) {
        throw new Error(
          `transformVariableValue: ${targetCollectionFiled.type} field value should be an array of object`,
        );
      }
      if (value && !_.isObject(value)) {
        throw new Error(`transformVariableValue: ${targetCollectionFiled.type} field value should be an object`);
      }
    }
  }

  if (['belongsTo', 'hasOne'].includes(targetCollectionFiled.type)) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  if (['hasMany', 'belongsToMany'].includes(targetCollectionFiled.type)) {
    if (!Array.isArray(value)) {
      return [value];
    }
    return value;
  }

  if (targetCollectionFiled.uiSchema['x-component'] === 'DatePicker') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  if (targetCollectionFiled.name === 'id') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (_.isString(value[0])) {
      return value.join(',');
    }
    if (_.isNumber(value[0])) {
      return _.sum(value);
    }
  }

  return value;
};
