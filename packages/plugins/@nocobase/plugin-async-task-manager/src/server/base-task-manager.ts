/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { throttle, DebouncedFunc } from 'lodash';

import { Application } from '@nocobase/server';
import { Logger } from '@nocobase/logger';

import { AsyncTasksManager, CreateTaskOptions } from './interfaces/async-task-manager';
import { ITask, TaskConstructor, TaskModel } from './interfaces/task';
import { TaskId, TaskStatus } from '../common/types';
import { TASK_STATUS } from '../common/constants';
import { randomUUID } from 'crypto';
import { TaskType } from './task-type';
import PluginAsyncTaskManagerServer from './plugin';
import { Model } from '@nocobase/database';

const WORKER_JOB_ASYNC_TASK_PROCESS = 'async-task:process';

type QueueMessage = {
  id: string;
};

export class BaseTaskManager implements AsyncTasksManager {
  private taskTypes: Map<string, TaskConstructor> = new Map();

  private tasks: Map<TaskId, ITask> = new Map();

  // Clean up completed tasks after 30 minutes by default
  private readonly cleanupDelay = 30 * 60 * 1000;

  private cleanupTimer: NodeJS.Timeout;

  private logger: Logger;

  private app: Application;

  private progressThrottles: Map<string, DebouncedFunc<(...args: any[]) => any>> = new Map();

  concurrency: number = process.env.ASYNC_TASK_MAX_CONCURRENCY
    ? Number.parseInt(process.env.ASYNC_TASK_MAX_CONCURRENCY, 10)
    : 3;

  private idle = () => {
    return this.app.serving(WORKER_JOB_ASYNC_TASK_PROCESS) && this.tasks.size < this.concurrency;
  };

  private onQueueTask = async ({ id }: QueueMessage) => {
    const task = await this.prepareTask(id);
    await this.runTask(task);
  };

  private onTaskProgress = (item: TaskModel) => {
    const userId = item.createdById;
    this.logger.trace(`Task ${item.id} of user(${userId}) progress: ${item.progressCurrent} / ${item.progressTotal}`);
    if (userId) {
      const throttledEmit = this.getThrottledProgressEmitter(item.id, userId);
      throttledEmit(item);
    }
  };

  private onTaskAfterCreate = (task) => {
    const userId = task.createdById;
    if (userId) {
      this.app.emit('ws:sendToUser', {
        userId,
        message: {
          type: 'async-tasks:created',
          payload: task.toJSON(),
        },
      });
    }
  };

  private onTaskStatusChanged = (task) => {
    if (!task.changed('status')) return;

    const userId = task.createdById;
    if (!userId) return;

    this.app.emit('ws:sendToUser', {
      userId,
      message: {
        type: 'async-tasks:status',
        payload: {
          taskId: task.id,
          status: task.status,
        },
      },
    });

    if ([TASK_STATUS.RUNNING, TASK_STATUS.PENDING].includes(task.status)) {
      const throttled = this.progressThrottles.get(task.id);
      if (throttled) {
        throttled.cancel();
        this.progressThrottles.delete(task.id);
      }
    }

    if (task.doneAt) {
      this.progressThrottles.delete(task.id);
      this.tasks.delete(task.id);
    }

    if (task.status === TASK_STATUS.SUCCEEDED) {
      this.app.emit('workflow:dispatch');
    }
  };

  private onTaskAfterDelete = (task) => {
    this.tasks.delete(task.id);
    this.progressThrottles.delete(task.id);
    const userId = task.createdById;
    if (userId) {
      this.app.emit('ws:sendToUser', {
        userId,
        message: {
          type: 'async-tasks:deleted',
          payload: { id: task.id },
        },
      });
    }
  };

  private onTaskCancelSignal = async (data) => {
    return this.cancelTask(data.id, true);
  };

  private cleanup = async () => {
    this.logger.debug('Running cleanup for completed tasks...');
    const TaskRepo = this.app.db.getRepository('asyncTasks');
    const tasksToCleanup = await TaskRepo.find({
      fields: ['id'],
      filter: {
        $or: [
          {
            status: [TASK_STATUS.SUCCEEDED, TASK_STATUS.FAILED],
            doneAt: {
              $lt: new Date(Date.now() - this.cleanupDelay),
            },
          },
          {
            status: TASK_STATUS.CANCELED,
          },
        ],
      },
    });

    this.logger.debug(`Found ${tasksToCleanup.length} tasks to cleanup`);

    for (const task of tasksToCleanup) {
      this.tasks.delete(task.id);
      this.progressThrottles.delete(task.id);
    }

    await TaskRepo.destroy({
      filterByTk: tasksToCleanup.map((task) => task.id),
      individualHooks: true,
    });
  };

