import React, { createContext, useContext } from 'react';
import { ISchema } from '@formily/react';

type ChartProps = {
  name: string;
  component: React.FC<any>;
  schema?: ISchema;
  transformer?: (data: any) => any;
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

/**
 * @params {usePropsFunc} useProps - Accept the information that the chart component needs to render,
 * process it and return the props of the chart component.
 */
export const ChartLibraryContext = createContext<{
  [library: string]: {
    enabled: boolean;
    charts: Charts;
    useProps: usePropsFunc;
  };
}>({});

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

export const useChart = (library: string, type: string) => {
  const ctx = useContext(ChartLibraryContext);
  return {
    library: ctx[library],
    chart: ctx[library]?.charts[type],
  };
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
