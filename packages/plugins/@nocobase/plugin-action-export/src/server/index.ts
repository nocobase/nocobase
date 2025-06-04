/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { exportXlsx } from './actions';
import { LoggerOptions, Logger } from '@nocobase/logger';

export class PluginActionExportServer extends Plugin {
  logger: Logger;
  beforeLoad() {
    this.app.on('afterInstall', async () => {
      if (!this.app.db.getRepository('roles')) {
        return;
      }

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
              actions: [...role.strategy.actions, 'export'],
            },
          },
        });
      }
    });
  }

  async load() {
    this.logger = this.getLogger();
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.registerActionHandler('export', exportXlsx.bind(this));
      dataSource.acl.setAvailableAction('export', {
        displayName: '{{t("Export")}}',
        allowConfigureFields: true,
        aliases: ['export', 'exportAttachments'],
      });
    });
  }

  getLogger(): Logger {
    const logger = this.createLogger({
      dirname: 'action-export',
      filename: '%DATE%.log',
    } as LoggerOptions);

    return logger;
  }
}

export default PluginActionExportServer;

export * from './services/base-exporter';
export * from './services/xlsx-exporter';
