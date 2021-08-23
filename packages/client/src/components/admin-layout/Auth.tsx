import { useRequest } from 'ahooks';
import { Spin } from 'antd';
import React, { createContext } from 'react';
import { Redirect } from 'react-router';
import { useLocation } from 'react-router-dom';

export const AuthContext = createContext(null);

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
