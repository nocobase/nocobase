/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import type { TablePaginationConfig } from 'antd/es/table';
import { useMemo } from 'react';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import { getResponseData, requestAgentGatewayAction } from '../../../pages/AgentGatewayPageUtils';
import type { AgentGatewayPageContext, RunListData, RunRecord, TFunction } from '../../../pages/runs/types';
import { getRunListMeta, getRunTaskTemplateFilterOptions, getRunsFilterCollectionOptions } from '../runShared';
import { useRunListState } from './useRunListState';

interface UseRunListControllerOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
}

export function useRunListController({ ctx, t }: UseRunListControllerOptions) {
  const state = useRunListState();
  const { filters, pagination, sort } = state;
  const request = useRequest(
    async () => {
      const response = await requestAgentGatewayAction<RunRecord[], RunListData['meta']>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.listRuns,
        {
          method: 'get',
          params: {
            ...(filters ? { filter: JSON.stringify(filters) } : {}),
            ...(sort ? { sort } : {}),
            page: pagination.current,
            pageSize: pagination.pageSize,
          },
        },
      );
      return {
        runs: getResponseData(response, []),
        meta: getRunListMeta(response.data?.meta),
      } satisfies RunListData;
    },
    {
      refreshDeps: [filters, pagination.current, pagination.pageSize, sort],
    },
  );
  const data = useMemo<RunListData>(() => request.data || { runs: [], meta: {} }, [request.data]);
  const taskTemplateFilterOptions = useMemo(() => getRunTaskTemplateFilterOptions(data), [data]);
  const filterCollection = useMemo(() => {
    const collection = new Collection(getRunsFilterCollectionOptions(taskTemplateFilterOptions));
    const dataSource = ctx.dataSourceManager?.getDataSource('main');
    if (dataSource) {
      collection.setDataSource(dataSource);
    }
    return collection;
  }, [ctx.dataSourceManager, taskTemplateFilterOptions]);
  const total = data.meta.count ?? data.runs.length;
  const { current, pageSize } = pagination;
  const tablePagination = useMemo<TablePaginationConfig>(
    () => ({
      current,
      pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (count) => t('Total {{count}} runs', { count }),
    }),
    [current, pageSize, t, total],
  );

  return {
    ...state,
    request,
    data,
    filterCollection,
    tablePagination,
  };
}
