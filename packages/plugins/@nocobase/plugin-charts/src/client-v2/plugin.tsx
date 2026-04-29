/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

import { tExpr, NAMESPACE } from './locale';

export class ChartsPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: tExpr('Charts'),
      icon: 'PieChartOutlined',
      aclSnippet: 'pm.charts.queries',
    });
    this.app.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      componentLoader: () => import('./pages/QueriesTablePage'),
      aclSnippet: 'pm.charts.queries',
    });

    this.flowEngine.registerModelLoaders({
      LegacyChartBlockModel: {
        loader: () => import('./models/LegacyChartBlockModel'),
      },
    });
  }
}

export default ChartsPlugin;
