/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import JSON5 from 'json5';
import lodash from 'lodash';
import { ErrorHandler } from './error-handler';

function titleKey(title: string) {
  return /{{\s*t\(\s*(['"`])([^'"`]+)\1\s*\)\s*}}/.exec(title)?.[2] || title;
}

function translateCollectionTitle(
  collection: Collection,
  t: (key: string, options: { ns: string | string[] }) => string,
) {
  const title = collection.options.title || collection.name;
  const defaultNs = ['lm-collections', 'client'];
  const expression = /^\s*{{\s*t\s*\(([\s\S]*)\)\s*}}\s*$/.exec(title);
  if (!expression) {
    return t(titleKey(title), { ns: defaultNs });
  }

  // Collection definitions use both JSON options and literals such as { ns: 'workflow' }.
  try {
    const [key, options] = JSON5.parse<[unknown, { ns?: unknown }?]>(`[${expression[1]}]`);
    if (typeof key === 'string') {
      const ns = options?.ns;
      const hasNamespace =
        typeof ns === 'string' || (Array.isArray(ns) && ns.every((value) => typeof value === 'string'));
      return t(key, { ns: hasNamespace ? ns : defaultNs });
    }
  } catch {
    // Older single-argument templates may use backticks.
  }
  const key = titleKey(title);
  return t(key === title ? collection.name : key, { ns: defaultNs });
}

export class PluginErrorHandlerServer extends Plugin {
  errorHandler: ErrorHandler = new ErrorHandler();
  i18nNs = 'error-handler';

  beforeLoad() {
    this.registerSequelizeValidationErrorHandler();
    this.registerSQLErrorHandler();
  }

  registerSequelizeValidationErrorHandler() {
    const findCollection = (instance, ctx): Collection | undefined => {
      if (!instance) {
        return;
      }

      const model = instance.constructor;
      const dataSourceKey = ctx.get('x-data-source');
      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      const database = dataSource ? dataSource.collectionManager.db : ctx.db;

      return database.modelCollection.get(model);
    };

    this.errorHandler.register(
      (err) =>
        err?.errors?.length &&
        (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError'),
      (err, ctx) => {
        ctx.body = {
          errors: err.errors.map((item) => {
            const t = ctx.i18n.t;
            const collection = findCollection(item.instance, ctx);
            const field = collection?.getField(item.path);
            const title = collection ? titleKey(lodash.get(field?.options, 'uiSchema.title', item.path)) : item.path;
            const message = t(item.type, {
              ns: this.i18nNs,
              field: t(title, { ns: ['lm-collections', 'client'] }),
            });
            const constraint =
              item.type === 'unique violation' ||
              item.type === 'notNull Violation' ||
              item.type === 'notNull violation';
            if (constraint && collection) {
              return { message: `${translateCollectionTitle(collection, t)}: ${message}` };
            }
            return { message };
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
