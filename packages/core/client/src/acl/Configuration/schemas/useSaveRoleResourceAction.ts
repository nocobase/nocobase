import { useForm } from '@formily/react';
import { useActionContext, useAPIClient, useRecord, useResourceActionContext } from '../../../';

export const useSaveRoleResourceAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  return {
    async run() {
      await api.resource('roles.resources', record.roleName)[record.exists ? 'update' : 'create']({
        filterByTk: record.name,
        values: {
          ...form.values,
          name: record.name,
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};
