/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AsyncTasksManager, CancelError } from '../interfaces/async-task-manager';
import { createMockServer, sleep } from '@nocobase/test';
import { TaskType } from '../task-type';
import { TASK_STATUS } from '../../common/constants';

describe('task manager', () => {
  let taskManager: AsyncTasksManager;

  let app;
  let root;
  let rootAgent;
  let userContext;
  let TaskRepo;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'async-task-manager'],
    });

    taskManager = app.container.get('AsyncTaskManager');
    const UserRepo = app.db.getRepository('users');
    root = await UserRepo.findOne();
    rootAgent = await app.agent().login(root);
    userContext = {
      state: {
        user: root,
      },
    };
    TaskRepo = app.db.getRepository('asyncTasks');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should register task type', async () => {
    class TestTaskType extends TaskType {
      static type = 'test';

      async execute() {
        for (let i = 0; i < 10; i++) {
          this.reportProgress({
            total: 10,
            current: i,
          });
        }

        return {
          a: 'b',
        };
      }
    }

    taskManager.registerTaskType(TestTaskType);

    const task = await taskManager.createTask(
      {
        type: 'test',
        params: {},
        createdById: root.id,
      },
      {
        context: userContext,
      },
    );

    expect(task).toBeTruthy();

    // should get tasks status through task id
    const getResp = await rootAgent.resource('asyncTasks').get({
      filterByTk: task.record.id,
    });

    expect(getResp.status).toBe(200);

    const testFn = vi.fn();

    task.onProgress = (progress) => {
      testFn();
    };

    await task.run();

    expect(testFn).toHaveBeenCalledTimes(10);

    const getResp2 = await rootAgent.resource('asyncTasks').get({
      filterByTk: task.record.id,
    });

    expect(getResp2.status).toBe(200);

    expect(getResp2.body.data.type).toBe('test');
    expect(getResp2.body.data.result).toEqual({
      a: 'b',
    });
  });

  it('should handle task progress correctly', async () => {
    class TestTaskType extends TaskType {
      static type = 'test';

      async execute() {
        for (let i = 0; i < 10; i++) {
          await sleep(10);
          this.reportProgress({
            total: 10,
            current: i + 1,
          });
        }

        return {
          completed: true,
          processedItems: 10,
        };
      }
    }

    taskManager.registerTaskType(TestTaskType);

    const progressUpdates = [];

    const task = await taskManager.createTask(
      {
        type: 'test',
        params: {},
        createdById: root.id,
      },
      { context: userContext },
    );

    // 监听进度更新
    task.onProgress = (record) => {
      progressUpdates.push({ current: record.progressCurrent, total: record.progressTotal });
    };

    // 运行任务
    await task.run();

    // 验证进度更新
    expect(progressUpdates.length).toBe(10);
    expect(progressUpdates[0]).toEqual({
      total: 10,
      current: 1,
    });
    expect(progressUpdates[9]).toEqual({
      total: 10,
      current: 10,
    });

    // 验证最终任务状态和进度
    const finalTask = await rootAgent.resource('asyncTasks').get({
      filterByTk: task.record.id,
    });

    expect(finalTask.body.data.status).toBe(TASK_STATUS.SUCCEEDED);
  });

  it('should cancel task correctly', async () => {
    let executionCompleted = false;

    class LongRunningTaskType extends TaskType {
      static type = 'long-running';

      async execute() {
        for (let i = 0; i < 10; i++) {
          if (this.isCanceled) {
            throw new CancelError();
          }
          await sleep(1000);
          this.reportProgress({
            total: 10,
            current: i + 1,
          });
        }
        executionCompleted = true;
        return { success: true };
      }
    }

    taskManager.registerTaskType(LongRunningTaskType);

    const task = await taskManager.createTask(
      {
        type: 'long-running',
        params: {},
      },
      {
        context: userContext,
      },
    );

    // 启动任务
    const runPromise = taskManager.runTask(task);

    // 等待一小段时间让任务开始执行
    await sleep(150);

    // 取消任务
    await taskManager.cancelTask(task.record.id);
    expect(task.isCanceled).toBe(true);

    // 等待任务完成执行
    await runPromise;
    // 等待状态变更事件被处理
    await sleep(100);
    // 验证任务状态
    expect(task.record.status).toBe(TASK_STATUS.CANCELED);

    // 验证任务是否正确中断
    expect(executionCompleted).toBe(false);

    // 验证无法取消不存在的任务
    expect(await taskManager.cancelTask('non-existent-id')).toBeUndefined();
  });

  it('should have forth task waiting when concurrency is 3', async () => {
    const taskControl = Array(4)
      .fill(null)
      .map(() => ({
        ready: false,
        resolve: null,
      }));

    const executionOrder = [];
    const executionState = { count: 0, max: 0 };

    class ControlledTaskType extends TaskType {
      static type = 'controlled-test';

      async execute() {
        const { index } = this.record.params;

        executionState.count++;
        executionState.max = Math.max(executionState.max, executionState.count);
        executionOrder.push(index);

        await new Promise<void>((resolve) => {
          taskControl[index].ready = true;
          taskControl[index].resolve = resolve;
        });

        executionState.count--;
        return { taskIndex: index };
      }
    }

    taskManager.registerTaskType(ControlledTaskType);

    for (let i = 0; i <= taskManager.concurrency; i++) {
      const task = await taskManager.createTask(
        {
          type: 'controlled-test',
          params: {
            index: i,
          },
        },
        {
          useQueue: true,
          context: userContext,
        },
      );
    }

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (taskControl[0].ready && taskControl[1].ready && taskControl[2].ready) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(executionOrder).toEqual([0, 1, 2]);
    expect(executionState.max).toBe(3);
    expect(executionOrder.includes(3)).toBe(false);

    const taskRecords = await TaskRepo.find();
    expect(taskRecords.filter((item) => item.status === TASK_STATUS.RUNNING).length).toBe(3);
    expect(taskRecords.filter((item) => item.status === TASK_STATUS.PENDING).length).toBe(1);

    taskControl[0].resolve();

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (taskControl[3].ready) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(executionOrder).toEqual([0, 1, 2, 3]);
    expect(executionState.max).toBe(3);

    taskControl[1].resolve();
    taskControl[2].resolve();
    taskControl[3].resolve();

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (executionState.count === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(executionState.count).toBe(0);
  });

  describe('task cancellation', () => {
    it('should remove task from memory immediately after cancellation', async () => {
      class CancellableTaskType extends TaskType {
        static type = 'cancellable';

        async execute() {
          while (!this.isCanceled) {
            await sleep(100);
          }
          throw new CancelError();
        }
      }

      taskManager.registerTaskType(CancellableTaskType);

      const task = await taskManager.createTask({
        type: 'cancellable',
        params: {},
      });

      // 启动任务
      const runPromise = taskManager.runTask(task);

      // 等待任务开始执行
      await sleep(150);

      // 取消任务
      await taskManager.cancelTask(task.record.id);
      expect(task.isCanceled).toBe(true);

      // 等待任务结束和状态变更事件被处理
      await runPromise;
      await sleep(100);

      // 验证任务已从内存中移除
      const tasks = Array.from(taskManager['tasks'].values()) as TaskType[];
      expect(tasks.length).toBe(0);

      // 验证无法获取已删除任务的状态
      await expect(taskManager.getTaskStatus(task.record.id)).rejects.toThrow();
    });

    it('should handle multiple cancellation attempts', async () => {
      class MultiCancelTaskType extends TaskType {
        static type = 'multi-cancel';

        async execute() {
          while (!this.isCanceled) {
            await sleep(100);
          }
          throw new CancelError();
        }
      }

      taskManager.registerTaskType(MultiCancelTaskType);

      const task = await taskManager.createTask({
        type: 'multi-cancel',
        params: {},
      });

      // 启动任务
      const runPromise = taskManager.runTask(task);

      // 第一次取消
      await taskManager.cancelTask(task.record.id);
      expect(task.isCanceled).toBe(true);

      // 等待任务结束和状态变更事件被处理
      await runPromise;
      await sleep(100);

      // 第二次取消应该返回 false，因为任务已经从内存中移除
      await taskManager.cancelTask(task.record.id);
      expect(task.isCanceled).toBe(true);
    });
  });
});
