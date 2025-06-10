/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class ErrorHandler {
  handlers = [];

  register(guard: (err) => boolean, render: (err, ctx) => void) {
    this.handlers.push({
      guard,
      render,
    });
  }

  defaultHandler(err, ctx) {
    ctx.status = err.statusCode || err.status || 500;

    let message = err.message;
    // if error has a cause, append it to the message
    if (err.cause) {
      message += `: ${err.cause.message}`;
    }

    const errorData: { message: string; code: string; title?: string } = {
      message,
      code: err.code,
    };

    if (err?.title) {
      errorData.title = err.title;
    }
    ctx.body = {
      errors: [errorData],
    };
  }

  renderError(err, ctx) {
    for (const handler of this.handlers) {
      if (handler.guard(err)) {
        return handler.render(err, ctx);
      }
    }

    this.defaultHandler(err, ctx);
  }

  middleware() {
    const self = this;
    return async function errorHandler(ctx, next) {
      try {
        await next();
      } catch (err) {
        ctx.log.error(err.message, { method: 'error-handler', err: err.stack, cause: err.cause });

        if (err.statusCode) {
          ctx.status = err.statusCode;
        }

        self.renderError(err, ctx);
      }
    };
  }
}
