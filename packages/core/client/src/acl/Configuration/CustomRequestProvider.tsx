import React, { createContext, useContext } from 'react';
import { useRequest } from '../../api-client';

export const CustomRequestContext = createContext(null);

export const useCustomRequest = () => {
  return useContext(CustomRequestContext);
};

export const CustomRequestProvider = (props) => {
  const options = { url: '/customRequest:list' };
  const roleService = useRequest({ url: '/rolesCustomRequest:list' }, { manual: true });
  const service = useRequest(options, { manual: true });
  const items = service.data?.data || [];
  return (
    <CustomRequestContext.Provider
      value={{
        service,
        roleService,
        items,
        rolesData: roleService.data?.data,
      }}
    >
      {props.children}
    </CustomRequestContext.Provider>
  );
};
