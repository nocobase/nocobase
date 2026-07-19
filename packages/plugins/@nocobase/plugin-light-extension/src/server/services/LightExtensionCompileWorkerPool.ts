/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { serialize } from 'node:v8';
import { Worker } from 'node:worker_threads';

import {
  aggregateLightExtensionCompileResults,
  assertLightExtensionCompileJob,
  createLightExtensionCompileInfrastructureFailure,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
} from './LightExtensionCompileContract';
import type {
  LightExtensionCompileWorkerRequest,
  LightExtensionCompileWorkerResponse,
} from './LightExtensionCompileWorkerProtocol';

export const LIGHT_EXTENSION_COMPILE_POOL_HARD_LIMITS = Object.freeze({
  queuedJobs: 1024,
  jobBytes: 64 * 1024 * 1024,
  inflightBytes: 256 * 1024 * 1024,
  capacityWaiters: 1024,
});

export interface LightExtensionCompileWorkerHandle {
  readonly threadId: number;
  on(event: 'message', listener: (message: LightExtensionCompileWorkerResponse) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'exit', listener: (code: number) => void): this;
  off(event: 'message', listener: (message: LightExtensionCompileWorkerResponse) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
  off(event: 'exit', listener: (code: number) => void): this;
  postMessage(value: LightExtensionCompileWorkerRequest): void;
  gracefulShutdown?(timeoutMs: number): Promise<void>;
  terminate(): Promise<number>;
}

export type LightExtensionCompileWorkerFactory = (workerId: number) => LightExtensionCompileWorkerHandle;

export interface LightExtensionCompileWorkerPoolOptions {
  maxQueueLength?: number;
  maxJobBytes?: number;
  maxInFlightBytes?: number;
  maxCapacityWaiters?: number;
  jobTimeoutMs?: number;
  shutdownGraceMs?: number;
  workerFactory?: LightExtensionCompileWorkerFactory;
}

export interface LightExtensionCompileWorkerPoolMetrics {
  workerCount: number;
  active: number;
  maxActive: number;
  queueDepth: number;
  maxQueueDepth: number;
  inflightBytes: number;
  maxInflightBytes: number;
  completed: number;
  rejected: number;
  restarts: number;
  timeouts: number;
  shuttingDown: boolean;
}

export type LightExtensionCompilePoolErrorCode =
  | 'LIGHT_EXTENSION_COMPILE_POOL_CLOSED'
  | 'LIGHT_EXTENSION_COMPILE_JOB_TOO_LARGE'
  | 'LIGHT_EXTENSION_COMPILE_QUEUE_CAPACITY_EXCEEDED'
  | 'LIGHT_EXTENSION_COMPILE_INFLIGHT_BYTES_EXCEEDED'
  | 'LIGHT_EXTENSION_COMPILE_CAPACITY_WAITERS_EXCEEDED';

export class LightExtensionCompilePoolError extends Error {
  constructor(
    public readonly code: LightExtensionCompilePoolErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LightExtensionCompilePoolError';
  }
}

interface CompileTask {
  job: LightExtensionCompileJob;
  byteSize: number;
  enqueuedAt: number;
  startedAt?: number;
  attempt: number;
  resolve: (result: LightExtensionCompileResult) => void;
}

interface WorkerListeners {
  message: (message: LightExtensionCompileWorkerResponse) => void;
  error: (error: Error) => void;
  exit: (code: number) => void;
}

interface WorkerSlot {
  id: number;
  handle: LightExtensionCompileWorkerHandle;
  listeners: WorkerListeners;
  task?: CompileTask;
  timeout?: NodeJS.Timeout;
}

interface CapacityWaiter {
  byteSize: number;
  signal?: AbortSignal;
  abort?: () => void;
  resolve: () => void;
  reject: (error: Error) => void;
}

interface NormalizedPoolOptions {
  maxQueueLength: number;
  maxJobBytes: number;
  maxInFlightBytes: number;
  maxCapacityWaiters: number;
  jobTimeoutMs: number;
  shutdownGraceMs: number;
  workerFactory: LightExtensionCompileWorkerFactory;
}

export class LightExtensionCompileWorkerPool {
  private readonly options: NormalizedPoolOptions;

  private readonly slots: WorkerSlot[] = [];

  private readonly queue: CompileTask[] = [];

  private readonly failedWorkers = new WeakSet<LightExtensionCompileWorkerHandle>();

