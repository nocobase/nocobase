import React, { FC, ReactNode } from 'react';

import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from './CollectionFieldProvider';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { DeletedPlaceholder } from './DeletedPlaceholder';

export interface AssociationProviderProps {
  ns?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, ns, children } = props;

  const collectionManager = useCollectionManagerV2();
  const collectionName = collectionManager.getCollectionName(name, { ns });

  if (!collectionName) return <DeletedPlaceholder />;

  return (
    <CollectionProviderV2 name={name.split('.')[0]} ns={ns}>
      <CollectionFieldProviderV2 name={name}>
        <CollectionProviderV2 name={collectionName} ns={ns}>
          {children}
        </CollectionProviderV2>
      </CollectionFieldProviderV2>
    </CollectionProviderV2>
  );
};
