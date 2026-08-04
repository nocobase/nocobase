/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type JavaScriptWorkerPermit = {
  release: () => void;
};

type WaitingRequest = {
  resolve: (permit: JavaScriptWorkerPermit) => void;
};

const DEFAULT_PROCESS_CONCURRENCY = 2;

function readPositiveInteger(value: string | undefined, defaultValue: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

export function getJavaScriptProcessConcurrency() {
  return readPositiveInteger(process.env.WORKFLOW_JAVASCRIPT_PROCESS_CONCURRENCY, DEFAULT_PROCESS_CONCURRENCY);
}

export class JavaScriptProcessLimiter {
  private active = 0;
  private readonly waiting: WaitingRequest[] = [];

  constructor(private limit: number) {}

  getLimit() {
    return this.limit;
  }

  setLimit(limit: number) {
    this.limit = limit;
    this.drain();
  }

  getActiveCount() {
    return this.active;
  }

  getQueuedCount() {
    return this.waiting.length;
  }

  hasCapacity() {
    return this.active < this.limit;
  }

  async acquire(): Promise<JavaScriptWorkerPermit> {
    if (this.hasCapacity()) {
      return this.createPermit();
    }

    return new Promise((resolve) => {
      this.waiting.push({ resolve });
    });
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
    const permit = await this.acquire();
    try {
      return await callback();
    } finally {
      permit.release();
    }
  }

  private createPermit(): JavaScriptWorkerPermit {
    let released = false;
    this.active += 1;

    return {
      release: () => {
        if (released) {
          return;
        }
        released = true;
        this.active -= 1;
        this.drain();
      },
    };
  }

  private drain() {
    while (this.hasCapacity() && this.waiting.length) {
      const request = this.waiting.shift();
      request?.resolve(this.createPermit());
    }
  }
}

let processLimiter: JavaScriptProcessLimiter | null = null;

export function getJavaScriptProcessLimiter() {
  const limit = getJavaScriptProcessConcurrency();
  if (!processLimiter) {
    processLimiter = new JavaScriptProcessLimiter(limit);
  } else {
    processLimiter.setLimit(limit);
  }

  return processLimiter;
}
