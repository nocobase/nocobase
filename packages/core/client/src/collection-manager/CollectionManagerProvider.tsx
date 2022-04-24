import { Spin } from 'antd';
import React, { useState } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionManagerContext } from './context';
import * as defaultInterfaces from './interfaces';
import { CollectionManagerOptions } from './types';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { service, interfaces, collections = [], refreshCM } = props;
  return (
    <CollectionManagerContext.Provider
      value={{
        service,
        interfaces: { ...defaultInterfaces, ...interfaces },
        collections,
        refreshCM: async () => {
          if (refreshCM) {
            await refreshCM();
          }
        },
      }}
    >
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerContext.Provider>
  );
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const api = useAPIClient();
  const [contentLoading, setContentLoading] = useState(false);
  const options = {
    resource: 'collections',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'fields.uiSchema'],
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
  return (
    <CollectionManagerProvider
      service={{...service, contentLoading, setContentLoading}}
      collections={service?.data?.data}
      refreshCM={async () => {
        setContentLoading(true);
        const { data } = await api.request(options);
        service.mutate(data);
        setContentLoading(false);
      }}
      {...props}
    />
  );
};
