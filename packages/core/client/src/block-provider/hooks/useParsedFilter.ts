/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@formily/reactive';
import { flatten, getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParseDataScopeFilter } from '../../schema-settings';
import { DEBOUNCE_WAIT } from '../../variables';
import { getPath } from '../../variables/utils/getPath';
import { getVariableName } from '../../variables/utils/getVariableName';
import { isVariable } from '../../variables/utils/isVariable';

/**
 * @internal
 * @param param0
 * @returns
 */
export function useParsedFilter({
  filterOption,
  onFilterChange,
}: {
  filterOption: any;
  onFilterChange?: (filter: any) => void;
}) {
  const { parseFilter, findVariable } = useParseDataScopeFilter();
  const [filter, setFilter] = useState({});
  const [parseVariableLoading, setParseVariableLoading] = useState(!!filterOption);

  useEffect(() => {
    if (!filterOption) return;

    const _run = async () => {
      setParseVariableLoading(true);
      const result = await parseFilter(filterOption);
      setParseVariableLoading(false);
      setFilter(result);
      onFilterChange?.(result);
    };
    _run();
    const run = _.debounce(_run, DEBOUNCE_WAIT);

    reaction(
      () => {
        // 这一步主要是为了使 reaction 能够收集到依赖
        const flat = flatten(filterOption, {
          breakOn({ key }) {
            return key.startsWith('$') && key !== '$and' && key !== '$or';
          },
          transformValue(value) {
            if (!isVariable(value)) {
              return value;
            }
            const variableName = getVariableName(value);
            const variable = findVariable(variableName);

            if (process.env.NODE_ENV !== 'production' && !variable) {
              throw new Error(`useParsedFilter: can not find variable ${variableName}`);
            }

            let result = null;
            const path = getPath(value);
            const keys = path.split('.');

            // For a path like 'a.b.c', if ctx.a exists but ctx.a.b doesn't,
            // we return the value of ctx.a. This ensures the `run` function is triggered
            // when field 'a' changes.
            keys.forEach((key, index) => {
              const subpath = keys.slice(0, index + 1).join('.');
              const _result = getValuesByPath(
                {
                  [variableName]: variable?.ctx || {},
                },
                subpath,
              );

              if (!_.isEmpty(_result)) {
                result = _result;
              }
            });

            return result;
          },
        });
        return flat;
      },
      run,
      {
        equals: _.isEqual,
      },
    );
  }, [JSON.stringify(filterOption), parseFilter, findVariable]);

  return {
    /** 数据范围的筛选参数 */
    filter,
    /** 表示是否正在解析筛选参数中的变量 */
    parseVariableLoading,
  };
}
