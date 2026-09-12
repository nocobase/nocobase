/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { PluginDataSourceManagerClientV2 } from '@nocobase/plugin-data-source-manager/client-v2';
import {
  FdwFieldsConfigureItem,
  FdwPreviewConfigureItem,
  FdwRemoteServerConfigureItem,
  FdwRemoteTableConfigureItem,
  normalizeFdwCollectionSubmitValues,
} from './FdwCollectionConfigure';
import { tExpr } from './locale';

export class PluginCollectionFDWClientV2 extends Plugin<any, Application> {
  async load() {
    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as PluginDataSourceManagerClientV2 | undefined;

    dataSourceManager?.registerCollectionTemplate?.({
      name: 'foreign',
      title: tExpr('Connect to foreign data'),
      order: 70,
      color: 'yellow',
      creatable: false,
      collection: {
        options: {
          template: 'foreign',
          autoGenId: false,
          createdAt: false,
          createdBy: false,
          updatedAt: false,
          updatedBy: false,
        },
        fields: [],
      },
      fieldInterfaces: {
        include: ['obo', 'oho', 'o2m', 'm2o', 'm2m'],
      },
      capabilities: {
        inherits: false,
      },
      configure: {
        items: [
          {
            name: 'remoteServerName',
            Component: FdwRemoteServerConfigureItem,
            required: true,
          },
          {
            name: 'remoteTableName',
            Component: FdwRemoteTableConfigureItem,
            required: true,
          },
          {
            name: 'fields',
            Component: FdwFieldsConfigureItem,
            required: true,
          },
          {
            name: 'preview',
            Component: FdwPreviewConfigureItem,
          },
        ],
        transformSubmitValues: normalizeFdwCollectionSubmitValues,
      },
    });
  }
}

export default PluginCollectionFDWClientV2;
