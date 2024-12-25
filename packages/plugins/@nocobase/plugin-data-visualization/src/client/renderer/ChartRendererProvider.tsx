/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import {
  CollectionManagerProvider,
  DEFAULT_DATA_SOURCE_KEY,
  MaybeCollectionProvider,
  useAPIClient,
  useRequest,
} from '@nocobase/client';
import React, { createContext, useContext, useEffect } from 'react';
import { parseField, removeUnparsableFilter } from '../utils';
import { ChartDataContext } from '../block/ChartDataProvider';
import { useChartFilter } from '../hooks';
import { ChartFilterContext } from '../filter/FilterProvider';
import { GlobalAutoRefreshContext } from '../block/GlobalAutoRefreshProvider';

export type MeasureProps = {
  field: string | string[];
  aggregation?: string;
  alias?: string;
};

export type DimensionProps = {
  field: string | string[];
  alias?: string;
  format?: string;
};

export type TransformProps = {
  field: string;
  type: string;
  format: string;
  argument?: string | number;
};

export type QueryProps = Partial<{
  measures: MeasureProps[];
  dimensions: DimensionProps[];
  orders: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  filter: any;
  limit: number;
  offset: number;
  sql: {
    fields?: string;
    clauses?: string;
  };
}>;

export type ChartRendererProps = {
  collection: string;
  dataSource?: string;
  query?: QueryProps;
  config?: {
    chartType: string;
    general: any;
    advanced: any;
    title?: string;
    bordered?: boolean;
  };
  transform?: TransformProps[];
  mode?: 'builder' | 'sql';
  disableAutoRefresh?: boolean;
};

export const ChartRendererContext = createContext<
  {
    service: any;
    data?: any[];
    autoRefresh?: number | boolean;
    setAutoRefresh?: (autoRefresh: number | boolean) => void;
    showActionBar?: boolean;
  } & ChartRendererProps
>({} as any);
ChartRendererContext.displayName = 'ChartRendererContext';

export const ChartRendererProvider: React.FC<ChartRendererProps> = (props) => {
  const { query, config, collection, transform, dataSource = DEFAULT_DATA_SOURCE_KEY, disableAutoRefresh } = props;
  const { addChart } = useContext(ChartDataContext);
  const { addChart: addGlobalAutoRefreshChart, removeChart: removeGlobalAutoRefreshChart } =
    useContext(GlobalAutoRefreshContext);
  const { ready, form, enabled } = useContext(ChartFilterContext);
  const { getFilter, hasFilter, appendFilter, parseFilter } = useChartFilter();
  const schema = useFieldSchema();
  const api = useAPIClient();
  const [autoRefresh, setAutoRefresh] = React.useState<number | boolean>(false);
  const [showActionBar, setShowActionBar] = React.useState<boolean>(false);
  const service = useRequest(
    async (dataSource, collection, query, manual) => {
      if (!(collection && query?.measures?.length)) return;
      // Check if the chart is configured
      // If the filter block is enabled, the filter form is required to be rendered
      if (enabled && !form) return;
      const filterValues = getFilter();
      const parsedFilter = await parseFilter(query.filter);
      const parsedQuery = { ...query, filter: parsedFilter };
      const config = { dataSource, collection, query: parsedQuery };
      const queryWithFilter =
        !manual && hasFilter(config, filterValues) ? appendFilter(config, filterValues) : parsedQuery;
      try {
        const res = await api.request({
          url: 'charts:query',
          method: 'POST',
          data: {
            uid: schema?.['x-uid'],
            dataSource,
            collection,
            ...queryWithFilter,
            filter: removeUnparsableFilter(queryWithFilter.filter),
            dimensions: (query?.dimensions || []).map((item: DimensionProps) => {
              const dimension = { ...item };
              if (item.format && !item.alias) {
                const { alias } = parseField(item.field);
                dimension.alias = alias;
              }
              return dimension;
            }),
            measures: (query?.measures || []).map((item: MeasureProps) => {
              const measure = { ...item };
              if (item.aggregation && !item.alias) {
                const { alias } = parseField(item.field);
                measure.alias = alias;
              }
              return measure;
            }),
          },
        });
        return res?.data?.data;
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        if (!manual && schema?.['x-uid']) {
          addChart(schema?.['x-uid'], { dataSource, collection, service, query });
          if (!autoRefresh) {
            addGlobalAutoRefreshChart?.(schema?.['x-uid'], { service });
          }
        }
      }
    },
    {
      defaultParams: [dataSource, collection, query],
      // Wait until ChartFilterProvider is rendered and check the status of the filter form
      // since the filter parameters should be applied if the filter block is enabled
      ready: ready && (!enabled || !!form),
    },
  );

  useEffect(() => {
    if (disableAutoRefresh) {
      return;
    }
    if (!autoRefresh) {
      addGlobalAutoRefreshChart?.(schema?.['x-uid'], { service });
      return;
    }
    removeGlobalAutoRefreshChart?.(schema?.['x-uid']);
    const refresh = autoRefresh as number;
    const timer = setInterval(service.refresh, refresh * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [autoRefresh, disableAutoRefresh]);

  return (
    <CollectionManagerProvider dataSource={dataSource}>
      <MaybeCollectionProvider collection={collection}>
        <ChartRendererContext.Provider
          value={{
            dataSource,
            collection,
            config,
            transform,
            service,
            query,
            autoRefresh,
            setAutoRefresh,
            showActionBar,
          }}
        >
          <div onMouseOver={() => setShowActionBar(true)} onMouseOut={() => setShowActionBar(false)}>
            {props.children}
          </div>
        </ChartRendererContext.Provider>
      </MaybeCollectionProvider>
    </CollectionManagerProvider>
  );
};
