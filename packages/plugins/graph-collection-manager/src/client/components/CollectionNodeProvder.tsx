

import React, { useLayoutEffect, useRef, useEffect, useContext, createContext } from 'react';
import {
    useRequest,
    SchemaComponent,
    SchemaComponentProvider,
    Action,
    APIClient,
  } from '@nocobase/client';
  import { Spin } from 'antd';

 interface CollectionNodeOptions {
    refresh: () => Promise<void>;
    record?:object;
  }
export const GraphCollectionContext = createContext(null);

export const  CollectionNodeProvder: React.FC <CollectionNodeOptions>= (props:any) => {
  const { refresh,record} = props;
  return (
    <GraphCollectionContext.Provider
      value={{
        refresh: async () => {
          if (refresh) {
            await refresh();
          }
        },
        record,
      }}
    >
      {props.children}
    </GraphCollectionContext.Provider>
  );
};
