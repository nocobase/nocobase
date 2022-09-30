

import React, { useLayoutEffect, useRef, useEffect, useContext, createContext } from 'react';
import {
    useRequest,
    SchemaComponent,
    SchemaComponentProvider,
    Action,
    APIClient,
  } from '@nocobase/client';
  import { Spin } from 'antd';

export const GraphDrawerContext = createContext(null);

export const GraphDrawerProver: React.FC = (props) => {
  const { data, loading, refresh } = useRequest({
    resource: 'collections',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'fields.uiSchema'],
    },
  });
  if (loading) {
    return <Spin />;
  }
  return (
    <GraphDrawerContext.Provider value={{ data: data?.data, refresh }}>{props.children}</GraphDrawerContext.Provider>
  );
};
