/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op, Transactionable, type Transaction } from '@nocobase/database';
import type PluginWorkflowServer from './Plugin';
import { EXECUTION_REASON, EXECUTION_STATUS } from './constants';
import type { ExecutionModel } from './types';
import { abortExecution, getExecutionLockKey } from './utils';

const LOAD_BATCH_SIZE = 1000;
const DEFAULT_SCAN_INTERVAL = 30_000;
const SCAN_JITTER = 5_000;
const MAX_TIMER_DELAY = 2_147_483_647;
const EXECUTION_LOCK_TIMEOUT = 60_000;

export default class ExecutionTimeoutManager {
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private scanTimer: NodeJS.Timeout | null = null;
  private nextExpiresAtTimer: NodeJS.Timeout | null = null;
  private nextExpiresAt: Date | null = null;
  private scanning: Promise<void> | null = null;
  private stopped = true;

  constructor(private readonly plugin: PluginWorkflowServer) {}

  getTimeout(execution: ExecutionModel) {
    const timeout = Number(execution.workflow?.options?.timeout ?? 0);
    return Number.isFinite(timeout) && timeout > 0 ? timeout : 0;
  }

  getExpiresAt(execution: ExecutionModel, startedAt: Date) {
    const timeout = this.getTimeout(execution);
    return timeout > 0 ? new Date(startedAt.getTime() + timeout) : null;
  }

  async load() {
    this.stopped = false;
    await this.scanExpiredExecutions();
    await this.scheduleNextExpiresAtTimer();
    this.scheduleScan();
  }

  async unload() {
    this.stopped = true;
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    if (this.nextExpiresAtTimer) {
      clearTimeout(this.nextExpiresAtTimer);
      this.nextExpiresAtTimer = null;
      this.nextExpiresAt = null;
    }
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    await this.scanning?.catch(() => {});
  }

  isExpired(execution: ExecutionModel, now = new Date()) {
    return !!execution.expiresAt && execution.expiresAt.getTime() <= now.getTime();
  }

  getRemainingMs(execution: ExecutionModel, now = new Date()) {
    if (!execution.expiresAt) {
      return null;
    }
    return execution.expiresAt.getTime() - now.getTime();
  }

  async abort(execution: ExecutionModel, options: Transactionable = {}) {
    const aborted = await abortExecution(this.plugin, execution, {
      ...options,
      reason: EXECUTION_REASON.TIMEOUT,
    });
    if (aborted) {
      this.clearExecutionTimeout(execution.id);
    }
    return aborted;
  }

  async abortExecutionIfExpired(execution: ExecutionModel, options: Transactionable = {}) {
    if (execution.status !== EXECUTION_STATUS.STARTED || !this.isExpired(execution)) {
      return false;
    }
    return this.abort(execution, options);
  }

  private async abortExecutionIfExpiredWithLock(executionOrId: ExecutionModel | number | string) {
    const executionId = typeof executionOrId === 'object' ? executionOrId.id : executionOrId;
    const lock = await this.plugin.app.lockManager.tryAcquire(getExecutionLockKey(executionId), EXECUTION_LOCK_TIMEOUT);

    return lock.runExclusive(async () => {
      const execution = await this.plugin.db.getRepository('executions').findOne({
        filterByTk: executionId,
      });
      if (!execution) {
        return false;
      }

      return this.abortExecutionIfExpired(execution);
    }, EXECUTION_LOCK_TIMEOUT);
  }

  clear(executionId: number | string) {
    this.clearExecutionTimeout(executionId);
  }

