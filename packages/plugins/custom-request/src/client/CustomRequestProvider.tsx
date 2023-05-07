import { useRequest } from '@nocobase/client';
import React, { createContext, useContext } from 'react';

const CustomRequestContext = createContext(null);

export const useCustomRequest = () => {
  return useContext(CustomRequestContext);
};

export const CustomRequestProvider = (props) => {
  const options = { url: `/customRequest:list` };
  const roleService = useRequest({ url: '/customrequestRoles:list' }, { manual: true });
  const service = useRequest(options, { manual: true });
  const items = service.data?.data || [];
  return (
    <CustomRequestContext.Provider
      value={{
        service,
        roleService,
        items,
      }}
    >
      {props.children}
    </CustomRequestContext.Provider>
  );
};
