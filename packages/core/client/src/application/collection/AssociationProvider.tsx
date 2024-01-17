import React, { FC, ReactNode } from 'react';

import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from './CollectionFieldProvider';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { DeletedPlaceholder } from './DeletedPlaceholder';

export interface AssociationProviderProps {
  namespace?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, namespace, children } = props;

  const collectionManager = useCollectionManagerV2();
  const collectionName = collectionManager.getCollectionName(name, { namespace });

  if (!collectionName) return <DeletedPlaceholder type="Collection" name={collectionName} />;

  return (
    <CollectionProviderV2 name={name.split('.')[0]} namespace={namespace}>
      <CollectionFieldProviderV2 name={name}>
        <CollectionProviderV2 name={collectionName} namespace={namespace}>
          {children}
        </CollectionProviderV2>
      </CollectionFieldProviderV2>
    </CollectionProviderV2>
  );
};
