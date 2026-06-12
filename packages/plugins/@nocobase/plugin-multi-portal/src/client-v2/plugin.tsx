/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { registerMultiPortalsFromApi } from './layoutRegistration';
import { registerMultiPortalPermissionsTab } from './permissions/multiPortalPermissions';

export class PluginMultiPortalClientV2 extends Plugin {
  async load() {
    const title = this.t('Multi-portal') as string;

    this.pluginSettingsManager.addMenuItem({
      key: 'multi-portal',
      title,
      icon: 'PartitionOutlined',
      aclSnippet: 'pm.multi-portal',
      showTabs: true,
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'multi-portal',
      key: 'index',
      title,
      aclSnippet: 'pm.multi-portal',
      componentLoader: () => import('./pages/MultiPortalsPage'),
    });

    registerMultiPortalPermissionsTab(this.app, (key) => this.t(key));

    await registerMultiPortalsFromApi(this.app);
  }
}

export default PluginMultiPortalClientV2;
