import { Result } from 'ahooks/lib/useRequest/src/types';
import React, { createContext, useContext, useEffect } from 'react';
import { useRecord } from '..';
import { useAPIClient, useRequest } from '../api-client';

export const ResourceActionContext = createContext<Result<any, any>>(null);

interface ResourceActionProviderProps {
  type?: 'association' | 'collection';
  request?: any;
  uid?: string;
}

const ResourceContext = createContext<any>(null);

const CollectionResourceActionProvider = (props) => {
  const { collection, request, uid } = props;
  const api = useAPIClient();
  const service = useRequest(request, {
    uid,
    refreshDeps: [request],
  });
  const resource = api.resource(request.resource);
  return (
    <ResourceContext.Provider value={{ type: 'collection', resource, collection }}>
      <ResourceActionContext.Provider value={service}>{props.children}</ResourceActionContext.Provider>
    </ResourceContext.Provider>
  );
};

const AssociationResourceActionProvider = (props) => {
  const { association, request, uid } = props;
  const api = useAPIClient();
  const record = useRecord();
  const resourceOf = record[association.sourceKey];
  const service = useRequest(
    { resourceOf, ...request },
    {
      uid,
      refreshDeps: [request, resourceOf],
    },
  );
  const resource = api.resource(request.resource, resourceOf);
  return (
    <ResourceContext.Provider value={{ type: 'association', resource, association }}>
      <ResourceActionContext.Provider value={service}>{props.children}</ResourceActionContext.Provider>
    </ResourceContext.Provider>
  );
};

export const ResourceActionProvider: React.FC<ResourceActionProviderProps> = (props) => {
  const { request } = props;
  if (request?.resource?.includes('.')) {
    return <AssociationResourceActionProvider {...props} />;
  }
  return <CollectionResourceActionProvider {...props} />;
};

export const useResourceActionContext = () => {
  return useContext(ResourceActionContext);
};

export const useDataSourceFromRAC = (options: any) => {
  const service = useContext(ResourceActionContext);
  useEffect(() => {
    if (!service.loading) {
      options?.onSuccess(service.data);
    }
  }, [service.loading]);
  return service;
};

export const useResourceContext = () => {
  const { type, resource, collection, association } = useContext(ResourceContext);
  return { type, resource, collection, association, targetKey: association?.targetKey || collection?.targetKey };
};
