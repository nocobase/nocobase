import React, { FC, ReactNode } from 'react';

import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from './CollectionFieldProvider';
import { useCollectionManagerV2 } from './CollectionManagerProvider';

export interface AssociationProviderProps {
  ns?: string;
  name?: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, ns, children } = props;

  const collectionManager = useCollectionManagerV2();

  return (
    <CollectionFieldProviderV2 name={name}>
      <CollectionProviderV2 name={collectionManager.getCollectionName(name)} ns={ns}>
        {children}
      </CollectionProviderV2>
    </CollectionFieldProviderV2>
  );
};
