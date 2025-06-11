/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';
import { ExecutionModel, JobModel, WorkflowModel } from '../../types';
import { MessageQueue } from './message-queue';
import { uniq } from 'lodash';
import { scheduleJob, Job } from 'node-schedule';

export type TaskData = { executionId: number; jobId?: number };

export { PRIORITY } from './message-queue';

export default class WorkflowBaseQueue extends MessageQueue {
  private cleanJob: Job = null;
  private get inTaskQueueExecutionListCacheKey() {
    return `WorkflowTaskQueue:inTaskQueueExecutionList`;
  }
  private get intervalCacheKey() {
    return `WorkflowTaskQueue:setIntervalValidateAndCleanTask`;
  }
  constructor(app: Application) {
    super(app);
    this._setupEventListeners();
  }
  private _setupEventListeners = () => {
    const reset = async () => {
      await this.cancelConsume();
      await this.cleanIntervalCache();
    };

    this.app.on('beforeStop', reset);

    this.app.on('beforeReload', reset);
  };
  getTaskLockKey = (action: string, messageId: string) => {
    return `WorkflowTaskQueue:${action}:${messageId}`;
  };
  getTaskKey = (messageId: string) => {
    return `WorkflowTaskQueue:task:${messageId}`;
  };
  getMessageId = (execution: ExecutionModel, job?: JobModel) => {
    const message = JSON.stringify({ executionId: execution?.id, jobId: job?.id });
    const messageId = this.app.queueManager.generateMessageId(message);
    return messageId;
  };
  setInTaskQueueExecutionList = async (data: number[], clean?: boolean) => {
    const existTaskIds = (await this.getInTaskQueueExecutionList()) || [];
    const result = clean ? data || [] : uniq(existTaskIds.concat(data));
    await this.app.cache.set(this.inTaskQueueExecutionListCacheKey, result);
    this.app.logger.debug('setInTaskQueueExecutionList', { clean, data: result });
  };
  getInTaskQueueExecutionList = async (): Promise<number[]> => {
    const taskIds: number[] = (await this.app.cache.get(this.inTaskQueueExecutionListCacheKey)) || [];
    this.app.logger.debug('getInTaskQueueExecutionList', { data: taskIds });
    return taskIds;
  };
  // 定期校验和清理任务 ID
  validateAndCleanTaskQueue = async () => {
    const taskIds = await this.getInTaskQueueExecutionList();

    if (!taskIds?.length) {
      return;
    }
    this.app.logger.debug(`validateAndCleanTaskQueue`);
    await this.setInTaskQueueExecutionList([], true);
  };
  // 定期执行校验和清理操作
  setIntervalValidateAndCleanTaskQueue = async () => {
    const isExist = await this.app.cache.get(this.intervalCacheKey);

    if (!isExist) {
      await this.app.cache.set(this.intervalCacheKey, true);
      const time = 10;
      if (this.cleanJob) {
        this.cleanJob.cancel();
      }

      // 使用Cron表达式定义任务的执行时间
      // "0 */10 * * * *" 表示每小时的第0、10、20、30、40、50分钟执行任务
      this.cleanJob = scheduleJob(`0 */${time} * * * *`, this.validateAndCleanTaskQueue);
    }
  };
  cleanIntervalCache = async () => {
    if (this.cleanJob) {
      this.cleanJob.cancel();
    }
    await this.app.cache.del(this.intervalCacheKey);
  };
  public async getWorkflow(id: number): Promise<WorkflowModel> {
    const workflow = await this.app.db.getRepository('workflows').findOne({
      filter: {
        id,
      },
    });
    return workflow;
  }
  public async getExecutionById(id: number): Promise<ExecutionModel> {
    const execution = await this.app.db.getRepository('executions').findOne({
      filterByTk: id,
      appends: ['workflow'],
    });
    return execution;
  }
  public async getJobById(id: number): Promise<JobModel> {
    const job = await this.app.db.getRepository('jobs').findOne({
      filter: {
        id,
      },
    });
    return job;
  }
}
