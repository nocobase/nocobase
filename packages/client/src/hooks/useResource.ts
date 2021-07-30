import { useCollectionContext } from '../constate';
import { Resource } from '../resource';

export const useResource = (options: any = {}) => {
  const { collection } = useCollectionContext();
  const resource = Resource.make(collection.name);
  return {
    initialValues: {},
    loading: false,
    async run() {},
    resource,
  };
};
