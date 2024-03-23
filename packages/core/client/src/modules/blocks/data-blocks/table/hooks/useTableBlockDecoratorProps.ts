import { useFieldSchema } from '@formily/react';
import { useParsedFilter } from '../../../../../block-provider/hooks/useParsedFilter';
import { useMemo } from 'react';
import { useDataBlockSourceId } from '../../../../../block-provider/hooks/useDataBlockSourceId';

export const useTableBlockDecoratorProps = (props) => {
  const params = useTableBlockParams(props);
  const sourceId = useTableBlockSourceId(props);

  return {
    params,
    sourceId,
  };
};

export function useTableBlockParams(props) {
  const fieldSchema = useFieldSchema();
  const { filter: parsedFilter } = useParsedFilter({
    filterOption: props.params?.filter,
  });

  return useMemo(() => {
    const params = props.params || {};

    // 1. sort
    const { dragSortBy } = fieldSchema?.['x-decorator-props'] || {};
    if (props.dragSort && dragSortBy) {
      params['sort'] = dragSortBy;
    }

    // 2. filter
    const paramsWithFilter = {
      ...params,
      filter: parsedFilter,
    };

    return paramsWithFilter;
  }, [fieldSchema, parsedFilter, props.dragSort, props.params]);
}

function useTableBlockSourceId(props) {
  const sourceId = useDataBlockSourceId({ association: props.association });
  return sourceId;
}
