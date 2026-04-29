/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class PluginKanbanClient extends Plugin {
  groupFields = {
    select: { useGetGroupOptions: (collectionField) => ({ options: collectionField.uiSchema.enum }) },
    radioGroup: { useGetGroupOptions: (collectionField) => ({ options: collectionField.uiSchema.enum }) },
  };

  registerGroupFieldInterface(interfaceName: string, options: { useGetGroupOptions: (collectionField: any) => any }) {
    this.groupFields[interfaceName] = options;
  }

  getGroupFieldInterface(key?: string) {
    return key ? this.groupFields[key] : this.groupFields;
  }

  async load() {
    const components = await import('./models');
    this.flowEngine.flowSettings.registerComponents({
      KanbanGroupingSelector: components.KanbanGroupingSelector,
      KanbanGroupOptionsTable: components.KanbanGroupOptionsTable,
      KanbanCreateSortFieldSelect: components.KanbanCreateSortFieldSelect,
    });

    this.flowEngine.registerModelLoaders({
      KanbanBlockModel: {
        loader: () => import('./models/KanbanBlockModel'),
      },
      KanbanCardItemModel: {
        loader: () => import('./models/KanbanCardItemModel'),
      },
      KanbanCardViewActionModel: {
        loader: () => import('./models/actions/KanbanPopupModels'),
      },
      KanbanCollectionActionGroupModel: {
        loader: () => import('./models/KanbanCollectionActionGroupModel'),
      },
      KanbanQuickCreateActionModel: {
        loader: () => import('./models/actions/KanbanPopupModels'),
      },
    });
  }
}

export default PluginKanbanClient;
