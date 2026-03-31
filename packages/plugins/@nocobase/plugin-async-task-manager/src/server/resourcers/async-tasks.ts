/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';
import fs from 'fs';
import _ from 'lodash';
import { basename } from 'path';
import { TASK_STATUS } from '../../common/constants';

export default {
  name: 'asyncTasks',
  actions: {
    async list(ctx, next) {
      ctx.action.mergeParams({
        filter: {
          createdById: ctx.auth.user.id,
        },
        blacklist: ['params'],
      });
      await actions.list(ctx, next);
    },
    async get(ctx, next) {
      ctx.action.mergeParams({
        filter: {
          createdById: ctx.auth.user.id,
        },
      });
      await actions.get(ctx, next);
    },
    async stop(ctx: Context, next) {
      const { filterByTk } = ctx.action.params;
      const userId = ctx.auth.user.id;
      const TaskRepo = ctx.app.db.getRepository('asyncTasks');
      const task = await TaskRepo.findOne({
        where: {
          id: filterByTk,
          createdById: userId,
        },
      });

      if (!task) {
        return ctx.throw(404, 'Task not found');
      }

      if (!task.cancelable) {
        return ctx.throw(400, 'Task cannot be canceled');
      }

      const taskManager = ctx.app.container.get('AsyncTaskManager');
      await taskManager.cancelTask(task.id);

      ctx.status = 202;
      await next();
    },

    async fetchFile(ctx, next) {
      const { filterByTk, filename } = ctx.action.params;
      const userId = ctx.auth.user.id;
      const TaskRepo = ctx.app.db.getRepository('asyncTasks');
      const task = await TaskRepo.findOne({
        where: {
          id: filterByTk,
          createdById: userId,
        },
      });

      if (!task) {
        return ctx.throw(404, 'Task not found');
      }

      if (task.status !== TASK_STATUS.SUCCEEDED) {
        return ctx.throw(400, 'Task is not success status');
      }

      const { filePath } = task.result || {};

      if (!filePath) {
        return ctx.throw(400, 'not a file task');
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
