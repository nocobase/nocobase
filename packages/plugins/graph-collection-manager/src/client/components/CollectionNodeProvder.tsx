

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
    refresh?: () => Promise<void>;
  }
export const GraphCollectionContext = createContext(null);

export const  CollectionNodeProvder: React.FC <CollectionNodeOptions>= (props:any) => {
  const { refresh} = props;
  return (
    <GraphCollectionContext.Provider
      value={{
        refresh: async () => {
          if (refresh) {
            await refresh();
          }
        },
      }}
    >
      {props.children}
    </GraphCollectionContext.Provider>
  );
};
