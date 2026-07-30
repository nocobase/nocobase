/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import React from 'react';
import { RootLanding } from './RootLanding';
import { registerPortalEntryActions } from './entryActions/registerPortalEntryActions';
import { fetchMultiPortals, registerMultiPortals, type MultiPortalRuntimeRecord } from './layoutRegistration';
import { MultiPortalBlockModel } from './models/MultiPortalBlockModel';
import { registerMultiPortalPermissionsTab } from './permissions/multiPortalPermissions';

type SignInRouteRegistrar = {
  registerSignInRoute: (name: string, path: string) => void;
};

function registerMultiPortalSignInRoutes(
  authPlugin: SignInRouteRegistrar | undefined,
  records: MultiPortalRuntimeRecord[],
) {
  if (!authPlugin || typeof authPlugin.registerSignInRoute !== 'function') {
    return;
  }

  for (const record of records) {
    if (!record.enabled || (record.portalType || 'no-code') !== 'no-code') {
      continue;
    }
    const routeName = `multiPortalSignin_${encodeURIComponent(record.uid).replace(/\./g, '%2E')}`;
    const routePath = `${record.routePath.replace(/\/+$/g, '')}/signin`;
    authPlugin.registerSignInRoute(routeName, routePath);
  }
}

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

    if (this.pluginSettingsManager.getRouteName('') === 'settings.') {
      return;
    }

    let runtimeRegistrationFailed = false;
    this.router.add('root', {
      path: '/',
      Component: () => <RootLanding runtimeRegistrationFailed={runtimeRegistrationFailed} />,
      authCheck: false,
      skipAuthCheck: true,
    });

    try {
      const records = await fetchMultiPortals(this.app.apiClient);
      registerMultiPortals(this.app, records);
      registerMultiPortalSignInRoutes(this.app.pm.get<SignInRouteRegistrar>('@nocobase/plugin-auth'), records);
    } catch {
      runtimeRegistrationFailed = true;
    }
  }
}

export default PluginMultiPortalClientV2;
