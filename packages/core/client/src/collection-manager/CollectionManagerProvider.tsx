import React, { FC, ReactNode, useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategroriesContext } from './context';
import { CollectionManagerOptions } from './types';
import { CollectionManagerProviderV2, CollectionOptionsV2, useCollectionManagerV2 } from '../application';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { useAppSpin } from '../application/hooks/useAppSpin';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { reloadCallback, cm, collections = [] } = props;
  const cmContext = useCollectionManagerV2();
  const newCm = useMemo(() => {
    const ctx = cm || cmContext;
    return ctx.inherit({
      collections: collections as any,
      reloadCallback,
    });
  }, [cm]);
  return (
    <CollectionManagerProviderV2 collectionManager={newCm}>
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerProviderV2>
  );
};

export const CollectionExtendsProvider: FC<{ collections: CollectionOptionsV2[]; children?: ReactNode }> = ({
  children,
  collections,
}) => {
  const localCollections = collections.map((item) => ({ ...item, isLocal: true }));
  return <CollectionManagerProvider collections={localCollections}>{children}</CollectionManagerProvider>;
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const api = useAPIClient();
  const cm = useCollectionManagerV2();
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
  }>(() => cm.reloadAll(refreshCH));
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
      <CollectionManagerProvider {...props}></CollectionManagerProvider>
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
