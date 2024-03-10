import { Schema } from '@formily/json-schema';
import lodash from 'lodash';
import { BaseError } from '@nocobase/database';
import { ErrorHandler } from '@nocobase/server';

export function registerSequelizeValidationErrorHandler(errorHandler: ErrorHandler) {
  const findFieldTitle = (instance, path, ctx) => {
    if (!instance) {
      return path;
    }

    const model = instance.constructor;
    const collection = ctx.app.db.modelCollection.get(model);
    const field = collection.getField(path);
    const fieldOptions = Schema.compile(field?.options, { t: ctx.i18n.t });
    const title = lodash.get(fieldOptions, 'uiSchema.title', path);
    return title;
  };

  errorHandler.register(
    (err) => err?.errors?.length && err instanceof BaseError,
    (err, ctx) => {
      ctx.body = {
        errors: err.errors.map((err) => {
          return {
            message: ctx.i18n.t(err.type, {
              ns: 'error-handler',
              field: findFieldTitle(err.instance, err.path, ctx),
            }),
          };
        }),
      };

      ctx.status = 400;
    },
  );
}
