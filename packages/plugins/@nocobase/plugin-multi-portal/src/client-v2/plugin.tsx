/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { RootLanding } from './RootLanding';
import { registerPortalEntryActions } from './entryActions/registerPortalEntryActions';
import { registerMultiPortalsFromApi } from './layoutRegistration';
import { MultiPortalBlockModel } from './models/MultiPortalBlockModel';
import { registerMultiPortalPermissionsTab } from './permissions/multiPortalPermissions';

export class PluginMultiPortalClientV2 extends Plugin {
  async load() {
    const title = String(this.t('Portal manager'));

    this.app.flowEngine.registerModels({ MultiPortalBlockModel });

    this.app.flowEngine.registerModelLoaders({
      MultiPortalMobileLayoutModel: {
        loader: () => import('./models/MultiPortalMobilePageModels'),
      },
      MultiPortalMobileRootPageModel: {
        loader: () => import('./models/MultiPortalMobilePageModels'),
      },
      MultiPortalMobileChildPageModel: {
        loader: () => import('./models/MultiPortalMobilePageModels'),
      },
      MultiPortalMobileRootPageTabModel: {
        loader: () => import('./models/MultiPortalMobilePageModels'),
      },
      MultiPortalMobileChildPageTabModel: {
        loader: () => import('./models/MultiPortalMobilePageModels'),
      },
    });
    if (this.app.entryActionManager) {
      this.app.flowEngine.registerModelLoaders({
        PortalEntryActionModel: {
          loader: () => import('./entryActions/PortalEntryActionModel'),
        },
      });
    }

    this.pluginSettingsManager.addMenuItem({
      key: 'multi-portal',
      title,
      icon: 'PartitionOutlined',
      aclSnippet: 'pm.multi-portal',
      showTabs: true,
      sort: -300,
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'multi-portal',
      key: 'index',
      title,
      aclSnippet: 'pm.multi-portal',
      componentLoader: () => import('./pages/MultiPortalsPage'),
    });

    registerMultiPortalPermissionsTab(this.app, (key) => this.t(key));
    registerPortalEntryActions(this.app, (key) => String(this.t(key)));

    if (this.pluginSettingsManager.getRoutePath?.('') === '/settings/') {
      return;
    }

    await registerMultiPortalsFromApi(this.app);
    this.router.add('root', {
      path: '/',
      Component: RootLanding,
      authCheck: true,
    });
  }
}

export default PluginMultiPortalClientV2;
