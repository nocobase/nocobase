/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { PluginDataSourceManagerClientV2 } from '@nocobase/plugin-data-source-manager/client-v2';
import {
  normalizeSqlCollectionSubmitValues,
  SqlFieldsConfigureItem,
  SqlPreviewConfigureItem,
  SqlSourceCollectionsConfigureItem,
  SqlStatementConfigureItem,
  SqlSyncFieldsDrawer,
} from './SqlCollectionConfigure';

export class PluginCollectionSqlClientV2 extends Plugin<any, Application> {
  async load() {
    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as PluginDataSourceManagerClientV2 | undefined;

    dataSourceManager?.registerCollectionTemplate?.({
      name: 'sql',
      title: '{{t("SQL collection")}}',
      order: 40,
      color: 'yellow',
      collection: {
        options: {
          template: 'sql',
        },
        fields: [],
      },
      capabilities: {
        recordUniqueKey: true,
      },
      configure: {
        items: [
          {
            name: 'sql',
            Component: SqlStatementConfigureItem,
            required: true,
          },
          {
            name: 'sources',
            Component: SqlSourceCollectionsConfigureItem,
          },
          {
            name: 'fields',
            Component: SqlFieldsConfigureItem,
            required: true,
          },
          {
            name: 'preview',
            Component: SqlPreviewConfigureItem,
          },
        ],
        syncFields: {
          visible: true,
          Component: SqlSyncFieldsDrawer,
        },
        transformSubmitValues: normalizeSqlCollectionSubmitValues,
      },
    });
  }
}

export default PluginCollectionSqlClientV2;
