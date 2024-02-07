import React, { FC, ReactNode } from 'react';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from '../collection-field';

export interface AssociationProviderPropsV2 {
  dataSource?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderPropsV2> = (props) => {
  const { name, children } = props;

  const collectionManager = useCollectionManagerV2();
  const collectionName = collectionManager.getCollectionName(name);

  if (!collectionName) return <CollectionDeletedPlaceholder type="Collection" name={name} />;

  return (
    <CollectionProviderV2 name={String(name).split('.')[0]}>
      <CollectionFieldProviderV2 name={name}>
        <CollectionProviderV2 name={collectionName}>{children}</CollectionProviderV2>
      </CollectionFieldProviderV2>
    </CollectionProviderV2>
  );
};
