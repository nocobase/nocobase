import { useContext } from 'react';
import { CollectionFieldOptions } from './types';
import { CollectionFieldContext, CollectionContext, CollectionManagerContext } from './context';

export const useCollectionManager = () => {
  const { collections } = useContext(CollectionManagerContext);
  return {
    get(name: string) {
      return collections?.find((collection) => collection.name === name);
    },
  };
};

export const useCollection = () => {
  const collection = useContext(CollectionContext);
  return {
    ...collection,
    getField(name: string): CollectionFieldOptions {
      return collection?.fields?.find((field) => field.name === name);
    },
  };
};

export const useCollectionField = () => {
  return useContext(CollectionFieldContext);
};
