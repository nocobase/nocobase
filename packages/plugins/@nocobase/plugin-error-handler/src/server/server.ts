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
import { ErrorHandler } from './error-handler';

function titleKey(title: string) {
  return /{{\s*t\(\s*(['"`])([^'"`]+)\1\s*\)\s*}}/.exec(title)?.[2] || title;
}

function findConstraintField(collection: Collection, path: string, unique: boolean) {
  const findField = (name: string) => collection.getField(name) || collection.findField((f) => f.columnName() === name);
  const field = findField(path);
  if (field || !unique) {
    return field;
  }

  // Sequelize v6 keeps generated index names (including shortened names) in _indexes.
  const model = collection.model as typeof collection.model & { _indexes?: typeof collection.model.options.indexes };
  const index = model._indexes?.find((index) => index.unique && index.name === path);
  if (index?.fields?.length === 1) {
    const [column] = index.fields;
    if (typeof column === 'string') {
      return findField(column);
    }
    if ('name' in column) {
      return findField(column.name);
    }
  }
}

export class PluginErrorHandlerServer extends Plugin {
  errorHandler: ErrorHandler = new ErrorHandler();
  i18nNs = 'error-handler';

  beforeLoad() {
    this.registerSequelizeValidationErrorHandler();
    this.registerSQLErrorHandler();
  }

  registerSequelizeValidationErrorHandler() {
    this.errorHandler.register(
      (err) =>
        err?.errors?.length &&
        (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError'),
      (err, ctx) => {
        ctx.body = {
          errors: err.errors.map((item) => {
            const t = ctx.i18n.t;
            const collection: Collection | undefined = item.instance?.constructor.collection;
            const unique = item.type === 'unique violation';
            const constraint = unique || item.type === 'notNull Violation' || item.type === 'notNull violation';
            const titles = { ns: ['lm-collections', 'client'] };
            const collectionTitle = collection && t(titleKey(collection.options.title || collection.name), titles);
            const field =
              constraint && collection && item.path
                ? findConstraintField(collection, item.path, unique)
                : collection?.getField(item.path);

            if (unique && !field) {
              const key = collectionTitle ? 'A record in {{collection}} already exists.' : 'A record already exists.';
              return { message: t(key, { ns: this.i18nNs, collection: collectionTitle }) };
            }

            const fieldTitle = t(titleKey(field?.options.uiSchema?.title || field?.name || item.path), titles);
            const label = constraint && collectionTitle ? `${collectionTitle}: ${fieldTitle}` : fieldTitle;
            return { message: t(item.type, { ns: this.i18nNs, field: label }) };
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
