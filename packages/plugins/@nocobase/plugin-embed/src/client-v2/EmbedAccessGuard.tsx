/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ACLContext,
  Application,
  createAclSnippetAllow,
  type ACLMeta,
  type ACLRoleData,
  CurrentUserContext,
  type CurrentUserState,
  useApp,
} from '@nocobase/client-v2';
import { createCollectionContextMeta } from '@nocobase/flow-engine';
import { Result } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from './locale';

type EmbedAccessState = {
  aclData: ACLRoleData;
  aclMeta: ACLMeta;
  authorized: boolean;
  error: Error | null;
  loading: boolean;
  user: CurrentUserState['data'];
};

type AuthCheckResponse = {
  data?: {
    data?: {
      id?: unknown;
      roles?: Array<{ name: string; title?: string }>;
      [key: string]: unknown;
    };
  };
};

type RolesCheckResponse = {
  data?: {
    data?: ACLRoleData;
    meta?: ACLMeta;
  };
};

type ACLStore = {
  data: ACLRoleData;
  meta: ACLMeta;
  setData: (data: ACLRoleData) => void;
  setMeta: (meta: ACLMeta) => void;
};

type DataSourceRuntime = {
  ensureLoaded?: () => Promise<unknown> | unknown;
};

type RouteRepositoryRuntime = {
  getRouteBySchemaUid?: (uid: string) => unknown;
};

const initialState: EmbedAccessState = {
  aclData: {},
  aclMeta: {},
  authorized: false,
  error: null,
  loading: true,
  user: undefined,
};

function getErrorStatus(error: unknown) {
  const responseStatus = (error as { response?: { status?: number } })?.response?.status;
  return responseStatus || (error as { status?: number })?.status;
}

function getCurrentUserMeta(app: Application) {
  const userMeta = createCollectionContextMeta(
    () => app.flowEngine.context.dataSourceManager?.getDataSource('main')?.getCollection('users') || null,
    app.flowEngine.translate('Current user'),
  );
  userMeta.sort = 1000;
  return userMeta;
}

function createACLStore(): ACLStore {
  return {
    data: {},
    meta: {},
    setData(data) {
      this.data = data || {};
    },
    setMeta(meta) {
      this.meta = meta || {};
    },
  };
}

function ensureACLStore(app: Application) {
  const acl = app.context.acl as ACLStore | undefined;

  if (acl?.setData && acl?.setMeta) {
    return acl;
  }

  const store = createACLStore();
  app.context.defineProperty('acl', {
    value: store,
  });
  return store;
}

function resetAcl(app: Application) {
  const aclStore = ensureACLStore(app);
  aclStore.setData({});
  aclStore.setMeta({});
  app.pluginSettingsManager.setAclSnippets([]);
  app.apiClient.auth.setRole(null);
}

function getDataSourceRuntime(value: unknown): DataSourceRuntime | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const runtime = value as DataSourceRuntime;
  return typeof runtime.ensureLoaded === 'function' ? runtime : null;
}

async function checkCurrentUser(app: Application) {
  const response = (await app.apiClient.request({
    url: '/auth:check',
    skipNotify: true,
    skipAuth: true,
  })) as AuthCheckResponse;
  const user = response?.data?.data;

  if (user?.id == null) {
    return null;
  }

  app.flowEngine.context.defineProperty('user', {
    value: user,
    resolveOnServer: true,
    meta: getCurrentUserMeta(app),
  });

  return user;
}

async function loadAcl(app: Application) {
  const response = (await app.apiClient.request({
    url: 'roles:check',
    skipNotify: true,
    skipAuth: true,
  })) as RolesCheckResponse;
  const aclData = response?.data?.data || {};
  const aclMeta = response?.data?.meta || {};
  const aclStore = ensureACLStore(app);

  aclStore.setData(aclData);
  aclStore.setMeta(aclMeta);

  app.pluginSettingsManager.setAclSnippets(aclData?.snippets || []);

  if (aclData?.role !== app.apiClient.auth.role) {
    app.apiClient.auth.setRole(aclData?.role || null);
  }

  if (!createAclSnippetAllow(aclData?.snippets || [], !!aclData?.allowAll)('ui.*')) {
    await app.flowEngine.flowSettings.disable();
  }

  return {
    aclData,
    aclMeta,
  };
}

async function loadEmbedRuntime(app: Application) {
  const dataSourceRuntime =
    getDataSourceRuntime((app as { dataSourceManager?: unknown }).dataSourceManager) ||
    getDataSourceRuntime(app.flowEngine.context.dataSourceManager);

  await dataSourceRuntime?.ensureLoaded?.();
  await app.flowEngine.context.routeRepository?.ensureAccessibleLoaded?.();
}

function canAccessEmbedPage(app: Application, pageUid?: string) {
  if (!pageUid) {
    return false;
  }

  const routeRepository = app.flowEngine.context.routeRepository as RouteRepositoryRuntime | undefined;
  return !!routeRepository?.getRouteBySchemaUid?.(pageUid);
}

export function EmbedAccessGuard(props: { children: React.ReactNode }) {
  const { children } = props;
  const app = useApp<Application>();
  const { t } = useTranslation();
  const params = useParams();
  const pageUid = params.name;
  const mountedRef = useRef(false);
  const [state, setState] = useState<EmbedAccessState>(initialState);

  const refreshAcl = useCallback(async () => {
    const aclState = await loadAcl(app);
    if (mountedRef.current) {
      setState((prev) => ({
        ...prev,
        ...aclState,
      }));
    }
  }, [app]);

  useEffect(() => {
    let active = true;
    mountedRef.current = true;
    setState(initialState);

    const run = async () => {
      try {
        const user = await checkCurrentUser(app);

        if (!active) {
          return;
        }

        if (!user) {
          resetAcl(app);
          if (active && mountedRef.current) {
            setState({
              ...initialState,
              loading: false,
            });
          }
          return;
        }

        await loadEmbedRuntime(app);

        if (!active) {
          return;
        }

        if (!canAccessEmbedPage(app, pageUid)) {
          if (active && mountedRef.current) {
            setState({
              ...initialState,
              loading: false,
            });
          }
          return;
        }

        const aclState = await loadAcl(app);

        if (active && mountedRef.current) {
          setState({
            ...aclState,
            authorized: true,
            error: null,
            loading: false,
            user: {
              data: user,
            },
          });
        }
      } catch (error) {
        if (!active || !mountedRef.current) {
          return;
        }

        if (getErrorStatus(error) === 401) {
          resetAcl(app);
          setState({
            ...initialState,
            loading: false,
          });
          return;
        }

        setState({
          ...initialState,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        });
      }
    };

    run();

    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [app, pageUid]);

  const aclContextValue = useMemo(
    () => ({
      loading: false,
      data: {
        data: state.aclData,
        meta: state.aclMeta,
      },
      refresh: refreshAcl,
    }),
    [refreshAcl, state.aclData, state.aclMeta],
  );
  const currentUserContextValue = useMemo<CurrentUserState>(
    () => ({
      data: state.user,
      loading: false,
    }),
    [state.user],
  );

  if (state.error) {
    throw state.error;
  }

  if (state.loading) {
    return app.renderComponent('AppSpin');
  }

  if (!state.authorized) {
    return <Result status="403" title="403" subTitle={t('Sorry, you are not authorized to access this page.')} />;
  }

  return (
    <CurrentUserContext.Provider value={currentUserContextValue}>
      <ACLContext.Provider value={aclContextValue}>{children}</ACLContext.Provider>
    </CurrentUserContext.Provider>
  );
}
