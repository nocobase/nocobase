import { useForm } from '@formily/react';
import { useActionContext, useAPIClient, useRecord_deprecated, useResourceActionContext } from '@nocobase/client';
import { useParams } from 'react-router-dom';

export const useSaveRoleResourceAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord_deprecated();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { name } = useParams();
  return {
    async run() {
      await api.resource('roles.dataSourceResources', record.roleName)[record.exists ? 'update' : 'create']({
        filterByTk: record.name,
        filter: {
          dataSourceKey: name || 'main',
          name: record.name,
        },
        values: {
          ...form.values,
          name: record.name,
          dataSourceKey: name || 'main',
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};
