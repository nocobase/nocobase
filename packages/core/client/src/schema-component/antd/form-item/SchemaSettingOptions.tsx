import { Schema, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useOperatorList } from '../filter/useOperators';

export const findFilterOperators = (schema: Schema) => {
  while (schema) {
    if (schema['x-filter-operators']) {
      return {
        operators: schema['x-filter-operators'],
        uid: schema['x-uid'],
      };
    }
    schema = schema.parent;
  }
  return {};
};

/**
 * 如果用户没有手动设置过 operator，那么在筛选的时候 operator 会是空的，
 * 该方法确保 operator 一定有值（需要在 FormItem 中调用）
 */
export const useEnsureOperatorsValid = () => {
  const fieldSchema = useFieldSchema();
  const operatorList = useOperatorList();
  const { operators: storedOperators } = findFilterOperators(fieldSchema);

  if (storedOperators && operatorList.length && !storedOperators[fieldSchema.name]) {
    storedOperators[fieldSchema.name] = operatorList[0].value;
  }
};
