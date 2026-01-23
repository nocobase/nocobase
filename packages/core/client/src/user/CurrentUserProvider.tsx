/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createCollectionContextMeta, useFlowEngine } from '@nocobase/flow-engine';
import React, { createContext, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl';
import { ReturnTypeOfUseRequest, useAPIClient, useRequest } from '../api-client';
import { useApp, useAppSpin } from '../application';
import { useCompile } from '../schema-component';

export const CurrentUserContext = createContext<ReturnTypeOfUseRequest>(null);
CurrentUserContext.displayName = 'CurrentUserContext';

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
  const navigate = useNavigate();
  const location = useLocation();
  const result = useRequest<any>(() =>
    api
      .request({
        url: '/auth:check',
        skipNotify: true,
        skipAuth: true,
      })
      .then((res) => {
        if (res?.data?.data?.id == null) {
          navigate('/signin?redirect=' + location.pathname + location.search);
        }
        const userMeta = createCollectionContextMeta(
          () => app.flowEngine.context.dataSourceManager.getDataSource('main')?.getCollection('users'),
          app.flowEngine.translate('Current user'),
        );
        // 排序：用户优先显示
        userMeta.sort = 1000;
        app.flowEngine.context.defineProperty('user', {
          value: res?.data?.data,
          resolveOnServer: true,
          meta: userMeta,
          info: {
            description: 'Current user record object.',
            detail: 'Record<string, any>',
          },
        });
        return res?.data;
      }),
  );

  const { render } = useAppSpin();

  if (result.loading) {
    return render();
  }
  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};
