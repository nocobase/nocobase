import { css } from '@emotion/css';
import { MaybeCollectionProvider } from '@nocobase/client';
import React, { createContext } from 'react';

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

export const ChartRendererContext = createContext<ChartRendererProps>({} as any);

export const ChartRendererProvider: React.FC<ChartRendererProps> = (props) => {
  const { collection } = props;
  return (
    <MaybeCollectionProvider collection={collection}>
      <div
        className={css`
          .ant-card {
            box-shadow: none;
          }
          .ant-card-body {
            padding: 0;
          }
        `}
      >
        <ChartRendererContext.Provider value={{ ...props }}>{props.children}</ChartRendererContext.Provider>
      </div>
    </MaybeCollectionProvider>
  );
};
