import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { CollectionFieldOptions, useCollectionManager } from '../../collection-manager';
import { CollectionProviderV2 } from './CollectionProvider';

export const AssociationContextV2 = createContext<CollectionFieldOptions>({} as any);
AssociationContextV2.displayName = 'AssociationContextV2';

export interface AssociationProviderProps extends CollectionFieldOptions {
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = ({ children, name, association }) => {
  const { getCollectionField } = useCollectionManager();
  const associationValue = useMemo(() => {
    if (association) return association;
    const res = getCollectionField(name);
    if (!res) {
      console.error(`[nocobase]: ${name} association does not exist`);
    }
    return res;
  }, [association, getCollectionField, name]);

  const collectionName = useMemo(() => {
    if (!associationValue) return undefined;
    return associationValue.target;
  }, [associationValue]);

  if (!associationValue || !collectionName) return null;

  return (
    <AssociationContextV2.Provider value={association}>
      <CollectionProviderV2 name={collectionName}>{children}</CollectionProviderV2>
    </AssociationContextV2.Provider>
  );
};

export const useAssociationV2 = (showError = true) => {
  const context = useContext(AssociationContextV2);
  if (showError && !context) {
    throw new Error('useAssociation() must be used within a AssociationProvider');
  }

  return context;
};
