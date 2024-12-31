/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useBlockRequestContext, useAPIClient, usePlugin } from '@nocobase/client';
import { App } from 'antd';
import { useT } from '../locale';
import { useForm } from '@formily/react';
import PluginBlockTemplateClient from '..';

export const useBulkDestroyAction = () => {
  const apiClient = useAPIClient();
  const { field } = useBlockRequestContext();
  const { service } = useBlockRequestContext();
  const t = useT();
  const form = useForm();
  const { message } = App.useApp();
  const plugin = usePlugin(PluginBlockTemplateClient);
  return {
    async run() {
      const selectedRowKeys = field.data?.selectedRowKeys;
      if (!selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await apiClient.request({
        method: 'POST',
        url: '/blockTemplates:destroy',
        params: {
          filterByTk: selectedRowKeys,
        },
      });

      for (const key in plugin.templateschemacache) {
        delete plugin.templateschemacache[key];
      }
      field.data.selectedRowKeys = [];
      form.reset();
      service.refresh();
    },
  };
};
