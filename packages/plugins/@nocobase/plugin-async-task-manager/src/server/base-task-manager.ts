/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventEmitter } from 'events';
import { AsyncTasksManager, CreateTaskOptions, TaskId, TaskStatus } from './interfaces/async-task-manager';
import { Logger } from '@nocobase/logger';
import { ITask, TaskConstructor } from './interfaces/task';
import { Application } from '@nocobase/server';
import PQueue from 'p-queue';

export class BaseTaskManager extends EventEmitter implements AsyncTasksManager {
  private taskTypes: Map<string, TaskConstructor> = new Map();

  private tasks: Map<TaskId, ITask> = new Map();

  // Clean up completed tasks after 30 minutes by default
  private readonly cleanupDelay = 30 * 60 * 1000;

  private logger: Logger;

  private app: Application;

  public queue: any;

  private queueOptions: {};

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  setApp(app: Application): void {
    this.app = app;
  }

  private scheduleCleanup(taskId: TaskId) {
    setTimeout(() => {
      this.tasks.delete(taskId);
      this.logger.debug(`Task ${taskId} cleaned up after ${this.cleanupDelay}ms`);
    }, this.cleanupDelay);
  }

  constructor() {
    super();
    this.queueOptions = {
      concurrency: process.env.ASYNC_TASK_MAX_CONCURRENCY ? parseInt(process.env.ASYNC_TASK_MAX_CONCURRENCY) : 3,
      autoStart: true,
    };
    this.queue = new PQueue(this.queueOptions);

    // 添加队列事件监听
    this.queue.on('idle', () => {
      this.logger.debug('Task queue is idle');
      this.emit('queueIdle');
    });

    this.queue.on('add', () => {
      this.logger.debug(`Task added to queue. Size: ${this.queue.size}, Pending: ${this.queue.pending}`);
      this.emit('queueAdd', { size: this.queue.size, pending: this.queue.pending });
    });
  }

  private enqueueTask(task: ITask): void {
    const taskHandler = async () => {
      if (task.status.type === 'pending') {
        try {
          this.logger.debug(`Starting execution of task ${task.taskId} from queue`);
          await task.run();
        } catch (error) {
          this.logger.error(`Error executing task ${task.taskId} from queue: ${error.message}`);
        }
      }
    };
    this.queue.add(taskHandler);
  }

  pauseQueue(): void {
    this.logger.info('Pausing task queue');
    this.queue.pause();
    this.emit('queuePaused');
  }

  resumeQueue(): void {
    this.logger.info('Resuming task queue');
    this.queue.start();
    this.emit('queueResumed');
  }

  async cancelTask(taskId: TaskId): Promise<boolean> {
    const task = this.tasks.get(taskId);

    if (!task) {
      this.logger.warn(`Attempted to cancel non-existent task ${taskId}`);
      return false;
    }
    this.logger.info(`Cancelling task ${taskId}, type: ${task.constructor.name}, tags: ${JSON.stringify(task.tags)}`);
    if (task.status.type === 'pending') {
      await task.statusChange({ type: 'cancelled' });
      return true;
    }
    return task.cancel();
  }

  createTask<T>(options: CreateTaskOptions): ITask {
    const taskType = this.taskTypes.get(options.type);

    if (!taskType) {
      this.logger.error(`Task type not found: ${options.type}, params: ${JSON.stringify(options.params)}`);
      throw new Error(`Task type ${options.type} not found`);
    }

    this.logger.info(
      `Creating task of type: ${options.type}, params: ${JSON.stringify(options.params)}, tags: ${JSON.stringify(
        options.tags,
      )}`,
    );
    const task = new (taskType as unknown as new (
      options: CreateTaskOptions['params'],
      tags?: Record<string, string>,
    ) => ITask)(options.params, options.tags);

    task.title = options.title;
    task.setLogger(this.logger);
    task.setApp(this.app);
    task.setContext(options.context);

    this.tasks.set(task.taskId, task);

    this.logger.info(
      `Created new task ${task.taskId} of type ${options.type}, params: ${JSON.stringify(
        options.params,
      )}, tags: ${JSON.stringify(options.tags)}, title: ${task.title}`,
    );
    this.emit('taskCreated', { task });
    if (options.useQueue) {
      this.enqueueTask(task);
    }
    task.on('progress', (progress) => {
      this.logger.debug(`Task ${task.taskId} progress: ${progress}`);
      this.emit('taskProgress', { task, progress });
    });

    task.on('statusChange', (status) => {
      if (['success', 'failed'].includes(status.type)) {
        this.scheduleCleanup(task.taskId);
      } else if (status.type === 'cancelled') {
        // Remove task immediately when cancelled
        this.tasks.delete(task.taskId);
      }
      this.emit('taskStatusChange', { task, status });
    });
    return task;
  }

  getTask(taskId: TaskId): ITask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.debug(`Task not found: ${taskId}`);
      return undefined;
    }
    this.logger.debug(`Retrieved task ${taskId}, type: ${task.constructor.name}, status: ${task.status.type}`);
    return task;
  }

  async getTaskStatus(taskId: TaskId): Promise<TaskStatus> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn(`Attempted to get status of non-existent task ${taskId}`);
      throw new Error(`Task ${taskId} not found`);
    }

    this.logger.debug(`Getting status for task ${taskId}, current status: ${task.status.type}`);
    return task.status;
  }

  registerTaskType(taskType: TaskConstructor): void {
    this.logger.debug(`Registering task type: ${taskType.type}`);
    this.taskTypes.set(taskType.type, taskType);
  }

  async getTasksByTag(tagKey: string, tagValue: string): Promise<ITask[]> {
    this.logger.debug(`Getting tasks by tag - key: ${tagKey}, value: ${tagValue}`);
    const tasks = Array.from(this.tasks.values()).filter((task) => {
      return task.tags[tagKey] == tagValue;
    });
    this.logger.debug(`Found ${tasks.length} tasks with tag ${tagKey}=${tagValue}`);
    return tasks;
  }
}
