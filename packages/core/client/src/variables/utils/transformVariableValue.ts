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
 * - `对多` 赋给 `对一` 时应该取数组的第一个元素
 * - `对多` 字段赋给一个字符串字段时，应该数组拼接为一个字符串
 * - `对多` 字段赋给如 `日期` 之类的字段时，应该取数组的第一个值，防止报错
 * @param value
 * @param deps
 * @returns
 */
export const transformVariableValue = (value: any, deps: Deps) => {
  const { targetCollectionField } = deps;

  // 关系字段的值应该是一个对象，如果不是一个对象就在开发环境抛出一个错误
  if (process.env.NODE_ENV !== 'production') {
    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(targetCollectionField.type)) {
      if (Array.isArray(value) && value.length && !_.isObject(value[0])) {
        throw new Error(
          `transformVariableValue: ${targetCollectionField.type} field value should be an array of object`,
        );
      }
      if (value && !_.isObject(value)) {
        throw new Error(`transformVariableValue: ${targetCollectionField.type} field value should be an object`);
      }
    }
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

  if (['belongsTo', 'hasOne'].includes(targetCollectionField.type)) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  if (['hasMany', 'belongsToMany'].includes(targetCollectionField.type)) {
    if (!Array.isArray(value)) {
      return [value];
    }
    return value;
  }

  // 日期字段的值是一个字符串，但是日期字符串有严格的格式要求，如果把数组中的日期拼接起来会报错
  if (targetCollectionField.uiSchema['x-component'] === 'DatePicker') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  // id 字段是一个 number ，但是又不能相加，所以也应该取第一个值
  if (targetCollectionField.name === 'id') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
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

  // 邮箱
  if (targetCollectionField.interface === 'email') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  // 电话
  if (targetCollectionField.interface === 'phone') {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  // 字符串应该拼接。
  // 数字应该相加，比如一个学校有 10 个班级，每个班级有 10 个同学，那么选择所有班级中的人数也就是整个学校的人数就是 100。
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
