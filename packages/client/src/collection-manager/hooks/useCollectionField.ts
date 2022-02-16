import { useContext } from 'react';
import { useAPIClient } from '../../api-client';
import { useRecord } from '../../record-provider';
import { CollectionFieldContext } from '../context';
import { useCollection } from './useCollection';

export const useCollectionField = () => {
  const collection = useCollection();
  const record = useRecord();
  const api = useAPIClient();
  const ctx = useContext(CollectionFieldContext);
  const resourceName = `${ctx?.collectinName || collection?.name}.${ctx.name}`;
  const resource = api?.resource(resourceName, record[ctx.sourceKey]);
  console.log({ resourceName });
  return {
    ...ctx,
    resource,
  };
};
