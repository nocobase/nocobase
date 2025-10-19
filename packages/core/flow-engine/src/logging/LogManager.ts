/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '../flowEngine';
import type { LogLevel, LogOptions } from '../utils/logging';
import { DefaultLogOptions } from '../utils/logging';
import type { FlowLogRecord, FlowLogLevel } from '../utils/logBus';
import { FlowLogBus } from '../utils/logBus';
import { FlowLogger } from '../utils/flowLogger';

/**
 * LogManager: encapsulates logging options, in-memory bus, sampling and rate limiting.
 * FlowEngine delegates logging-related responsibilities to this class to keep the engine lean.
 */
export class LogManager {
  private engine: FlowEngine;
  private _options: LogOptions = { ...DefaultLogOptions };
  private _bus = new FlowLogBus();
  private _sampleCounts: Map<string, number> = new Map();
  private _rateWindowSec = 0;
  private _rateTotal = 0;
  private _rateCountsByType: Map<string, number> = new Map();

  constructor(engine: FlowEngine) {
    this.engine = engine;
  }

  get bus(): FlowLogBus {
    return this._bus;
  }

  get options(): LogOptions {
    return this._options;
  }

  setOptions(next: LogOptions) {
    this._options = next;
    if (typeof next.capacity === 'number' && next.capacity > 0) {
      this._bus.setCapacity(next.capacity);
    }
  }

  updateOptions(patchOrFn: Partial<LogOptions> | ((prev: LogOptions) => Partial<LogOptions>)) {
    const patch = typeof patchOrFn === 'function' ? patchOrFn(this._options) : patchOrFn;
    const prev = this._options;
    const next: LogOptions = { ...prev, ...patch } as LogOptions;
    if (patch.samples) {
      next.samples = { ...(prev.samples || {}), ...patch.samples };
    }
    if (patch.maxPerSecByType) {
      next.maxPerSecByType = { ...(prev.maxPerSecByType || {}), ...patch.maxPerSecByType };
    }
    if (patch.filters) next.filters = patch.filters;
    if (patch.dropTypes) next.dropTypes = patch.dropTypes.slice();
    if (patch.dropTypePrefixes) next.dropTypePrefixes = patch.dropTypePrefixes.slice();
    this.setOptions(next);
    const changed = Object.keys(patch || {});
    this.createLogger().info({ type: 'engine.logOptions.update', changed });
  }

  /** Create a FlowLogger (pino-compatible) using engine base logger */
  createLogger(bindings?: Record<string, any>): FlowLogger {
    const base = bindings ? this.engine.logger.child(bindings) : this.engine.logger;
    return new FlowLogger(this.engine, base, bindings);
  }

  /**
   * Publish a structured log record to the in-memory bus (for devtools/diagnostics).
   */
  publish(level: LogLevel, data: Omit<FlowLogRecord, 'level' | 'ts'>) {
    if (level === 'silent') return;
    const mappedLevel = (level === 'trace' ? 'debug' : level === 'fatal' ? 'error' : level) as FlowLogLevel;

    const nowTs = Date.now();
    const rec: FlowLogRecord = { ts: nowTs, level: mappedLevel, ...(data as any) };

    // rate guard: limit info/debug/trace based on options (never drop warn/error)
    if (!(rec.level === 'error' || rec.level === 'warn')) {
      const sec = Math.floor(nowTs / 1000);
      if (this._rateWindowSec !== sec) {
        this._rateWindowSec = sec;
        this._rateTotal = 0;
        this._rateCountsByType.clear();
      }
      const maxTotal = this._options.maxRatePerSec;
      if (typeof maxTotal === 'number') {
        if (this._rateTotal >= maxTotal) return;
        this._rateTotal += 1;
      }
      const byType = this._options.maxPerSecByType;
      if (byType && rec.type && typeof byType[rec.type] === 'number') {
        const curr = this._rateCountsByType.get(rec.type) || 0;
        if (curr >= (byType[rec.type] as number)) return;
        this._rateCountsByType.set(rec.type, curr + 1);
      }
    }

    // sampling: logOptions.samples[type] = N -> keep 1 of N
    const samples = this._options.samples;
    if (samples && rec.type && samples[rec.type] && samples[rec.type] > 1) {
      const N = Number(samples[rec.type]);
      const c = (this._sampleCounts.get(rec.type) || 0) + 1;
      this._sampleCounts.set(rec.type, c % N);
      if (c % N !== 1) return; // only keep 1 of N
    }

    // slow-only filter for end events
    const so = this._options.slowOnly;
    if (so && rec && typeof rec === 'object') {
      if (rec.type === 'event.end' && so.event) {
        const thr = this._options.slowEventMs ?? 16;
        if (!(typeof rec.duration === 'number' && rec.duration >= thr)) return;
      }
      if (rec.type === 'step.end' && so.step) {
        const thr = this._options.slowStepMs ?? 16;
        if (!(typeof rec.duration === 'number' && rec.duration >= thr)) return;
      }
    }

    // level keepers (never drop warn/error). For non-critical levels, apply drop rules
    if (!(rec.level === 'error' || rec.level === 'warn')) {
      const dropTypes = this._options.dropTypes;
      const dropTypePrefixes = this._options.dropTypePrefixes;
      if (dropTypes && dropTypes.includes(rec.type || '')) return;
      if (dropTypePrefixes && rec.type && dropTypePrefixes.some((p) => rec.type?.startsWith(p) === true)) return;
    }

    // exact-match filters
    const f = this._options.filters;
    if (f) {
      if (f.types && rec.type && !f.types.includes(rec.type)) return;
      if (f.modelId && rec.modelId && !f.modelId.includes(rec.modelId)) return;
      if (f.modelType && rec.modelType && !f.modelType.includes(rec.modelType)) return;
      if (f.flowKey && rec.flowKey && !f.flowKey.includes(rec.flowKey)) return;
      if (f.stepKey && rec.stepKey && !f.stepKey.includes(rec.stepKey)) return;
      if (f.eventName && rec.eventName && !f.eventName.includes(rec.eventName)) return;
    }

    // emit to ring buffer
    this._bus.publish(rec);
  }
}

export default LogManager;
