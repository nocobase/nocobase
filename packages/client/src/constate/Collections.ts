import { useRequest } from 'ahooks';
import constate from 'constate';

const [CollectionsProvider, useCollectionsContext] = constate(() => {
  const result = useRequest('collections:findAll', {
    formatResult: (result) => result?.data,
  });
  return { ...result, collections: result.data || [] };
});

export { CollectionsProvider, useCollectionsContext };

export interface CollectionProviderProps {
  collectionName?: string;
}

export function useCollection(props: CollectionProviderProps) {
  const { collectionName } = props;
  const { collections = [], loading, refresh } = useCollectionsContext();
  let collection: any;
  let fields = [];
  if (collectionName) {
    collection = collections.find((item) => item.name === collectionName);
  }
  if (collection) {
    fields = collection?.generalFields || [];
  }
  let sortableField = collection?.sortable;
  if (collection?.sortable && typeof collection?.sortable === 'object') {
    sortableField = collection?.sortable?.name;
  }
  return {
    sortableField,
    collection,
    fields,
    loading,
    refresh,
    getField(name: string) {
      if (!name) {
        return null;
      }
      return fields.find((item) => item.name === name);
    },
  };
}

const [CollectionProvider, useCollectionContext] = constate(useCollection);

export { CollectionProvider, useCollectionContext };
