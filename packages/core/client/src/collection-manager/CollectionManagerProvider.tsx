import React, { useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategroriesContext } from './context';
import { CollectionManagerOptions } from './types';
import { CollectionManagerProviderV2, CollectionManagerV2, useApp, useCollectionManagerV2 } from '../application';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { useAppSpin } from '../application/hooks/useAppSpin';
import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
import { interfaces as defaultInterfaces } from './Configuration/interfaces';
// import { general, expression, sql, tree, view } from './templates';
import { collectionTemplates } from './Configuration/templates';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { interfaces, reloadCallback, cm, collections = [], templates } = props;
  const cmContext = useCollectionManagerV2();
  const app = useApp();
  const newCm = useMemo(() => {
    let ctx = cm || cmContext;
    if (!ctx)
      ctx = new CollectionManagerV2(
        {
          collectionMixins: [InheritanceCollectionMixin],
          collectionFieldInterfaces: defaultInterfaces as any,
          collectionTemplates: Object.values(collectionTemplates) as any,
        },
        app,
      );
    return ctx.inherit({
      collections: collections as any,
      collectionFieldInterfaces: interfaces,
      collectionTemplates: templates,
      reloadCallback,
    });
  }, [cm]);
  return (
    <CollectionManagerProviderV2 collectionManager={newCm}>
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerProviderV2>
  );
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
  }>(() => cm.reload(refreshCH));
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
