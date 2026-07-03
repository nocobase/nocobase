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
import React from 'react';
import { Navigate } from 'react-router-dom';
import { registerUiLayoutsFromApi } from './layoutRegistration';
import { mobileOpenView } from './mobileOpenViewAction';
import { registerMobilePageModelResolution } from './mobilePageModelResolution';
import { MobileMenuSettingsIconPicker } from './models/MobileMenuComponents';
import { registerLayoutAwareDesktopRoutesPermissionsTab } from './permissions/layoutAwareDesktopRoutesPermissions';

function MobileSettingsRedirect() {
  return <Navigate replace to="/mobile" />;
}

function getMobileSettingsLink(app: Application) {
  return app.getRouteUrl?.('/mobile') || '/mobile';
}

export class PluginUiLayoutClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
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
      key: 'mobile',
      title: this.t('Mobile') as unknown as string,
      icon: 'MobileOutlined',
      aclSnippet: 'pm.mobile',
      link: getMobileSettingsLink(this.app),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'mobile',
      key: 'index',
      title: this.t('Mobile') as unknown as string,
      aclSnippet: 'pm.mobile',
      Component: MobileSettingsRedirect,
    });

    this.pluginSettingsManager.addMenuItem({
      key: 'routes',
      title: this.t('Routes') as unknown as string,
      icon: 'ApartmentOutlined',
      aclSnippet: 'pm.routes',
      showTabs: true,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'routes',
      key: 'index',
      title: this.t('Desktop routes') as unknown as string,
      aclSnippet: 'pm.routes',
      componentLoader: () => import('./pages/RoutesPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'routes',
      key: 'mobile',
      title: this.t('Mobile routes') as unknown as string,
      aclSnippet: 'pm.routes',
      componentLoader: async () => {
        const module = await import('./pages/RoutesPage');
        return { default: module.MobileRoutesPage };
      },
    });
    this.pluginSettingsManager.setPluginSettingsLink('ui-layout', 'routes');

    registerLayoutAwareDesktopRoutesPermissionsTab(this.app, (key) => this.t(key));

    await registerUiLayoutsFromApi(this.app);
  }
}

export default PluginUiLayoutClientV2;
