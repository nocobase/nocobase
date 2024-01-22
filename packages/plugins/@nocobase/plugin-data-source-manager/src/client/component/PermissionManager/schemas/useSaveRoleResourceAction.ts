import { useForm } from '@formily/react';
import { useActionContext, useAPIClient, useRecord, useResourceActionContext } from '@nocobase/client';
import { useParams } from 'react-router-dom';

export const useSaveRoleResourceAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { name } = useParams();
  return {
    async run() {
      await api.resource('roles.connectionResources', record.roleName)[record.exists ? 'update' : 'create']({
        filterByTk: record.name,
        filter: {
          connectionName: name,
          name: record.name,
        },
        values: {
          ...form.values,
          name: record.name,
          connectionName: name,
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};
