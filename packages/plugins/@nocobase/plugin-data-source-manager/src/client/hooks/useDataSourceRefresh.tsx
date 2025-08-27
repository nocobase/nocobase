/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import { ResourceActionContext, useAPIClient, useDataSourceManager } from '@nocobase/client';
import { message } from 'antd';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { DataSourceContext } from '../DatabaseConnectionProvider';

export interface UseDataSourceRefreshOptions {
  dataSourceName: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  showMessage?: boolean;
}

export const useDataSourceRefresh = (options: UseDataSourceRefreshOptions) => {
  const { dataSourceName, onSuccess, onError, showMessage = true } = options;
  const { t } = useTranslation();
  const service = useContext(ResourceActionContext);
  const api = useAPIClient();
  const field = useField();
  const ds = useDataSourceManager();
  const { setDataSource, dataSource } = useContext(DataSourceContext);

  field.data = field.data || {};

  return {
    async onClick() {
      field.data.loading = true;
      try {
        const { data } = await api.request({
          url: `${
            dataSourceName === 'main' ? 'mainDataSource' : 'dataSources'
          }:refresh?filterByTk=${dataSourceName}&clientStatus=${dataSource?.status || 'loaded'}`,
          method: 'post',
        });

        field.data.loading = false;
        setDataSource({ ...data?.data, name: dataSourceName });

        if (data?.data?.status === 'reloading') {
          if (showMessage) {
            message.warning(t('Data source synchronization in progress'));
          }
        } else if (data?.data?.status === 'loaded') {
          if (showMessage) {
            message.success(t('Data source synchronization successful'));
          }
          service?.refresh?.();
        }

        await ds.getDataSource(dataSourceName).reload();

        onSuccess?.();
      } catch (error) {
        field.data.loading = false;

        if (showMessage) {
          message.error(t('Data source synchronization failed'));
        }

        onError?.(error);
      }
    },

    get loading() {
      return field.data.loading;
    },
  };
};
