/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { BaseError } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import lodash from 'lodash';
import { ErrorHandler } from './error-handler';

export class PluginErrorHandlerServer extends Plugin {
  errorHandler: ErrorHandler = new ErrorHandler();
  i18nNs = 'error-handler';

  beforeLoad() {
    this.registerSequelizeValidationErrorHandler();
  }

  registerSequelizeValidationErrorHandler() {
    const findFieldTitle = (instance, path, tFunc, ctx) => {
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
      const fieldOptions = Schema.compile(field?.options, { t: tFunc });
      const title = lodash.get(fieldOptions, 'uiSchema.title', path);
      return title;
    };

    this.errorHandler.register(
      (err) => err?.errors?.length && err instanceof BaseError,
      (err, ctx) => {
        ctx.body = {
          errors: err.errors.map((err) => {
            const t = ctx.i18n.t;
            const title = findFieldTitle(err.instance, err.path, t, ctx);
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

  async load() {
    this.app.use(this.errorHandler.middleware(), { after: 'i18n', tag: 'errorHandler', before: 'cors' });
  }
}
