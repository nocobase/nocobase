/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';

import { validateLocalStorageConfig } from '../storages/local';

export async function validateStorageMiddleware(ctx: Context, next: Next) {
  const { actionName, params } = ctx.action;
  const values = params.values || {};
  let storage = values;
  const hasSubmittedDocumentRoot = Object.prototype.hasOwnProperty.call(values.options || {}, 'documentRoot');

  if (actionName === 'update' && params.filterByTk) {
    const repository = ctx.db.getRepository('storages');
    let existing = await repository.findById(params.filterByTk);
    if (!existing) {
      existing = await repository.findOne({
        filter: {
          name: params.filterByTk,
        },
      });
    }
    if (existing) {
      const existingValues = existing.toJSON();
      storage = {
        ...existingValues,
        ...values,
        options: {
          ...(existingValues.options || {}),
          ...(values.options || {}),
        },
      };
    }
  }

  try {
    validateLocalStorageConfig(storage, { validateDocumentRoot: hasSubmittedDocumentRoot });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'PATH_TRAVERSAL') {
      return ctx.throw(400, (error as Error).message);
    }
    throw error;
  }

  await next();
}
