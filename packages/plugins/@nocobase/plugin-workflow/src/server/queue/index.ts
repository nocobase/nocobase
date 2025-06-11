/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';

import type { ExecutionModel, JobModel, WorkflowModel } from '../types';
import type { EventOptions } from '../Plugin';
import { SYSTEM_MANAGEMENT_CONFIG_CHNAGE_EVENT } from './constants';
import { Transactionable } from 'sequelize';
import WorkflowBaseQueue, { PRIORITY } from './base-queue';
import { sleep } from '../utils';

enum CONSUME_MODE {
  TASK = 'task',
  APP = 'app',
  BOTH = 'both',
  NONE = 'none',
}

enum TASK_TYPE {
  CREATE = 'create',
  CONSUME = 'consume',
}

type CreateExecution = (workflow: WorkflowModel, context, options: EventOptions) => Promise<ExecutionModel | null>;
type ConsumeExecution = (execution: ExecutionModel, job?: JobModel) => Promise<void>;

type InitOptions = {
  createExecution: CreateExecution;
  consumeExecution: ConsumeExecution;
};

export default class WorkflowTaskQueue extends WorkflowBaseQueue {
  private options: InitOptions;
  public consumeMode: CONSUME_MODE = CONSUME_MODE.TASK;
  public workflowTaskDelay = 200;
  public useQueueForCreateWorkflow = false;
  public isConsumer = false;
  public isProducer = false;
  private _ready = false;
  get isReady() {
    return this.isConnected && this._ready;
  }
  constructor(app: Application) {
    super(app);
    this.isConsumer = app.isTaskWorker;
    this.isProducer = !app.isTaskWorker;
    this.setupEventListeners();
  }
  public init = async (options: InitOptions) => {
    this.options = options;
    // 初始化系统配置
    await this.initializeConsumeSettings();
    // 初始化队列
    await this.createQueue();
    await this.consumeTaskQueue();
    await this.setIntervalValidateAndCleanTaskQueue();

    this._ready = true;
  };
  private setupEventListeners = () => {
    // 系统管理配置变更事件
    this.app.on(SYSTEM_MANAGEMENT_CONFIG_CHNAGE_EVENT, async (config) => {
      const { consumeMode, workflowTaskDelay, useQueueForCreateWorkflow } = config;
      this.workflowTaskDelay = Number(workflowTaskDelay);
      this.useQueueForCreateWorkflow = !!useQueueForCreateWorkflow;
      this.app.logger.info('system management config change', {
        config,
      });

      if (this.consumeMode !== consumeMode) {
        this.consumeMode = consumeMode;
        this.calculateRoles();
        this.app.logger.info('consumeMode change', {
          consumeMode,
          isConsumer: this.isConsumer,
          isProducer: this.isProducer,
        });
        if (this.isConsumer) {
          await this.consumeTaskQueue();
        } else {
          await this.cancelConsume();
        }
      }
    });

    this.app.on('beforeStop', async () => {
      this._ready = false;
    });

    this.app.on('beforeReload', async () => {
      this._ready = false;
    });
  };
  // 计算角色
  private calculateRoles = () => {
    // app服务始终都会是
    const modeMapping = {
      none: { isConsumer: false }, // app、task均不消费
      task: { isConsumer: this.app.isTaskWorker }, // 仅task消费
      app: { isConsumer: !this.app.isTaskWorker }, // 仅app消费
      both: { isConsumer: true }, // app、task都消费
    };

    const roles = modeMapping[this.consumeMode] || modeMapping.none;
    this.isConsumer = roles.isConsumer;
  };
  // 初始化系统配置
  private initializeConsumeSettings = async () => {
    try {
      const systemManager = this.app.container.get('NocobaseSystemManager') as any;
      const { consumeMode, workflowTaskDelay, useQueueForCreateWorkflow } = await systemManager.getConfig();
      this.consumeMode = consumeMode || this.consumeMode;
      this.useQueueForCreateWorkflow = !!useQueueForCreateWorkflow;
      this.workflowTaskDelay = Number(workflowTaskDelay) || this.workflowTaskDelay;
      this.calculateRoles();
      this.app.logger.info(`init consumeMode`, {
        consumeMode: this.consumeMode,
        workflowTaskDelay: this.workflowTaskDelay,
        isConsumer: this.isConsumer,
        isProducer: this.isProducer,
      });
    } catch (error) {
      this.app.logger.error(`initializeConsumeSettings error`, error);
    }
  };
  // 添加创建任务至队列
  public addCreateTask2Queue = async (workflow: WorkflowModel, context, options: EventOptions) => {
    const data = {
      type: TASK_TYPE.CREATE,
      payload: { workflowId: workflow.id, context, options },
    };
    const message = JSON.stringify(data);

    this.app.logger.info(`addCreateTask2Queue, workflow: ${workflow.id}`, {
      payload: { workflowId: workflow.id, context, options },
    });
    if (options?.eventKey) {
      // 这里不用eventKey，因为执行 createExecution 时加锁用的是eventKey
      const messageId = this.app.queueManager.generateMessageId(message);
      const lockKey = this.getTaskLockKey('addCreateTask2Queue', messageId);
      this.app.lockManager.runExclusive(lockKey, async () => {
        await this.sendMessage(message, PRIORITY.HIGH);
      });
    } else {
      await this.sendMessage(message, PRIORITY.HIGH);
    }
  };
  // 添加消费工作任务至队列
  public addConsumeTask2Queue = async (
    execution: ExecutionModel,
    job?: JobModel,
    options: Transactionable & { priority?: PRIORITY } = {},
  ) => {
    this.app.logger.info(
      `to addConsumeTask2Queue, workflow: ${execution?.workflowId} execution: ${execution?.id} job: ${job?.id}`,
    );
    const messageId = this.getMessageId(execution, job);
    const lockKey = this.getTaskLockKey('addConsumeTask2Queue', messageId);
    const taskKey = this.getTaskKey(messageId);
    const ttl = 1000 * 60 * 10;

    // 加锁，防止重复添加任务
    await this.app.lockManager.runExclusive(
      lockKey,
      async () => {
        // 检查任务是否已经存在
        const taskExists = await this.app.cache.get(taskKey);
        if (taskExists) {
          this.app.logger.info(`task already exists for workflow: ${execution.workflowId} execution: ${execution.id}`);
          return;
        }
        // 设置任务锁
        await this.app.cache.set(taskKey, true);
        await this.setInTaskQueueExecutionList([execution.id]);

        const data = {
          type: TASK_TYPE.CONSUME,
          payload: { executionId: execution.id, jobId: job?.id },
        };

        this.app.logger.info(
          `addConsumeTask2Queue: ${messageId} workflow: ${execution.workflowId} execution: ${execution.id}`,
          {
            data,
          },
        );
        const message = JSON.stringify(data);
        const priority = options.priority || PRIORITY.MEDIUM;
        await this.sendMessage(message, priority);
      },
      ttl,
    );
  };
  // 消费任务队列
  public consumeTaskQueue = async () => {
    // 只有 消费者 服务才消费消息
    if (!this.isConsumer) {
      return;
    }

    await this.cancelConsume();

    await this.consumeMessage(async (message) => {
      try {
        const data = JSON.parse(message);
        const { type, payload } = data;
        if (type === TASK_TYPE.CREATE) {
          const { workflowId, context, options } = payload;
          const workflow = await this.getWorkflow(workflowId);
          const execution = await this.options.createExecution(workflow, context, options);
          // 创建任务后，添加消费任务至队列
          await this.addConsumeTask2Queue(execution, null, { priority: PRIORITY.LOW });
        } else if (type === TASK_TYPE.CONSUME) {
          const { executionId, jobId } = payload;
          const execution = await this.getExecutionById(Number(executionId));
          const job = jobId ? await this.getJobById(Number(jobId)) : null;

          try {
            await this.options.consumeExecution(execution, job);
          } finally {
            const messageId = this.getMessageId(execution, job);
            const taskKey = this.getTaskKey(messageId);

            // 延迟删除锁，避免高并发下重复添加任务
            await sleep(1000);
            await this.app.cache.del(taskKey);
          }
        }
      } catch (error) {
        this.app.logger.error(error);
      }
    });
  };
  isMessageSizeExceedingLimit = (message: string) => {
    const size = this.app.queueManager.getMessageSize(message); // 消息大小 KB
    const MAX_LIMIT = process.env.RABBITMQ_MESSAGE_SIZE_LIMIT ? Number(process.env.RABBITMQ_MESSAGE_SIZE_LIMIT) : 30; // 默认30kb
    if (size > MAX_LIMIT) {
      this.app.logger.warn(`Message size exceeds ${MAX_LIMIT}KB, size: ${size} KB`);
    }
    return size > MAX_LIMIT;
  };
}
