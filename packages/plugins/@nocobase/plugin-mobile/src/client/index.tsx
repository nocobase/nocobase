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
import { isDesktop } from 'react-device-detect';

import { Mobile } from './mobile';
import { MobileLayout } from './mobile-layout';
import { MobileSchemaPage } from './mobile-schema-page';
import { MobilePage, mobilePageSettings } from './mobile-page';
import {
  MobileNavigationBar,
  mobilePageTabInitializer,
  mobilePageTabSettings,
  mobileNavigationBarInitializer,
  mobileNavigationBarLinkSettings,
  useMobileNavigationBarLink,
} from './mobile-navigation-bar';
import { MobileContent, mobileAddBlockInitializer } from './mobile-content';
import {
  MobileTabBar,
  mobileTabBarInitializer,
  mobileTabBarLinkSettings,
  mobileTabBarSchemaSettings,
  mobileTabBarSettings,
} from './mobile-tab-bar';
import { generatePluginTranslationTemplate } from './locale';
import { MobileHomePage } from './mobile-home-page';
import { MobileNotFoundPage } from './mobile-not-found-page';
export * from './mobile-providers';

export class PluginMobileClient extends Plugin {
  mobileRouter?: RouterManager;
  mobilePath = '/m';
  get mobileBasename() {
    return `${this.router.getBasename()}m`; // `/m` or `/apps/aaa/m`
  }

  async afterAdd(): Promise<void> {
    this.setMobileRouter();
  }

  async load() {
    this.setMobileMeta();
    this.addComponents();
    this.addAppRoutes();
    this.addRoutes();
    this.addInitializers();
    this.addSettings();
    this.addScopes();

    this.app.pluginSettingsManager.add('mobile', {
      title: generatePluginTranslationTemplate('Mobile'),
      icon: 'MobileOutlined',
      link: this.mobileBasename,
    });
  }

  setMobileMeta() {
    if (window.location.pathname.startsWith(this.mobileBasename) && !isDesktop) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no';
      document.head.appendChild(meta);

      // 设置 body 背景色 background: '#fafbfc'
      (document.querySelector('#root') as HTMLDivElement).style.backgroundColor = '#fafbfc';
    }
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
      MobilePage,
      MobileNavigationBar,
      MobileHomePage,
      MobileContent,
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
    this.app.addComponents({ MobileLayout, MobileSchemaPage });

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
      path: '/schema/:pageSchemaUid',
      Component: 'MobileSchemaPage',
    });
    this.mobileRouter.add('mobile.schema.tabs', {
      element: <Outlet />,
    });
    this.mobileRouter.add('mobile.schema.tabs.page', {
      path: '/schema/:pageSchemaUid/tabs/:tabSchemaUid',
      Component: 'MobileSchemaPage',
    });

    this.mobileRouter.add('not-found', {
      path: '*',
      Component: 'MobileNotFoundPage',
    });
  }

  addAppRoutes() {
    this.app.addComponents({ Mobile });
    this.app.router.add('mobile', {
      path: `${this.mobilePath}/*`,
      Component: 'Mobile',
    });
  }

  getRouterComponent() {
    return this.mobileRouter.getRouterComponent();
  }
}

export default PluginMobileClient;