  private readonly capacityWaiters: CapacityWaiter[] = [];

  private readonly drainWaiters = new Set<() => void>();

  private active = 0;

  private maxActive = 0;

  private maxQueueDepth = 0;

  private inflightBytes = 0;

  private maxInflightBytes = 0;

  private completed = 0;

  private rejected = 0;

  private restarts = 0;

  private timeouts = 0;

  private shuttingDown = false;

  private closed = false;

  private shutdownPromise?: Promise<void>;

  constructor(options: LightExtensionCompileWorkerPoolOptions = {}) {
    this.options = normalizeOptions(options);
    this.slots.push(this.createWorkerSlot(1));
  }

  submit(job: LightExtensionCompileJob): Promise<LightExtensionCompileResult> {
    if (this.shuttingDown || this.closed) {
      return this.rejectSubmission(
        new LightExtensionCompilePoolError(
          'LIGHT_EXTENSION_COMPILE_POOL_CLOSED',
          'Light extension compile worker pool is shutting down',
        ),
      );
    }
    try {
      assertLightExtensionCompileJob(job);
    } catch (error) {
      return Promise.reject(error);
    }
    const byteSize = serialize(job).byteLength;
    if (byteSize > this.options.maxJobBytes) {
      return this.rejectSubmission(
        new LightExtensionCompilePoolError(
          'LIGHT_EXTENSION_COMPILE_JOB_TOO_LARGE',
          `Compile job byte size ${byteSize} exceeds limit ${this.options.maxJobBytes}`,
        ),
      );
    }
    if (this.inflightBytes + byteSize > this.options.maxInFlightBytes) {
      return this.rejectSubmission(
        new LightExtensionCompilePoolError(
          'LIGHT_EXTENSION_COMPILE_INFLIGHT_BYTES_EXCEEDED',
          `Compile in-flight byte size would exceed limit ${this.options.maxInFlightBytes}`,
        ),
      );
    }
    if (!this.hasAdmissionSlot()) {
      return this.rejectSubmission(
        new LightExtensionCompilePoolError(
          'LIGHT_EXTENSION_COMPILE_QUEUE_CAPACITY_EXCEEDED',
          `Compile queue length exceeds limit ${this.options.maxQueueLength}`,
        ),
      );
    }

    return new Promise<LightExtensionCompileResult>((resolve) => {
      const task: CompileTask = {
        job,
        byteSize,
        enqueuedAt: performance.now(),
        attempt: 1,
        resolve,
      };
      this.inflightBytes += byteSize;
      this.maxInflightBytes = Math.max(this.maxInflightBytes, this.inflightBytes);
      this.queue.push(task);
      this.dispatch();
    });
  }

  async submitWithBackpressure(
    job: LightExtensionCompileJob,
    signal?: AbortSignal,
  ): Promise<LightExtensionCompileResult> {
    assertLightExtensionCompileJob(job);
    const byteSize = serialize(job).byteLength;
    await this.waitForCapacity(byteSize, signal);
    try {
      return await this.submit(job);
    } catch (error) {
      if (!isRetryableAdmissionError(error)) {
        throw error;
      }
      return this.submitWithBackpressure(job, signal);
    }
  }

  async waitForCapacity(byteSize: number, signal?: AbortSignal): Promise<void> {
    if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > this.options.maxJobBytes) {
      throw new LightExtensionCompilePoolError(
        'LIGHT_EXTENSION_COMPILE_JOB_TOO_LARGE',
        `Compile job byte size ${byteSize} is outside the supported range`,
      );
    }
    if (this.shuttingDown || this.closed) {
      throw new LightExtensionCompilePoolError(
        'LIGHT_EXTENSION_COMPILE_POOL_CLOSED',
        'Light extension compile worker pool is shutting down',
      );
    }
    if (this.canAdmit(byteSize)) {
      return;
    }
    if (this.capacityWaiters.length >= this.options.maxCapacityWaiters) {
      throw new LightExtensionCompilePoolError(
        'LIGHT_EXTENSION_COMPILE_CAPACITY_WAITERS_EXCEEDED',
        `Compile capacity waiter count exceeds limit ${this.options.maxCapacityWaiters}`,
      );
    }

