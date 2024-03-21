import {
  CollectionContext,
  useFilterFieldOptions,
  useFilterFieldProps,
  useResourceActionContext,
} from '@nocobase/client';
import { useContext } from 'react';

export const useFilterActionProps = () => {
  const collection = useContext(CollectionContext);
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};
