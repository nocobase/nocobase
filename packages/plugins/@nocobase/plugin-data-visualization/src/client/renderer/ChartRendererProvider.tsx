import { useFieldSchema } from '@formily/react';
import { MaybeCollectionProvider, useAPIClient, useRequest } from '@nocobase/client';
import React, { createContext, useContext } from 'react';
import { parseField, removeUnparsableFilter } from '../utils';
import { ChartDataContext } from '../block/ChartDataProvider';
import { ConfigProvider } from 'antd';
import { useChartFilter } from '../hooks';
import { ChartFilterContext } from '../filter/FilterProvider';

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
  sql: {
    fields?: string;
    clauses?: string;
  };
}>;

export type ChartRendererProps = {
  collection: string;
  query?: QueryProps;
  config?: {
    chartType: string;
    general: any;
    advanced: any;
  };
  transform?: TransformProps[];
  mode?: 'builder' | 'sql';
};

export const ChartRendererContext = createContext<
  {
    service: any;
    data?: any[];
  } & ChartRendererProps
>({} as any);

export const ChartRendererProvider: React.FC<ChartRendererProps> = (props) => {
  const { query, config, collection, transform } = props;
  const { addChart } = useContext(ChartDataContext);
  const { ready, form, enabled } = useContext(ChartFilterContext);
  const { getFilter, hasFilter, appendFilter } = useChartFilter();
  const schema = useFieldSchema();
  const api = useAPIClient();
  const service = useRequest(
    (collection, query, manual) =>
      new Promise((resolve, reject) => {
        // Check if the chart is configured
        if (!(collection && query?.measures?.length)) return resolve(undefined);
        // If the filter block is enabled, the filter form is required to be rendered
        if (enabled && !form) return resolve(undefined);
        const filterValues = getFilter();
        const queryWithFilter =
          !manual && hasFilter({ collection, query }, filterValues)
            ? appendFilter({ collection, query }, filterValues)
            : query;
        api
          .request({
            url: 'charts:query',
            method: 'POST',
            data: {
              uid: schema?.['x-uid'],
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
          })
          .then((res) => {
            resolve(res?.data?.data);
            if (!manual && schema?.['x-uid']) {
              addChart(schema?.['x-uid'], { collection, service, query });
            }
          })
          .catch(reject);
      }),
    {
      defaultParams: [collection, query],
      // Wait until ChartFilterProvider is rendered and check the status of the filter form
      // since the filter parameters should be applied if the filter block is enabled
      ready: ready && (!enabled || !!form),
    },
  );

  return (
    <MaybeCollectionProvider collection={collection}>
      <ConfigProvider card={{ style: { boxShadow: 'none' } }}>
        <ChartRendererContext.Provider value={{ collection, config, transform, service, query }}>
          {props.children}
        </ChartRendererContext.Provider>
      </ConfigProvider>
    </MaybeCollectionProvider>
  );
};
