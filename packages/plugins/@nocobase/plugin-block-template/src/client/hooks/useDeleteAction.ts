/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useCollection,
  useCollectionRecordData,
  useBlockRequestContext,
  useDataBlockResource,
  useAPIClient,
  usePlugin,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import { useForm } from '@formily/react';
import { useT } from '../locale';
import PluginBlockTemplateClient from '..';

export function useDeleteAction() {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { service } = useBlockRequestContext();
  const collection = useCollection();
  const t = useT();
  const form = useForm();
  const apiClient = useAPIClient();
  const plugin = usePlugin(PluginBlockTemplateClient);

  return {
    async run() {
      if (!collection) {
        throw new Error('collection does not exist');
      }
      await form.submit();
      const keepBlocks = form.values.keepBlocks;
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
      });
      if (!keepBlocks) {
        await apiClient.request({
          method: 'POST',
          url: `/uiSchemas:remove/${record['uid']}`,
        });
        // clear the cache
        for (const key in plugin.templateschemacache) {
          delete plugin.templateschemacache[key];
        }
      }
      await service.refresh();
      message.success(t('Deleted successfully'), 0.2);
    },
  };
}
