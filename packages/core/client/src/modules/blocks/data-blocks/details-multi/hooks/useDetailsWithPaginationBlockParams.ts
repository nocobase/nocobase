import { useMemo } from 'react';
import { useParsedFilter } from '../../../../../block-provider/hooks/useParsedFilter';

export const useDetailsWithPaginationBlockParams = (props) => {
  const { params } = props;

  const { filter } = useParsedFilter({
    filterOption: params?.filter,
  });

  return useMemo(() => {
    return { ...params, filter };
  }, [JSON.stringify(filter)]);
};
