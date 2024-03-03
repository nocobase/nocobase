import { useForm } from '@formily/react';
import { useContext } from 'react';
import { useActionContext, useAPIClient, useRecord, useResourceActionContext } from '@nocobase/client';
import { PermissionContext } from '../PermisionProvider';

export const useSaveRoleResourceAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { currentDataSource } = useContext(PermissionContext);
  return {
    async run() {
      await api.resource('roles.dataSourceResources', record.roleName)[record.exists ? 'update' : 'create']({
        filterByTk: record.name,
        filter: {
          dataSourceKey: currentDataSource.key,
          name: record.name,
        },
        values: {
          ...form.values,
          name: record.name,
          dataSourceKey: currentDataSource.key,
        },
      });
      ctx.setVisible(false);
      refresh();
    },
  };
};
