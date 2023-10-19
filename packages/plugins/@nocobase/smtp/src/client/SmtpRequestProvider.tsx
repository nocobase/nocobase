/* eslint-disable */

import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '@nocobase/client';

export const SmtpRequestContext = createContext<Result<any, any>>(null);

export const useSmtpRequest = () => {
  return useContext(SmtpRequestContext);
};


export const SmtpRequestProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const result = useRequest({
    url: 'smtpRequest:get?filterByTk=1',
  });

  return <SmtpRequestContext.Provider value={result}>{props.children}</SmtpRequestContext.Provider>;
};

