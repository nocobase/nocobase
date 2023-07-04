import { Spin } from 'antd';
import React, { createContext, useContext, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useACLRoleContext } from '../acl';
import { useRequest } from '../api-client';
import { useCompile } from '../schema-component';

export const CurrentUserContext = createContext(null);

export const useCurrentUserContext = () => {
  return useContext(CurrentUserContext);
};

export const useCurrentRoles = () => {
  const { allowAnonymous } = useACLRoleContext();
  const { data } = useCurrentUserContext();
  const compile = useCompile();
  const options = useMemo(() => {
    const roles = data?.data?.roles || [];
    if (allowAnonymous) {
      roles.push({
        title: 'Anonymous',
        name: 'anonymous',
      });
    }
    return compile(roles);
  }, [allowAnonymous, data?.data?.roles]);
  return options;
};

export const CurrentUserProvider = (props) => {
  const location = useLocation();
  const result = useRequest({
    url: 'auth:check',
  });
  if (result.loading) {
    return <Spin />;
  }
  const { pathname, search } = location;
  const redirect = `?redirect=${pathname}${search}`;
  if (!result?.data?.data?.id) {
    return <Navigate replace to={`/signin${redirect}`} />;
  }
  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};
