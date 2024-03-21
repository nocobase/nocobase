import React, { createContext } from 'react';

interface CollectionNodeOptions {
  setTargetNode?: Function;
  node?: Node | any;
  record?: Object;
  handelOpenPorts?: Function;
}
export const GraphCollectionContext = createContext(null);
GraphCollectionContext.displayName = 'GraphCollectionContext';

export const CollectionNodeProvder: React.FC<CollectionNodeOptions> = (props: any) => {
  const { record, setTargetNode, node, handelOpenPorts } = props;

  return (
    <GraphCollectionContext.Provider
      value={{
        node,
        record,
        positionTargetNode: (target) => {
          setTargetNode(target || node);
        },
        openPorts: handelOpenPorts,
      }}
    >
      {props.children}
    </GraphCollectionContext.Provider>
  );
};
