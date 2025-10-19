/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Method decorator: LogDuration
 *
 * Wraps a method (sync or async) to automatically:
 * - measure duration via startTimer()
 * - choose level via levelByDuration when level='auto'
 * - emit a structured log via ctx.logger/this.logger compatible with FlowLogger
 * - on error, log with onErrorLevel and rethrow
 *
 * The decorator is self-contained within flow-engine and does not import external app code.
 */
import { levelByDuration, serializeError, startTimer, logAt, LoggerLike } from './logging';

type SlowKey = 'slowParamsMs' | 'slowRenderMs' | 'slowStepMs' | 'slowEventMs';

export interface LogDurationOptions<TThis = any, TArgs extends any[] = any[], TRet = any> {
  /** Optional explicit type; if omitted, falls back to method name */
  type?: string | ((self: TThis, args: TArgs, ret: TRet, err?: any) => string);
  /** When 'auto', choose info for slow, debug for fast. Default: 'auto' */
  level?: 'auto' | 'debug' | 'info';
  /** Fixed threshold in ms. Overrides slowMsKey when provided. */
  slowMs?: number | ((self: TThis, args: TArgs) => number);
  /** Threshold key to read from engine.logManager.options (e.g., slowParamsMs). */
  slowMsKey?: SlowKey;
  /** Directly provide a logger; overrides getLogger when set. */
  logger?: LoggerLike;
  /** Provide a logger; default tries self.context.logger -> self.logger */
  getLogger?: (self: TThis) => LoggerLike | undefined;
  /** Additional fields to merge into the log record. */
  enrich?: (self: TThis, args: TArgs, ret?: TRet) => Record<string, any> | void;
  /** Error level; default 'error' */
  onErrorLevel?: 'error' | 'warn';
}

function defaultGetLogger(self: any): LoggerLike | undefined {
  return (self?.context?.logger || self?.logger) as LoggerLike | undefined;
}

function getLogOptions(self: unknown): any {
  const s = self as any;
  return s?.context?.engine?.logManager?.options || s?.engine?.logManager?.options;
}

function resolveSlowMs<TThis, TArgs extends any[]>(
  self: TThis,
  args: TArgs,
  opts: LogDurationOptions<TThis, TArgs, any>,
  typeName?: string,
): number {
  if (typeof opts.slowMs === 'function') return Number(opts.slowMs(self, args)) || 0;
  if (typeof opts.slowMs === 'number') return Math.max(0, Number(opts.slowMs));
  if (opts.slowMsKey) {
    const key = opts.slowMsKey as keyof any;
    const logOptions = getLogOptions(self);
    const v = logOptions ? logOptions[key] : undefined;
    if (typeof v === 'number') return Math.max(0, v as number);
  }
  // Heuristic by typeName when neither slowMs nor slowMsKey provided
  const logOptions = getLogOptions(self);
  const t = String(typeName || '').toLowerCase();
  if (logOptions && t) {
    if (t.includes('variables.resolve') || t.includes('params')) return Number(logOptions.slowParamsMs ?? 8);
    if (t.includes('render')) return Number(logOptions.slowRenderMs ?? 8);
    if (t.includes('step.end') || t.includes('step.')) return Number(logOptions.slowStepMs ?? 16);
    if (t.includes('event.end') || t.includes('event.')) return Number(logOptions.slowEventMs ?? 16);
  }
  // fallback reasonable default for micro-measurements
  return 16;
}

function resolveType(
  self: any,
  args: any[],
  ret: any,
  provided: undefined | string | ((self: any, args: any[], ret: any, err?: any) => string),
  fallbackName: string,
  err?: any,
): string {
  if (typeof provided === 'string' && provided) return provided;
  if (typeof provided === 'function') {
    const t = provided(self, args, ret, err);
    if (t && typeof t === 'string') return t;
  }
  return fallbackName || 'log.duration';
}

export function LogDuration(options: LogDurationOptions = {}): MethodDecorator {
  return function (_target: any, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const orig = descriptor.value;
    if (typeof orig !== 'function') return descriptor;

    descriptor.value = function wrapped(this: any, ...args: any[]) {
      const stop = startTimer();
      const finish = (ret: any, err?: any) => {
        const d = stop();
        const logger = options.logger || (options.getLogger || defaultGetLogger)(this);
        if (!logger) return ret;
        const methodName = typeof _propertyKey === 'string' ? _propertyKey : 'log.duration';
        const typeName = resolveType(this, args, ret, options.type, methodName, err);
        const baseRec: any = { type: typeName, duration: d };
        const extra = options.enrich?.(this, args, ret);
        if (extra && typeof extra === 'object') Object.assign(baseRec, extra);
        if (err) {
          const lvl = options.onErrorLevel || 'error';
          baseRec.error = serializeError(err);
          logAt(logger, lvl, baseRec);
        } else {
          const strategy = options.level || 'auto';
          if (strategy === 'auto') {
            const slowMs = resolveSlowMs(this, args, options, typeName);
            const lvl = levelByDuration(d, slowMs);
            logAt(logger, lvl, baseRec);
          } else {
            logAt(logger, strategy, baseRec);
          }
        }
        return ret;
      };

      try {
        const ret = orig.apply(this, args);
        if (ret && typeof ret.then === 'function') {
          return (ret as Promise<any>)
            .then((v) => finish(v))
            .catch((e) => {
              finish(undefined, e);
              throw e;
            });
        }
        return finish(ret);
      } catch (e) {
        finish(undefined, e);
        throw e;
      }
    };
    return descriptor;
  };
}

export default LogDuration;
