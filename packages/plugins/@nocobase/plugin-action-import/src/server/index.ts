/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { namespace } from '..';
import { downloadXlsxTemplate, importXlsx } from './actions';
import { enUS, zhCN } from './locale';
import { importMiddleware } from './middleware';

export class PluginActionImportServer extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);

    this.app.on('afterInstall', async () => {
      const roleNames = ['admin', 'member'];
      const roles = await this.app.db.getRepository('roles').find({
        filter: {
          name: roleNames,
        },
      });

      for (const role of roles) {
        await this.app.db.getRepository('roles').update({
          filter: {
            name: role.name,
          },
          values: {
            strategy: {
              ...role.strategy,
              actions: [...role.strategy.actions, 'importXlsx'],
            },
          },
        });
      }
    });
  }

  async load() {
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(importMiddleware);
      dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
      dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);

      dataSource.acl.setAvailableAction('importXlsx', {
        displayName: '{{t("Import")}}',
        allowConfigureFields: true,
        type: 'new-data',
        onNewRecord: true,
      });

      dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn');
    });
  }
}

export default PluginActionImportServer;
