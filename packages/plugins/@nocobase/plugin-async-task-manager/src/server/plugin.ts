import { Plugin } from '@nocobase/server';
import { BaseTaskManager } from './base-task-manager';
import { AsyncTasksManager } from './interfaces/async-task-manager';
import { CommandTaskType } from './command-task-type';
import asyncTasksResource from './resourcers/async-tasks';

export class PluginAsyncExportServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.container.register('AsyncTaskManager', () => {
      const manager = new BaseTaskManager();
      // @ts-ignore
      manager.setLogger(this.app.logger);
      manager.setApp(this.app);
      return manager;
    });

    this.app.container.get<AsyncTasksManager>('AsyncTaskManager').registerTaskType(CommandTaskType);

    this.app.acl.allow('asyncTasks', ['get', 'fetchFile'], 'loggedIn');
  }

  async load() {
    this.app.resourceManager.define(asyncTasksResource);

    const asyncTaskManager = this.app.container.get<AsyncTasksManager>('AsyncTaskManager');

    this.app.on(`ws:message:request:async-tasks:list`, async (message) => {
      const { tags } = message;

      this.app.logger.info(`Received request for async tasks with tags: ${JSON.stringify(tags)}`);

      const userTag = tags?.find((tag) => tag.startsWith('userId#'));
      const userId = userTag ? userTag.split('#')[1] : null;

      if (userId) {
        this.app.logger.info(`Fetching tasks for userId: ${userId}`);

        const tasks = await asyncTaskManager.getTasksByTag('userId', userId);

        this.app.logger.info(`Found ${tasks.length} tasks for userId: ${userId}`);

        this.app.emit('ws:sendToTag', {
          tagKey: 'userId',
          tagValue: userId,
          message: {
            type: 'async-tasks',
            payload: tasks.map((task) => task.toJSON()),
          },
        });
      } else {
        this.app.logger.warn(`No userId found in message tags: ${JSON.stringify(tags)}`);
      }
    });

    asyncTaskManager.on('taskCreated', ({ task }) => {
      const userId = task.tags['userId'];
      if (userId) {
        this.app.emit('ws:sendToTag', {
          tagKey: 'userId',
          tagValue: userId,
          message: {
            type: 'async-tasks:created',
            payload: task.toJSON(),
          },
        });
      }
    });

    asyncTaskManager.on('taskProgress', ({ task, progress }) => {
      const userId = task.tags['userId'];
      if (userId) {
        this.app.emit('ws:sendToTag', {
          tagKey: 'userId',
          tagValue: userId,
          message: {
            type: 'async-tasks:progress',
            payload: {
              taskId: task.taskId,
              progress,
            },
          },
        });
      }
    });

    asyncTaskManager.on('taskStatusChange', ({ task, status }) => {
      const userId = task.tags['userId'];
      if (userId) {
        this.app.emit('ws:sendToTag', {
          tagKey: 'userId',
          tagValue: userId,
          message: {
            type: 'async-tasks:status',
            payload: {
              taskId: task.taskId,
              status: task.toJSON().status,
            },
          },
        });
      }
    });

    asyncTaskManager.on('taskStatusChange', ({ status }) => {
      if (status.type === 'success') {
        this.app.emit('workflow:dispatch');
      }
    });

    this.app.on('ws:message:request:async-tasks:cancel', async (message) => {
      const { payload, tags } = message;
      const { taskId } = payload;

      const userTag = tags?.find((tag) => tag.startsWith('userId#'));
      const userId = userTag ? userTag.split('#')[1] : null;

      if (userId) {
        const task = asyncTaskManager.getTask(taskId);

        if (task.tags['userId'] != userId) {
          return;
        }

        const cancelled = await asyncTaskManager.cancelTask(taskId);

        if (cancelled) {
          this.app.emit('ws:sendToTag', {
            tagKey: 'userId',
            tagValue: userId,
            message: {
              type: 'async-tasks:cancelled',
              payload: { taskId },
            },
          });
        }
      }
    });
  }
}

export default PluginAsyncExportServer;
