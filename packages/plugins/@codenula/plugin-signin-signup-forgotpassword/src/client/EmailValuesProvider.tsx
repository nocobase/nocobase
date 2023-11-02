import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '@nocobase/client';

export const EmailValuesContext = createContext<Result<any, any>>(null);
export const UsersValuesContext = createContext<Result<any, any>>(null);

export const useEmailValuesRequest = () => {
  return useContext(EmailValuesContext);
};
export const useUsersRequest = () => {
  return useContext(UsersValuesContext);
};

export const EmailValuesProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const result = useRequest({
    url: 'custom-email-body:get?filterByTk=1',
  });

  return <EmailValuesContext.Provider value={result}>{props.children}</EmailValuesContext.Provider>;
};
export const UserValuesProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const result = useRequest({
    url: 'users:get?filterByTk=1',
  });

  return <UsersValuesContext.Provider value={result}>{props.children}</UsersValuesContext.Provider>;
};
