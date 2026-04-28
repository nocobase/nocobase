/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { useTreeProps } from './schema';
import { Tree } from './component';
import { treeSettings } from './settings';
import { treeInitializerItem } from './initializer';
import {
  treeConnectDataBlocks,
  TreeActionGroupModel,
  TreeBlockModel,
  TreeFilterBlockMenuModel,
  TreeTitleFieldSettingsModel,
} from './models';
export * from './component';

export class PluginBlockTreeClient extends Plugin {
  async load() {
    this.flowEngine.registerActions({
      treeConnectDataBlocks,
    });
    this.flowEngine.registerModels({
      TreeActionGroupModel,
      TreeBlockModel,
      TreeFilterBlockMenuModel,
      TreeTitleFieldSettingsModel,
    });
    this.app.addComponents({ Tree });
    this.app.schemaSettingsManager.add(treeSettings);
    this.app.addScopes({ useTreeProps });

    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      `filterBlocks.${treeInitializerItem.name}`,
      treeInitializerItem,
    );
    this.app.schemaInitializerManager.addItem(
      'popup:common:addBlock',
      `filterBlocks.${treeInitializerItem.name}`,
      treeInitializerItem,
    );
    this.app.schemaInitializerManager.addItem(
      'popup:tableSelector:addBlock',
      `filterBlocks.${treeInitializerItem.name}`,
      treeInitializerItem,
    );
  }
}

export default PluginBlockTreeClient;