  async shouldContinue(execution: ExecutionModel, options: Transactionable = {}) {
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      return false;
    }
    if (!this.isExpired(execution)) {
      return true;
    }
    await this.abortExecutionIfExpired(execution, options);
    return false;
  }

  /**
   * Owner-only per-execution timer. Only call from code paths that have acquired
   * local execution ownership, such as Dispatcher/Processor processing paths.
   */
  scheduleExecutionTimeout(execution: ExecutionModel) {
    const id = String(execution.id);
    this.clearExecutionTimeout(id);

    if (execution.status !== EXECUTION_STATUS.STARTED || !execution.expiresAt) {
      return;
    }

    this.scheduleNextExpiresAtIfEarlier(execution.expiresAt);

    const remaining = this.getRemainingMs(execution);
    if (remaining == null) {
      return;
    }

    if (remaining <= 0) {
      setImmediate(() => {
        this.handleExecutionTimeout(id).catch((error) => {
          this.plugin.getLogger(execution.workflowId).error(`execution (${execution.id}) timeout handling failed`, {
            error,
          });
        });
      });
      return;
    }

    this.timers.set(
      id,
      setTimeout(
        () => {
          if (execution.expiresAt && execution.expiresAt.getTime() > Date.now()) {
            this.scheduleExecutionTimeout(execution);
            return;
          }
          this.handleExecutionTimeout(id).catch((error) => {
            this.plugin.getLogger(execution.workflowId).error(`execution (${execution.id}) timeout handling failed`, {
              error,
            });
          });
        },
        Math.min(remaining, MAX_TIMER_DELAY),
      ),
    );
  }

  invalidateNextExpiresAtIfMatches(expiresAt?: Date | null) {
    if (!expiresAt || !this.nextExpiresAt || this.nextExpiresAt.getTime() !== expiresAt.getTime()) {
      return;
    }

    this.clearNextExpiresAtTimer();
    this.scheduleNextExpiresAtTimer().catch((error) => {
      this.plugin.getLogger('timeout').error(`workflow execution timeout one-shot refresh failed`, { error });
    });
  }

  private async scanExpiredExecutions() {
    if (this.scanning) {
      // Concurrent scan requests are intentionally deduplicated, not queued.
      return this.scanning;
    }
    if (this.stopped) {
      return;
    }

    this.scanning = (async () => {
      const ExecutionModelClass = this.plugin.db.getModel('executions');
      const executions = (await ExecutionModelClass.findAll({
        attributes: ['id', 'workflowId', 'status', 'expiresAt'],
        where: {
          status: EXECUTION_STATUS.STARTED,
          expiresAt: {
            [Op.not]: null,
            [Op.lt]: new Date(),
          },
        },
        order: [
          ['expiresAt', 'ASC'],
          ['id', 'ASC'],
        ],
        limit: LOAD_BATCH_SIZE,
      })) as ExecutionModel[];

      for (const execution of executions) {
        await this.abortExecutionIfExpiredWithLock(execution);
      }
    })();

    try {
      await this.scanning;
    } finally {
      this.scanning = null;
    }
  }

  private scheduleScan() {
    if (this.stopped) {
      return;
    }
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
    }

    this.scanTimer = setTimeout(
      async () => {
        this.scanTimer = null;
        if (this.stopped) {
          return;
        }
        try {
          await this.scanExpiredExecutions();
          this.scheduleNextExpiresAtTimer();
        } catch (error) {
          this.plugin.getLogger('timeout').error(`workflow execution timeout scan failed`, { error });
        } finally {
          this.scheduleScan();
        }
      },
      DEFAULT_SCAN_INTERVAL + Math.floor(Math.random() * SCAN_JITTER),
    );
  }

  private async scheduleNextExpiresAtTimer() {
    if (this.stopped) {
      return;
    }
    const ExecutionModelClass = this.plugin.db.getModel('executions');

    const execution = (await ExecutionModelClass.findOne({
      attributes: ['id', 'expiresAt'],
      where: {
        status: EXECUTION_STATUS.STARTED,
        expiresAt: {
          [Op.not]: null,
        },
      },
      order: [
        ['expiresAt', 'ASC'],
        ['id', 'ASC'],
      ],
    })) as ExecutionModel | null;

    if (!execution?.expiresAt) {
      this.clearNextExpiresAtTimer();
      return;
    }

    this.scheduleNextExpiresAtIfEarlier(execution.expiresAt, true);
  }

  private scheduleNextExpiresAtIfEarlier(expiresAt: Date, force = false) {
    if (this.stopped) {
      return;
    }
    if (!force && this.nextExpiresAt && this.nextExpiresAt.getTime() <= expiresAt.getTime()) {
      return;
    }

    this.clearNextExpiresAtTimer();
    this.nextExpiresAt = expiresAt;
    const remaining = expiresAt.getTime() - Date.now();
    const delay = Math.max(0, Math.min(remaining, MAX_TIMER_DELAY));

    this.nextExpiresAtTimer = setTimeout(() => {
      this.handleNextExpiresAtTimeout(expiresAt).catch((error) => {
        this.plugin.getLogger('timeout').error(`workflow execution timeout one-shot failed`, { error });
      });
    }, delay);
  }

  private async handleNextExpiresAtTimeout(expiresAt: Date) {
    this.nextExpiresAtTimer = null;
    this.nextExpiresAt = null;

    if (expiresAt.getTime() > Date.now()) {
      this.scheduleNextExpiresAtIfEarlier(expiresAt, true);
      return;
    }

    await this.scanExpiredExecutions();
    await this.scheduleNextExpiresAtTimer();
  }

  private clearNextExpiresAtTimer() {
    if (this.nextExpiresAtTimer) {
      clearTimeout(this.nextExpiresAtTimer);
      this.nextExpiresAtTimer = null;
    }
    this.nextExpiresAt = null;
  }

  private clearExecutionTimeout(executionId: number | string) {
    const id = String(executionId);
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    this.timers.delete(id);
  }

  private async handleExecutionTimeout(executionId: string) {
    this.clearExecutionTimeout(executionId);

    if (this.plugin.abortRunningExecution(executionId, EXECUTION_REASON.TIMEOUT)) {
      return;
    }

    await this.abortExecutionIfExpiredWithLock(executionId);
  }
}
