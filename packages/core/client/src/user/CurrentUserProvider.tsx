/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useACLRoleContext } from '../acl';
import { ReturnTypeOfUseRequest, useAPIClient, useRequest } from '../api-client';
import { useApp, useAppSpin } from '../application';
import { useCompile } from '../schema-component';
import { createRecordProxyContext } from '@nocobase/flow-engine';

export const CurrentUserContext = createContext<ReturnTypeOfUseRequest>(null);
CurrentUserContext.displayName = 'CurrentUserContext';

export const useCurrentUserContext = () => {
  return useContext(CurrentUserContext);
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
  const result = useRequest<any>(() =>
    api
      .request({
        url: '/auth:check',
        skipNotify: true,
        skipAuth: true,
      })
      .then((res) => {
        app.flowEngine.context.defineProperty('user', {
          value: res?.data?.data,
        });

        app.flowEngine.context.defineProperty(
          'userAsync',
          createRecordProxyContext(
            () => app.flowEngine.context.user,
            () => app.flowEngine.context.dataSourceManager.getDataSource('main')?.getCollection('users'),
            app.flowEngine.translate('Current user'),
          ),
        );

        return res?.data;
      }),
  );

  const { render } = useAppSpin();

  if (result.loading) {
    return render();
  }
  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};
