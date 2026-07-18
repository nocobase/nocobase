/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import React, { useRef } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FC } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { createAclSnippetAllow } from './createAclSnippetAllow';

export type ACLRoleData = {
  snippets?: string[];
  role?: string;
  roleMode?: string;
  resources?: string[];
  actions?: Record<string, any>;
  actionAlias?: Record<string, string>;
  strategy?: {
    actions?: string[];
  };
  allowAll?: boolean;
  allowConfigure?: boolean;
  availableActions?: string[];
  allowMenuItemIds?: number[];
  allowAnonymous?: boolean;
  uiButtonSchemasBlacklist?: string[];
};

export type ACLMeta = Record<string, any>;

type ACLStore = {
  data: ACLRoleData;
  meta: ACLMeta;
  setData: (data: ACLRoleData) => void;
  setMeta: (meta: ACLMeta) => void;
};

type ACLContextValue = {
  loading: boolean;
  data: {
    data: ACLRoleData;
    meta: ACLMeta;
  };
  refresh: () => Promise<void>;
};

export const ACLContext = createContext<ACLContextValue | null>(null);
ACLContext.displayName = 'ACLContext';

function createACLStore(): ACLStore {
  return observable({
    data: {} as ACLRoleData,
    meta: {} as ACLMeta,
    setData(data: ACLRoleData) {
      this.data = data || {};
    },
    setMeta(meta: ACLMeta) {
      this.meta = meta || {};
    },
  });
}

function ensureACLStore(app: ReturnType<typeof useApp>) {
  if (!app.context.acl) {
    app.context.defineProperty('acl', {
      value: createACLStore(),
    });
  }

  return app.context.acl as ACLStore;
}

/**
 * 在 v2 中执行 `roles:check`，并把 ACL 数据同步到 app context。
 */
export const ACLRolesCheckProvider: FC = ({ children }) => {
  const app = useApp();
  const location = useLocation();
  const aclStore = ensureACLStore(app);
  const [loading, setLoading] = useState(false);
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const refresh = useCallback(async () => {
    if (app.router.isSkippedAuthCheckRoute(pathnameRef.current)) {
      // 认证页等免鉴权路由不需要执行 `roles:check`，避免未登录时产生多余的 401 与 loading 闪烁。
      setLoading(false);
      return;
    }

    const shouldShowLoading = !aclStore.data?.role && !aclStore.data?.snippets?.length;
    if (shouldShowLoading) {
      setLoading(true);
    }

    try {
      const res = await app.apiClient.request({
        url: 'roles:check',
        skipNotify: true,
        skipAuth: true,
      });

      const nextData = res?.data?.data || {};
      const nextMeta = res?.data?.meta || {};

      aclStore.setData(nextData);
      aclStore.setMeta(nextMeta);
      app.pluginSettingsManager.setAclSnippets(nextData?.snippets || []);

      if (nextData?.role !== app.apiClient.auth.role) {
        app.apiClient.auth.setRole(nextData?.role);
      }

      if (!createAclSnippetAllow(nextData?.snippets || [], !!nextData?.allowAll)('ui.*')) {
        await app.flowEngine.flowSettings.disable();
      }
    } catch (error) {
      const status = error?.response?.status || error?.status;

      if (status === 401) {
        aclStore.setData({});
        aclStore.setMeta({});
        app.pluginSettingsManager.setAclSnippets([]);
        app.apiClient.auth.setRole(null);
        return;
      }

      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [aclStore, app]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<ACLContextValue>(
    () => ({
      loading,
      data: {
        data: aclStore.data || {},
        meta: aclStore.meta || {},
      },
      refresh,
    }),
    [aclStore.data, aclStore.meta, loading, refresh],
  );

  if (loading) {
    return app.renderComponent('AppSpin');
  }

  return <ACLContext.Provider value={value}>{children}</ACLContext.Provider>;
};

/**
 * 返回原始 ACL provider 上下文。
 */
export const useACLContext = () => {
  return useContext(ACLContext);
};

/**
 * 触发当前角色权限重新检查。
 */
export const useRoleRecheck = () => {
  const ctx = useACLContext();
  const { allowAll } = useACLRoleContext();

  return useCallback(() => {
    if (!ctx || allowAll) {
      return Promise.resolve();
    }
    return ctx.refresh();
  }, [allowAll, ctx]);
};

/**
 * 返回当前角色模式。
 */
export const useCurrentRoleMode = () => {
  const ctx = useACLContext();
  return ctx?.data?.data?.roleMode;
};

const useACLRolesCheck = () => {
  const ctx = useACLContext();
  const data = ctx?.data?.data || {};

  const getActionAlias = useCallback(
    (actionPath: string) => {
      const actionName = actionPath.split(':').pop();
      return data?.actionAlias?.[actionName || ''] || actionName;
    },
    [data?.actionAlias],
  );

  const inResources = useCallback(
    (resourceName: string) => {
      return data?.resources?.includes?.(resourceName);
    },
    [data?.resources],
  );

  const getResourceActionParams = useCallback(
    (actionPath: string) => {
      const [resourceName] = actionPath.split(':');
      const actionAlias = getActionAlias(actionPath);
      return data?.actions?.[`${resourceName}:${actionAlias}`] || data?.actions?.[actionPath];
    },
    [data?.actions, getActionAlias],
  );

  const getStrategyActionParams = useCallback(
    (actionPath: string) => {
      const actionAlias = getActionAlias(actionPath);
      const strategyAction = data?.strategy?.actions?.find((action) => {
        const [value] = action.split(':');
        return value === actionAlias;
      });
      return strategyAction ? {} : null;
    },
    [data?.strategy?.actions, getActionAlias],
  );

  return {
    data,
    getActionAlias,
    inResources,
    getResourceActionParams,
    getStrategyActionParams,
  };
};

/**
 * 返回当前角色可直接消费的 ACL 数据与动作解析函数。
 */
export function useACLRoleContext() {
  const { data, inResources, getResourceActionParams, getStrategyActionParams } = useACLRolesCheck();

  return {
    ...data,
    snippets: data?.snippets || [],
    parseAction: useCallback(
      (actionPath: string) => {
        if (!actionPath) {
          return null;
        }

        const [resourceName] = actionPath.split(':');

        if (data?.allowAll) {
          return {};
        }

        if (inResources(resourceName)) {
          return getResourceActionParams(actionPath);
        }

        return getStrategyActionParams(actionPath);
      },
      [data?.allowAll, getResourceActionParams, getStrategyActionParams, inResources],
    ),
  };
}

/**
 * 返回当前用户是否允许配置界面。
 */
export function useUIConfigurationPermissions(): { allowConfigUI: boolean } {
  const { allowAll, snippets } = useACLRoleContext();
  const allow = useMemo(() => createAclSnippetAllow(snippets || [], !!allowAll), [allowAll, snippets]);

  return {
    allowConfigUI: allow('ui.*'),
  };
}
