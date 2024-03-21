import React, { FC, ReactNode, createContext, useContext } from 'react';
import { CollectionFieldProvider } from '../collection-field';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import { Collection } from './Collection';
import { useCollectionManager } from './CollectionManagerProvider';
import { CollectionProvider, useCollection } from './CollectionProvider';

export interface AssociationProviderProps {
  dataSource?: string;
  name: string;
  children?: ReactNode;
}

const ParentCollectionContext = createContext<Collection>(null);
ParentCollectionContext.displayName = 'ParentCollectionContext';

const ParentCollectionProvider = (props) => {
  const collection = useCollection();
  return <ParentCollectionContext.Provider value={collection}>{props.children}</ParentCollectionContext.Provider>;
};

export const useParentCollection = () => {
  return useContext(ParentCollectionContext);
};

export const AssociationProvider: FC<AssociationProviderProps> = (props) => {
  const { name, children } = props;

  const collectionManager = useCollectionManager();
  const collectionName = collectionManager.getCollectionName(name);

  if (!collectionName) return <CollectionDeletedPlaceholder type="Collection" name={name} />;

  return (
    <CollectionProvider name={String(name).split('.')[0]}>
      <ParentCollectionProvider>
        <CollectionFieldProvider name={name}>
          <CollectionProvider name={collectionName}>{children}</CollectionProvider>
        </CollectionFieldProvider>
      </ParentCollectionProvider>
    </CollectionProvider>
  );
};