    await new Promise<void>((resolve, reject) => {
      const waiter: CapacityWaiter = { byteSize, resolve, reject, signal };
      if (signal) {
        waiter.abort = () => {
          this.removeCapacityWaiter(waiter);
          reject(signal.reason instanceof Error ? signal.reason : new Error('Compile capacity wait aborted'));
        };
        if (signal.aborted) {
          waiter.abort();
          return;
        }
        signal.addEventListener('abort', waiter.abort, { once: true });
      }
      this.capacityWaiters.push(waiter);
    });
  }

  getMetrics(): LightExtensionCompileWorkerPoolMetrics {
    return {
      workerCount: this.slots.length,
      active: this.active,
      maxActive: this.maxActive,
      queueDepth: this.queue.length,
      maxQueueDepth: this.maxQueueDepth,
      inflightBytes: this.inflightBytes,
      maxInflightBytes: this.maxInflightBytes,
      completed: this.completed,
      rejected: this.rejected,
      restarts: this.restarts,
      timeouts: this.timeouts,
      shuttingDown: this.shuttingDown,
    };
  }

  shutdown(graceMs = this.options.shutdownGraceMs): Promise<void> {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }
    this.shutdownPromise = this.performShutdown(graceMs);
    return this.shutdownPromise;
  }

  private async performShutdown(graceMs: number): Promise<void> {
    if (!Number.isFinite(graceMs) || graceMs < 0) {
      throw new TypeError('Compile worker pool shutdown grace period must be a non-negative number');
    }
    this.shuttingDown = true;
    this.rejectCapacityWaiters(
      new LightExtensionCompilePoolError(
        'LIGHT_EXTENSION_COMPILE_POOL_CLOSED',
        'Light extension compile worker pool is shutting down',
      ),
    );
    const drained = await this.waitForDrain(graceMs);
    if (!drained) {
      this.forceSettleOutstandingTasks();
    }
    const slots = this.slots.splice(0);
    await Promise.all(slots.map((slot) => this.terminateSlot(slot, Math.min(graceMs, 5_000))));
    this.closed = true;
    this.notifyDrain();
  }

  private createWorkerSlot(workerId: number): WorkerSlot {
    const handle = this.options.workerFactory(workerId);
    const slot = {} as WorkerSlot;
    const listeners: WorkerListeners = {
      message: (message) => this.handleWorkerMessage(slot, handle, message),
      error: (error) => this.scheduleWorkerFailure(slot, handle, error, 'LIGHT_EXTENSION_COMPILE_WORKER_CRASH'),
      exit: (code) => {
        this.scheduleWorkerFailure(
          slot,
          handle,
          new Error(`Compile worker exited with code ${code}`),
          'LIGHT_EXTENSION_COMPILE_WORKER_CRASH',
        );
      },
    };
    Object.assign(slot, { id: workerId, handle, listeners });
    handle.on('message', listeners.message);
    handle.on('error', listeners.error);
    handle.on('exit', listeners.exit);
    return slot;
  }

  private dispatch(): void {
    for (const slot of this.slots) {
      if (slot.task || this.failedWorkers.has(slot.handle) || this.queue.length === 0) {
        continue;
      }
      const task = this.queue.shift();
      if (!task) {
        continue;
      }
      task.startedAt = performance.now();
      slot.task = task;
      this.active += 1;
      this.maxActive = Math.max(this.maxActive, this.active);
      const request: LightExtensionCompileWorkerRequest = {
        type: 'compile',
        workerId: slot.id,
        attempt: task.attempt,
        job: task.job,
      };
      try {
        slot.handle.postMessage(request);
        slot.timeout = setTimeout(() => {
          this.timeouts += 1;
          this.scheduleWorkerFailure(
            slot,
            slot.handle,
            new Error(`Compile job timed out after ${this.options.jobTimeoutMs}ms`),
            'LIGHT_EXTENSION_COMPILE_JOB_TIMEOUT',
          );
        }, this.options.jobTimeoutMs);
      } catch (error) {
        this.scheduleWorkerFailure(
          slot,
          slot.handle,
          error instanceof Error ? error : new Error(String(error)),
          'LIGHT_EXTENSION_COMPILE_WORKER_CRASH',
        );
      }
    }
    this.maxQueueDepth = Math.max(this.maxQueueDepth, this.queue.length);
  }

  private handleWorkerMessage(
    slot: WorkerSlot,
    handle: LightExtensionCompileWorkerHandle,
    message: LightExtensionCompileWorkerResponse,
  ): void {
    if (slot.handle !== handle || message.type === 'ready' || message.type === 'shutdown-complete') {
      return;
    }
    const task = slot.task;
    if (!task) {
      return;
    }
    try {
      aggregateLightExtensionCompileResults([task.job], [message.result]);
    } catch (error) {
      this.scheduleWorkerFailure(
        slot,
        handle,
        error instanceof Error ? error : new Error(String(error)),
        'LIGHT_EXTENSION_COMPILE_WORKER_PROTOCOL_ERROR',
      );
      return;
    }
    this.clearSlotTask(slot);
    const result: LightExtensionCompileResult = {
      ...message.result,
      observation: {
        ...message.result.observation,
        workerId: slot.id,
        threadId: message.result.observation.threadId || handle.threadId,
        attempt: task.attempt,
        queueDurationMs: Math.max(0, (task.startedAt || performance.now()) - task.enqueuedAt),
      },
    };
    this.completeTask(task, result);
    this.dispatch();
    this.notifyCapacityWaiters();
    this.notifyDrain();
  }

  private async handleWorkerFailure(
    slot: WorkerSlot,
    handle: LightExtensionCompileWorkerHandle,
    error: Error,
    failureCode: string,
  ): Promise<void> {
    if (slot.handle !== handle || this.failedWorkers.has(handle)) {
      return;
    }
    this.failedWorkers.add(handle);
    const threadId = handle.threadId;
    const task = slot.task;
    this.clearSlotTask(slot);
    this.detachWorker(slot, handle);
    await handle.terminate().catch(() => -1);

    if (task) {
      if (!this.shuttingDown && task.attempt < 2) {
        task.attempt += 1;
        task.startedAt = undefined;
        this.queue.unshift(task);
      } else {
        this.completeTask(
          task,
          createLightExtensionCompileInfrastructureFailure({
            job: task.job,
            workerId: slot.id,
            threadId,
            attempt: task.attempt,
            queueDurationMs: Math.max(0, (task.startedAt || performance.now()) - task.enqueuedAt),
            runDurationMs: task.startedAt ? Math.max(0, performance.now() - task.startedAt) : 0,
            failureCode,
            message: error.message,
          }),
        );
      }
    }

    const slotIndex = this.slots.indexOf(slot);
    if (!this.shuttingDown && slotIndex >= 0) {
      this.restarts += 1;
      this.slots[slotIndex] = this.createWorkerSlot(slot.id);
    }
    this.dispatch();
    this.notifyCapacityWaiters();
    this.notifyDrain();
  }

  private scheduleWorkerFailure(
    slot: WorkerSlot,
    handle: LightExtensionCompileWorkerHandle,
    error: Error,
    failureCode: string,
  ): void {
    this.handleWorkerFailure(slot, handle, error, failureCode).catch((failure: unknown) =>
      this.forceSettlePoolFailure(failure),
    );
  }

  private clearSlotTask(slot: WorkerSlot): void {
    if (slot.timeout) {
      clearTimeout(slot.timeout);
      slot.timeout = undefined;
    }
    if (slot.task) {
      slot.task = undefined;
      this.active = Math.max(0, this.active - 1);
    }
  }

  private completeTask(task: CompileTask, result: LightExtensionCompileResult): void {
    this.inflightBytes = Math.max(0, this.inflightBytes - task.byteSize);
    this.completed += 1;
    task.resolve(result);
  }

  private forceSettleOutstandingTasks(): void {
    const now = performance.now();
    const queued = this.queue.splice(0);
    for (const task of queued) {
      this.completeTask(
        task,
        createLightExtensionCompileInfrastructureFailure({
          job: task.job,
          workerId: 0,
          threadId: -1,
          attempt: task.attempt,
          queueDurationMs: Math.max(0, now - task.enqueuedAt),
          runDurationMs: 0,
          failureCode: 'LIGHT_EXTENSION_COMPILE_POOL_SHUTDOWN',
          message: 'Compile worker pool shut down before the queued job completed',
        }),
      );
    }
    for (const slot of this.slots) {
      const task = slot.task;
      if (!task) {
        continue;
      }
      this.clearSlotTask(slot);
      this.completeTask(
        task,
        createLightExtensionCompileInfrastructureFailure({
          job: task.job,
          workerId: slot.id,
          threadId: slot.handle.threadId,
          attempt: task.attempt,
          queueDurationMs: Math.max(0, (task.startedAt || now) - task.enqueuedAt),
          runDurationMs: task.startedAt ? Math.max(0, now - task.startedAt) : 0,
          failureCode: 'LIGHT_EXTENSION_COMPILE_POOL_SHUTDOWN',
          message: 'Compile worker pool grace period expired before the job completed',
        }),
      );
    }
  }

  private forceSettlePoolFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    for (const task of this.queue.splice(0)) {
      this.completeTask(
        task,
        createLightExtensionCompileInfrastructureFailure({
          job: task.job,
          workerId: 0,
          threadId: -1,
          attempt: task.attempt,
          queueDurationMs: Math.max(0, performance.now() - task.enqueuedAt),
          runDurationMs: 0,
          failureCode: 'LIGHT_EXTENSION_COMPILE_POOL_FAILED',
          message,
        }),
      );
    }
  }

  private async terminateSlot(slot: WorkerSlot, gracefulTimeoutMs = 0): Promise<void> {
    this.failedWorkers.add(slot.handle);
    if (slot.timeout) {
      clearTimeout(slot.timeout);
      slot.timeout = undefined;
    }
    if (gracefulTimeoutMs > 0 && slot.handle.gracefulShutdown) {
      await slot.handle.gracefulShutdown(gracefulTimeoutMs).catch(() => undefined);
    }
    this.detachWorker(slot, slot.handle);
    await slot.handle.terminate().catch(() => -1);
  }

  private detachWorker(slot: WorkerSlot, handle: LightExtensionCompileWorkerHandle): void {
    handle.off('message', slot.listeners.message);
    handle.off('error', slot.listeners.error);
    handle.off('exit', slot.listeners.exit);
  }

  private hasAdmissionSlot(): boolean {
    return this.queue.length < this.options.maxQueueLength || (this.queue.length === 0 && this.active === 0);
  }

  private canAdmit(byteSize: number): boolean {
    return this.hasAdmissionSlot() && this.inflightBytes + byteSize <= this.options.maxInFlightBytes;
  }

  private rejectSubmission(error: LightExtensionCompilePoolError): Promise<LightExtensionCompileResult> {
    this.rejected += 1;
    return Promise.reject(error);
  }

  private notifyCapacityWaiters(): void {
    const index = this.capacityWaiters.findIndex((waiter) => this.canAdmit(waiter.byteSize));
    if (index < 0) {
      return;
    }
    const [waiter] = this.capacityWaiters.splice(index, 1);
    if (!waiter) {
      return;
    }
    if (waiter.abort && waiter.signal) {
      waiter.signal.removeEventListener('abort', waiter.abort);
    }
    waiter.resolve();
  }

  private removeCapacityWaiter(waiter: CapacityWaiter): void {
    const index = this.capacityWaiters.indexOf(waiter);
    if (index >= 0) {
      this.capacityWaiters.splice(index, 1);
    }
    if (waiter.abort && waiter.signal) {
      waiter.signal.removeEventListener('abort', waiter.abort);
    }
  }

  private rejectCapacityWaiters(error: Error): void {
    for (const waiter of this.capacityWaiters.splice(0)) {
      if (waiter.abort && waiter.signal) {
        waiter.signal.removeEventListener('abort', waiter.abort);
      }
      waiter.reject(error);
    }
  }

  private async waitForDrain(graceMs: number): Promise<boolean> {
    if (this.active === 0 && this.queue.length === 0) {
      return true;
    }
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (drained: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        this.drainWaiters.delete(onDrain);
        resolve(drained);
      };
      const onDrain = () => finish(true);
      const timeout = setTimeout(() => finish(false), graceMs);
      this.drainWaiters.add(onDrain);
    });
  }

  private notifyDrain(): void {
    if (this.active !== 0 || this.queue.length !== 0) {
      return;
    }
    for (const resolve of [...this.drainWaiters]) {
      resolve();
    }
  }
}

