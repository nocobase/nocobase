/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginCommandError } from './plugin-command-error';
import Application from '../application';

type ErrorLevel = 'fatal' | 'silly' | 'warn';

export function getErrorLevel(e: Error): ErrorLevel {
  // @ts-ignore
  if (e.code === 'commander.unknownCommand') {
    return 'silly';
  }

  if (e instanceof PluginCommandError) {
    return 'warn';
  }

  if (e.name === 'RestoreCheckError') {
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

    let message = err.message;
    // if error has a cause, append it to the message
    if (err.cause) {
      message += `: ${err.cause.message}`;
    }

    ctx.body = {
      errors: [
        {
          message,
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
        ctx.log.error(err.message, { method: 'error-handler', err: err.stack, cause: err.cause });

        if (err.statusCode) {
          ctx.status = err.statusCode;
        }

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
  return handler;
}
