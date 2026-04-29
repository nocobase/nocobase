/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { Schema } from '@formily/react';

import builtinCharts from './chart/basic';
import { ChartGroup } from './chart/ChartGroup';
import { tExpr } from './locale';

type FieldInterfaceConfig = {
  valueFormatter: (field: any, value: any) => any;
};

const valueFormatter = (field: any, value: any) => {
  const options = field.uiSchema?.enum;
  const parseEnumValues = (items: { label: string; value: string }[], current: any) => {
    if (Array.isArray(current)) {
      return current.map((item) => parseEnumValues(items, item));
    }
    const option = items.find((item) => item.value === (current?.toString?.() || current));
    return Schema.compile(option?.label || current);
  };

  if (!options || !Array.isArray(options)) {
    return value;
  }

  return parseEnumValues(options, value);
};

export class PluginDataVisualizationClient extends Plugin {
  public charts = new ChartGroup();

  fieldInterfaceConfigs: Record<string, FieldInterfaceConfig> = {
    select: { valueFormatter },
    multipleSelect: { valueFormatter },
    radioGroup: { valueFormatter },
    checkboxGroup: { valueFormatter },
  };

  registerFieldInterfaceConfig(key: string, config: FieldInterfaceConfig) {
    this.fieldInterfaceConfigs[key] = config;
  }

  async load() {
    this.charts.addGroup('basic', {
      title: 'Built-in charts',
      charts: builtinCharts,
      sort: 100,
    });

    this.flowEngine.registerModelLoaders({
      ChartBlockModel: {
        loader: () => import('./models/ChartBlockModel'),
      },
    });

    this.app.pluginSettingsManager.addMenuItem({
      key: 'data-visualization',
      title: tExpr('Data visualization'),
      icon: 'BarChartOutlined',
      hidden: true,
    });
  }
}

export { PluginDataVisualizationClient as PluginDataVisualiztionClient };

export default PluginDataVisualizationClient;
