import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import { MaybeCollectionProvider, useAPIClient, useRequest } from '@nocobase/client';
import React, { createContext } from 'react';
import { parseField } from '../utils';

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
  const schema = useFieldSchema();
  const api = useAPIClient();
  const service = useRequest(
    (collection, query) =>
      new Promise((resolve, reject) => {
        if (!(collection && query?.measures?.length)) return resolve(undefined);
        api
          .request({
            url: 'charts:query',
            method: 'POST',
            data: {
              uid: schema?.['x-uid'],
              collection,
              ...query,
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
          })
          .catch(reject);
      }),
    {
      defaultParams: [collection, query],
    },
  );

  return (
    <MaybeCollectionProvider collection={collection}>
      <div
        className={css`
          .ant-card {
            box-shadow: none;
          }
        `}
      >
        <ChartRendererContext.Provider value={{ collection, config, transform, service, query }}>
          {props.children}
        </ChartRendererContext.Provider>
      </div>
    </MaybeCollectionProvider>
  );
};
