/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useACLRoleContext } from '../acl';
import { ReturnTypeOfUseRequest, useRequest } from '../api-client';
import { useLocationNoUpdate } from '../application';
import { useAppSpin } from '../application/hooks/useAppSpin';
import { useCompile } from '../schema-component';

export const CurrentUserContext = createContext<ReturnTypeOfUseRequest>(null);
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
  }, [allowAnonymous, data?.data?.roles]);
  return options;
};

export const CurrentUserProvider = (props) => {
  const { render } = useAppSpin();
  const result = useRequest<any>({
    url: 'auth:check',
  });

  if (result.loading) {
    return render();
  }

  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};

export const NavigateIfNotSignIn = ({ children }) => {
  const result = useCurrentUserContext();
  const { pathname, search } = useLocationNoUpdate();
  const redirect = `?redirect=${pathname}${search}`;
  if (!result?.data?.data?.id) {
    return <Navigate replace to={`/signin${redirect}`} />;
  }
  return <>{children}</>;
};
