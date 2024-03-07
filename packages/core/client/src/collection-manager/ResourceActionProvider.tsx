import { useField } from '@formily/react';
import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, useContext, useEffect } from 'react';
import { useCollectionManager_deprecated } from '.';
import { CollectionProvider_deprecated, useRecord } from '..';
import { useAPIClient, useRequest } from '../api-client';

export const ResourceActionContext = createContext<
  Result<any, any> & { state?: any; setState?: any; dragSort?: boolean; defaultRequest?: any }
>(null);
ResourceActionContext.displayName = 'ResourceActionContext';

interface ResourceActionProviderProps {
  type?: 'association' | 'collection';
  collection?: any;
  request?: any;
  dragSort?: boolean;
  uid?: string;
}

const ResourceContext = createContext<any>(null);
ResourceContext.displayName = 'ResourceContext';

const CollectionResourceActionProvider = (props) => {
  const { collection, request, uid, dragSort } = props;
  const api = useAPIClient();
  const record = useRecord();
  const actionName = request?.action;
  const others = {};
  if (actionName === 'get') {
    others['filterByTk'] = record[collection.targetKey || collection.filterTargetKey || 'id'];
  }
  const appends = request?.params?.appends || [];
  const service = useRequest<{
    data: any;
  }>(
    {
      ...request,
      params: {
        ...others,
        ...request?.params,
        appends: [
          ...(collection?.fields?.filter?.((field) => field.target).map((field) => field.name) || []),
          ...appends,
        ],
        sort: dragSort ? [collection.sortable === true ? 'sort' : collection.sortable] : request?.params?.sort,
      },
    },
    { uid },
  );
  const resource = api.resource(request.resource);
  return (
    <ResourceContext.Provider value={{ type: 'collection', resource, collection }}>
      <ResourceActionContext.Provider value={{ ...service, defaultRequest: request, dragSort }}>
        <CollectionProvider_deprecated collection={collection}>{props.children}</CollectionProvider_deprecated>
      </ResourceActionContext.Provider>
    </ResourceContext.Provider>
  );
};

const AssociationResourceActionProvider = (props) => {
  const { collection, association, request, uid, dragSort } = props;
  const api = useAPIClient();
  const record = useRecord();
  const resourceOf = record[association.sourceKey];
  const appends = request?.params?.appends || [];
  const service = useRequest(
    {
      resourceOf,
      ...request,
      params: {
        ...request?.params,
        appends: [
          ...(collection?.fields?.filter?.((field) => field.target).map((field) => field.name) || []),
          ...appends,
        ],
      },
    },
    { uid },
  );
  const resource = api.resource(request.resource, resourceOf);
  return (
    <ResourceContext.Provider value={{ type: 'association', resource, association, collection }}>
      <ResourceActionContext.Provider value={{ ...service, defaultRequest: request, dragSort }}>
        <CollectionProvider_deprecated collection={collection}>{props.children}</CollectionProvider_deprecated>
      </ResourceActionContext.Provider>
    </ResourceContext.Provider>
  );
};

export const ResourceActionProvider: React.FC<ResourceActionProviderProps> = (props) => {
  // eslint-disable-next-line prefer-const
  let { collection, request } = props;
  const { getCollection } = useCollectionManager_deprecated();
  if (typeof collection === 'string') {
    collection = getCollection(collection);
  }
  if (!collection) {
    return null;
  }
  if (request?.resource?.includes('.')) {
    return <AssociationResourceActionProvider {...props} collection={collection} />;
  }
  return <CollectionResourceActionProvider {...props} collection={collection} />;
};

export const useResourceActionContext = () => {
  return useContext(ResourceActionContext);
};

export const useDataSourceFromRAC = (options: any) => {
  const service = useContext(ResourceActionContext);
  const field = useField();
  useEffect(() => {
    if (!service.loading) {
      options?.onSuccess(service.data);
      field.componentProps.dragSort = !!service.dragSort;
    }
  }, [service.loading]);
  return service;
};

export const useResourceContext = () => {
  const { type, resource, collection, association } = useContext(ResourceContext);
  return {
    type,
    resource,
    collection,
    association,
    targetKey: association?.targetKey || collection?.targetKey || 'id',
  };
};
