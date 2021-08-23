import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React, { createContext } from 'react';
import { useContext } from 'react';
import { Redirect } from 'react-router';
import { useLocation } from 'react-router-dom';
import { BaseResult } from '@ahooksjs/use-request/lib/types';

export interface AuthContextProps {
  currentUser?: any;
  service: BaseResult<any, any>;
}

export const AuthContext = createContext<AuthContextProps>({});

export const useCurrentUser = () => {
  const { currentUser } = useContext(AuthContext);
  return currentUser;
}

export function AuthProvider(props) {
  const service = useRequest('users:check', {
    formatResult: (result) => result?.data,
  });
  const location = useLocation();
  const { pathname, search } = location;
  let redirect = `?redirect=${pathname}${search}`;
  if (service.error) {
    return <Redirect to={'/login' + redirect} />;
  }
  return (
    <AuthContext.Provider value={{ service, currentUser: service.data }}>
      {service.loading ? <Spin /> : props.children}
    </AuthContext.Provider>
  );
}
