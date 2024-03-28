import { useParsedFilter } from '../../../../../block-provider/hooks/useParsedFilter';
import { useMemo } from 'react';

export function useGridCardBlockParams(props) {
  const { params } = props;
  const { filter: parsedFilter } = useParsedFilter({
    filterOption: params?.filter,
  });
  const paramsWithFilter = useMemo(() => {
    return {
      ...params,
      filter: parsedFilter,
    };
  }, [parsedFilter, params]);

  return paramsWithFilter;
}
