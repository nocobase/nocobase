import { useEffect, useContext } from 'react';
import { useActionContext, useRecord, useRequest } from '@nocobase/client';
import { PermissionContext } from '../PermisionProvider';

export const useRoleResourceValues = (options) => {
  const record = useRecord();
  const { visible } = useActionContext();
  const { currentDataSource } = useContext(PermissionContext);

  const result = useRequest(
    {
      resource: 'roles.dataSourceResources',
      resourceOf: record.roleName,
      action: 'get',
      params: {
        appends: ['actions', 'actions.scope'],
        filterByTk: record.name,
        filter: {
          dataSourceKey: currentDataSource.key,
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
