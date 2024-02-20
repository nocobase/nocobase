import React from 'react';
import { ResourceActionProvider, useRecord_deprecated } from '@nocobase/client';

export const ExecutionResourceProvider = ({ request, filter = {}, ...others }) => {
  const workflow = useRecord_deprecated();
  const props = {
    ...others,
    request: {
      ...request,
      params: {
        ...request?.params,
        filter: {
          ...request?.params?.filter,
          key: workflow.key,
        },
      },
    },
  };

  return <ResourceActionProvider {...props} />;
};
