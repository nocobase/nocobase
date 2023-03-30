import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRequest } from '../api-client';

export const CurrentUserContext = createContext(null);

export const useCurrentUserContext = () => {
  return useContext(CurrentUserContext);
};

export const CurrentUserProvider = (props) => {
  const location = useLocation();
  const result = useRequest({
    url: 'users:check',
  });
  if (result.loading) {
    return <Spin />;
  }
  const { pathname, search } = location;
  let redirect = `?redirect=${pathname}${search}`;
  if (!result?.data?.data?.id) {
    return <Navigate replace to={`/signin${redirect}`} />;
  }
  return <CurrentUserContext.Provider value={result}>{props.children}</CurrentUserContext.Provider>;
};
