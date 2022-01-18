import { useContext } from 'react';
import { SchemaKey } from '@formily/react';
import { CollectionFieldOptions } from '../types';
import { CollectionContext } from '../context';
import { useAPIClient } from '../../api-client';

export const useCollection = () => {
  const collection = useContext(CollectionContext);
  const api = useAPIClient();
  const resource = api?.resource(collection.name);
  return {
    ...collection,
    resource,
    getField(name: SchemaKey): CollectionFieldOptions {
      return collection?.fields?.find((field) => field.name === name);
    },
  };
};
