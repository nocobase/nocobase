import { Result } from 'ahooks/lib/useRequest/src/types';
import React, { createContext, useContext, useEffect } from 'react';
import { useRequest } from '../api-client';

export const ResourceActionContext = createContext<Result<any, any>>(null);

interface ResourceActionProviderProps {
  request?: any;
  uid?: string;
}

export const ResourceActionProvider: React.FC<ResourceActionProviderProps> = (props) => {
  const { request, uid } = props;
  console.log(request);
  const service = useRequest(request, {
    uid,
    refreshDeps: [request],
  });
  return <ResourceActionContext.Provider value={service}>{props.children}</ResourceActionContext.Provider>;
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
