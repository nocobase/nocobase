import { Schema } from '@formily/react';
import { useContext } from 'react';
import { CollectionFieldContext } from '.';
import { CollectionContext, CollectionManagerContext } from './context';

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
  console.log({ collection });
  return {
    getField(name: string) {
      return collection?.fields?.find((field) => field.name === name);
    },
  };
};

export const useCollectionField = () => {
  const { uiSchema, ...others } = useContext(CollectionFieldContext);
  const fieldSchema = new Schema(uiSchema);
  return { ...others, fieldSchema };
};
