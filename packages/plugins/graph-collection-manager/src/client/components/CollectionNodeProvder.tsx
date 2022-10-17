

import React, {createContext } from 'react';

 interface CollectionNodeOptions {
    setTargetNode?:Function;
    node?: Node | any;
    record?:Object;

  }
export const GraphCollectionContext = createContext(null);

export const  CollectionNodeProvder: React.FC <CollectionNodeOptions>= (props:any) => {
  const { record,setTargetNode,node} = props;
  
  return (
    <GraphCollectionContext.Provider
      value={{
        record,
        positionTargetNode:(target)=>{setTargetNode(target||node)}
      }}
    >
      {props.children}
    </GraphCollectionContext.Provider>
  );
};
