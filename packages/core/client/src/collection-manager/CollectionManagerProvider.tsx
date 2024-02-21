import React from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategroriesContext } from './context';
import { CollectionManagerOptions } from './types';
import { CollectionManagerProvider } from '../data-source/collection/CollectionManagerProvider';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { useAppSpin } from '../application/hooks/useAppSpin';

/**
 * @deprecated use `CollectionManagerProvider` instead
 */
export const CollectionManagerProvider_deprecated: React.FC<CollectionManagerOptions> = (props) => {
  return (
    <CollectionManagerProvider>
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerProvider>
  );
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const api = useAPIClient();
  const dm = useDataSourceManager();
  const { refreshCH } = useCollectionHistory();

  const coptions = {
    url: 'collectionCategories:list',
    params: {
      paginate: false,
      sort: ['sort'],
    },
  };
  const service = useRequest<{
    data: any;
  }>(() => {
    return dm.reload().then(refreshCH);
  });
  const result = useRequest<{
    data: any;
  }>(coptions);

  const { render } = useAppSpin();
  if (service.loading) {
    return render();
  }

  const refreshCategory = async () => {
    const { data } = await api.request(coptions);
    result.mutate(data);
    return data?.data || [];
  };
  return (
    <CollectionCategroriesProvider service={{ ...result }} refreshCategory={refreshCategory}>
      <CollectionManagerProvider_deprecated {...props}></CollectionManagerProvider_deprecated>
    </CollectionCategroriesProvider>
  );
};

export const CollectionCategroriesProvider = (props) => {
  const { service, refreshCategory } = props;
  return (
    <CollectionCategroriesContext.Provider
      value={{
        data: service?.data?.data,
        refresh: refreshCategory,
        ...props,
      }}
    >
      {props.children}
    </CollectionCategroriesContext.Provider>
  );
};
