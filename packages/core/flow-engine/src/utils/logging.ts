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
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  trace: (...args: any[]) => void;
  fatal: (...args: any[]) => void;
  child: (bindings: Record<string, any>) => LoggerLike;
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
};

export function isLevelEnabled(logger: pino.Logger, level: LogLevel): boolean {
  const l = logger as unknown as PinoIntrospect & { level?: string };
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
 * Decide default logger level for browser/runtime by NODE_ENV:
 * - development -> 'debug'
 * - test/ci     -> 'info'
 * - otherwise   -> 'warn'
 */
export function getDefaultLogLevel(): LogLevel {
  const env =
    typeof process !== 'undefined' && (process as any)?.env?.NODE_ENV
      ? String((process as any).env.NODE_ENV).toLowerCase()
      : undefined;
  if (env === 'development') return 'debug';
  if (env === 'test' || env === 'ci') return 'info';
  // 兜底：若无法识别环境，则按生产对待
  return 'warn';
}
