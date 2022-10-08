import React, { createContext } from 'react';
import { useRequest } from '@nocobase/client';
import { Spin } from 'antd';

export const GraphDrawerContext = createContext(null);

export const options = {
  resource: 'collections',
  action: 'list',
  params: {
    paginate: false,
    appends: ['fields', 'fields.uiSchema'],
  },
};
export const GraphDrawerProver: React.FC = (props) => {
  const service = useRequest(options);

  if (service.loading) {
    return <Spin />;
  }
  return (
    <GraphDrawerContext.Provider
      value={{
        data: service.data?.data,
      }}
    >
      {props.children}
    </GraphDrawerContext.Provider>
  );
};
