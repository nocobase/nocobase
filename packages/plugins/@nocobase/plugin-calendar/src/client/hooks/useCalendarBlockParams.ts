import { useParsedFilter } from '@nocobase/client';
import { useMemo } from 'react';

export function useCalendarBlockParams(props) {
  const { filter } = useParsedFilter({
    filterOption: props.params?.filter,
  });
  const appends = useMemo(() => {
    const arr: string[] = [];
    const start = props.fieldNames?.start;
    const end = props.fieldNames?.end;

    if (Array.isArray(start) && start.length >= 2) {
      arr.push(start[0]);
    }
    if (Array.isArray(end) && end.length >= 2) {
      arr.push(end[0]);
    }

    return arr;
  }, [props.fieldNames]);

  return useMemo(() => {
    return { ...props.params, appends: [...appends, ...(props.params.appends || [])], paginate: false, filter };
  }, [appends, JSON.stringify(filter), props.params]);
}
