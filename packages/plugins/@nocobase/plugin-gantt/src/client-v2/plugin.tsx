/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { ganttLocaleResources, LEGACY_NAMESPACE, NAMESPACE } from './locale';

export class PluginGanttClient extends Plugin<any, Application> {
  async load() {
    Object.entries(ganttLocaleResources).forEach(([lang, resource]) => {
      this.app.i18n.addResources(lang, this.options?.packageName || NAMESPACE, resource);
      this.app.i18n.addResources(lang, LEGACY_NAMESPACE, resource);
    });

    this.flowEngine.registerModelLoaders({
      GanttBlockModel: {
        loader: () => import('./models/GanttBlockModel'),
      },
      GanttCollectionActionGroupModel: {
        loader: () => import('./models/actions/GanttActionModels'),
      },
      GanttTodayActionModel: {
        loader: () => import('./models/actions/GanttActionModels'),
      },
      GanttExpandCollapseActionModel: {
        loader: () => import('./models/actions/GanttActionModels'),
      },
      GanttEventViewActionModel: {
        loader: () => import('./models/actions/GanttPopupModels'),
      },
    });
  }
}

export default PluginGanttClient;
