/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';

import type PluginDataVisualizationClient from '../plugin';
import type { ChartType } from './types';

type Group = {
  title: string;
  charts: ChartType[];
  sort?: number;
};

export class ChartGroup {
  charts = new Map<string, Group>();

  addGroup(name: string, group: Group) {
    if (this.charts.has(name)) {
      throw new Error(`[data-visualization] Chart group "${name}" already exists`);
    }
    this.charts.set(name, group);
  }

  add(name: string, charts: ChartType | ChartType[]) {
    const group = this.charts.get(name);
    if (!group) {
      return;
    }
    const nextCharts = Array.isArray(charts) ? charts : [charts];
    this.charts.set(name, {
      ...group,
      charts: [...group.charts, ...nextCharts],
    });
  }

  getChartTypes() {
    return Array.from(this.charts.entries())
      .sort(([, a], [, b]) => (a.sort || 0) - (b.sort || 0))
      .map(([group, { title, charts }]) => ({
        label: title,
        value: group,
        children: charts.map((chart) => ({
          key: `${group}.${chart.name}`,
          label: chart.title,
          value: chart.name,
        })),
      }));
  }

  getCharts() {
    const result: Record<string, ChartType> = {};
    this.charts.forEach(({ charts }, group) => {
      charts.forEach((chart) => {
        result[`${group}.${chart.name}`] = chart;
      });
    });
    return result;
  }

  getChart(type?: string) {
    if (!type) {
      return;
    }
    return this.getCharts()[type];
  }

  getDefaultChartType() {
    const group = this.getChartTypes()[0];
    const chart = group?.children?.[0];
    return group && chart ? `${group.value}.${chart.value}` : undefined;
  }
}

export const useChartTypes = () => {
  const plugin = useDataVisualizationPlugin();
  return plugin?.charts?.getChartTypes() || [];
};

export const useDefaultChartType = () => {
  const plugin = useDataVisualizationPlugin();
  return getDefaultChartType(plugin?.charts);
};

export const useCharts = () => {
  const plugin = useDataVisualizationPlugin();
  return plugin?.charts?.getCharts() || {};
};

export const useChart = (type?: string) => {
  const plugin = useDataVisualizationPlugin();
  return plugin?.charts?.getChart(type);
};

const useDataVisualizationPlugin = () => {
  const app = useApp();
  return (app.pm.get('@nocobase/plugin-data-visualization') ||
    app.pm.get('data-visualization')) as PluginDataVisualizationClient;
};

const getDefaultChartType = (charts?: ChartGroup) => {
  if (!charts) {
    return;
  }
  if (typeof charts.getDefaultChartType === 'function') {
    return charts.getDefaultChartType();
  }
  const group = charts.getChartTypes?.()[0];
  return group?.children?.[0]?.value;
};
