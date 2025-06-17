/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AsyncTasksManager, TaskStatus, CancelError } from '../interfaces/async-task-manager';
import { createMockServer } from '@nocobase/test';
import { TaskType } from '../task-type';

describe('task manager', () => {
  let taskManager: AsyncTasksManager;

  let app;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'async-task-manager'],
    });

    taskManager = app.container.get('AsyncTaskManager');
    taskManager;
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

    const task = await taskManager.createTask({
      type: 'test',
      params: {},
    });

    expect(task).toBeTruthy();

    // should get tasks status through task id
    const getResp = await app.agent().resource('asyncTasks').get({
      filterByTk: task.taskId,
    });

    expect(getResp.status).toBe(200);

    const testFn = vi.fn();

    task.on('progress', (progress) => {
      testFn();
    });

    await task.run();

    expect(testFn).toHaveBeenCalledTimes(10);

    const getResp2 = await app.agent().resource('asyncTasks').get({
      filterByTk: task.taskId,
    });

    expect(getResp2.status).toBe(200);

    expect(getResp2.body.data.type).toBe('success');
    expect(getResp2.body.data.payload).toEqual({
      a: 'b',
    });
  });

  it('should get tasks by tag', async () => {
    class TestTaskType extends TaskType {
      static type = 'test';

      async execute() {
        return { success: true };
      }
    }

    taskManager.registerTaskType(TestTaskType);

    const task1 = await taskManager.createTask({
      type: 'test',
      params: {},
      tags: {
        category: 'import',
        source: 'excel',
      },
    });

    const task2 = await taskManager.createTask({
      type: 'test',
      params: {},
      tags: {
        category: 'import',
        source: 'csv',
      },
    });

    const task3 = await taskManager.createTask({
      type: 'test',
      params: {},
      tags: {
        category: 'export',
        source: 'excel',
      },
    });

    const importTasks = await taskManager.getTasksByTag('category', 'import');
    expect(importTasks.length).toBe(2);

    const excelTasks = await taskManager.getTasksByTag('source', 'excel');
    expect(excelTasks.length).toBe(2);

    const csvTasks = await taskManager.getTasksByTag('source', 'csv');
    expect(csvTasks.length).toBe(1);
  });

  it('should emit events when task status changes', async () => {
    class TestTaskType extends TaskType {
      static type = 'test';

      async execute() {
        this.reportProgress({ total: 10, current: 5 });
        return { success: true };
      }
    }

    taskManager.registerTaskType(TestTaskType);

    const taskCreatedFn = vi.fn();
    const taskProgressFn = vi.fn();
    const taskStatusChangeFn = vi.fn();

    taskManager.on('taskCreated', taskCreatedFn);
    taskManager.on('taskProgress', taskProgressFn);
    taskManager.on('taskStatusChange', (event) => {
      console.log('taskStatusChange', event);
      taskStatusChangeFn(event);
    });

    const task = await taskManager.createTask({
      type: 'test',
      params: {},
    });

    // 测试任务创建事件
    expect(taskCreatedFn).toHaveBeenCalledTimes(1);
    expect(taskCreatedFn).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.any(TestTaskType),
      }),
    );

    await task.run();

    // 测试进度事件
    expect(taskProgressFn).toHaveBeenCalledTimes(1);
    expect(taskProgressFn).toHaveBeenCalledWith(
      expect.objectContaining({
        task,
        progress: { total: 10, current: 5 },
      }),
    );

    // 测试状态变更事件
    expect(taskStatusChangeFn).toHaveBeenCalledTimes(2); // 初始 running 状态和最终 success 状态
    expect(taskStatusChangeFn).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        task,
        status: {
          type: 'running',
          indicator: 'progress',
        },
      }),
    );
    expect(taskStatusChangeFn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        task,
        status: {
          type: 'success',
          indicator: 'success',
          payload: { success: true },
        },
      }),
    );
  });

  it('should emit events when task fails', async () => {
    class FailingTaskType extends TaskType {
      static type = 'failing';

      async execute() {
        throw new Error('Task failed');
      }
    }

    taskManager.registerTaskType(FailingTaskType);

    const taskStatusChangeFn = vi.fn();
    taskManager.on('taskStatusChange', taskStatusChangeFn);

    const task = taskManager.createTask({
      type: 'failing',
      params: {},
    });

    // 使用 try/catch 来处理预期的错误
    try {
      await task.run();
    } catch (error) {
      console.log('error', error);
      // 错误已经被 TaskType 的 run 方法处理了，这里不需要做任何事
    }

    expect(taskStatusChangeFn).toHaveBeenCalledTimes(2); // 一次是 running 状态，一次是 failed 状态
    expect(taskStatusChangeFn).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        task,
        status: {
          type: 'running',
          indicator: 'progress',
        },
      }),
    );
    expect(taskStatusChangeFn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        task,
        status: {
          type: 'failed',
          indicator: 'error',
          errors: [{ message: 'Task failed' }],
        },
      }),
    );
  });

  it('should handle task progress correctly', async () => {
    class TestTaskType extends TaskType {
      static type = 'test';

      async execute() {
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 10));
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
    const statusChanges = [];

    const task = await taskManager.createTask({
      type: 'test',
      params: {},
    });

    // 监听进度更新
    task.on('progress', (progress) => {
      progressUpdates.push(progress);
    });

    // 监听状态变化
    task.on('statusChange', (status) => {
      statusChanges.push(status);
    });

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

    // 验证状态变化
    expect(statusChanges.length).toBe(2); // pending -> running -> success
    expect(statusChanges[0].type).toBe('running');
    expect(statusChanges[1].type).toBe('success');
    expect(statusChanges[1].payload).toEqual({
      completed: true,
      processedItems: 10,
    });

    // 验证最终任务状态和进度
    const finalTask = await app.agent().resource('asyncTasks').get({
      filterByTk: task.taskId,
    });

    expect(finalTask.body.data.type).toBe('success');
  });

  it('should cancel task correctly', async () => {
    let executionCompleted = false;

    class LongRunningTaskType extends TaskType {
      static type = 'long-running';

      async execute() {
        for (let i = 0; i < 10; i++) {
          if (this.isCancelled) {
            throw new CancelError();
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

    const statusChanges: TaskStatus[] = [];
    const task = await taskManager.createTask({
      type: 'long-running',
      params: {},
    });

    task.on('statusChange', (status) => {
      statusChanges.push(status);
    });

    // 启动任务
    const runPromise = task.run();

    // 等待一小段时间让任务开始执行
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 取消任务
    const cancelled = await taskManager.cancelTask(task.taskId);
    expect(cancelled).toBe(true);

    // 等待任务完成执行
    await runPromise;
    // 等待状态变更事件被处理
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证状态变化
    expect(statusChanges.length).toBe(2); // running -> cancelled
    expect(statusChanges[0].type).toBe('running');
    expect(statusChanges[1].type).toBe('cancelled');

    // 验证任务状态
    expect(task.status.type).toBe('cancelled');

    // 验证任务是否正确中断
    expect(executionCompleted).toBe(false);

    // 验证无法取消不存在的任务
    expect(await taskManager.cancelTask('non-existent-id')).toBe(false);
  });

  it('should have third task waiting when concurrency is 2', async () => {
    const taskControl = {
      task1Ready: false,
      task2Ready: false,
      task3Ready: false,
      task1Resolve: null,
      task2Resolve: null,
      task3Resolve: null,
    };

    const executionOrder = [];
    const executionState = { count: 0, max: 0 };

    taskManager.queue.concurrency = 2;

    class ControlledTaskType extends TaskType {
      static type = 'controlled-test';

      async execute() {
        const index = parseInt(this.tags.index);

        executionState.count++;
        executionState.max = Math.max(executionState.max, executionState.count);
        executionOrder.push(index);

        await new Promise<void>((resolve) => {
          if (index === 1) {
            taskControl.task1Resolve = resolve;
            taskControl.task1Ready = true;
          } else if (index === 2) {
            taskControl.task2Resolve = resolve;
            taskControl.task2Ready = true;
          } else if (index === 3) {
            taskControl.task3Resolve = resolve;
            taskControl.task3Ready = true;
          }
        });

        executionState.count--;
        return { taskIndex: index };
      }
    }

    taskManager.registerTaskType(ControlledTaskType);

    for (let i = 1; i <= 3; i++) {
      taskManager.createTask({
        type: 'controlled-test',
        params: {},
        tags: { index: i.toString() },
        useQueue: true,
      });
    }

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (taskControl.task1Ready && taskControl.task2Ready) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(executionOrder).toEqual([1, 2]);
    expect(executionState.max).toBe(2);
    expect(executionOrder.includes(3)).toBe(false);

    expect(taskManager.queue.pending).toBe(2);
    expect(taskManager.queue.size).toBe(1);

    taskControl.task1Resolve();

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (taskControl.task3Ready) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    expect(executionOrder).toEqual([1, 2, 3]);
    expect(executionState.max).toBe(2);

    taskControl.task2Resolve();
    taskControl.task3Resolve();

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
          while (!this.isCancelled) {
            await new Promise((resolve) => setTimeout(resolve, 100));
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
      const runPromise = task.run();

      // 等待任务开始执行
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 取消任务
      const cancelled = await taskManager.cancelTask(task.taskId);
      expect(cancelled).toBe(true);

      // 等待任务结束和状态变更事件被处理
      await runPromise;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证任务已从内存中移除
      const tasks = Array.from(taskManager['tasks'].values()) as TaskType[];
      expect(tasks.length).toBe(0);

      // 验证无法获取已删除任务的状态
      await expect(taskManager.getTaskStatus(task.taskId)).rejects.toThrow();
    });

    it('should handle multiple cancellation attempts', async () => {
      class MultiCancelTaskType extends TaskType {
        static type = 'multi-cancel';

        async execute() {
          while (!this.isCancelled) {
            await new Promise((resolve) => setTimeout(resolve, 100));
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
      const runPromise = task.run();

      // 第一次取消
      const firstCancellation = await taskManager.cancelTask(task.taskId);
      expect(firstCancellation).toBe(true);

      // 等待任务结束和状态变更事件被处理
      await runPromise;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 第二次取消应该返回 false，因为任务已经从内存中移除
      const secondCancellation = await taskManager.cancelTask(task.taskId);
      expect(secondCancellation).toBe(false);
    });
  });
});
