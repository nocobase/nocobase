import { SchemaKey } from '@formily/react';
import { reduce } from 'lodash';
import { useContext } from 'react';
import { useAPIClient } from '../../api-client';
import { CollectionContext } from '../context';
import { CollectionFieldOptions } from '../types';
import { useCollectionManager } from './useCollectionManager';

export const useCollection = () => {
  const collection = useContext(CollectionContext);
  const api = useAPIClient();
  const resource = api?.resource(collection?.name);
  const { getParentCollections, getCollectionFields } = useCollectionManager();
  const getTotalFields = (): CollectionFieldOptions => {
    const currentFields = collection.fields;
    const inheritKeys = getParentCollections(collection.name);
    const inheritFields = reduce(inheritKeys, (result, value) => {
      const arr=result
      return arr.concat(getCollectionFields(value));
    },[]);
    return currentFields.concat(inheritFields);
  };
  return {
    ...collection,
    resource,
    getField(name: SchemaKey): CollectionFieldOptions {
      const fields=getTotalFields();
      return fields?.find((field) => field.name === name);
    },
  };
};
