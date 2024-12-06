/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValidFilter } from '@nocobase/utils';

export default async function validateFilterParams(ctx, next) {
  const { params } = ctx.action;
  const guardedActions = ['update', 'destroy'];

  const { actionName } = params;

  if (skipValidate(params)) {
    return await next();
  }

  if (emptyFilter(params) && emptyFilterByTk(params)) {
    throw new Error(`to do ${actionName} action, filter or filterByTk is required`);
  }

  if (params.filter && !isValidFilter(params.filter) && guardedActions.includes(params.actionName)) {
    throw new Error(`Invalid filter: ${JSON.stringify(params.filter)}`);
  }

  await next();
}

function emptyFilter(params) {
  return !isValidFilter(params.filter);
}

function emptyFilterByTk(params) {
  return !params.filterByTk;
}

function skipValidate(actionParams) {
  const { actionName } = actionParams;
  if (actionName === 'update') {
    return actionParams.forceUpdate;
  }

  if (actionName === 'destroy') {
    return actionParams.truncate;
  }

  return true;
}
