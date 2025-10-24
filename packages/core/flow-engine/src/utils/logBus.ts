/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Simple in-memory log bus with ring buffer and subscribers.
 */
import type { SerializedError } from './logging';

export type FlowLogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface FlowLogRecord {
  ts: number;
  level: FlowLogLevel;
  type?: string;
  // Common context fields
  modelId?: string;
  modelType?: string;
  flowKey?: string;
  stepKey?: string;
  stepType?: string;
  runId?: string;
  eventName?: string;
  duration?: number;
  status?: 'ok' | 'err' | 'skip';
  error?: SerializedError;
  [key: string]: any;
}

export type FlowLogSubscriber = (record: FlowLogRecord) => void;

export class FlowLogBus {
  private buffer: FlowLogRecord[] = [];
  private max = 2000;
  private subs = new Set<FlowLogSubscriber>();
  private pending: FlowLogRecord[] = [];
  private scheduled = false;

  setCapacity(max: number) {
    if (typeof max === 'number' && max > 0) this.max = max;
  }

  getCapacity() {
    return this.max;
  }

  getSnapshot(): FlowLogRecord[] {
    return this.buffer.slice();
  }

  clear() {
    this.buffer = [];
  }

  subscribe(fn: FlowLogSubscriber) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  hasSubscribers(): boolean {
    return this.subs.size > 0;
  }

  getSubscriberCount(): number {
    return this.subs.size;
  }

  publish(rec: FlowLogRecord) {
    // append to ring buffer immediately
    this.buffer.push(rec);
    if (this.buffer.length > this.max) {
      const overflow = this.buffer.length - this.max;
      this.buffer.splice(0, overflow);
    }
    // enqueue for async delivery to subscribers to avoid nested React commits
    this.pending.push(rec);
    if (this.scheduled) return;
    this.scheduled = true;
    const flush = () => {
      this.scheduled = false;
      const batch = this.pending;
      this.pending = [];
      if (!batch.length) return;
      this.subs.forEach((fn) => {
        try {
          for (const r of batch) fn(r);
        } catch (e) {
          console.error('FlowLogBus subscriber error:', e);
        }
      });
    };
    // microtask; fallback to setTimeout when Promise not available
    Promise.resolve()
      .then(flush)
      .catch(() => setTimeout(flush, 0));
  }
}
