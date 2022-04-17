import { SchemaKey } from '@formily/react';
import { useContext } from 'react';
import { useAPIClient } from '../../api-client';
import { CollectionContext } from '../context';
import { CollectionFieldOptions } from '../types';

export const useCollection = () => {
  const collection = useContext(CollectionContext);
  const api = useAPIClient();
  const resource = api?.resource(collection?.name);
  return {
    ...collection,
    resource,
    getField(name: SchemaKey): CollectionFieldOptions {
      return collection?.fields?.find((field) => field.name === name);
    },
  };
};
