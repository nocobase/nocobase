/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import {
  useActionContext,
  useCollection,
  useDataBlockRequest,
  useDataBlockResource,
  useTableBlockContext,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import { useT } from '../locale';

export function useBulkDestroyAction() {
  const { message } = AntdApp.useApp();
  const { setVisible } = useActionContext();
  const resource = useDataBlockResource();
  const { data, refresh, run } = useDataBlockRequest();
  const collection = useCollection();
  const { field } = useTableBlockContext();
  const t = useT();

  return {
    async run() {
      if (!collection) {
        throw new Error('collection does not exist');
      }

      const selectedRowKeys = field?.data?.selectedRowKeys;
      if (!selectedRowKeys || selectedRowKeys.length === 0) {
        message.error(t('Please select items to delete'));
        setVisible(false);
        return;
      }

      await resource.destroy({
        filterByTk: selectedRowKeys,
      });

      // Calculate pagination after deletion
      const currentPage = data?.['meta']?.page || 1;
      const pageSize = data?.['meta']?.pageSize || 20;
      const totalCount = data?.['meta']?.count || 0;
      const remainingItems = totalCount - selectedRowKeys.length;
      const lastPage = Math.max(Math.ceil(remainingItems / pageSize), 1);

      // Clear selection
      field.data.selectedRowKeys = [];

      // Update data with appropriate page
      if (currentPage > lastPage) {
        run({ page: lastPage, pageSize });
      } else {
        refresh();
      }

      message.success(t('Selected light components deleted successfully'));
      setVisible(false);
    },
  };
}