function isRetryableAdmissionError(error: unknown): boolean {
  return (
    error instanceof LightExtensionCompilePoolError &&
    (error.code === 'LIGHT_EXTENSION_COMPILE_QUEUE_CAPACITY_EXCEEDED' ||
      error.code === 'LIGHT_EXTENSION_COMPILE_INFLIGHT_BYTES_EXCEEDED')
  );
}

function normalizeOptions(options: LightExtensionCompileWorkerPoolOptions): NormalizedPoolOptions {
  const normalized: NormalizedPoolOptions = {
    maxQueueLength: options.maxQueueLength ?? 64,
    maxJobBytes: options.maxJobBytes ?? 8 * 1024 * 1024,
    maxInFlightBytes: options.maxInFlightBytes ?? 32 * 1024 * 1024,
    maxCapacityWaiters: options.maxCapacityWaiters ?? 64,
    jobTimeoutMs: options.jobTimeoutMs ?? 30_000,
    shutdownGraceMs: options.shutdownGraceMs ?? 5_000,
    workerFactory: options.workerFactory || createDefaultWorker,
  };
  assertIntegerLimit(
    'maxQueueLength',
    normalized.maxQueueLength,
    0,
    LIGHT_EXTENSION_COMPILE_POOL_HARD_LIMITS.queuedJobs,
  );
  assertIntegerLimit('maxJobBytes', normalized.maxJobBytes, 1, LIGHT_EXTENSION_COMPILE_POOL_HARD_LIMITS.jobBytes);
  assertIntegerLimit(
    'maxInFlightBytes',
    normalized.maxInFlightBytes,
    normalized.maxJobBytes,
    LIGHT_EXTENSION_COMPILE_POOL_HARD_LIMITS.inflightBytes,
  );
  assertIntegerLimit(
    'maxCapacityWaiters',
    normalized.maxCapacityWaiters,
    0,
    LIGHT_EXTENSION_COMPILE_POOL_HARD_LIMITS.capacityWaiters,
  );
  assertIntegerLimit('jobTimeoutMs', normalized.jobTimeoutMs, 1, 10 * 60_000);
  assertIntegerLimit('shutdownGraceMs', normalized.shutdownGraceMs, 0, 60_000);
  return normalized;
}

