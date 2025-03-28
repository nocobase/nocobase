/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { throttle } from 'lodash';
import { BaseTaskManager } from './base-task-manager';
import { CommandTaskType } from './command-task-type';
import { AsyncTasksManager } from './interfaces/async-task-manager';
import asyncTasksResource from './resourcers/async-tasks';

export class PluginAsyncExportServer extends Plugin {
  private progressThrottles: Map<string, Function> = new Map();

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
    this.app.acl.allow('asyncTasks', ['list', 'get', 'fetchFile', 'cancel'], 'loggedIn');
  }

  getThrottledProgressEmitter(taskId: string, userId: string) {
    if (!this.progressThrottles.has(taskId)) {
      this.progressThrottles.set(
        taskId,
        throttle(
          (progress: any) => {
            this.app.emit('ws:sendToTag', {
              tagKey: 'userId',
              tagValue: userId,
              message: {
                type: 'async-tasks:progress',
                payload: {
                  taskId,
                  progress,
                },
              },
            });
          },
          500,
          { leading: true, trailing: true },
        ),
      );
    }
    return this.progressThrottles.get(taskId);
  }

  async load() {
    this.app.resourceManager.define(asyncTasksResource);
    const asyncTaskManager = this.app.container.get<AsyncTasksManager>('AsyncTaskManager');

    this.app.on(`ws:message:request:async-tasks:list`, async (message) => {
      const { tags, clientId } = message;

      this.app.logger.info(`Received request for async tasks with tags: ${JSON.stringify(tags)}`);

      const userTag = tags?.find((tag) => tag.startsWith('userId#'));
      const userId = userTag ? userTag.split('#')[1] : null;

      if (userId) {
        this.app.logger.info(`Fetching tasks for userId: ${userId}`);

        const tasks = await asyncTaskManager.getTasksByTag('userId', userId);

        this.app.logger.info(`Found ${tasks.length} tasks for userId: ${userId}`);

        this.app.emit('ws:sendToClient', {
          clientId,
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
        const throttledEmit = this.getThrottledProgressEmitter(task.taskId, userId);
        throttledEmit(progress);
      }
    });

    asyncTaskManager.on('taskStatusChange', ({ task, status }) => {
      const userId = task.tags['userId'];
      if (!userId) return;

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

      if (status.type !== 'running' && status.type !== 'pending') {
        const throttled = this.progressThrottles.get(task.taskId);
        if (throttled) {
          // @ts-ignore
          throttled.cancel();
          this.progressThrottles.delete(task.taskId);
        }
      }

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
