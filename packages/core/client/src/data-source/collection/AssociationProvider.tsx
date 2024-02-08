import React, { FC, ReactNode, createContext, useContext } from 'react';
import { CollectionFieldProviderV2 } from '../collection-field';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import { CollectionV2 } from './Collection';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { CollectionProviderV2, useCollectionV2 } from './CollectionProvider';

export interface AssociationProviderPropsV2 {
  dataSource?: string;
  name: string;
  children?: ReactNode;
}

const ParentCollectionContext = createContext<CollectionV2>(null);

const ParentCollectionProvider = (props) => {
  const collection = useCollectionV2();
  return <ParentCollectionContext.Provider value={collection}>{props.children}</ParentCollectionContext.Provider>;
};

export const useParentCollection = () => {
  return useContext(ParentCollectionContext);
};

export const AssociationProviderV2: FC<AssociationProviderPropsV2> = (props) => {
  const { name, children } = props;

  const collectionManager = useCollectionManagerV2();
  const collectionName = collectionManager.getCollectionName(name);

  if (!collectionName) return <CollectionDeletedPlaceholder type="Collection" name={name} />;

  return (
    <CollectionProviderV2 name={String(name).split('.')[0]}>
      <ParentCollectionProvider>
        <CollectionFieldProviderV2 name={name}>
          <CollectionProviderV2 name={collectionName}>{children}</CollectionProviderV2>
        </CollectionFieldProviderV2>
      </ParentCollectionProvider>
    </CollectionProviderV2>
  );
};
