/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import _ from 'lodash';
import { basename } from 'path';

export default {
  name: 'asyncTasks',
  actions: {
    async list(ctx, next) {
      const userId = ctx.auth.user.id;
      const asyncTaskManager = ctx.app.container.get('AsyncTaskManager');
      const tasks = await asyncTaskManager.getTasksByTag('userId', userId);
      ctx.body = _.orderBy(tasks, 'createdAt', 'desc');
      await next();
    },
    async get(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const taskManager = ctx.app.container.get('AsyncTaskManager');
      const taskStatus = await taskManager.getTaskStatus(filterByTk);

      ctx.body = taskStatus;
      await next();
    },
    async cancel(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const userId = ctx.auth.user.id;
      const asyncTaskManager = ctx.app.container.get('AsyncTaskManager');

      const task = asyncTaskManager.getTask(filterByTk);

      if (!task) {
        ctx.body = 'ok';
        await next();
        return;
      }

      if (task.tags['userId'] != userId) {
        ctx.throw(403);
      }

      const cancelled = await asyncTaskManager.cancelTask(filterByTk);
      ctx.body = cancelled;
      await next();
    },
    async fetchFile(ctx, next) {
      const { filterByTk, filename } = ctx.action.params;
      const taskManager = ctx.app.container.get('AsyncTaskManager');
      const taskStatus = await taskManager.getTaskStatus(filterByTk);
      // throw error if task is not success
      if (taskStatus.type !== 'success') {
        throw new Error('Task is not success status');
      }

      const { filePath } = taskStatus.payload;

      if (!filePath) {
        throw new Error('not a file task');
      }

      // send file to client
      ctx.body = fs.createReadStream(filePath);
      // 处理文件名
      let finalFileName = filename ? filename : basename(filePath);
      finalFileName = encodeURIComponent(finalFileName); // 避免中文或特殊字符问题
      ctx.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${finalFileName}`,
      });

      await next();
    },
  },
};
