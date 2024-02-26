import _ from 'lodash';
import { CollectionFieldOptions_deprecated } from '../../collection-manager';

interface Deps {
  /**
   * 消费当前变量值的 collection field，根据其值去判断应该怎么转换变量值
   */
  targetCollectionField: CollectionFieldOptions_deprecated;
}

/**
 * - `对一` 赋给 `对多` 时应该转化为一个数组
 */
export const transformVariableValue = (value: any, deps: Deps) => {
  const { targetCollectionField } = deps;

  if (value == null) {
    return value;
  }

  if (!targetCollectionField) {
    return value;
  }

  // 行政区划
  if (targetCollectionField.interface === 'chinaRegion') {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (!_.isObject(item)) {
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(`transformVariableValue: chinaRegion field value should be an array of object`);
          }
        }

        item = { ...item };
        Object.keys(item).forEach((key) => {
          // 在这里删除掉一些字段，不然保存的时候会报 `字段唯一性` 错误
          if (_.isObjectLike(item[key])) {
            delete item[key];
          }
        });

        return item;
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`transformVariableValue: chinaRegion field value should be an array`);
    }
  }

  if (['hasMany', 'belongsToMany'].includes(targetCollectionField.type)) {
    if (!Array.isArray(value)) {
      return [value];
    }
    return value;
  }

  if (targetCollectionField.interface === 'json') {
    return value;
  }

  return value;
};
