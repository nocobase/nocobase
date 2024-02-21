import { reaction } from '@formily/reactive';
import { flatten, getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParseDataScopeFilter } from '../../schema-settings';
import { DEBOUNCE_WAIT } from '../../variables';
import { getPath } from '../../variables/utils/getPath';
import { getVariableName } from '../../variables/utils/getVariableName';
import { isVariable } from '../../variables/utils/isVariable';

export function useParsedFilter({ filterOption }: { filterOption: any }) {
  const { parseFilter, findVariable } = useParseDataScopeFilter();
  const [filter, setFilter] = useState({});

  useEffect(() => {
    if (!filterOption) return;

    const _run = async () => {
      const result = await parseFilter(filterOption);
      setFilter(result);
    };
    _run();
    const run = _.debounce(_run, DEBOUNCE_WAIT);

    reaction(() => {
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

          const result = getValuesByPath(
            {
              [variableName]: variable?.ctx || {},
            },
            getPath(value),
          );
          return result;
        },
      });
      return flat;
    }, run);
  }, [JSON.stringify(filterOption)]);

  return { filter };
}
