import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionFieldOptions, useCollectionManager } from '../../collection-manager';
import { CollectionProviderV2 } from './CollectionProvider';

export const AssociationContextV2 = createContext<CollectionFieldOptions>({} as any);

export interface AssociationProviderProps extends CollectionFieldOptions {
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = ({ children, name, association }) => {
  const { getCollectionField } = useCollectionManager();
  const associationValue = useMemo(() => {
    if (association) return association;
    return getCollectionField(name);
  }, [association, getCollectionField, name]);

  const collectionName = useMemo(() => {
    if (!associationValue) return undefined;
    return associationValue.target;
  }, [associationValue]);

  return (
    <CollectionProviderV2 name={collectionName}>
      <AssociationContextV2.Provider value={association}>{children}</AssociationContextV2.Provider>
    </CollectionProviderV2>
  );
};

export const useAssociationV2 = (showError = true) => {
  const context = useContext(AssociationContextV2);
  if (showError && !context) {
    throw new Error('useAssociation() must be used within a AssociationProvider');
  }

  return context;
};
