import React, { createContext,  useContext } from 'react';
import { Spin } from 'antd';
import { useRequest } from '../api-client';

export const CurrentAppInfoContext = createContext(null);

export const useCurrentAppInfo = () => {
  return useContext(CurrentAppInfoContext);
};
export const CurrentAppInfoProvider = (props) => {
    const result = useRequest({
        url: 'app:getInfo',
      });
      if (result.loading) {
        return <Spin />;
      }
  return (
    <CurrentAppInfoContext.Provider
      value={result.data}
    >
      {props.children}
    </CurrentAppInfoContext.Provider>
  );
};
