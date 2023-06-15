import React, { createContext, useContext } from 'react';
import { ISchema } from '@formily/react';
import { QueryProps } from './ChartRendererProvider';
import { FieldOption } from '../hooks';

export type ChartProps = {
  name: string;
  component: React.FC<any>;
  schema?: ISchema;
  transformer?: (data: any) => any;
  // The initConfig function is used to initialize the configuration of the chart component from the query configuration.
  initConfig?: (
    fields: FieldOption[],
    query: QueryProps,
  ) => {
    general?: any;
    advanced?: any;
  };
};

export type usePropsFunc = (props: {
  data: any;
  meta: {
    [field: string]: Partial<{
      formatter: (value: any) => any;
    }>;
  };
  general: any;
  advanced: any;
}) => any;

export type Charts = {
  [type: string]: ChartProps;
};

export type ChartLibraries = {
  [library: string]: {
    enabled: boolean;
    charts: Charts;
    useProps: usePropsFunc;
  };
};

/**
 * @params {usePropsFunc} useProps - Accept the information that the chart component needs to render,
 * process it and return the props of the chart component.
 */
export const ChartLibraryContext = createContext<ChartLibraries>({});

export const useChartTypes = (): (ChartProps & {
  key: string;
  label: string;
  value: string;
})[] => {
  const library = useContext(ChartLibraryContext);
  return Object.entries(library)
    .filter(([_, l]) => l.enabled)
    .reduce((charts, [name, l]) => {
      const children = Object.entries(l.charts).map(([type, chart]) => ({
        ...chart,
        key: `${name}-${type}`,
        label: chart.name,
        value: `${name}-${type}`,
      }));
      return [
        ...charts,
        {
          label: name,
          children,
        },
      ];
    }, []);
};

export const useToggleChartLibrary = () => {
  const ctx = useContext(ChartLibraryContext);
  return {
    toggle: (library: string) => {
      ctx[library].enabled = !ctx[library].enabled;
    },
  };
};

export const ChartLibraryProvider: React.FC<{
  name: string;
  charts: Charts;
  useProps: usePropsFunc;
}> = (props) => {
  const { children, charts, name, useProps } = props;
  const ctx = useContext(ChartLibraryContext);
  const library = {
    ...ctx,
    [name]: {
      charts,
      enabled: true,
      useProps,
    },
  };
  return <ChartLibraryContext.Provider value={library}>{children}</ChartLibraryContext.Provider>;
};
