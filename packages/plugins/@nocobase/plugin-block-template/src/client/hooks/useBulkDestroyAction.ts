/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, usePlugin, useDataBlockRequest, useActionContext } from '@nocobase/client';
import { useField } from '@formily/react';
import { App } from 'antd';
import { useT } from '../locale';
import { useForm } from '@formily/react';
import { useTableBlockProps } from '@nocobase/client';

export const useBulkDestroyAction = () => {
  const apiClient = useAPIClient();
  const { setVisible } = useActionContext();
  const { data, refresh, run } = useDataBlockRequest();
  const field = useField();
  const t = useT();
  const form = useForm();
  const { message } = App.useApp();
  const { onRowSelectionChange } = useTableBlockProps();

  return {
    async run() {
      const selectedRowKeys = field.data?.selectedRowKeys;
      if (!selectedRowKeys?.length) {
        message.error(t('Please select the records you want to delete'));
        return;
      }

      await apiClient.request({
        method: 'POST',
        url: '/blockTemplates:destroy',
        params: {
          filterByTk: selectedRowKeys,
          removeSchema: !form.values.keepBlocks,
        },
      });

      // Reset selection
      onRowSelectionChange([], []);
      form.reset();

      // Calculate pagination after deletion
      const currentPage = data?.['meta']?.page || 1;
      const pageSize = data?.['meta']?.pageSize || 20;
      const totalCount = data?.['meta']?.count || 0;
      const remainingItems = totalCount - selectedRowKeys.length;
      const lastPage = Math.max(Math.ceil(remainingItems / pageSize), 1);

      // Update data with appropriate page
      if (currentPage > lastPage) {
        run({ page: lastPage, pageSize });
      } else {
        refresh();
      }

      setVisible(false);
      message.success(t('Deleted successfully'));
    },
  };
};
