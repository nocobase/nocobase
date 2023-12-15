import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionFieldOptions, useCollectionManager } from '../../collection-manager';
import { CollectionFieldV2 } from './CollectionField';

export const CollectionFieldContextV2 = createContext<CollectionFieldV2>(null);
CollectionFieldContextV2.displayName = 'CollectionFieldContextV2';

export type CollectionFieldProviderProps = (
  | { name: string }
  | { collectionField: CollectionFieldV2 | CollectionFieldOptions }
) & {
  children?: ReactNode;
};

export const CollectionFieldProviderV2: FC<CollectionFieldProviderProps> = (props) => {
  const { name, collectionField, children } = props as {
    name: string;
    collectionField: CollectionFieldV2 | CollectionFieldOptions;
    children?: ReactNode;
  };
  const { getCollectionField } = useCollectionManager();

  const collectionFieldValue = useMemo(() => {
    if (collectionField instanceof CollectionFieldV2) {
      return collectionField;
    }
    if (collectionField) {
      return new CollectionFieldV2(collectionField);
    }
    const res = getCollectionField(name);
    if (!res) {
      console.error(`[nocobase-CollectionFieldProvider]: "${name}" field does not exist`);
    }
    return new CollectionFieldV2(res);
  }, [collectionField, getCollectionField, name]);

  if (!collectionFieldValue) return null;

  return <CollectionFieldContextV2.Provider value={collectionFieldValue}>{children}</CollectionFieldContextV2.Provider>;
};

export const useCollectionFieldV2 = () => {
  const context = useContext(CollectionFieldContextV2);
  if (!context) {
    throw new Error('useCollectionFieldV2() must be used within a AssociationProvider');
  }

  return context;
};

export const useCollectionFieldDataV2 = () => {
  const context = useCollectionFieldV2();
  return context.data;
};
