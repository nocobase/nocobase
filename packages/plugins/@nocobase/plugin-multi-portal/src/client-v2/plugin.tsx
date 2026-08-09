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
import { PortalAccessRuntimeProvider } from './PortalAccessBoundary';
import { RootLanding } from './RootLanding';
import { registerPortalEntryActions } from './entryActions/registerPortalEntryActions';
import { fetchMultiPortals, registerMultiPortals, type MultiPortalRuntimeRecord } from './layoutRegistration';
import { MultiPortalBlockModel } from './models/MultiPortalBlockModel';
import { registerMultiPortalPermissionsTab } from './permissions/multiPortalPermissions';
import { PortalAccessController, type PortalAccessApiClient } from './portalAccess';

type AuthRouteScopeRegistrar = {
  registerAuthRouteScope?: (name: string, basePath: string, routeNames?: { signin?: string; signup?: string }) => void;
  registerSignInRoute?: (name: string, path: string) => void;
};

function registerMultiPortalAuthRouteScopes(
  authPlugin: AuthRouteScopeRegistrar | undefined,
  records: MultiPortalRuntimeRecord[],
) {
  if (
    !authPlugin ||
    (typeof authPlugin.registerAuthRouteScope !== 'function' && typeof authPlugin.registerSignInRoute !== 'function')
  ) {
    return;
  }

  for (const record of records) {
    if (!record.enabled || (record.portalType || 'no-code') !== 'no-code') {
      continue;
    }
    const encodedUid = encodeURIComponent(record.uid).replace(/\./g, '%2E');
    const routeName = `multiPortal_${encodedUid}`;
    const signinRouteName = `multiPortalSignin_${encodedUid}`;
    if (typeof authPlugin.registerAuthRouteScope === 'function') {
      authPlugin.registerAuthRouteScope(routeName, record.routePath, {
        signin: signinRouteName,
        signup: `multiPortalSignup_${encodedUid}`,
      });
    } else {
      authPlugin.registerSignInRoute?.(signinRouteName, `${record.routePath.replace(/\/+$/g, '')}/signin`);
    }
  }
}

function getCurrentPathname(app: PluginMultiPortalClientV2['app']) {
  try {
    const pathname = app.router.state?.location?.pathname;
    if (pathname) {
      return pathname;
    }
  } catch {
    // The React Router instance is created after plugins finish loading.
  }
  return globalThis.window?.location?.pathname || '/';
}

export class PluginMultiPortalClientV2 extends Plugin {
  async load() {
    const title = String(this.t('Portal manager'));

    this.app.flowEngine.registerModels({ MultiPortalBlockModel });

    this.app.flowEngine.registerModelLoaders({
      MultiPortalDesktopLayoutModel: {
        loader: () => import('./models/MultiPortalLayoutModels'),
      },
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

    const portalAccessController = new PortalAccessController({
      apiClient: this.app.apiClient as unknown as PortalAccessApiClient,
      getBasename: () => this.app.router.getBasename(),
      getCurrentPathname: () => getCurrentPathname(this.app),
    });
    portalAccessController.install();
    this.app.use(PortalAccessRuntimeProvider, { controller: portalAccessController });

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
      portalAccessController.setRecords(records);
      registerMultiPortalAuthRouteScopes(this.app.pm.get<AuthRouteScopeRegistrar>('@nocobase/plugin-auth'), records);
    } catch (error) {
      console.error('[NocoBase] Failed to register multi-portals.', error);
      portalAccessController.setRecords([]);
      runtimeRegistrationFailed = true;
    }
  }
}

export default PluginMultiPortalClientV2;
