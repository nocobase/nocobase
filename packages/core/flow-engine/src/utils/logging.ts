/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Lightweight logging helpers for flow-engine.
 */
import type pino from 'pino';

export type LogLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Minimal logger interface compatible with pino.Logger and FlowLogger
export interface LoggerLike {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  trace: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
  child: (bindings: Record<string, unknown>) => LoggerLike;
  // 可选：用于 level 门控的探针能力（若底层为 pino，会自动具备）
  isLevelEnabled?: (lvl: LogLevel) => boolean;
  level?: string;
  // pino 的内部字段，用于数值化比较
  levelVal?: number;
  levels?: { values: Record<string, number> };
}

export interface LogFilters {
  types?: string[];
  modelId?: string[];
  modelType?: string[];
  flowKey?: string[];
  stepKey?: string[];
  eventName?: string[];
}

export interface LogOptions {
  slowStepMs: number;
  slowEventMs: number;
  slowParamsMs: number;
  slowRenderMs: number;
  capacity: number;
  /** Optional: base console logger level (engine.logger.level). */
  loggerLevel?: LogLevel;
  samples?: Record<string, number>;
  slowOnly?: { event?: boolean; step?: boolean };
  dropTypes?: string[];
  dropTypePrefixes?: string[];
  filters?: LogFilters;
  /** optional: max total logs per second (info/debug/trace only) */
  maxRatePerSec?: number;
  /** optional: per-type max logs per second */
  maxPerSecByType?: Record<string, number>;
}

export const DefaultLogOptions: LogOptions = {
  slowStepMs: 16,
  slowEventMs: 16,
  slowParamsMs: 8,
  slowRenderMs: 8,
  capacity: 2000,
  samples: {
    'variables.resolve.final': 10,
    'variables.resolve.server': 5,
  },
  slowOnly: { event: true },
  dropTypes: ['step.start'],
  dropTypePrefixes: ['cache.'],
  filters: undefined,
};

type PinoIntrospect = {
  isLevelEnabled?: (lvl: LogLevel) => boolean;
  levelVal?: number;
  levels?: { values: Record<string, number> };
  level?: string;
};

export function isLevelEnabled(logger: pino.Logger | (LoggerLike & PinoIntrospect), level: LogLevel): boolean {
  const l = logger as PinoIntrospect;
  if (typeof l.isLevelEnabled === 'function') {
    return !!l.isLevelEnabled(level);
  }
  // Numeric comparison via levelVal and levels.values
  if (typeof l.levelVal === 'number' && l.levels && l.levels.values) {
    const current = l.levelVal as number;
    const values = l.levels.values as Record<string, number>;
    if (typeof values[level] === 'number') {
      return values[level] >= current;
    }
  }
  // Fallback: compare string level against known pino level mapping
  const map: Record<string, number> = {
    silent: 100,
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  };
  const currentLevel = (l.level || 'info').toLowerCase();
  if (map[currentLevel] !== undefined && map[level] !== undefined) {
    return map[level] >= map[currentLevel];
  }
  // final fallback
  return false;
}

export function startTimer(): () => number {
  const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  return () => {
    const t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    return Math.max(0, t1 - t0);
  };
}

export function levelByDuration(ms: number, slowMs: number): LogLevel {
  return ms > slowMs ? 'info' : 'debug';
}

export interface SerializedError {
  name?: string;
  message?: string;
  stack?: string;
}

export function serializeError(err: unknown): SerializedError | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  try {
    const anyObj = err as { name?: string; message?: string; stack?: string };
    return {
      name: anyObj?.name || 'Error',
      message: anyObj?.message || String(err),
      stack: anyObj?.stack,
    };
  } catch (_) {
    return { name: 'Error', message: String(err) };
  }
}

export function logAt(
  logger: LoggerLike,
  level: LogLevel,
  obj?: Record<string, unknown> | Error | string,
  msg?: string,
): void {
  switch (level) {
    case 'fatal':
      typeof obj === 'string' ? logger.fatal?.(obj) : logger.fatal?.(obj as Record<string, unknown>, msg);
      break;
    case 'error':
      typeof obj === 'string' ? logger.error(obj) : logger.error(obj as Record<string, unknown>, msg);
      break;
    case 'warn':
      typeof obj === 'string' ? logger.warn(obj) : logger.warn(obj as Record<string, unknown>, msg);
      break;
    case 'info':
      typeof obj === 'string' ? logger.info(obj) : logger.info(obj as Record<string, unknown>, msg);
      break;
    case 'debug':
    case 'trace':
      typeof obj === 'string' ? logger.debug(obj) : logger.debug(obj as Record<string, unknown>, msg);
      break;
    case 'silent':
    default:
      // no-op
      break;
  }
}

/**
 * Decide default logger level for browser/runtime by environment:
 * - CI            -> 'error' (minimal noise in pipelines)
 * - development   -> 'debug'
 * - test          -> 'warn'
 * - otherwise     -> 'warn'
 */
export function getDefaultLogLevel(): LogLevel {
  try {
    const hasWindow = typeof window !== 'undefined' && typeof (window as any).localStorage !== 'undefined';
    if (hasWindow) {
      const raw = (window as any).localStorage?.getItem?.('nb.flow.logs.options');
      if (raw) {
        const obj = JSON.parse(raw);
        const lvl = obj?.loggerLevel;
        const allowed: Record<string, true> = {
          silent: true,
          fatal: true,
          error: true,
          warn: true,
          info: true,
          debug: true,
          trace: true,
        };
        if (typeof lvl === 'string' && allowed[lvl]) {
          return lvl as LogLevel;
        }
      }
    }
  } catch (_) {
    // ignore parse / access errors and fallback to env
  }

  // 2) Fallback to env-based heuristic
  const penv = (typeof process !== 'undefined' ? (process as any).env || {} : {}) as Record<string, any>;
  const env = typeof penv.NODE_ENV === 'string' ? String(penv.NODE_ENV).toLowerCase() : undefined;
  const isCI = ['1', 'true', 'yes'].includes(String(penv.CI || '').toLowerCase()) || env === 'ci';
  if (isCI) return 'error';
  if (env === 'development') return 'debug';
  if (env === 'test') return 'warn';
  // 兜底：若无法识别环境，则按生产对待
  return 'warn';
}

/**
 * 高频事件的默认采样（与错误/慢日志无关），用于降低噪音。
 * 如需按环境差异化，可在此基础上扩展；当前保持统一策略。
 */
export function getDefaultSamples(): Record<string, number> {
  return {
    'model.update': 10,
    'event.flow.dispatch': 5,
    'model.dispatch': 5,
    'model.mount': 20,
    'model.unmount': 20,
  };
}

/**
 * 生成默认日志选项：在静态默认基础上合并高频采样策略。
 * 若后续通过 UI/本地存储/远程配置覆盖，仍可用 logManager.updateOptions 动态修改。
 */
export function getDefaultLogOptions(): LogOptions {
  const samples = { ...(DefaultLogOptions.samples || {}), ...getDefaultSamples() };
  return { ...DefaultLogOptions, samples };
}
