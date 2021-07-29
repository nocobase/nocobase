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

const [CollectionProvider, useCollectionContext] = constate(
  (props: CollectionProviderProps) => {
    const { collectionName } = props;
    const { data = [], loading, refresh } = useCollectionsContext();
    let collection: any;
    let fields = [];
    if (collectionName) {
      collection = data.find((item) => item.name === collectionName);
    }
    if (collection) {
      fields = collection?.fields || [];
    }
    return {
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
  },
);

export { CollectionProvider, useCollectionContext };
