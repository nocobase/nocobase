import { useEffect } from 'react';
import { useCollectionContext } from '../constate';
import { Resource } from '../resource';

export const useResource = (options: any = {}) => {
  const { collection } = useCollectionContext();
  const resource = Resource.make(collection?.name);
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
