

import React, {createContext } from 'react';

 interface CollectionNodeOptions {
    record?:Object;
  }
export const GraphCollectionContext = createContext(null);

export const  CollectionNodeProvder: React.FC <CollectionNodeOptions>= (props:any) => {
  const { refresh,record} = props;
  return (
    <GraphCollectionContext.Provider
      value={{
        record,
      }}
    >
      {props.children}
    </GraphCollectionContext.Provider>
  );
};
