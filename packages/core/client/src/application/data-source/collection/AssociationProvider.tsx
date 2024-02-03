import React, { FC, ReactNode } from 'react';
import { useCollectionManagerV3 } from './CollectionManagerProvider';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import { CollectionProviderV3 } from './CollectionProvider';
import { CollectionFieldProviderV3 } from '../collection-field';

export interface AssociationProviderPropsV3 {
  dataSource?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV3: FC<AssociationProviderPropsV3> = (props) => {
  const { name, children } = props;

  const collectionManager = useCollectionManagerV3();
  const collectionName = collectionManager.getCollectionName(name);

  if (!collectionName) return <CollectionDeletedPlaceholder type="Collection" name={name} />;

  return (
    <CollectionProviderV3 name={String(name).split('.')[0]}>
      <CollectionFieldProviderV3 name={name}>
        <CollectionProviderV3 name={collectionName}>{children}</CollectionProviderV3>
      </CollectionFieldProviderV3>
    </CollectionProviderV3>
  );
};
