import { reaction } from '@formily/reactive';
import { flatten } from '@nocobase/utils/client';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParseDataScopeFilter } from '../../schema-settings';
import { DEBOUNCE_WAIT } from '../../variables';
import { getPath } from '../../variables/utils/getPath';
import { isVariable } from '../../variables/utils/isVariable';
import { useFormBlockContext } from '../FormBlockProvider';

export function useParsedFilter({ filterOption, currentRecord }: { filterOption: any; currentRecord?: any }) {
  const { parseFilter } = useParseDataScopeFilter({ currentRecord });
  const [filter, setFilter] = useState({});
  const { form } = useFormBlockContext();

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
          const result = _.get({ $nForm: form?.values }, getPath(value));
          return result;
        },
      });
      return flat;
    }, run);
  }, [JSON.stringify(filterOption)]);

  return { filter };
}
