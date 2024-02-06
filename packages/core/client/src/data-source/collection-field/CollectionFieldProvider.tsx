import React, { FC, ReactNode, createContext, useContext } from 'react';

import type { SchemaKey } from '@formily/react';
import type { CollectionFieldOptionsV2 } from '../collection';

import { useCollectionV2 } from '../collection';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';

export const CollectionFieldContextV2 = createContext<CollectionFieldOptionsV2>(null);
CollectionFieldContextV2.displayName = 'CollectionFieldContextV2';

export type CollectionFieldProviderPropsV2 = {
  name?: SchemaKey;
  children?: ReactNode;
};

export const CollectionFieldProviderV2: FC<CollectionFieldProviderPropsV2> = (props) => {
  const { name, children } = props;

  const collection = useCollectionV2();
  const field = collection.getField(name);

  if (!field) {
    return <CollectionDeletedPlaceholder type="Field" name={name} />;
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
