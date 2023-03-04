import { useFieldSchema } from '@formily/react';
import { useCollection, useCollectionManager } from '../../../collection-manager';

export const useOperatorList = () => {
  const schema = useFieldSchema();
  const { name } = useCollection();
  const { getCollectionFields, getInterface } = useCollectionManager();
  const field = getCollectionFields(name).find((item) => item.name === schema.name);
  const filterable = getInterface(field?.interface)?.filterable;

  return filterable?.operators || [];
};
