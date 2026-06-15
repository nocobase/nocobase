/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createCollectionContextMeta, useFlowEngine } from '@nocobase/flow-engine';
import React, { createContext, type FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl';
import type { Application } from '../Application';
import { getCurrentV2RedirectPath, getDefaultV2AdminRedirectPath } from '../authRedirect';
import { AppNotFound } from '../components';
import { PluginFlowEngine } from '../flow';
import { ADMIN_LAYOUT_MODEL_UID, AdminLayoutMenuItemModel, AdminLayoutModel } from '../flow/admin-shell/admin-layout';
import { useApp } from '../hooks/useApp';
import { Plugin } from '../Plugin';
import { AdminSettingsLayoutModel } from '../settings-center';
import { LocalePlugin } from './plugins/LocalePlugin';

export type CurrentUserState = {
  data?: {
    data?: any;
  };
  loading: boolean;
};

type CurrentUserAuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'redirecting';

type CurrentUserInternalState = CurrentUserState & {
  authStatus: CurrentUserAuthStatus;
  error?: Error | null;
};

export type CurrentRoleOption = {
  name: string;
  title: string;
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

function hasAuthCheckRoute(app: Application, pathname: string) {
  const matchedRoutes = app.router.matchRoutes(pathname) || [];
  return matchedRoutes.some((match) => match?.route?.authCheck === true);
}

function shouldCheckRuntimeRoute(app: Application, pathname: string) {
  return isAdminRuntimeRoute(pathname, app.router.getBasename()) || hasAuthCheckRoute(app, pathname);
}

type CurrentUserAuthCheckRouteState = 'skipped' | 'unchecked' | 'required';

function getCurrentUserAuthCheckRouteState(app: Application, pathname: string): CurrentUserAuthCheckRouteState {
  const basename = app.router.getBasename();
  if (isBuiltinAuthRoute(pathname, basename) || app.router.isSkippedAuthCheckRoute(pathname)) {
    return 'skipped';
  }

  if (!shouldCheckRuntimeRoute(app, pathname)) {
    return 'unchecked';
  }

  return 'required';
}

export const CurrentUserContext = createContext<CurrentUserState | null>(null);
CurrentUserContext.displayName = 'CurrentUserContext';

export function useCurrentUserContext() {
  return useContext(CurrentUserContext);
}

/**
 * 返回当前用户在 v2 应用上下文中可选的角色列表，等价于 v1 `useCurrentRoles`：从 FlowEngine 全局上下文 `engine.context.user.roles` 派生（CurrentUserProvider 在 `/auth:check` 成功后通过 `defineProperty('user', { value })` 写入），按需追加匿名角色，并去掉合并角色 `__union__`。v2 中角色 title 可能含有 `{{t('...')}}` 模板，因此用 flowEngine.context.t 解析。
 *
 * 不读 React `CurrentUserContext`：FlowEngine 的 dialog/drawer/popover 内容通过 `ctx.viewer` 渲染到独立的 ElementsHolder，部分场景会脱离原 Provider 树；FlowEngine 全局上下文是同一份数据但不受 React 树位置影响。
 */
export function useCurrentRoles(): CurrentRoleOption[] {
  const { allowAnonymous } = useACLRoleContext();
  const engine = useFlowEngine();
  const rolesRaw = engine?.context?.user?.roles as Array<{ name: string; title?: string }> | undefined;

  return useMemo(() => {
    const compile = (value: string | undefined): string =>
      value == null ? '' : engine?.context?.t ? engine.context.t(value) : value;
    const roles: CurrentRoleOption[] = (rolesRaw || [])
      .filter((role) => role?.name !== '__union__')
      .map((role) => ({ name: role.name, title: compile(role.title) }));
    if (allowAnonymous) {
      roles.push({ name: 'anonymous', title: 'Anonymous' });
    }
    return roles;
  }, [allowAnonymous, engine, rolesRaw]);
}

const DataSourceBootstrapProvider: FC = ({ children }) => {
  const app = useApp<Application>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const basename = app.router.getBasename();
    const isSkippedAuthCheckRoute =
      isBuiltinAuthRoute(location.pathname, basename) || app.router.isSkippedAuthCheckRoute(location.pathname);
    const shouldBootstrap = shouldCheckRuntimeRoute(app, location.pathname);

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

    run();

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
  const app = useApp<Application>();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<CurrentUserInternalState>({ loading: true, authStatus: 'unknown' });
  const locationRef = useRef(location);
  locationRef.current = location;
  const authCheckRouteState = getCurrentUserAuthCheckRouteState(app, location.pathname);
  const shouldBlockAuthRequiredRoute = authCheckRouteState === 'required' && state.authStatus !== 'authenticated';
  const contextValue = useMemo<CurrentUserState>(
    () => ({
      data: state.data,
      loading: state.loading,
    }),
    [state.data, state.loading],
  );

  useEffect(() => {
    let mounted = true;

    if (authCheckRouteState !== 'required') {
      // 认证页等免鉴权路由不应再执行 `/auth:check`，否则未登录时会重复鉴权并触发重定向抖动。
      setState({ loading: false, authStatus: 'unauthenticated', error: null });
      return;
    }

    setState((previous) =>
      previous.authStatus === 'authenticated'
        ? previous
        : { data: previous.data, loading: true, authStatus: 'unknown', error: null },
    );

    const run = async () => {
      try {
        const res = await app.apiClient.request({
          url: '/auth:check',
          skipNotify: true,
          skipAuth: true,
        });

        if (!mounted) {
          return;
        }

        const user = res?.data?.data;
        // 服务端通过 `{ code: 302, redirect }` 通知客户端先去某个中间页(例如 2FA 验证页)。这类响应没有 user.id,但也不能视为未登录——否则会和处理 302 的全局响应拦截器 (例如 plugin-two-factor-authentication 注册的那一个)竞态,而 `window.location.replace` 会覆盖更早发出的 `window.location.href`,把用户错误地弹回登录页。让响应拦截器接管跳转。
        if (user?.code === 302) {
          setState({ loading: false, authStatus: 'redirecting', error: null });
          return;
        }
        if (user?.id == null) {
          // 用 react-router navigate (虚拟跳转)而不是 location.replace, 这样如果有其他响应拦截器已经发起了 window.location.href 整页跳转(例如 2FA 插件接收到服务端 302 重定向), 真实跳转可以胜出 navigate, 不会被这里的 signin 重定向覆盖。
          setState({ loading: true, authStatus: 'unauthenticated', error: null });
          navigate(`/signin?redirect=${encodeURIComponent(getCurrentV2RedirectPath(app, locationRef.current))}`, {
            replace: true,
          });
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

        setState({
          data: res?.data,
          loading: false,
          authStatus: 'authenticated',
          error: null,
        });
      } catch (error: unknown) {
        if (!mounted) {
          return;
        }

        const errorLike = error as { response?: { status?: number }; status?: number };
        const isAuthError = errorLike?.response?.status === 401 || errorLike?.status === 401;
        if (isAuthError) {
          setState({ loading: true, authStatus: 'unauthenticated', error: null });
          navigate(`/signin?redirect=${encodeURIComponent(getCurrentV2RedirectPath(app, locationRef.current))}`, {
            replace: true,
          });
          return;
        }
        setState({
          loading: false,
          authStatus: 'unknown',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [app, authCheckRouteState, navigate]);

  if (state.error) {
    throw state.error;
  }

  if (state.loading || shouldBlockAuthRequiredRoute) {
    return app.renderComponent('AppSpin');
  }

  return <CurrentUserContext.Provider value={contextValue}>{children}</CurrentUserContext.Provider>;
};

const RootRedirect: FC = () => {
  const app = useApp<Application>();
  const hasToken = !!app?.apiClient?.auth?.token;
  const targetPath = getDefaultV2AdminRedirectPath(app);

  if (!hasToken) {
    // 用 react-router <Navigate /> 而非 location.replace, 避免覆盖同时段其它响应拦截器触发的 window.location.href (例如 2FA 接收到服务端 302 时设置的整页跳转)。
    return <Navigate replace to={`/signin?redirect=${encodeURIComponent(targetPath)}`} />;
  }

  return <Navigate replace to="/admin" />;
};

/**
 * client-v2 使用的内建插件集合。
 *
 * 只迁移当前 v2 运行时仍然需要的部分，显式跳过 schemaInitializerManager 以及用户标注暂不迁移的旧插件注册逻辑。
 */
export class NocoBaseBuildInPlugin extends Plugin<any, Application> {
  async afterAdd() {
    await this.addPlugins();
  }

  async load() {
    this.addComponents();
    this.addRoutes();

    // Auth-required routes must finish auth check or redirect before data source metadata requests can start.
    this.app.use(CurrentUserProvider);
    this.app.use(DataSourceBootstrapProvider);
    this.app.flowEngine.registerModels({
      AdminLayoutModel,
      AdminLayoutMenuItemModel,
      AdminSettingsLayoutModel,
    });
    this.app.layoutManager.registerLayout({
      routeName: 'admin',
      routePath: '/admin',
      uid: ADMIN_LAYOUT_MODEL_UID,
      layoutModelClass: 'AdminLayoutModel',
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
      componentLoader: () => import('../settings-center/plugin-manager'),
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
    // Parent menu for security-related plugin settings (password policy, locked users, etc.). Registered here in the buildin plugin so any pro plugin can attach page tabs to `menuKey: 'security'` without each one re-registering the same parent.
    this.app.pluginSettingsManager.addMenuItem({
      key: 'security',
      title: this.app.i18n.t('Security'),
      icon: 'SafetyOutlined',
      aclSnippet: 'pm.security',
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

    this.router.add('admin.settings', {
      path: '/admin/settings',
      componentLoader: () => import('../settings-center/AdminSettingsLayout'),
    });
    this.router.add('admin.settings.route-empty', {
      path: '*',
      Component: Outlet,
    });
  }

  addComponents() {}

  async addPlugins() {
    await this.app.pm.add(PluginFlowEngine);
    await this.app.pm.add(LocalePlugin, { name: 'builtin-locale' });
  }
}

export { NocoBaseBuildInPlugin as NocoBaseBuildInPluginV2 };