  private getThrottledProgressEmitter(taskId: string, userId: number) {
    if (!this.progressThrottles.has(taskId)) {
      this.progressThrottles.set(
        taskId,
        throttle(
          (record: Model) => {
            this.app.emit('ws:sendToUser', {
              userId,
              message: {
                type: 'async-tasks:progress',
                payload: record.toJSON(),
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

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setApp(app: Application): void {
    this.app = app;
    const plugin = this.app.pm.get(PluginAsyncTaskManagerServer) as PluginAsyncTaskManagerServer;

    this.app.on('afterLoad', () => {
      this.app.eventQueue.subscribe(`${plugin.name}.task`, {
        idle: this.idle,
        process: this.onQueueTask,
        concurrency: this.concurrency,
      });
      this.app.pubSubManager.subscribe(`${plugin.name}.task.cancel`, this.onTaskCancelSignal);

      if (!this.cleanupTimer) {
        this.cleanupTimer = setInterval(this.cleanup, 60 * 1000); // Cleanup every minute
      }
    });

    this.app.on('beforeStop', () => {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
    });

    this.app.db.on('asyncTasks.afterCreate', this.onTaskAfterCreate);
    this.app.db.on('asyncTasks.afterUpdate', this.onTaskStatusChanged);
    this.app.db.on('asyncTasks.afterDestroy', this.onTaskAfterDelete);
  }

  private enqueueTask(task: ITask, queueOptions): void {
    const plugin = this.app.pm.get(PluginAsyncTaskManagerServer) as PluginAsyncTaskManagerServer;
    this.app.eventQueue.publish(`${plugin.name}.task`, { id: task.record.id }, queueOptions);
  }

  async cancelTask(taskId: TaskId, externally = false): Promise<void> {
    const task = this.tasks.get(taskId);

    if (task) {
      this.logger.info(`Cancelling task ${taskId}, type: ${task.constructor.name}`);
      this.progressThrottles.delete(taskId);
      task.cancel();
      await task.record.update({
        status: TASK_STATUS.CANCELED,
        doneAt: new Date(),
      });
    } else {
      if (externally) {
        this.logger.info(`Task ${taskId} not found on this instance, skip`);
        return;
      }
      this.logger.warn(`Task ${taskId} not found on this instance, broadcasting to other instances...`);
      const plugin = this.app.pm.get(PluginAsyncTaskManagerServer) as PluginAsyncTaskManagerServer;
      this.app.pubSubManager.publish(`${plugin.name}.task.cancel`, { id: taskId }, { skipSelf: true });
      const TaskRepo = this.app.db.getRepository('asyncTasks');
      await TaskRepo.update({
        filterByTk: taskId,
        values: {
          status: TASK_STATUS.CANCELED,
          doneAt: new Date(),
        },
      });
    }
  }

  async createTask(data: TaskModel, { useQueue, ...options }: CreateTaskOptions = {}): Promise<ITask> {
    const taskType = this.taskTypes.get(data.type) as unknown as typeof TaskType;

    if (!taskType) {
      this.logger.error(`Task type not found: ${data.type}, params: ${JSON.stringify(data.params)}`);
      throw new Error(`Task type ${data.type} not found`);
    }

    const values = taskType.defaults({
      id: randomUUID(),
      status: TASK_STATUS.PENDING,
      ...data,
    });

    const DBTaskModel = this.app.db.getModel('asyncTasks');
    const record = (await DBTaskModel.create(values, options)) as TaskModel;

    this.logger.debug(`Creating task of type: ${data.type}`);
    this.logger.debug(`Task data: ${JSON.stringify(data)}`);
    const task = new taskType(record);

    this.logger.info(`New task of type: ${data.type} created as ${record.id}`);
    if (useQueue) {
      this.logger.debug(`New task ${record.id} will be sent to queue for processing`);
      const queueOptions = typeof useQueue === 'object' ? useQueue : {};
      this.enqueueTask(task, queueOptions);
    }

    return task;
  }

  getTask(taskId: TaskId): ITask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.debug(`Task not found: ${taskId}`);
      return undefined;
    }
    this.logger.debug(`Retrieved task ${taskId}, type: ${task.constructor.name}, status: ${task.record.status}`);
    return task;
  }

  async getTaskStatus(taskId: TaskId): Promise<TaskStatus> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Attempted to get status of non-existent task ${taskId}`);
      throw new Error(`Task ${taskId} not found`);
    }

    this.logger.debug(`Getting status for task ${taskId}, current status: ${task.record.status}`);
    return task.record.status;
  }

  registerTaskType(taskType: TaskConstructor): void {
    this.logger.debug(`Registering task type: ${taskType.type}`);
    this.taskTypes.set(taskType.type, taskType);
  }

  private async prepareTask(id): Promise<ITask> {
    const TaskRepo = this.app.db.getRepository('asyncTasks');
    const record = (await TaskRepo.findOne({
      filterByTk: id,
    })) as TaskModel;
    const taskType = this.taskTypes.get(record.type) as unknown as typeof TaskType;
    if (!taskType) {
      this.logger.error(`Task type not found: ${record.type} (#${id})`);
      throw new Error(`Task type ${record.type} not found`);
    }
    const task = new taskType(record) as ITask;
    return task;
  }

  async runTask(task: ITask): Promise<void> {
    if (task.record.status === TASK_STATUS.PENDING) {
      task.setLogger(this.logger);
      task.setApp(this.app);
      task.onProgress = this.onTaskProgress;
      this.tasks.set(task.record.id, task);
      try {
        this.logger.debug(`Starting execution of task ${task.record.id} from queue`);
        await task.run();
      } catch (error) {
        this.logger.error(`Error executing task ${task.record.id} from queue: ${error.message}`);
      } finally {
        this.tasks.delete(task.record.id);
      }
    }
  }
}
