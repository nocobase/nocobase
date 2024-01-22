import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useForm, useField } from '@formily/react';
import { useParams } from 'react-router-dom';
import { useAPIClient, useRecord, useResourceActionContext, useActionContext } from '@nocobase/client';

export const useDestroyAction = () => {
  const { refresh } = useResourceActionContext();
  const { name: filterByTk, collectionName, connectionName } = useRecord();
  const api = useAPIClient();
  return {
    async run() {
      await api.request({
        url: `remoteCollections/${collectionName}/fields:destroy?filterByTk=${filterByTk}`,
        headers: {
          'X-Database': connectionName,
        },
        method: 'post',
      });
      refresh();
    },
  };
};

export const useBulkDestroyAction = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const { t } = useTranslation();
  const { name: xDatabase } = useParams();
  const api = useAPIClient();
  const { name } = useRecord();
  return {
    async run() {
      if (!state?.selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await api.request({
        url: `remoteCollections/${name}/fields:destroy`,
        headers: {
          'X-Database': xDatabase,
        },
        method: 'post',
        params: { filterByTk: state?.selectedRowKeys || [] },
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

export const useBulkDestroyActionAndRefreshCM = () => {
  const { run } = useBulkDestroyAction();
  // const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      // await refreshCM();
    },
  };
};

export const useDestroyActionAndRefreshCM = () => {
  const { run } = useDestroyAction();
  // const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      // await refreshCM();
    },
  };
};

export const useUpdateAction = () => {
  const field = useField();
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
  const { refresh } = useResourceActionContext();
  const { name: filterByTk, collectionName, connectionName } = useRecord();
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await api.request({
          url: `remoteCollections/${collectionName}/fields:update?filterByTk=${filterByTk}`,
          headers: {
            'X-Database': connectionName,
          },
          method: 'post',
          data: form.values,
        });
        ctx.setVisible(false);
        await form.reset();
        refresh();
      } catch (e) {
        console.log(e);
      } finally {
        field.data.loading = false;
      }
    },
  };
};
