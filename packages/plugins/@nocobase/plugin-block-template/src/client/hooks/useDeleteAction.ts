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
  useDataBlockResource,
  usePlugin,
  useDataBlockRequest,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import { useForm } from '@formily/react';
import { useT } from '../locale';

export function useDeleteAction() {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { data, refresh, run } = useDataBlockRequest();
  const collection = useCollection();
  const t = useT();
  const form = useForm();

  return {
    async run() {
      if (!collection) {
        throw new Error('collection does not exist');
      }
      await form.submit();
      const keepBlocks = form.values.keepBlocks;
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
        removeSchema: !keepBlocks,
      });

      // Calculate pagination after deletion
      const currentPage = data?.['meta']?.page || 1;
      const pageSize = data?.['meta']?.pageSize || 20;
      const totalCount = data?.['meta']?.count || 0;
      const remainingItems = totalCount - 1;
      const lastPage = Math.max(Math.ceil(remainingItems / pageSize), 1);

      // Update data with appropriate page
      if (currentPage > lastPage) {
        run({ page: lastPage, pageSize });
      } else {
        refresh();
      }

      message.success(t('Deleted successfully'));
    },
  };
}
