import { flatten, unflatten } from '@nocobase/utils/client';
import { useCallback } from 'react';
import { useLocalVariables, useVariables } from '../../variables';
import { getVariableName } from '../../variables/utils/getVariableName';
import { isVariable } from '../../variables/utils/isVariable';

interface Props {
  /**
   * 需要排除的变量名称，例如：['$user', '$date']
   * 被排除的变量不会被解析，会按原值返回
   */
  exclude?: string[];
}

// TODO: 建议变量名统一命名为 `$n` 开头，以防止与 formily 内置变量冲突
const defaultExclude = ['$user', '$date', '$nDate', '$nRole'];

const useParseDataScopeFilter = ({ exclude = defaultExclude }: Props = {}) => {
  const localVariables = useLocalVariables();
  const variables = useVariables();

  /**
   * name: 如 $user
   */
  const findVariable = useCallback(
    (name: string) => {
      let result = variables?.getVariable(name);
      if (!result) {
        result = localVariables.find((item) => item.name === name);
      }
      return result;
    },
    [localVariables, variables],
  );

  const parseFilter = useCallback(
    async (filterValue: any) => {
      const flat = flatten(filterValue, {
        breakOn({ key }) {
          return key.startsWith('$') && key !== '$and' && key !== '$or';
        },
        transformValue(value) {
          if (!isVariable(value)) {
            return value;
          }
          if (exclude.includes(getVariableName(value))) {
            return value;
          }
          const result = variables?.parseVariable(value, localVariables);
          return result;
        },
      });
      await Promise.all(
        Object.keys(flat).map(async (key) => {
          flat[key] = await flat[key];
          if (flat[key] === undefined) {
            flat[key] = null;
          }
          return flat[key];
        }),
      );
      const result = unflatten(flat);
      return result;
    },
    [exclude, localVariables, variables?.parseVariable],
  );

  return { parseFilter, findVariable };
};

export default useParseDataScopeFilter;
