import { useForm, useField } from '@formily/react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useActionContext, useAPIClient } from '@nocobase/client';
import { NAMESPACE } from '../locale';

export const useCreateDatabaseServer = (handleDataServerChange) => {
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
  const { t } = useTranslation();
  const actionField = useField();
  actionField.data = actionField.data || {};
  return {
    async run() {
      await form.submit();
      try {
        actionField.data.loading = true;
        const { data } = await api.resource('databaseServers').create({
          values: {
            ...form.values,
          },
        });
        actionField.data.loading = false;
        ctx.setVisible(false);
        await form.reset();
        handleDataServerChange?.(data?.data);
        message.success(t('Saved successfully'));
      } catch (error) {
        actionField.data.loading = false;
        console.log(error);
      }
    },
  };
};

export const useTestConnectionAction = () => {
  const form = useForm();
  const api = useAPIClient();
  const { t } = useTranslation();
  const actionField = useField();
  actionField.data = actionField.data || {};
  return {
    async run() {
      await form.submit();
      try {
        actionField.data.loading = true;
        await api.resource('dataSources').testConnection({
          values: {
            ...form.values,
          },
        });
        actionField.data.loading = false;
        message.success(t('Connection successful', { ns: NAMESPACE }));
      } catch (error) {
        actionField.data.loading = false;
        console.log(error);
      }
    },
  };
};
