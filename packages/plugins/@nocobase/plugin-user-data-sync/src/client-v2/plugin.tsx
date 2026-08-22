/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import type { Application } from '@nocobase/client-v2';
import { Registry } from '@nocobase/utils/client';
import type { SourceOptions } from './types';

export class PluginUserDataSyncClientV2 extends Plugin<Record<string, never>, Application> {
  sourceTypes = new Registry<SourceOptions>();

  registerType(sourceType: string, options: SourceOptions) {
    this.sourceTypes.register(sourceType, options);
  }

  async load() {
    this.flowEngine.context.defineProperty('userDataSyncSourceTypes', {
      get: () => this.sourceTypes,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'users-permissions',
      key: 'sync',
      title: this.t('Synchronize'),
      icon: 'SyncOutlined',
      sort: 99,
      aclSnippet: 'pm.user-data-sync',
      componentLoader: () => import('./pages/UserDataSyncSourcePage'),
    });
  }
}

export default PluginUserDataSyncClientV2;
