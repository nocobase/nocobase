import _ from 'lodash';
import { CollectionFieldOptions } from '../../collection-manager';

interface Deps {
  /**
   * 消费当前变量值的 collection field，根据其值去判断应该怎么转换变量值
   */
  targetCollectionField: CollectionFieldOptions;
}

/**
 * - `对一` 赋给 `对多` 时应该转化为一个数组
 */
export const transformVariableValue = (value: any, deps: Deps) => {
  const { targetCollectionField } = deps;

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

  // 下拉多选
  if (targetCollectionField.interface === 'multipleSelect') {
    const options = _.isArray(targetCollectionField.uiSchema.enum) ? targetCollectionField.uiSchema.enum : [];
    if (Array.isArray(value)) {
      return value.filter((item) => options.some((enumItem: { value: any }) => enumItem.value === item));
    }
    return [value].filter((item) => options.some((enumItem: { value: any }) => enumItem.value === item));
  }

  // 下拉单选
  if (targetCollectionField.interface === 'select') {
    const options = _.isArray(targetCollectionField.uiSchema.enum) ? targetCollectionField.uiSchema.enum : [];
    if (Array.isArray(value)) {
      return value.find((item) => options.some((enumItem: { value: any }) => enumItem.value === item));
    }
    return options.some((item: { value: any }) => item.value === value) ? value : undefined;
  }

  // 勾选
  if (targetCollectionField.type === 'boolean') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  // Radio 单选
  if (targetCollectionField.uiSchema['x-component'] === 'Radio.Group') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  // Checkbox 多选
  if (targetCollectionField.uiSchema['x-component'] === 'Checkbox.Group') {
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  }

  if (['hasMany', 'belongsToMany'].includes(targetCollectionField.type)) {
    if (!Array.isArray(value)) {
      return [value];
    }
    return value;
  }

  if (targetCollectionField.interface === 'json') {
    return JSON.stringify(value);
  }

  return value;
};
