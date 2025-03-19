import fs from 'fs';
import { basename } from 'path';
export default {
  name: 'asyncTasks',
  actions: {
    async get(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const taskManager = ctx.app.container.get('AsyncTaskManager');
      const taskStatus = await taskManager.getTaskStatus(filterByTk);

      ctx.body = taskStatus;
      await next();
    },
    async fetchFile(ctx, next) {
      const { filterByTk } = ctx.action.params;
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

      ctx.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${basename(filePath)}`,
      });

      await next();
    },
  },
};
