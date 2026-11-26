/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { Timeline } from './component';
import { useTimelineProps } from './schema';
import { timelineSettings } from './settings';
import {
  timelineInitializerItem,
  configureActionsInitializer,
  useCustomRefreshActionProps,
  customRefreshActionSettings,
} from './initializer';

export class PluginTimelineClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addComponents({ Timeline });
    this.app.addScopes({ useTimelineProps, useCustomRefreshActionProps });

    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      `dataBlocks.${timelineInitializerItem.name}`,
      timelineInitializerItem,
    );
    this.app.schemaInitializerManager.addItem(
      'popup:addNew:addBlock',
      `dataBlocks.${timelineInitializerItem.name}`,
      timelineInitializerItem,
    );
    this.app.schemaInitializerManager.add(configureActionsInitializer);
    this.app.schemaSettingsManager.add(timelineSettings);
    this.app.schemaSettingsManager.add(customRefreshActionSettings);
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginTimelineClient;
