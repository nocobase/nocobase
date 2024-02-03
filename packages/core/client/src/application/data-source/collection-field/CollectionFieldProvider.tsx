import React, { FC, ReactNode, createContext, useContext } from 'react';

import type { SchemaKey } from '@formily/react';
import type { CollectionFieldOptionsV3 } from '../collection';

import { useCollectionV3 } from '../collection';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';

export const CollectionFieldContextV3 = createContext<CollectionFieldOptionsV3>(null);
CollectionFieldContextV3.displayName = 'CollectionFieldContextV3';

export type CollectionFieldProviderPropsV3 = {
  name?: SchemaKey;
  children?: ReactNode;
};

export const CollectionFieldProviderV3: FC<CollectionFieldProviderPropsV3> = (props) => {
  const { name, children } = props;

  const collection = useCollectionV3();
  const field = collection.getField(name);

  if (!field) {
    return <CollectionDeletedPlaceholder type="Field" name={name} />;
  }

  return <CollectionFieldContextV3.Provider value={field}>{children}</CollectionFieldContextV3.Provider>;
};

export const useCollectionFieldV3 = () => {
  const context = useContext(CollectionFieldContextV3);
  if (!context) {
    throw new Error('useCollectionFieldV3() must be used within a CollectionFieldProviderV3');
  }

  return context;
};
