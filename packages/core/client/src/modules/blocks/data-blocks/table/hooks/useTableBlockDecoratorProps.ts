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
  let sourceId: string | undefined;

  // 因为 association 是固定不变的，所以在条件中使用 hooks 是安全的
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sourceId = useDataBlockSourceId({ association: props.association });
  }

  return sourceId;
}
