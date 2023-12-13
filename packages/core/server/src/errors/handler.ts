import { Schema } from '@formily/json-schema';
import { BaseError } from '@nocobase/database';
import { PluginCommandError } from './plugin-command-error';
import lodash from 'lodash';
import Application from '../application';
import zhCN from './locale/zh_CN.json';
import enUS from './locale/en_US.json';

type ErrorLevel = 'fatal' | 'silly' | 'warn';

export function getErrorLevel(e: Error): ErrorLevel {
  // @ts-ignore
  if (e.code === 'commander.unknownCommand') {
    return 'silly';
  }

  if (e instanceof PluginCommandError) {
    return 'warn';
  }

  return 'fatal';
}

export class ErrorHandler {
  handlers = [];

  constructor() {}

  register(guard: (err) => boolean, render: (err, ctx) => void) {
    this.handlers.push({
      guard,
      render,
    });
  }

  defaultHandler(err, ctx) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      errors: [
        {
          message: err.message,
          code: err.code,
        },
      ],
    };
  }

  middleware() {
    const self = this;
    return async function errorHandler(ctx, next) {
      try {
        await next();
      } catch (err) {
        ctx.log.error(err);

        for (const handler of self.handlers) {
          if (handler.guard(err)) {
            return handler.render(err, ctx);
          }
        }

        self.defaultHandler(err, ctx);
      }
    };
  }
}

export function createErrorHandler(app: Application) {
  const handler = new ErrorHandler();

  registerSequelizeValidationErrorHandler(handler);

  app.i18n.addResources('zh-CN', 'error-handler', zhCN);
  app.i18n.addResources('en-US', 'error-handler', enUS);

  return handler;
}

function registerSequelizeValidationErrorHandler(errorHandler: ErrorHandler) {
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
