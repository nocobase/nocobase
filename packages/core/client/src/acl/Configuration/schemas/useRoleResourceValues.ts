import { useEffect } from 'react';
import { useActionContext, useRecord_deprecated, useRequest } from '../../../';

export const useRoleResourceValues = (options) => {
  const record = useRecord_deprecated();
  const { visible } = useActionContext();
  const result = useRequest(
    {
      resource: 'roles.resources',
      resourceOf: record.roleName,
      action: 'get',
      params: {
        appends: ['actions', 'actions.scope'],
        filterByTk: record.name,
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
