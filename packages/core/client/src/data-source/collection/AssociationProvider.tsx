import React, { FC, ReactNode, useMemo } from 'react';
import { CollectionFieldProviderV2 } from '../collection-field';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { CollectionProviderV2 } from './CollectionProvider';
import { ParentCollectionProviderV2 } from './ParentCollectionProvider';

export interface AssociationProviderPropsV2 {
  dataSource?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderPropsV2> = (props) => {
  const { name, children } = props;

  const collectionManager = useCollectionManagerV2();
  const collectionName = collectionManager.getCollectionName(name);
  const parentCollectionName = useMemo(() => String(name).split('.')[0], [name]);

  if (!collectionName) return <CollectionDeletedPlaceholder type="Collection" name={name} />;

  return (
    <CollectionProviderV2 name={parentCollectionName}>
      <CollectionFieldProviderV2 name={name}>
        <ParentCollectionProviderV2 name={parentCollectionName}>
          <CollectionProviderV2 name={collectionName}>{children}</CollectionProviderV2>
        </ParentCollectionProviderV2>
      </CollectionFieldProviderV2>
    </CollectionProviderV2>
  );
};
