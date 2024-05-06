/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
