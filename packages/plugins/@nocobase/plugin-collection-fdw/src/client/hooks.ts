/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { useForm, useField } from '@formily/react';
import { message } from 'antd';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useActionContext, useAPIClient } from '@nocobase/client';
import { DatabaseServerContext } from './components/DatabaseServerSelect';
import { NAMESPACE } from '../locale';

export const useCreateDatabaseServer = (handleDataServerChange) => {
  const form = useForm();
  const ctx = useActionContext();
  const { options, setOptions } = useContext(DatabaseServerContext);
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
        const servers = options.concat();
        servers.push(data?.data);
        handleDataServerChange?.(data?.data);
        setOptions(servers);
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
        await api.resource('databaseServers').testConnection({
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
export const useCancelAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  return {
    async run() {
      ctx.setVisible(false);
      form.reset();
    },
  };
};

export const useEditDatabaseServer = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useContext(DatabaseServerContext);
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      try {
        await api.resource('databaseServers').update({
          filterByTk: form.values.name,
          values: {
            ...form.values,
          },
        });
        ctx.setVisible(false);
        await form.reset();
        refresh();
      } catch (error) {
        console.log(error);
      }
    },
  };
};
