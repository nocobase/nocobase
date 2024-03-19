import { useFieldSchema } from '@formily/react';
import { useCollectionManager_deprecated } from '../../../../collection-manager/hooks/useCollectionManager_deprecated';
import { useParsedFilter } from 'packages/core/client/src/block-provider/hooks/useParsedFilter';
import { useMemo } from 'react';

export const useTableBlockDecoratorProps = (props) => {
  const params = useTableBlockParams(props);
  const sourceId = useTableBlockSourceId();

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

function useTableBlockSourceId() {
  return {};
}
