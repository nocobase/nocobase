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

// @ts-ignore
import { name } from '../../package.json';

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
  mobileNavigationBarActionsInitializer,
  mobileNavigationBarLinkSettings,
  MobileNavigationActionBar,
} from './pages';
import {
  MobileTabBar,
  MobileLayout,
  mobileTabBarSettings,
  mobileTabBarInitializer,
  mobileTabBarLinkSettings,
  mobileTabBarPageSettings,
} from './mobile-layout';
import { generatePluginTranslationTemplate } from './locale';

// 导出 JSBridge，会挂在到 window 上
import './js-bridge';
import { MobileCheckerProvider } from './providers';

export * from './mobile-providers';
export * from './mobile';
export * from './mobile-layout';
export * from './providers';
export * from './pages';
export * from './desktop-mode';

export class PluginMobileClient extends Plugin {
  mobileRouter?: RouterManager;
  mobilePath = '/m';

  get desktopMode() {
    return this.options?.config?.desktopMode ?? true;
  }

  get mobileBasename() {
    return `${this.router.getBasename()}m`; // `/m` or `/apps/aaa/m`（多应用）
  }

  async updateOptions(value: { showTabBar?: boolean }) {
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
      mobileNavigationBarActionsInitializer,
    );
  }

  addSettings() {
    this.app.schemaSettingsManager.add(
      mobileTabBarSettings,
      mobilePageSettings,
      mobileTabBarPageSettings,
      mobileTabBarLinkSettings,
      mobilePageTabSettings,
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
      path: '/page/:pageSchemaUid',
      Component: 'MobilePage',
    });
    this.mobileRouter.add('mobile.schema.tabs', {
      element: <Outlet />,
    });
    this.mobileRouter.add('mobile.schema.tabs.page', {
      path: '/page/:pageSchemaUid/tabs/:tabSchemaUid',
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
