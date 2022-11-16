import React, { createContext,  useContext } from 'react';
import { Spin } from 'antd';
import { useRequest } from '../api-client';

export const CurrentDatabaseContext = createContext(null);

export const useCurrentDatabase = () => {
  return useContext(CurrentDatabaseContext);
};
export const CurrentDatabaseProvider = (props) => {
    const result = useRequest({
        url: 'app:getInfo',
      });
      if (result.loading) {
        return <Spin />;
      }
  return (
    <CurrentDatabaseContext.Provider
      value={result.data}
    >
      {props.children}
    </CurrentDatabaseContext.Provider>
  );
};
