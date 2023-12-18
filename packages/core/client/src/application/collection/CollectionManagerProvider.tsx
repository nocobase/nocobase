import React, { FC, ReactNode, createContext, useContext, useEffect } from 'react';
import { CollectionManagerV2 } from './CollectionManager';

export const CollectionManagerContextV2 = createContext<CollectionManagerV2>(null);
CollectionManagerContextV2.displayName = 'CollectionManagerContextV2';

export interface CollectionManagerProviderProps {
  collectionManager: CollectionManagerV2;
  children?: ReactNode;
  inherit?: boolean;
}

export const CollectionManagerProviderV2: FC<CollectionManagerProviderProps> = ({
  children,
  inherit = true,
  collectionManager,
}) => {
  const parentCollectionManager = useContext(CollectionManagerContextV2);

  useEffect(() => {
    if (inherit && parentCollectionManager) {
      collectionManager.addCollectionTemplates(parentCollectionManager.getCollectionTemplates());
      collectionManager.addFieldInterfaces(parentCollectionManager.getFieldInterfaces());
      collectionManager.addNamespaces(parentCollectionManager.getNamespaces());
    }
  }, [collectionManager, inherit, parentCollectionManager]);

  return (
    <CollectionManagerContextV2.Provider value={collectionManager}>{children}</CollectionManagerContextV2.Provider>
  );
};

export const useCollectionManagerV2 = () => {
  const context = useContext(CollectionManagerContextV2);
  return context;
};
