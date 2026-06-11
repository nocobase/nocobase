/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import { registerUiLayoutsFromApi } from './layoutRegistration';
import { mobileOpenView } from './mobileOpenViewAction';
import { registerMobilePageModelResolution } from './mobilePageModelResolution';
import { MobileMenuSettingsIconPicker } from './models/MobileMenuComponents';
import { registerLayoutAwareDesktopRoutesPermissionsTab } from './permissions/layoutAwareDesktopRoutesPermissions';

export class PluginUiLayoutClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.t('UI layout') as unknown as string;

    this.app.flowEngine.registerModelLoaders({
      MobileLayoutModel: {
        loader: () => import('./models/MobileLayoutModel'),
      },
      MobileLayoutMenuItemModel: {
        loader: () => import('./models/MobileMenuModels'),
      },
      MobileRootPageModel: {
        loader: () => import('./models/MobilePageModels'),
      },
      MobileChildPageModel: {
        loader: () => import('./models/MobilePageModels'),
      },
    });
    this.app.flowEngine.registerActions({
      openView: mobileOpenView,
    });
    this.app.flowEngine.flowSettings?.registerComponents({
      MobileMenuSettingsIconPicker,
    });
    registerMobilePageModelResolution();

    this.pluginSettingsManager.addMenuItem({
      key: 'ui-layout',
      title,
      icon: 'LayoutOutlined',
      aclSnippet: 'pm.ui-layout',
      showTabs: true,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'ui-layout',
      key: 'routes',
      title: this.t('Routes') as unknown as string,
      aclSnippet: 'pm.ui-layout',
      componentLoader: () => import('./pages/RoutesPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'ui-layout',
      key: 'mobile',
      title: this.t('Mobile') as unknown as string,
      aclSnippet: 'pm.ui-layout',
      link: '/mobile',
    });

    registerLayoutAwareDesktopRoutesPermissionsTab(this.app, (key) => this.t(key));

    await registerUiLayoutsFromApi(this.app);
  }
}

export default PluginUiLayoutClientV2;
