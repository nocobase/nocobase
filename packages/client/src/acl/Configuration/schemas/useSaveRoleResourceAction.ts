import { useForm } from '@formily/react';
import { useAPIClient, useRecord } from '../../../';

export const useSaveRoleResourceAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const record = useRecord();
  return {
    async run() {
      await api.resource('roles.resources', record.roleName).create({
        values: {
          ...form.values,
          name: record.name,
        },
      });
    },
  };
};
