import { Plugin } from '@nocobase/server';
import { ErrorHandler } from './error-handler';
import { BaseError } from 'sequelize';
import zhCN from './locale/zh_CN';
import enUS from './locale/en_US';

export class PluginErrorHandler extends Plugin {
  errorHandler: ErrorHandler = new ErrorHandler();
  i18nNs: string = 'error-handler';

  beforeLoad() {
    this.errorHandler.register(
      (err) => err?.errors?.length && err instanceof BaseError,
      (err, ctx) => {
        ctx.body = {
          errors: err.errors.map((err) => {
            return { message: ctx.i18n.t(err.type, { ns: this.i18nNs, field: err.path }) };
          }),
        };
        ctx.status = 400;
      },
    );
  }

  async load() {
    this.app.i18n.addResources('zh-CN', this.i18nNs, zhCN);
    this.app.i18n.addResources('en-US', this.i18nNs, enUS);

    this.app.middleware.unshift(this.errorHandler.middleware());
  }
}
