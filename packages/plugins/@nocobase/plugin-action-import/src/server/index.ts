/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { downloadXlsxTemplate, importXlsx } from './actions';
import { importMiddleware } from './middleware';
import { ImportError, ImportValidationError } from './errors';
export class PluginActionImportServer extends Plugin {
  beforeLoad() {
    this.app.on('afterInstall', async () => {
      if (!this.app.db.getRepository('roles')) {
        return;
      }
      const roleNames = ['admin'];
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

    const errorHandlerPlugin = this.app.getPlugin<any>('error-handler');

    errorHandlerPlugin.errorHandler.register(
      (err) => err instanceof ImportValidationError,
      (err: ImportValidationError, ctx) => {
        ctx.status = 400;
        ctx.body = {
          errors: [
            {
              message: ctx.i18n.t(err.message, {
                ...err.params,
                ns: 'action-import',
              }),
            },
          ],
        };
      },
    );

    errorHandlerPlugin.errorHandler.register(
      (err) => err.name === 'ImportError',
      (err: ImportError, ctx) => {
        ctx.status = 400;
        const causeError = err.cause;
        errorHandlerPlugin.errorHandler.renderError(causeError, ctx);
        const message = ctx.i18n.t('import-error', {
          interpolation: { escapeValue: false },
          ns: 'action-import',
          rowData: JSON.stringify(err.rowData),
          rowIndex: err.rowIndex,
          causeMessage: ctx.body.errors[0].message,
        });
        ctx.body = {
          errors: [
            {
              message,
            },
          ],
        };
      },
    );
  }
}

export default PluginActionImportServer;
export * from './services/xlsx-importer';
export * from './services/template-creator';
