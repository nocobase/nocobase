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
import { ChartCardItem } from './block/CardItem';

class PluginDataVisualiztionClient extends Plugin {
  public charts: ChartGroup = new ChartGroup();

  async load() {
    this.charts.setGroup('Built-in', [...g2plot, ...antd]);

    this.app.addComponents({
      ChartV2BlockInitializer,
      ChartV2BlockDesigner,
      ChartV2Block,
      ChartCardItem,
    });

    this.app.addScopes({
      useChartBlockCardProps,
    });

    this.app.schemaInitializerManager.add(chartInitializers_deprecated);
    this.app.schemaInitializerManager.add(chartInitializers);
    this.app.schemaInitializerManager.add(chartFilterItemInitializers_deprecated);
    this.app.schemaInitializerManager.add(chartFilterItemInitializers);
    this.app.schemaInitializerManager.add(chartFilterActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(chartFilterActionInitializers);

    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('dataBlocks.chartV2', {
      title: lang('Charts'),
      Component: 'ChartV2BlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('mobile:addBlock', 'dataBlocks.chartV2', {
      title: lang('Charts'),
      Component: 'ChartV2BlockInitializer',
    });
  }
}

export default PluginDataVisualiztionClient;
export { Chart } from './chart/chart';
export type { ChartProps, ChartType, RenderProps } from './chart/chart';
export { ChartConfigContext } from './configure';
export type { FieldOption } from './hooks';
export type { QueryProps } from './renderer';
