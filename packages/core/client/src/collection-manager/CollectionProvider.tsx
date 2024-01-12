import { FC, ReactNode } from 'react';
import { CollectionProviderV2, useCollectionManagerV2 } from '../application';
import { CollectionOptions } from './types';
import React from 'react';
import { DeletedPlaceholder } from '../application/collection/DeletedPlaceholder';
import { CollectionExtendsProvider } from './CollectionManagerProvider';

function getCollectionName(name?: string | CollectionOptions): string {
  if (!name) return undefined;
  if (typeof name === 'string') return name;
  if (typeof name === 'object') return name.name;
}

export const CollectionProvider: FC<{
  name?: string;
  collection?: CollectionOptions | string;
  allowNull?: boolean;
  children?: ReactNode;
}> = ({ children, allowNull, name, collection }) => {
  const collectionName = getCollectionName(name || collection);
  const cm = useCollectionManagerV2();
  const hasCollection = cm.getCollection(collectionName);
  if (hasCollection || (allowNull && !collection))
    return (
      <CollectionProviderV2 allowNull={allowNull} name={collectionName}>
        {children}
      </CollectionProviderV2>
    );
  if (typeof collection === 'object') {
    return (
      <CollectionExtendsProvider collections={[collection]}>
        <CollectionProviderV2 name={collection.name}>{children}</CollectionProviderV2>
      </CollectionExtendsProvider>
    );
  }
  return <DeletedPlaceholder type="Collection" name={name} />;
};
