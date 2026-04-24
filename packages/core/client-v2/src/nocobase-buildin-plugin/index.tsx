/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createCollectionContextMeta } from '@nocobase/flow-engine';
import React, { createContext, type FC, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Application } from '../Application';
import { getCurrentV2RedirectPath, getDefaultV2AdminRedirectPath, redirectToLegacySignin } from '../authRedirect';
import { AppNotFound } from '../components';
import { PluginFlowEngine } from '../flow';
import { AdminLayoutMenuItemModel, AdminLayoutModel } from '../flow/admin-shell/admin-layout';
import { useApp } from '../hooks/useApp';
import { Plugin } from '../Plugin';
import { AdminSettingsLayoutModel } from '../settings-center';
import { LocalePlugin } from './plugins/LocalePlugin';

type CurrentUserState = {
  data?: {
    data?: any;
  };
  loading: boolean;
};

const AUTH_ROUTE_PREFIXES = ['/signin', '/signup', '/forgot-password', '/reset-password'];

function removeBasename(pathname: string, basename?: string) {
  if (!basename) {
    return pathname;
  }
  const escapedBasename = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedBasename.replace(/\/?$/, '')}(\\/|$)`);
  return pathname.replace(regex, '/') || pathname;
}

function isBuiltinAuthRoute(pathname: string, basename?: string) {
  const normalizedPathname = removeBasename(pathname, basename);
  return AUTH_ROUTE_PREFIXES.some((route) => {
    return normalizedPathname === route || normalizedPathname.startsWith(`${route}/`);
  });
}

function isAdminRuntimeRoute(pathname: string, basename?: string) {
  const normalizedPathname = removeBasename(pathname, basename);
  return normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/');
}

const CurrentUserContext = createContext<CurrentUserState | null>(null);
CurrentUserContext.displayName = 'CurrentUserContext';

const DataSourceBootstrapProvider: FC = ({ children }) => {
  const app = useApp();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const basename = app.router.getBasename();
    const isSkippedAuthCheckRoute =
      isBuiltinAuthRoute(location.pathname, basename) || app.router.isSkippedAuthCheckRoute(location.pathname);
    const shouldBootstrap = isAdminRuntimeRoute(location.pathname, basename);

    if (isSkippedAuthCheckRoute || !shouldBootstrap) {
      setLoading(false);
      setError(null);
      return;
    }

    if (!hasBootstrappedRef.current) {
      setLoading(true);
    }
    setError(null);

    const run = async () => {
      try {
        await app.dataSourceManager.ensureLoaded();
        hasBootstrappedRef.current = true;
        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }
        setLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [app, location.pathname]);

  if (error) {
    throw error;
  }

  if (loading) {
    return app.renderComponent('AppSpin');
  }

  return <>{children}</>;
};

const CurrentUserProvider: FC = ({ children }) => {
  const app = useApp();
  const location = useLocation();
  const [state, setState] = useState<CurrentUserState>({ loading: true });
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    let mounted = true;
    const isSkippedAuthCheckRoute =
      isBuiltinAuthRoute(pathnameRef.current, app.router.getBasename()) ||
      app.router.isSkippedAuthCheckRoute(pathnameRef.current);
    const shouldCheckCurrentUser = isAdminRuntimeRoute(pathnameRef.current, app.router.getBasename());

    if (isSkippedAuthCheckRoute || !shouldCheckCurrentUser) {
      // 认证页等免鉴权路由不应再执行 `/auth:check`，否则未登录时会重复鉴权并触发重定向抖动。
      setState({ loading: false });
      return;
    }

    const run = async () => {
      try {
        const res = await app.apiClient.request({
          url: '/auth:check',
          skipNotify: true,
          skipAuth: true,
        });

        const user = res?.data?.data;
        if (user?.id == null) {
          redirectToLegacySignin(app, getCurrentV2RedirectPath(app, locationRef.current), { replace: true });
          return;
        }

        const userMeta = createCollectionContextMeta(
          () => app.flowEngine.context.dataSourceManager?.getDataSource('main')?.getCollection('users') || null,
          app.flowEngine.translate('Current user'),
        );
        userMeta.sort = 1000;

        app.flowEngine.context.defineProperty('user', {
          value: user,
          resolveOnServer: true,
          meta: userMeta,
        });

        if (mounted) {
          setState({
            data: res?.data,
            loading: false,
          });
        }
      } catch (error: any) {
        const isAuthError = error?.response?.status === 401 || error?.status === 401;
        if (isAuthError) {
          redirectToLegacySignin(app, getCurrentV2RedirectPath(app, locationRef.current), { replace: true });
          return;
        }
        if (mounted) {
          setState({ loading: false });
        }
        throw error;
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [app]);

  if (state.loading) {
    return app.renderComponent('AppSpin');
  }

  return <CurrentUserContext.Provider value={state}>{children}</CurrentUserContext.Provider>;
};

const RootRedirect: FC = () => {
  const app = useApp();
  const hasToken = !!app?.apiClient?.auth?.token;

  useEffect(() => {
    if (!hasToken) {
      redirectToLegacySignin(app, getDefaultV2AdminRedirectPath(app), { replace: true });
    }
  }, [app, hasToken]);

  if (!hasToken) {
    return app.renderComponent('AppSpin');
  }

  return <Navigate replace to="/admin" />;
};

/**
 * client-v2 使用的内建插件集合。
 *
 * 只迁移当前 v2 运行时仍然需要的部分，显式跳过 schemaInitializerManager
 * 以及用户标注暂不迁移的旧插件注册逻辑。
 */
export class NocoBaseBuildInPlugin extends Plugin<any, Application> {
  async afterAdd() {
    await this.addPlugins();
  }

  async load() {
    this.addComponents();
    this.addRoutes();

    this.app.use(DataSourceBootstrapProvider);
    this.app.use(CurrentUserProvider);
    this.app.flowEngine.registerModels({
      AdminLayoutModel,
      AdminLayoutMenuItemModel,
      AdminSettingsLayoutModel,
    });

    this.app.pluginSettingsManager.addMenuItem({
      key: 'plugin-manager',
      title: this.app.i18n.t('Plugin manager'),
      icon: 'ApiOutlined',
      aclSnippet: 'pm',
      sort: -200,
    });
    this.app.pluginSettingsManager.addPageTabItem({
      menuKey: 'plugin-manager',
      key: 'index',
      title: this.app.i18n.t('Plugin manager'),
      componentLoader: () => import('../settings-center/PluginManagerPage'),
      aclSnippet: 'pm',
      sort: -200,
    });
    this.app.pluginSettingsManager.addMenuItem({
      key: 'system-settings',
      title: this.app.i18n.t('System settings'),
      icon: 'SettingOutlined',
      aclSnippet: 'pm.system-settings.system-settings',
      sort: -100,
    });
    this.app.pluginSettingsManager.addPageTabItem({
      menuKey: 'system-settings',
      key: 'index',
      title: this.app.i18n.t('System settings'),
      componentLoader: () => import('../settings-center/SystemSettingsPage'),
      aclSnippet: 'pm.system-settings.system-settings',
      sort: -100,
    });
  }

  addRoutes() {
    this.router.add('root', {
      path: '/',
      element: <RootRedirect />,
    });

    this.router.add('not-found', {
      path: '*',
      Component: AppNotFound,
    });

    this.router.add('admin', {
      path: '/admin',
      componentLoader: () => import('../flow/components/AdminLayout'),
    });
    this.router.add('admin.settings', {
      path: '/admin/settings',
      componentLoader: () => import('../settings-center/AdminSettingsLayout'),
    });
    this.router.add('admin.settings.route-empty', {
      path: '*',
      Component: Outlet,
    });
    this.router.add('admin.page', {
      path: '/admin/:name',
      componentLoader: () => import('../flow/components/FlowRoute'),
    });

    this.router.add('admin.page.tab', {
      path: '/admin/:name/tab/:tabUid',
      componentLoader: () => import('../flow/components/FlowRoute'),
    });
    this.router.add('admin.page.view', {
      path: '/admin/:name/view/*',
      componentLoader: () => import('../flow/components/FlowRoute'),
    });
    this.router.add('admin.page.tab.view', {
      path: '/admin/:name/tab/:tabUid/view/*',
      componentLoader: () => import('../flow/components/FlowRoute'),
    });
  }

  addComponents() {}

  async addPlugins() {
    await this.app.pm.add(PluginFlowEngine);
    await this.app.pm.add(LocalePlugin, { name: 'builtin-locale' });
  }
}

export { NocoBaseBuildInPlugin as NocoBaseBuildInPluginV2 };
