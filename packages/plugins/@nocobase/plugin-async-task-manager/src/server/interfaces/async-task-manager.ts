import { Logger } from '@nocobase/logger';
import { ITask, TaskConstructor } from './task';
import { Application } from '@nocobase/server';
import { EventEmitter } from 'events';

export type TaskOptions = any;

export interface CreateTaskOptions {
  type: string;
  params: TaskOptions;
  tags?: Record<string, string>;
  title?: {
    actionType: string;
    collection: string;
    dataSource: string;
  };
  context?: any;
}

export type TaskId = string;

export type TaskStatus = PendingStatus | SuccessStatus<any> | RunningStatus | FailedStatus | CancelledStatus;

export type ProgressIndicator = 'spinner' | 'progress' | 'success' | 'error';

export interface PendingStatus {
  type: 'pending';
  indicator?: 'spinner';
}

export interface SuccessStatus<T = any> {
  type: 'success';
  indicator?: 'success';
  resultType?: 'file' | 'data';
  payload?: T;
}

export interface RunningStatus {
  type: 'running';
  indicator: 'progress';
}

export interface FailedStatus {
  type: 'failed';
  indicator?: 'error';
  errors: Array<{ message: string; code?: number }>;
}

export interface CancelledStatus {
  type: 'cancelled';
}

export interface AsyncTasksManager extends EventEmitter {
  setLogger(logger: Logger): void;
  setApp(app: Application): void;
  registerTaskType(taskType: TaskConstructor): void;
  createTask<T>(options: CreateTaskOptions): ITask;
  getTasksByTag(tagKey: string, tagValue: string): Promise<ITask[]>;
  cancelTask(taskId: TaskId): Promise<boolean>;
  getTaskStatus(taskId: TaskId): Promise<TaskStatus>;
  getTask(taskId: TaskId): ITask | undefined;
}

export class CancelError extends Error {
  constructor(message = 'Task cancelled') {
    super(message);
    this.name = 'CancelError';
  }
}
