import { useEffect } from 'react';
import { useActionContext, useRecord, useRequest } from '@nocobase/client';
import { useParams } from 'react-router-dom';

export const useRoleResourceValues = (options) => {
  const record = useRecord();
  const { visible } = useActionContext();
  const { name } = useParams();

  const result = useRequest(
    {
      resource: 'roles.dataSourceResources',
      resourceOf: record.roleName,
      action: 'get',
      params: {
        appends: ['actions', 'actions.scope'],
        filterByTk: record.name,
        filter: {
          dataSourceKey: name,
          name: record.name,
        },
      },
    },
    { ...options, manual: true },
  );
  useEffect(() => {
    if (!record.exists) {
      options.onSuccess({
        data: {},
      });
      return;
    }
    if (visible) {
      result.run();
    }
  }, [visible, record.exists]);
  return result;
};
