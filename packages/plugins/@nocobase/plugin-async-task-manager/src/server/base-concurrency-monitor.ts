/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TaskId } from '../common/types';
import { ConcurrencyMonitor } from './interfaces/concurrency-monitor';

export class BaseConcurrencyMonitor implements ConcurrencyMonitor {
  constructor(private _concurrency: number) {}

  private taskIds: Set<TaskId> = new Set();

  idle(): boolean {
    return this.taskIds.size < this.concurrency;
  }

  get concurrency(): number {
    return this._concurrency;
  }

  set concurrency(concurrency: number) {
    this._concurrency = concurrency;
  }

  increase(taskId: TaskId): boolean {
    if (this.taskIds.size + 1 > this.concurrency) {
      return false;
    }
    this.taskIds.add(taskId);
    return true;
  }

  reduce(taskId: TaskId): void {
    this.taskIds.delete(taskId);
  }
}
