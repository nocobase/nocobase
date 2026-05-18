/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { KanbanCreateSortFieldSelect } from './models/components/KanbanCreateSortFieldSelect';
import { KanbanGroupOptionsTable as KanbanGroupOptionsTableComponent } from './models/components/KanbanGroupOptionsTable';
import { KanbanGroupingSelector as KanbanGroupingSelectorComponent } from './models/components/KanbanGroupingSelector';

export class PluginKanbanClient extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponents({
      KanbanCreateSortFieldSelect,
      KanbanGroupOptionsTable: KanbanGroupOptionsTableComponent,
      KanbanGroupingSelector: KanbanGroupingSelectorComponent,
    });

    this.flowEngine.registerModelLoaders({
      KanbanBlockModel: {
        loader: () => import('./models/KanbanBlockModel'),
      },
      KanbanCardItemModel: {
        loader: () => import('./models/KanbanCardItemModel'),
      },
      KanbanCollectionActionGroupModel: {
        loader: () => import('./models/KanbanCollectionActionGroupModel'),
      },
      KanbanQuickCreateActionModel: {
        loader: () => import('./models/actions/KanbanPopupModels'),
      },
      KanbanCardViewActionModel: {
        loader: () => import('./models/actions/KanbanPopupModels'),
      },
    });
  }
}

export default PluginKanbanClient;
