/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParsedFilter } from '@nocobase/client';
import { useMemo } from 'react';

export function useCalendarBlockParams(props) {
  const { filter, parseVariableLoading } = useParsedFilter({
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

  const params = useMemo(() => {
    return { ...props.params, appends: [...appends, ...(props.params.appends || [])], paginate: false, filter };
  }, [appends, JSON.stringify(filter), props.params]);

  return { params, parseVariableLoading };
}
