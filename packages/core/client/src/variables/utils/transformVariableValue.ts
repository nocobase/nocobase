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
