/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

export const useLoadCollections = () => {
  const api = useAPIClient();
  return async (key) => {
    const { data } = await api.request({
      url: `dataSources/${key}/collections:all`,
      method: 'get',
    });
    return data;
  };
};

export const addDatasourceCollections = async (api, filterByTk, options: { collections, dbOptions }) => {
  const url = `dataSources/${filterByTk}/collections:add`;
  const { collections: toBeAddedCollections, dbOptions } = options;
  if (toBeAddedCollections.length) {
    const collections = [];
    for (const { name, selected } of toBeAddedCollections) {
      if (selected) {
        collections.push(name);
      }
    }
    await api.request({
      url,
      method: 'post',
      data: {
        dbOptions,
        collections,
      },
    });
  }
};
