import { Spin } from 'antd';
import { keyBy } from 'lodash';
import React, { useContext, useState } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { templateOptions } from '../collection-manager/Configuration/templates';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategroriesContext, CollectionManagerContext } from './context';
import * as defaultInterfaces from './interfaces';
import { CollectionManagerOptions } from './types';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { service, interfaces, collections = [], refreshCM, templates } = props;
  const defaultTemplates = keyBy(templateOptions(), (item) => item.name);
  const ctx = useContext(CollectionManagerContext);
  return (
    <CollectionManagerContext.Provider
      value={{
        ...ctx,
        service,
        interfaces: { ...defaultInterfaces, ...ctx.interfaces, ...interfaces },
        templates: { ...defaultTemplates, ...templates },
        collections,
        refreshCM,
      }}
    >
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerContext.Provider>
  );
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const api = useAPIClient();
  const [contentLoading, setContentLoading] = useState(false);
  const { refreshCH } = useCollectionHistory();
  const options = {
    resource: 'collections',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'fields.uiSchema','category'],
      filter: {
        // inherit: false,
      },
      sort: ['sort'],
    },
  };
  const service = useRequest(options);
  if (service.loading) {
    return <Spin />;
  }

  const refreshCM = async (opts) => {
    if (opts?.reload) {
      setContentLoading(true);
    }
    const { data } = await api.request(options);
    service.mutate(data);
    await refreshCH();
    if (opts?.reload) {
      setContentLoading(false);
    }
    return data?.data || [];
  };

  return (
    <CollectionManagerProvider
      service={{ ...service, contentLoading, setContentLoading }}
      collections={service?.data?.data}
      refreshCM={refreshCM}
      {...props}
    />
  );
};

export const CollectionCategroriesProvider = (props) => {
  const api = useAPIClient();
  const options={
    url: 'collectionCategories:list',
    params: {
      paginate: false,
      sort:['sort']
    },
  }
  const result = useRequest(options);
  if (result.loading) {
    return <Spin />;
  }
  return (
    <CollectionCategroriesContext.Provider
      value={{
        ...result,
        data: result?.data?.data,
        refresh:async ()=>{
          const { data } = await api.request(options);
          result.mutate(data);
          return data?.data || [];
        }
      }}
    >
      {props.children}
    </CollectionCategroriesContext.Provider>
  );
};
