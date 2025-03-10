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
import { useAppSpin } from '../application';
import { useCompile } from '../schema-component';
import { useTranslation } from 'react-i18next';

export const CurrentUserContext = createContext<ReturnTypeOfUseRequest & { roleMode?: { data: { roleMode } } }>(null);
CurrentUserContext.displayName = 'CurrentUserContext';

export const useCurrentUserContext = () => {
  return useContext(CurrentUserContext);
};

export const useCurrentRoles = () => {
  const { allowAnonymous } = useACLRoleContext();
  const { data } = useCurrentUserContext();
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

export const useCurrentRoleMode = () => {
  const { roleMode } = useCurrentUserContext();
  return roleMode?.data;
};

export const CurrentUserProvider = (props) => {
  const api = useAPIClient();
  const result = useRequest<any>(() =>
    api
      .request({
        url: '/auth:check',
        skipNotify: true,
        skipAuth: true,
      })
      .then((res) => res?.data),
  );

  const { loading: roleModeLoading, data } = useRequest(() => api.resource('roles').getSystemRoleMode(), {
    onSuccess: (res) => {
      return res.data.data.roleMode;
    },
  });
  const { render } = useAppSpin();

  if (result.loading || roleModeLoading) {
    return render();
  }
  result['roleMode'] = data?.['data'];
  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};
