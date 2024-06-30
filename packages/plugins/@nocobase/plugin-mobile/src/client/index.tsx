/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Plugin, RouterManager, createRouterManager } from '@nocobase/client';

import { Mobile } from './mobile';
import {
  MobileHomePage,
  MobilePage,
  MobileNotFoundPage,
  MobilePageContent,
  MobilePageProvider,
  mobilePageSettings,
  MobileNavigationBarAction,
  mobileAddBlockInitializer,
  useMobileNavigationBarLink,
  mobilePageTabSettings,
  MobilePageNavigationBar,
  mobilePageTabInitializer,
  mobileNavigationBarInitializer,
  mobileNavigationBarLinkSettings,
} from './pages';
import {
  MobileTabBar,
  MobileLayout,
  MobilePageOutlet,
  mobileTabBarSettings,
  mobileTabBarInitializer,
  mobileTabBarLinkSettings,
  mobileTabBarSchemaSettings,
} from './mobile-layout';
import { generatePluginTranslationTemplate } from './locale';

// 导出 JSBridge，会挂在到 window 上
import './js-bridge';
import { MobileCheckerProvider } from './providers';

export * from './mobile-providers';

export class PluginMobileClient extends Plugin {
  mobileRouter?: RouterManager;
  mobilePath = '/m';
  get mobileBasename() {
    return `${this.router.getBasename()}m`; // `/m` or `/apps/aaa/m`（多应用）
  }

  async afterAdd(): Promise<void> {
    this.setMobileRouter();
  }

  async load() {
    this.addComponents();
    this.addAppRoutes();
    this.addRoutes();
    this.addInitializers();
    this.addSettings();
    this.addScopes();
    this.app.addProvider(MobileCheckerProvider);

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
      mobilePageTabInitializer,
      mobileNavigationBarInitializer,
    );
  }

  addSettings() {
    this.app.schemaSettingsManager.add(
      mobileTabBarSettings,
      mobilePageSettings,
      mobileTabBarSchemaSettings,
      mobileTabBarLinkSettings,
      mobilePageTabSettings,
      mobileNavigationBarLinkSettings,
    );
  }

  addComponents() {
    this.app.addComponents({
      MobilePageProvider,
      MobilePageOutlet,
      MobileNavigationBarAction,
      MobilePageNavigationBar,
      MobileHomePage,
      MobilePageContent,
      MobileTabBar,
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

    // 跳转到主应用的登录页
    this.mobileRouter.add('signin', {
      path: '/signin',
      Component: () => {
        window.location.href = window.location.href
          .replace(this.mobilePath, '')
          .replace('redirect=', `redirect=${this.mobilePath}`);
        return null;
      },
    });

    this.mobileRouter.add('mobile.schema', {
      element: <Outlet />,
    });
    this.mobileRouter.add('mobile.schema.page', {
      path: '/schema/:schemaPageUid',
      Component: 'MobilePage',
    });
    this.mobileRouter.add('mobile.schema.tabs', {
      element: <Outlet />,
    });
    this.mobileRouter.add('mobile.schema.tabs.page', {
      path: '/schema/:schemaPageUid/tabs/:tabSchemaUid',
      Component: 'MobilePage',
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
}

export default PluginMobileClient;
