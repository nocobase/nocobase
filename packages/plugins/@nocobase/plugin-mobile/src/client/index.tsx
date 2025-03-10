/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PagePopups, Plugin, RouterManager, createRouterManager } from '@nocobase/client';
import React from 'react';
// @ts-ignore
import { name } from '../../package.json';

import { Outlet } from 'react-router-dom';

import { generatePluginTranslationTemplate } from './locale';
import { Mobile } from './mobile';
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

import PluginACLClient from '@nocobase/plugin-acl/client';
import { MenuPermissions, MobileAllRoutesProvider } from './MenuPermissions';

// 导出 JSBridge，会挂在到 window 上
import './js-bridge';
import { MobileSettings } from './mobile-blocks/settings-block/MobileSettings';
import { MobileSettingsBlockInitializer } from './mobile-blocks/settings-block/MobileSettingsBlockInitializer';
import { MobileSettingsBlockSchemaSettings } from './mobile-blocks/settings-block/schemaSettings';
// @ts-ignore
import pkg from './../../package.json';
import { MobileComponentsProvider } from './MobileComponentsProvider';

export * from './desktop-mode';
export * from './mobile';
export * from './mobile-layout';
export * from './mobile-providers';
export * from './pages';

export class PluginMobileClient extends Plugin {
  mobileRouter?: RouterManager;
  mobilePath = '/m';

  get desktopMode() {
    return this.options?.config?.desktopMode ?? true;
  }

  get mobileBasename() {
    return `${this.router.getBasename()}m`; // `/m` or `/apps/aaa/m`（多应用）
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
          packageName: name,
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

    this.app.pluginSettingsManager.add('mobile', {
      title: generatePluginTranslationTemplate('Mobile'),
      icon: 'MobileOutlined',
      link: this.mobileBasename,
    });
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
      MobileSettingsBlockSchemaSettings,
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
      MobileSettingsBlockInitializer,
      MobileSettings,
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

    // redirect to main app signin page
    // e.g. /m/signin => /signin
    this.mobileRouter.add('signin', {
      path: '/signin',
      Component: () => {
        window.location.href = window.location.href
          .replace(this.mobilePath + '/', '/')
          .replace('redirect=', `redirect=${this.mobilePath}`);
        return null;
      },
    });

    // redirect to main app admin page
    // e.g. /m/admin/xxx => /admin/xxx
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
        label: t('Mobile routes', {
          ns: pkg.name,
        }),
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

export default PluginMobileClient;
