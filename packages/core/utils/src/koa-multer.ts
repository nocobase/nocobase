/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import originalMulter from 'multer';

function multer(options?) {
  const m = originalMulter(options) as any;

  makePromise(m, 'any');
  makePromise(m, 'array');
  makePromise(m, 'fields');
  makePromise(m, 'none');
  makePromise(m, 'single');

  return m;
}

function makePromise(multer, name) {
  if (!multer[name]) return;

  const fn = multer[name];

  multer[name] = function (...args) {
    const middleware: any = Reflect.apply(fn, this, args);

    return async (ctx, next) => {
      await new Promise((resolve, reject) => {
        middleware(ctx.req, ctx.res, (err) => {
          if (err) return reject(err);
          if ('request' in ctx) {
            if (ctx.req.body) {
              ctx.request.body = ctx.req.body;
              delete ctx.req.body;
            }

            if (ctx.req.file) {
              ctx.request.file = ctx.req.file;
              ctx.file = ctx.req.file;
              delete ctx.req.file;
            }

            if (ctx.req.files) {
              ctx.request.files = ctx.req.files;
              ctx.files = ctx.req.files;
              delete ctx.req.files;
            }
          }

          resolve(ctx);
        });
      });

      return next();
    };
  };
}

multer.diskStorage = originalMulter.diskStorage;
multer.memoryStorage = originalMulter.memoryStorage;

export { multer as koaMulter };
