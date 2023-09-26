import { usePlugin } from '@nocobase/client';
import { ChartType } from './chart';
import DataVisualizationPlugin from '..';
import { lang } from '../locale';

export class ChartGroup {
  charts: Map<string, ChartType[]> = new Map();

  setGroup(name: string, charts: ChartType[]) {
    this.charts.set(name, charts);
  }

  addGroup(name: string, charts: ChartType[]) {
    if (this.charts.has(name)) {
      throw new Error(`[data-visualization] Chart group "${name}" already exists`);
    }
    this.setGroup(name, charts);
  }

  add(group: string, chart: ChartType) {
    if (!this.charts.has(group)) {
      this.setGroup(group, []);
    }
    this.charts.get(group)?.push(chart);
  }

  getChartTypes(): {
    label: string;
    children: {
      key: string;
      label: string;
      value: string;
    }[];
  }[] {
    const result = [];
    this.charts.forEach((charts, group) => {
      const children = charts.map((chart) => ({
        key: `${group}.${chart.name}`,
        label: lang(chart.title),
        value: `${group}.${chart.name}`,
      }));
      result.push({
        label: lang(group),
        children,
      });
    });
    return result;
  }

  getCharts(): {
    [key: string]: ChartType;
  } {
    const result = {};
    this.charts.forEach((charts, group) => {
      charts.forEach((chart) => {
        result[`${group}.${chart.name}`] = chart;
      });
    });
    return result;
  }

  getChart(type: string): ChartType {
    const charts = this.getCharts();
    return charts[type];
  }
}

export const useChartTypes = () => {
  const plugin = usePlugin(DataVisualizationPlugin);
  return plugin.charts.getChartTypes();
};

export const useDefaultChartType = () => {
  const chartTypes = useChartTypes();
  return chartTypes[0]?.children?.[0]?.value;
};

export const useCharts = () => {
  const plugin = usePlugin(DataVisualizationPlugin);
  return plugin.charts.getCharts();
};

export const useChart = (type: string) => {
  const plugin = usePlugin(DataVisualizationPlugin);
  return plugin.charts.getChart(type);
};