function assertIntegerLimit(label: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} must be a safe integer between ${minimum} and ${maximum}`);
  }
}

function createDefaultWorker(): LightExtensionCompileWorkerHandle {
  const isTypeScriptRuntime = __filename.endsWith('.ts');
  const workerPath = path.join(__dirname, `LightExtensionCompileWorker.${isTypeScriptRuntime ? 'ts' : 'js'}`);
  return new NodeCompileWorkerHandle(
    new Worker(workerPath, {
      execArgv: isTypeScriptRuntime ? ['--require', 'tsx/cjs'] : undefined,
    }),
  );
}

class NodeCompileWorkerHandle implements LightExtensionCompileWorkerHandle {
  constructor(private readonly worker: Worker) {}

  get threadId(): number {
    return this.worker.threadId;
  }

  on(event: 'message', listener: (message: LightExtensionCompileWorkerResponse) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'exit', listener: (code: number) => void): this;
  on(
    event: 'message' | 'error' | 'exit',
    listener:
      | ((message: LightExtensionCompileWorkerResponse) => void)
      | ((error: Error) => void)
      | ((code: number) => void),
  ): this {
    this.worker.on(event, listener as never);
    return this;
  }

  off(event: 'message', listener: (message: LightExtensionCompileWorkerResponse) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
  off(event: 'exit', listener: (code: number) => void): this;
  off(
    event: 'message' | 'error' | 'exit',
    listener:
      | ((message: LightExtensionCompileWorkerResponse) => void)
      | ((error: Error) => void)
      | ((code: number) => void),
  ): this {
    this.worker.off(event, listener as never);
    return this;
  }

  postMessage(value: LightExtensionCompileWorkerRequest): void {
    this.worker.postMessage(value);
  }

  terminate(): Promise<number> {
    return this.worker.terminate();
  }

  async gracefulShutdown(timeoutMs: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        this.worker.off('message', onMessage);
        this.worker.off('error', onError);
        this.worker.off('exit', onExit);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };
      const onMessage = (message: LightExtensionCompileWorkerResponse) => {
        if (message.type === 'shutdown-complete') {
          finish();
        }
      };
      const onError = (error: Error) => finish(error);
      const onExit = () => finish();
      const timeout = setTimeout(
        () => finish(new Error(`Compile worker graceful shutdown timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
      this.worker.on('message', onMessage);
      this.worker.on('error', onError);
      this.worker.on('exit', onExit);
      this.worker.postMessage({ type: 'shutdown' });
    });
  }
}
