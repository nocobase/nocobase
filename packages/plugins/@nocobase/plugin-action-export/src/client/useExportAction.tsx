/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  mergeFilter,
  useBlockRequestContext,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCompile,
  useCurrentAppInfo,
} from '@nocobase/client';
import lodash from 'lodash';
import { saveAs } from 'file-saver';
import { App } from 'antd';
import { useExportTranslation } from './locale';
import { useMemo } from 'react';

export const useExportAction = () => {
  const { service, resource, props } = useBlockRequestContext();
  const appInfo = useCurrentAppInfo();
  const defaultFilter = props?.params.filter;
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { name, title } = useCollection_deprecated();
  const { t } = useExportTranslation();
  const { modal } = App.useApp();
  const filters = service.params?.[1]?.filters || {};
  const field = useField();
  const exportLimit = useMemo(() => {
    if (appInfo?.data?.exportLimit) {
      return appInfo.data.exportLimit;
    }

    return 2000;
  }, [appInfo]);

  return {
    async onClick() {
      field.data = field.data || {};
      const confirmed = await modal.confirm({
        title: t('Export'),
        content: t('Export warning', { limit: exportLimit }),
        okText: t('Start export'),
      });
      if (!confirmed) {
        return;
      }
      field.data.loading = true;
      const { exportSettings } = lodash.cloneDeep(actionSchema?.['x-action-settings'] ?? {});
      exportSettings.forEach((es) => {
        const { uiSchema, interface: fieldInterface } =
          getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
        // @ts-ignore
        es.enum = uiSchema?.enum?.map((e) => ({ value: e.value, label: e.label }));
        if (!es.enum && uiSchema?.type === 'boolean') {
          es.enum = [
            { value: true, label: t('Yes') },
            { value: false, label: t('No') },
          ];
        }
        es.defaultTitle = uiSchema?.title;
      });
      const { data } = await resource.export(
        {
          title: compile(title),
          appends: service.params[0]?.appends?.join(),
          filter: mergeFilter([...Object.values(filters), defaultFilter]),
          sort: service.params[0]?.sort,
        },
        {
          method: 'post',
          data: {
            columns: compile(exportSettings),
          },
          responseType: 'blob',
        },
      );
      const blob = new Blob([data], { type: 'application/x-xls' });
      field.data.loading = false;
      saveAs(blob, `${compile(title)}.xlsx`);
    },
  };
};
