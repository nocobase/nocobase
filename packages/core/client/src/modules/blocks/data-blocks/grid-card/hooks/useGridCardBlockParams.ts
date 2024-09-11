/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useParsedFilter } from '../../../../../block-provider/hooks/useParsedFilter';

export function useGridCardBlockParams(props) {
  const { params } = props;
  const { filter: parsedFilter, parseVariableLoading } = useParsedFilter({
    filterOption: params?.filter,
  });
  const paramsWithFilter = useMemo(() => {
    return {
      ...params,
      filter: parsedFilter,
    };
  }, [parsedFilter, params]);

  return { params: paramsWithFilter, parseVariableLoading };
}
