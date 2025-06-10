/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import {
  ChartV2Block,
  ChartV2BlockDesigner,
  ChartV2BlockInitializer,
  ChartBlockProvider,
  chartInitializers,
  chartInitializers_deprecated,
} from './block';
import antd from './chart/antd';
import g2plot from './chart/g2plot';
import { ChartGroup } from './chart/group';
import {
  chartFilterActionInitializers,
  chartFilterActionInitializers_deprecated,
  chartFilterItemInitializers,
  chartFilterItemInitializers_deprecated,
} from './filter';
import { lang } from './locale';
import { useChartBlockCardProps } from './block/ChartBlock';
import { chartActionsInitializer } from './initializers/chartActions';
import {
  chartActionRefreshSettings,
  chartBlockActionRefreshSettings,
  chartBlockSettings,
  chartFilterBlockSettings,
  chartFilterItemSettings,
  chartRendererSettings,
} from './settings';
import { chartBlockActionsInitializer } from './initializers/chartBlockActions';
import { useChartRefreshActionProps } from './initializers/RefreshAction';
import { useChartBlockRefreshActionProps } from './initializers/BlockRefreshAction';
import { ChartRendererToolbar, ChartFilterBlockToolbar, ChartFilterItemToolbar } from './toolbar';
import { ChartCardItem } from './block/CardItem';
import { Schema } from '@formily/react';

type fieldInterfaceConfig = {
  valueFormatter: (field: any, value: any) => any;
};

const valueFormatter = (field: any, value: any) => {
  const options = field.uiSchema?.enum;
  const parseEnumValues = (options: { label: string; value: string }[], value: any) => {
    if (Array.isArray(value)) {
      return value.map((v) => parseEnumValues(options, v));
    }
    const option = options.find((option) => option.value === (value?.toString?.() || value));
    return Schema.compile(option?.label || value, { t: lang });
  };
  if (!options || !Array.isArray(options)) {
    return value;
  }
  return parseEnumValues(options, value);
};

class PluginDataVisualiztionClient extends Plugin {
  public charts: ChartGroup = new ChartGroup();

  fieldInterfaceConfigs: {
    [fieldInterface: string]: fieldInterfaceConfig;
  } = {
    select: { valueFormatter },
    multipleSelect: { valueFormatter },
    radioGroup: { valueFormatter },
    checkboxGroup: { valueFormatter },
  };

  registerFieldInterfaceConfig(key: string, config: fieldInterfaceConfig) {
    this.fieldInterfaceConfigs[key] = config;
  }

  async load() {
    this.charts.addGroup('antd', { title: 'Ant Design', charts: antd });
    this.charts.addGroup('ant-design-charts', { title: 'Ant Design Charts', charts: g2plot });

    this.app.addComponents({
      ChartV2BlockInitializer,
      ChartV2BlockDesigner,
      ChartV2Block,
      ChartCardItem,
      ChartBlockProvider,
      ChartRendererToolbar,
      ChartFilterBlockToolbar,
      ChartFilterItemToolbar,
    });
    this.app.addScopes({
      useChartBlockCardProps,
      useChartRefreshActionProps,
      useChartBlockRefreshActionProps,
    });

    this.app.schemaInitializerManager.add(
      chartInitializers_deprecated,
      chartInitializers,
      chartFilterItemInitializers_deprecated,
      chartFilterItemInitializers,
      chartFilterActionInitializers_deprecated,
      chartFilterActionInitializers,
      chartActionsInitializer,
      chartBlockActionsInitializer,
    );
    this.app.schemaSettingsManager.add(
      chartActionRefreshSettings,
      chartBlockActionRefreshSettings,
      chartBlockSettings,
      chartRendererSettings,
      chartFilterBlockSettings,
      chartFilterItemSettings,
    );

    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('dataBlocks.chartV2', {
      title: lang('Charts'),
      Component: 'ChartV2BlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('mobile:addBlock', 'dataBlocks.chartV2', {
      title: lang('Charts'),
      Component: 'ChartV2BlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'dataBlocks.charts', {
      title: '{{t("Charts")}}',
      Component: 'ChartV2BlockInitializer',
    });
  }
}

export default PluginDataVisualiztionClient;
export { Chart } from './chart/chart';
export type { ChartProps, ChartType, RenderProps } from './chart/chart';
export { ChartConfigContext } from './configure';
export { useSetChartSize } from './hooks';
export type { FieldOption } from './hooks';
export type { QueryProps } from './renderer';
