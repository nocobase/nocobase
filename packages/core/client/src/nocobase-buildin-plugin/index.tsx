/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
import { Plugin } from '../application/Plugin';
import { BlockSchemaComponentPlugin } from '../block-provider';
import { CollectionPlugin } from '../collection-manager';
import { RemoteDocumentTitlePlugin } from '../document-title';
import { useAPIClient } from '../api-client';
import { AppNotFound, PluginFlowEngine } from '@nocobase/client-v2';
import { PinnedListPlugin } from '../plugin-manager';
import { PMPlugin } from '../pm';
import { AdminLayoutPlugin, RouteSchemaComponent } from '../route-switch';
import { AntdSchemaComponentPlugin, PageTabs, SchemaComponentPlugin } from '../schema-component';
import { ErrorFallback } from '../schema-component/antd/error-fallback';
import { PagePopups } from '../schema-component/antd/page/PagePopups';
import { AssociationFilterPlugin, SchemaInitializerPlugin } from '../schema-initializer';
import { SchemaSettingsPlugin } from '../schema-settings';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsPlugin } from '../system-settings';
import { CurrentUserProvider, CurrentUserSettingsMenuProvider } from '../user';
import { LocalePlugin } from './plugins/LocalePlugin';

export class NocoBaseBuildInPlugin extends Plugin {
  async afterAdd() {
    await this.addPlugins();
  }

  /**
   * Redirect component for root path:
   * - If there is a token, go to `/admin` (existing behavior)
   * - If not logged in, go to `/signin?redirect=/admin`
   * This avoids the race where `/` first jumps to `/admin` before auth check.
   */
  private static RootRedirect: FC = () => {
    const api = useAPIClient();
    const hasToken = !!api?.auth?.token;
    const to = hasToken ? '/admin' : '/signin?redirect=/admin';
    return <Navigate replace to={to} />;
  };

  async load() {
    this.addComponents();
    this.addRoutes();

    this.app.use(CurrentUserProvider);
    this.app.use(CurrentUserSettingsMenuProvider);

    this.app.pluginSettingsManager.add('security', {
      title: tval('Security'),
      icon: 'SafetyOutlined',
    });
  }

  addRoutes() {
    this.router.add('root', {
      path: '/',
      element: <NocoBaseBuildInPlugin.RootRedirect />,
    });

    this.router.add('not-found', {
      path: '*',
      Component: AppNotFound,
    });

    this.router.add('admin', {
      path: '/admin',
      Component: 'AdminLayout',
    });
    this.router.add('admin.page', {
      path: '/admin/:name',
      Component: 'AdminDynamicPage',
    });
    this.router.add('admin.page.tabs', {
      path: '/admin/:name/tabs/:tabUid',
      Component: PageTabs as any,
    });
    this.router.add('admin.page.popups', {
      path: '/admin/:name/popups/*',
      Component: PagePopups,
    });
    this.router.add('admin.page.tabs.popups', {
      path: '/admin/:name/tabs/:tabUid/popups/*',
      Component: PagePopups,
    });

    // 和 2.0 相关的路由
    this.router.add('admin.page.tab', {
      path: '/admin/:name/tab/:tabUid', // 为了和 2.0 的路由区分，这里使用 tab 而不是 tabs
      Component: 'AdminDynamicPage',
    });
    this.router.add('admin.page.view', {
      path: '/admin/:name/view/*',
      Component: 'AdminDynamicPage',
    });
    this.router.add('admin.page.tab.view', {
      path: '/admin/:name/tab/:tabUid/view/*',
      Component: 'AdminDynamicPage',
    });
  }

  addComponents() {
    this.app.addComponents({
      ErrorFallback,
      RouteSchemaComponent,
      BlockTemplatePage,
      BlockTemplateDetails,
    });
  }
  async addPlugins() {
    await this.app.pm.add(PluginFlowEngine);
    await this.app.pm.add(AssociationFilterPlugin);
    await this.app.pm.add(LocalePlugin, { name: 'builtin-locale' });
    await this.app.pm.add(AdminLayoutPlugin, { name: 'admin-layout' });
    await this.app.pm.add(SystemSettingsPlugin, { name: 'system-setting' });
    await this.app.pm.add(PinnedListPlugin, {
      name: 'pinned-list',
      config: {
        items: {
          ui: { order: 100, component: 'DesignableSwitch', pin: true, snippet: 'ui.*' },
          // pm: { order: 200, component: 'PluginManagerLink', pin: true, snippet: 'pm' },
          sc: { order: 300, component: 'SettingsCenterDropdown', pin: true, snippet: 'pm.*' },
        },
      },
    });
    await this.app.pm.add(SchemaComponentPlugin, { name: 'schema-component' });
    await this.app.pm.add(SchemaInitializerPlugin, { name: 'schema-initializer' });
    await this.app.pm.add(SchemaSettingsPlugin, { name: 'schema-settings' });
    await this.app.pm.add(BlockSchemaComponentPlugin, { name: 'block-schema-component' });
    await this.app.pm.add(AntdSchemaComponentPlugin, { name: 'antd-schema-component' });
    await this.app.pm.add(ACLPlugin, { name: 'builtin-acl' });
    await this.app.pm.add(RemoteDocumentTitlePlugin, { name: 'remote-document-title' });
    await this.app.pm.add(PMPlugin, { name: 'builtin-pm' });
    await this.app.pm.add(CollectionPlugin, { name: 'builtin-collection' });
  }
}
