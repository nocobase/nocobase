/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { useParentRecordCommon } from '../../../useParentRecordCommon';
import { useDetailsWithPaginationBlockParams } from './useDetailsWithPaginationBlockParams';
import { useDataSource } from '../../../../../data-source/data-source/DataSourceProvider';
import { useFilterByTk } from '../../../../../block-provider/BlockProvider';

export function useDetailsWithPaginationDecoratorProps(props) {
  let parentRecord;
  const { params, parseVariableLoading } = useDetailsWithPaginationBlockParams(props);
  const dataSource = useDataSource();
  const filterByTk = useFilterByTk(props);
  const isDBInstance = dataSource?.getOption('isDBInstance') ?? true;

  // association 的值是固定不变的，所以可以在条件中使用 hooks
  if (props.association) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parentRecord = useParentRecordCommon(props.association);
  }

  // For non-DB datasources (e.g. REST API), use 'get' action with filterByTk
  // because their list and get endpoints return different data structures
  if (!isDBInstance && filterByTk) {
    return {
      parentRecord,
      action: 'get',
      params: { filterByTk },
      parseVariableLoading,
    };
  }

  return {
    parentRecord,
    params,
    /**
     * 用于解析变量的 loading 状态
     */
    parseVariableLoading,
  };
}
