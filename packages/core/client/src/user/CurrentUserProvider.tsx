/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createCollectionContextMeta, useFlowEngine } from '@nocobase/flow-engine';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl';
import { ReturnTypeOfUseRequest, useAPIClient, useRequest } from '../api-client';
import { useApp, useAppSpin } from '../application';
import { useCompile } from '../schema-component';

export const CurrentUserContext = createContext<ReturnTypeOfUseRequest>(null);
CurrentUserContext.displayName = 'CurrentUserContext';

const builtinAuthRoutes = new Set(['/signin', '/signup', '/forgot-password', '/reset-password']);

const normalizePathname = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

const removeBasename = (pathname: string, basename?: string) => {
  if (!basename || basename === '/') {
    return normalizePathname(pathname);
  }

  const normalizedBasename = normalizePathname(basename);
  const escapedBasename = normalizedBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const basenamePattern = new RegExp(`^${escapedBasename}(?=/|$)`);
  return normalizePathname(pathname.replace(basenamePattern, '') || '/');
};

const isBuiltinAuthRoute = (pathname: string) => {
  return builtinAuthRoutes.has(normalizePathname(pathname));
};

const getCurrentRedirectPath = (pathname: string, search: string, basename?: string) => {
  return `${removeBasename(pathname, basename)}${search}`;
};

const getSigninPath = (pathname: string, search: string, basename?: string) => {
  const params = new URLSearchParams();
  params.set('redirect', getCurrentRedirectPath(pathname, search, basename));
  return `/signin?${params.toString()}`;
};

export const useCurrentUserContext = () => {
  const flowEngine = useFlowEngine();
  const contextValue = useContext(CurrentUserContext);

  if (!contextValue && flowEngine) {
    return {
      data: {
        data: flowEngine.context.user,
      },
    } as any;
  }

  return contextValue;
};

export const useIsLoggedIn = () => {
  const ctx = useContext(CurrentUserContext);
  return !!ctx?.data?.data;
};

export const useCurrentRoles = () => {
  const { allowAnonymous } = useACLRoleContext();
  const { data } = useCurrentUserContext() || {};
  const compile = useCompile();
  const options = useMemo(() => {
    const roles = (data?.data?.roles || []).map(({ name, title }) => ({ name, title: compile(title) }));
    if (allowAnonymous) {
      roles.push({
        title: 'Anonymous',
        name: 'anonymous',
      });
    }
    return roles;
  }, [allowAnonymous, data?.data?.roles, compile]);
  return options;
};

export const CurrentUserProvider = (props) => {
  const api = useAPIClient();
  const app = useApp();
  const flowEngine = useFlowEngine();
  const navigate = useNavigate();
  const location = useLocation();
  const runtimeFlowEngine = app?.flowEngine || flowEngine;
  const [redirectingToSignin, setRedirectingToSignin] = useState(false);
  const router = app?.router;
  const basename = router?.getBasename?.() || router?.basename;
  const currentPathname = removeBasename(location.pathname, basename);
  const shouldCheckCurrentUser =
    !isBuiltinAuthRoute(currentPathname) && !router?.isSkippedAuthCheckRoute?.(location.pathname);
  const result = useRequest<any>(
    async () => {
      if (!shouldCheckCurrentUser) {
        setRedirectingToSignin(false);
        return { data: null };
      }

      try {
        const res = await api.request({
          url: '/auth:check',
          skipNotify: true,
          skipAuth: true,
        });

        if (res?.data?.data?.id == null) {
          setRedirectingToSignin(true);
          navigate(getSigninPath(location.pathname, location.search, basename), { replace: true });
          return { data: null };
        }
        const userMeta = createCollectionContextMeta(
          () => runtimeFlowEngine.context.dataSourceManager.getDataSource('main')?.getCollection('users'),
          runtimeFlowEngine.translate('Current user'),
        );
        // 排序：用户优先显示
        userMeta.sort = 1000;
        runtimeFlowEngine.context.defineProperty('user', {
          value: res?.data?.data,
          resolveOnServer: true,
          meta: userMeta,
        });
        setRedirectingToSignin(false);
        return res?.data;
      } catch (error: any) {
        const isAuthError = error?.response?.status === 401 || error?.status === 401;
        if (isAuthError) {
          setRedirectingToSignin(true);
          navigate(getSigninPath(location.pathname, location.search, basename), { replace: true });
          return { data: null };
        }
        setRedirectingToSignin(false);
        throw error;
      }
    },
    {
      refreshDeps: [shouldCheckCurrentUser],
    },
  );

  const { render } = useAppSpin();

  if (result.loading || redirectingToSignin) {
    return render();
  }
  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};
