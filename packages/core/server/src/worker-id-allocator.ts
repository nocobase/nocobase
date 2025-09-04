/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface WorkerIdAllocatorAdapter {
  getWorkerId(): Promise<number>;
  release(): Promise<void>;
}

export class WorkerIdAllocator {
  private adapter: WorkerIdAllocatorAdapter;

  setAdapter(adapter: WorkerIdAllocatorAdapter) {
    this.adapter = adapter;
  }

  async getWorkerId() {
    if (this.adapter) {
      return this.adapter.getWorkerId();
    }
    return 0;
  }

  async release() {
    if (this.adapter) {
      return this.adapter.release();
    }
    return;
  }
}
