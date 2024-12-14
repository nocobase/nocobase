/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
          const result = variables?.parseVariable(value, localVariables).then(({ value }) => value);
          return result;
        },
      });
      await Promise.all(
        Object.keys(flat).map(async (key) => {
          flat[key] = await flat[key];
          if (flat[key] === undefined) {
            delete flat[key];
          }
          return flat[key];
        }),
      );
      const result = unflatten(flat);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exclude, localVariables, variables?.parseVariable],
  );

  return { parseFilter, findVariable };
};

export default useParseDataScopeFilter;
