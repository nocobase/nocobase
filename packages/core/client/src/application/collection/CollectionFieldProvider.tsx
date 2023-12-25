import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionFieldOptions } from '../../collection-manager';
import { SchemaKey } from '@formily/react';
import { useCollectionV2 } from './CollectionProvider';
import { DeletedPlaceholder } from './DeletedPlaceholder';

export const CollectionFieldContextV2 = createContext<CollectionFieldOptions>(null);
CollectionFieldContextV2.displayName = 'CollectionFieldContextV2';

export type CollectionFieldProviderProps = {
  name?: SchemaKey;
  children?: ReactNode;
  fallback?: React.ReactElement;
};

export const CollectionFieldProviderV2: FC<CollectionFieldProviderProps> = (props) => {
  const { name, children } = props;

  const collection = useCollectionV2();
  const field = collection.getField(name);

  if (!field) {
    return <DeletedPlaceholder />;
  }

  return <CollectionFieldContextV2.Provider value={field}>{children}</CollectionFieldContextV2.Provider>;
};

export const useCollectionFieldV2 = () => {
  const context = useContext(CollectionFieldContextV2);
  if (!context) {
    throw new Error('useCollectionFieldV2() must be used within a CollectionFieldProviderV2');
  }

  return context;
};
