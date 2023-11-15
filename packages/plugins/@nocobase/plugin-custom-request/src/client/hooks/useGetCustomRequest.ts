import { useFieldSchema } from '@formily/react';
import { useRequest } from '@nocobase/client';

export const useGetCustomRequest = () => {
  const fieldSchema = useFieldSchema();
  const url = `customRequests:get/${fieldSchema['x-uid']}`;
  return useRequest<{ data: { options: any; title: string; roles: any[] } }>(
    {
      url,
      params: {
        appends: ['roles'],
      },
    },
    {
      manual: true,
      cacheKey: url,
    },
  );
};
