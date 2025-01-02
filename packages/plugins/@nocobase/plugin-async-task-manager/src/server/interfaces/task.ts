import { Logger } from '@nocobase/logger';
import { TaskStatus } from './async-task-manager';
import { EventEmitter } from 'events';
import { Application } from '@nocobase/server';

export interface ITask extends EventEmitter {
  taskId: string;
  status: TaskStatus;
  progress: {
    total: number;
    current: number;
  };
  startedAt: Date;
  fulfilledAt: Date;
  tags: Record<string, string>;
  createdAt: Date;
  title?: any;
  isCancelled: boolean;
  context?: any;
  setLogger(logger: Logger): void;
  setApp(app: Application): void;
  setContext(context: any): void;

  cancel(): Promise<boolean>;
  execute(): Promise<any>;
  reportProgress(progress: { total: number; current: number }): void;
  run(): Promise<void>;
  toJSON(options?: { raw?: boolean }): any;
}

export interface TaskConstructor {
  type: string;
  new (options: any, tags?: Record<string, string>): ITask;
}
