/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { ErrorHandler } from './error-handler';

export class PluginErrorHandlerServer extends Plugin {
  errorHandler: ErrorHandler = new ErrorHandler();
  i18nNs = 'error-handler';

  beforeLoad() {
    this.registerSequelizeValidationErrorHandler();
    this.registerSQLErrorHandler();
  }

  registerSequelizeValidationErrorHandler() {
    const findFieldTitle = (instance, path, ctx) => {
      if (!instance) {
        return path;
      }

      const model = instance.constructor;
      const dataSourceKey = ctx.get('x-data-source');
      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      const database = dataSource ? dataSource.collectionManager.db : ctx.db;

      const collection = database.modelCollection.get(model);

      if (!collection) {
        return path;
      }

      const field = collection.getField(path);
      const fieldOptions = field?.options;
      const title = lodash.get(fieldOptions, 'uiSchema.title', path);
      const re = /{{\s*t\(\s*(['"`])([^'"`]+)\1\s*\)\s*}}/g;
      const parsed = re.exec(title);
      return parsed?.[2] || title;
    };

    this.errorHandler.register(
      (err) =>
        err?.errors?.length &&
        (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError'),
      (err, ctx) => {
        ctx.body = {
          errors: err.errors.map((err) => {
            const t = ctx.i18n.t;
            const title = findFieldTitle(err.instance, err.path, ctx);
            return {
              message: t(err.type, {
                ns: this.i18nNs,
                field: t(title, { ns: ['lm-collections', 'client'] }),
              }),
            };
          }),
        };
        ctx.status = 400;
      },
    );
  }

  registerSQLErrorHandler() {
    const unwrapSqlError = (error) => {
      return error?.original?.parent ?? error?.parent ?? error?.original ?? error;
    };

    const isSqlSyntaxError = (error) => {
      const err = unwrapSqlError(error);
      if (!err) {
        return false;
      }

      const message = typeof err.message === 'string' ? err.message : '';

      // MySQL / MariaDB
      if (err?.errno === 1064) {
        return true;
      }

      // PostgreSQL
      if (err?.code === '42601') {
        return true;
      }

      // SQLite
      if (err?.code === 'SQLITE_ERROR' && /syntax error/i.test(message)) {
        return true;
      }

      return false;
    };

    const isSqlReferenceError = (error) => {
      const err = unwrapSqlError(error);
      if (!err) {
        return false;
      }

      const message = typeof err.message === 'string' ? err.message : '';

      // MySQL / MariaDB unknown table/column/ambiguous column
      if ([1054, 1051, 1146, 1052].includes(err?.errno)) {
        return true;
      }

      // PostgreSQL unknown/ambiguous column or table
      if (['42703', '42P01', '42702'].includes(err?.code)) {
        return true;
      }

      // SQLite and other engines rely on the error message content
      if (
        /(unknown column|no such column|has no column named|no such table|unknown table|ambiguous column)/i.test(
          message,
        )
      ) {
        return true;
      }

      return false;
    };

    this.errorHandler.register(
      (err) => isSqlSyntaxError(err),
      (err, ctx) => {
        ctx.body = {
          errors: [
            {
              message: 'Invalid SQL syntax',
            },
          ],
        };
        ctx.status = 500;
      },
    );

    this.errorHandler.register(
      (err) => isSqlReferenceError(err),
      (err, ctx) => {
        ctx.body = {
          errors: [
            {
              message: 'Invalid SQL column or table reference',
            },
          ],
        };
        ctx.status = 400;
      },
    );
  }

  async load() {
    this.app.use(this.errorHandler.middleware(), { after: 'i18n', tag: 'errorHandler', before: 'cors' });
  }
}
