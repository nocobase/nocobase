import { useEffect } from 'react';
import { useCollectionContext, useResourceRequest } from '../constate';
import { Resource } from '../resource';

export const useResource = (options: any = {}) => {
  const { collection } = useCollectionContext();
  const resource = useResourceRequest(collection?.name);
  useEffect(() => {
    options.onSuccess && options.onSuccess({});
  }, []);
  return {
    initialValues: {},
    loading: false,
    async run() {},
    resource,
  };
};
