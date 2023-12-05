import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionOptions, useCollectionManager } from '../../collection-manager';

interface AssociationContextValue {
  name: string;
  association?: CollectionOptions;
}

export const AssociationContextV2 = createContext<AssociationContextValue>({} as any);

export interface AssociationProviderProps extends AssociationContextValue {
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = ({ children, name, association }) => {
  const { get } = useCollectionManager();
  const associationValue = useMemo(() => {
    if (association) return association;
    return get(name);
  }, [association, get, name]);
  return (
    <AssociationContextV2.Provider value={{ name, association: associationValue }}>
      {children}
    </AssociationContextV2.Provider>
  );
};

export const useAssociationV2 = () => {
  const context = useContext(AssociationContextV2);
  if (!context) {
    throw new Error('useAssociation() must be used within a AssociationProvider');
  }

  return context;
};
