/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * FlowLogger: a lightweight wrapper around pino.Logger that also
 * publishes structured logs into FlowEngine's LogBus.
 *
 * Usage goals:
 * - Keep console output behavior identical to pino
 * - Auto-bridge to engine.publishLog with minimal overhead
 * - Support logger.child(...) to propagate context fields
 * - Try to auto-derive a reasonable `type` when missing
 */
import type pino from 'pino';
import type { FlowEngine } from '../flowEngine';
import { LogLevel, serializeError, isLevelEnabled } from './logging';
import type { FlowLogRecord } from './logBus';

function mapLevel(lvl: LogLevel): Exclude<LogLevel, 'silent' | 'fatal'> {
  if (lvl === 'trace') return 'debug';
  if (lvl === 'fatal') return 'error';
  if (lvl === 'silent') return 'debug';
  return lvl as Exclude<LogLevel, 'silent' | 'fatal'>;
}

function deriveType(obj: any, msg?: string): string {
  if (obj && typeof obj.type === 'string' && obj.type) return obj.type;
  if (obj) {
    if (obj.stepKey) return 'step.log';
    if (obj.flowKey) return 'flow.log';
    if (obj.eventName) return 'event.log';
    if (obj.modelId) return 'model.log';
  }
  if (typeof msg === 'string') {
    const m = msg.trim();
    if (/^(engine|model|event|flow|step)\./.test(m)) {
      // e.g., "event.start ..." → use the first token as type
      return m.split(/\s+/)[0];
    }
  }
  return 'log';
}

export class FlowLogger {
  private readonly base: pino.Logger;
  private readonly engine: FlowEngine;
  private readonly bindings: Record<string, any>;

  constructor(engine: FlowEngine, base: pino.Logger, bindings?: Record<string, any>) {
    this.engine = engine;
    this.base = base;
    this.bindings = { ...(bindings || {}) };
  }

  // Level check helper
  isLevelEnabled(lvl: LogLevel): boolean {
    return isLevelEnabled(this.base, lvl);
  }

  child(bindings: Record<string, any>): FlowLogger {
    const baseChild = this.base.child(bindings);
    const merged = { ...this.bindings, ...bindings };
    return new FlowLogger(this.engine, baseChild, merged);
  }

  private publish(level: LogLevel, obj?: unknown, msg?: string) {
    // Console output via pino first, with internal level gating for low levels
    const method = mapLevel(level);
    const isLow = method === 'debug' || method === 'trace' || method === 'info';
    const enabled = this.isLevelEnabled(method);
    if (isLow && !enabled) {
      // Skip both console and bus to avoid unnecessary overhead when level is disabled
      return;
    }
    // 选择合适的 pino 重载
    if (typeof obj === 'string' && msg === undefined) {
      switch (method) {
        case 'debug':
          this.base.debug(obj);
          break;
        case 'info':
          this.base.info(obj);
          break;
        case 'warn':
          this.base.warn(obj);
          break;
        case 'error':
          this.base.error(obj);
          break;
        case 'trace':
          this.base.trace(obj);
          break;
      }
    } else if (obj instanceof Error) {
      const payload = { error: serializeError(obj) } as Record<string, unknown>;
      switch (method) {
        case 'debug':
          this.base.debug(payload, msg);
          break;
        case 'info':
          this.base.info(payload, msg);
          break;
        case 'warn':
          this.base.warn(payload, msg);
          break;
        case 'error':
          this.base.error(payload, msg);
          break;
        case 'trace':
          this.base.trace(payload, msg);
          break;
      }
    } else if (obj && typeof obj === 'object') {
      const payload = obj as Record<string, unknown>;
      switch (method) {
        case 'debug':
          this.base.debug(payload, msg);
          break;
        case 'info':
          this.base.info(payload, msg);
          break;
        case 'warn':
          this.base.warn(payload, msg);
          break;
        case 'error':
          this.base.error(payload, msg);
          break;
        case 'trace':
          this.base.trace(payload, msg);
          break;
      }
    } else if (obj === undefined && typeof msg === 'string') {
      switch (method) {
        case 'debug':
          this.base.debug(msg);
          break;
        case 'info':
          this.base.info(msg);
          break;
        case 'warn':
          this.base.warn(msg);
          break;
        case 'error':
          this.base.error(msg);
          break;
        case 'trace':
          this.base.trace(msg);
          break;
      }
    } else {
      const payload = obj as Record<string, unknown>;
      switch (method) {
        case 'debug':
          this.base.debug(payload, msg);
          break;
        case 'info':
          this.base.info(payload, msg);
          break;
        case 'warn':
          this.base.warn(payload, msg);
          break;
        case 'error':
          this.base.error(payload, msg);
          break;
        case 'trace':
          this.base.trace(payload, msg);
          break;
      }
    }

    // Build structured record for LogBus
    let rec: Record<string, unknown> = {};
    if (obj instanceof Error) {
      rec = { error: serializeError(obj) };
    } else if (obj && typeof obj === 'object') {
      rec = { ...(obj as Record<string, unknown>) };
    } else if (typeof obj === 'string' && !msg) {
      rec = { message: obj };
    } else if (typeof msg === 'string') {
      rec = { message: msg };
    }
    rec = { ...this.bindings, ...rec };
    if (!('type' in rec) || !rec.type) {
      rec.type = deriveType(rec, typeof msg === 'string' ? msg : typeof obj === 'string' ? obj : undefined);
    }
    this.engine.logManager.publish(method as LogLevel, rec as Omit<FlowLogRecord, 'level' | 'ts'>);
  }

  fatal(obj?: unknown, msg?: string) {
    this.publish('fatal', obj, msg);
  }
  error(obj?: unknown, msg?: string) {
    this.publish('error', obj, msg);
  }
  warn(obj?: unknown, msg?: string) {
    this.publish('warn', obj, msg);
  }
  info(obj?: unknown, msg?: string) {
    this.publish('info', obj, msg);
  }
  debug(obj?: unknown, msg?: string) {
    this.publish('debug', obj, msg);
  }
  trace(obj?: unknown, msg?: string) {
    this.publish('trace', obj, msg);
  }
}
