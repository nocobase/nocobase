import React, { createContext, useContext } from 'react';
import { ISchema } from '@formily/react';

type ChartProps = {
  name: string;
  component: React.FC<any>;
  schema?: ISchema;
  transformer?: (data: any) => any;
};

export type Charts = {
  [type: string]: ChartProps;
};

export const ChartLibraryContext = createContext<{
  [library: string]: {
    enabled: boolean;
    charts: Charts;
  };
}>({});

export const useChartLibrary = () => {
  const library = useContext(ChartLibraryContext);
  return Object.keys(library);
};

export const useChartTypes = (): (ChartProps & {
  key: string;
  label: string;
  value: string;
})[] => {
  const library = useContext(ChartLibraryContext);
  return Object.entries(library)
    .filter(([_, l]) => l.enabled)
    .reduce((charts, [name, l]) => {
      const appends = Object.entries(l.charts).map(([type, chart]) => ({
        ...chart,
        key: `${name}-${type}`,
        label: chart.name,
        value: `${name}-${type}`,
      }));
      return [...charts, ...appends];
    }, []);
};

export const useChart = (library: string, type: string) => {
  const ctx = useContext(ChartLibraryContext);
  return ctx[library]?.charts[type];
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
}> = (props) => {
  const { children, charts, name } = props;
  const ctx = useContext(ChartLibraryContext);
  const library = {
    ...ctx,
    [name]: {
      charts,
      enabled: true,
    },
  };
  return <ChartLibraryContext.Provider value={library}>{children}</ChartLibraryContext.Provider>;
};
