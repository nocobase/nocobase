import { useCollectionField, useCollectionManager, useRequest } from '@nocobase/client';

export function useStorageRules(name = '') {
  const { loading, data } = useRequest<any>(
    {
      url: `storages:getRules/${name}`,
    },
    {
      refreshDeps: [name],
    },
  );
  return (!loading && data?.data) || null;
}

export function useCollectionFieldStorageRules(props) {
  const field = useCollectionField();
  return useStorageRules(field?.storage);
}

export function useFileCollectionStorageRules(props) {
  const field = useCollectionField();
  const collectionManager = useCollectionManager();
  const collection = collectionManager.getCollection(field?.target);
  return useStorageRules(collection?.getOption('storage'));
}
