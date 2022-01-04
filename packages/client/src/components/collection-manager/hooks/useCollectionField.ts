import { useContext } from 'react';
import { CollectionFieldContext } from '../context';
import { useRecord } from '../../record-provider';
import { useCollection } from './useCollection';
import { useAPIClient } from '../../api-client';

export const useCollectionField = () => {
  const collection = useCollection();
  const record = useRecord();
  const api = useAPIClient();
  const ctx = useContext(CollectionFieldContext);
  const resource = api?.resource(collection.name, record[ctx.sourceKey]);
  return {
    ...ctx,
    resource,
  };
};
