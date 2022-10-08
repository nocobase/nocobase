

import React, {createContext } from 'react';

 interface CollectionNodeOptions {
    refresh: () => Promise<void>;
    record?:Object;
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
