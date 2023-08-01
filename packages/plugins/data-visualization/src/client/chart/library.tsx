import React, { createContext, useContext } from 'react';
import { lang } from '../locale';
import { ChartType } from './chart';

export type ChartLibraries = {
  [library: string]: {
    enabled: boolean;
    charts: ChartType[];
  };
};

export const ChartLibraryContext = createContext<ChartLibraries>({});

export const useCharts = (): {
  [name: string]: ChartType;
} => {
  const library = useContext(ChartLibraryContext);
  return Object.values(library)
    .filter((l) => l.enabled)
    .reduce((allCharts, l) => {
      const charts = Object.values(l.charts);
      return {
        ...allCharts,
        ...charts.reduce((all, chart) => {
          return {
            ...all,
            [chart.name]: chart,
          };
        }, {}),
      };
    }, {});
};

export const useChartTypes = (): {
  label: string;
  children: {
    key: string;
    label: string;
    value: string;
  }[];
}[] => {
  const library = useContext(ChartLibraryContext);
  return Object.entries(library)
    .filter(([_, l]) => l.enabled)
    .reduce((charts, [name, l]) => {
      const children = Object.values(l.charts).map((chart) => ({
        key: chart.name,
        label: lang(chart.title),
        value: chart.name,
      }));
      return [
        ...charts,
        {
          label: lang(name),
          children,
        },
      ];
    }, []);
};

export const useDefaultChartType = () => {
  const chartTypes = useChartTypes();
  return chartTypes[0]?.children?.[0]?.value;
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
  charts: ChartType[];
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
