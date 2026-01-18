/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, RouterManager, createRouterManager } from '../application';
import React from 'react';

import { Outlet } from 'react-router-dom';

import { Mobile } from './Mobile';
import {
  MobileLayout,
  MobileTabBar,
  mobileTabBarInitializer,
  mobileTabBarLinkSettings,
  mobileTabBarPageSettings,
} from './mobile-layout';
import {
  MobileHomePage,
  MobileNavigationActionBar,
  MobileNavigationBarAction,
  MobileNotFoundPage,
  MobilePage,
  MobilePageContent,
  MobilePageHeader,
  MobilePageNavigationBar,
  MobilePageProvider,
  MobilePageTabs,
  mobileAddBlockInitializer,
  mobileNavigationBarActionsInitializer,
  mobileNavigationBarLinkSettings,
  mobilePageSettings,
  mobilePageTabsSettings,
  mobilePagesTabInitializer,
  useMobileNavigationBarLink,
} from './pages';
import { MobileComponentsProvider } from './MobileComponentsProvider';

import PluginACLClient from '@nocobase/plugin-acl/client';
import { MenuPermissions, MobileAllRoutesProvider } from './MenuPermissions';
import { PagePopups } from '../schema-component';

export class PluginMobileClient extends Plugin {
  mobileRouter?: RouterManager;
  mobilePath = '/m';

  get desktopMode() {
    return this.options?.config?.desktopMode ?? true;
  }

  get mobileBasename() {
    return `${this.router.getBasename()}m`;
  }

  async updateOptions(value: { showTabBar?: boolean; showBackButton?: boolean }) {
    if (!this.options) {
      this.options = {};
    }

    this.options.options = {
      ...this.options?.options,
      ...value,
    };
    return this.app.apiClient.request({
      url: 'applicationPlugins:update',
      method: 'post',
      params: {
        filter: {
          packageName: this.options?.packageName,
        },
      },
      data: {
        options: this.options.options,
      },
    });
  }

  getPluginOptions() {
    return this.options?.options;
  }

  async afterAdd(): Promise<void> {
    this.setMobileRouter();
  }

  async load() {
    this.app.use(MobileComponentsProvider);
    this.addComponents();
    this.addAppRoutes();
    this.addRoutes();
    this.addInitializers();
    this.addSettings();
    this.addScopes();
    this.addPermissionsSettingsUI();
  }

  addScopes() {
    this.app.addScopes({
      useMobileNavigationBarLink,
    });
  }

  addInitializers() {
    this.app.schemaInitializerManager.add(
      mobileAddBlockInitializer,
      mobileTabBarInitializer,
      mobilePagesTabInitializer,
      mobileNavigationBarActionsInitializer,
    );
  }

  addSettings() {
    this.app.schemaSettingsManager.add(
      mobilePageSettings,
      mobileTabBarPageSettings,
      mobileTabBarLinkSettings,
      mobilePageTabsSettings,
      mobileNavigationBarLinkSettings,
    );
  }

  addComponents() {
    this.app.addComponents({
      MobilePageProvider,
      MobileNavigationBarAction,
      MobilePageNavigationBar,
      MobileHomePage,
      MobilePageContent,
      MobileTabBar,
      MobilePageHeader,
      MobilePageTabs,
      MobileNavigationActionBar,
      MobileNotFoundPage,
    });
  }

  setMobileRouter() {
    const router = createRouterManager(
      this.options?.config?.router || { type: 'browser', basename: this.mobileBasename },
      this.app,
    );
    this.mobileRouter = router;
  }

  addRoutes() {
    this.app.addComponents({ MobileLayout, MobilePage });

    this.mobileRouter.add('mobile', {
      Component: 'MobileLayout',
    });

    this.mobileRouter.add('mobile.home', {
      path: '/',
      Component: 'MobileHomePage',
    });

    this.mobileRouter.add('signin', {
      path: '/signin',
      Component: () => {
        window.location.href = window.location.href
          .replace(this.mobilePath + '/', '/')
          .replace('redirect=', `redirect=${this.mobilePath}`);
        return null;
      },
    });

    this.mobileRouter.add('admin', {
      path: `/admin/*`,
      Component: () => {
        if (window.location.pathname.includes(`${this.mobilePath}/admin/`)) {
          window.location.replace(window.location.href.replace(this.mobilePath + '/', '/'));
        }
        return null;
      },
    });

    this.mobileRouter.add('mobile.schema', {
      element: <Outlet />,
    });
    this.mobileRouter.add('mobile.schema.page', {
      path: '/page/:pageSchemaUid',
      Component: 'MobilePage',
    });
    this.mobileRouter.add('mobile.schema.page.popup', {
      path: '/page/:pageSchemaUid/popups/*',
      Component: PagePopups,
    });
    this.mobileRouter.add('mobile.schema.tabs', {
      element: <Outlet />,
    });
    this.mobileRouter.add('mobile.schema.tabs.page', {
      path: '/page/:pageSchemaUid/tabs/:tabSchemaUid',
      Component: 'MobilePage',
    });
    this.mobileRouter.add('mobile.schema.tabs.page.popup', {
      path: '/page/:pageSchemaUid/tabs/:tabSchemaUid/popups/*',
      Component: PagePopups,
    });

    this.mobileRouter.add('not-found', {
      path: '*',
      Component: 'MobileNotFoundPage',
    });
  }

  addAppRoutes() {
    this.app.addComponents({ Mobile });
    this.app.router.add('m', {
      path: `${this.mobilePath}/*`,
      Component: 'Mobile',
    });
  }

  getRouterComponent() {
    return this.mobileRouter.getRouterComponent();
  }

  addPermissionsSettingsUI() {
    this.app.pm.get(PluginACLClient)?.settingsUI.addPermissionsTab(({ t, TabLayout, activeKey, currentUserRole }) => {
      if (
        currentUserRole &&
        ((!currentUserRole.snippets.includes('pm.mobile') && !currentUserRole.snippets.includes('pm.*')) ||
          currentUserRole.snippets.includes('!pm.mobile'))
      ) {
        return null;
      }

      return {
        key: 'mobile-menu',
        label: t('Mobile routes'),
        children: (
          <TabLayout>
            <MobileAllRoutesProvider active={activeKey === 'mobile-menu'}>
              <MenuPermissions active={activeKey === 'mobile-menu'} />
            </MobileAllRoutesProvider>
          </TabLayout>
        ),
      };
    });
  }
}
