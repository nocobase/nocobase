/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import SystemManager from '../SystemManager';

export const getConfig = async (ctx: Context, next) => {
  const systemManager = ctx.app.container.get(SystemManager.displayName) as SystemManager;
  const result = await systemManager.getConfig();
  ctx.body = result;
  await next();
};

export const setConfig = async (ctx: Context, next) => {
  const systemManager = ctx.app.container.get(SystemManager.displayName) as SystemManager;
  const { consumeMode, disableMetaOp, workflowTaskDelay, useQueueForCreateWorkflow, stopAsyncTask } = ctx.action.params;
  await systemManager.setConfig({
    consumeMode,
    disableMetaOp,
    workflowTaskDelay,
    useQueueForCreateWorkflow,
    stopAsyncTask,
  });
  ctx.body = {
    success: true,
  };
  await next();
};
