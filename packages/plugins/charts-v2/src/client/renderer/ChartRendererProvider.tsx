import { ACLCollectionProvider } from '@nocobase/client';
import React, { createContext } from 'react';

export type QueryProps = Partial<{
  measures: {
    field: string;
    aggregate?: string;
    alias?: string;
  }[];
  dimensions: {
    field: string;
    alias?: string;
    format?: string;
  }[];
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
    advanced: string;
  };
  transform?: {
    field: string;
    type: string;
    format: string;
  }[];
  mode?: 'builder' | 'sql';
};

export const ChartRendererContext = createContext<ChartRendererProps>({} as any);

export const ChartRendererProvider: React.FC<ChartRendererProps> = (props) => {
  return (
    <ACLCollectionProvider>
      <ChartRendererContext.Provider value={{ ...props }}>{props.children}</ChartRendererContext.Provider>
    </ACLCollectionProvider>
  );
};
