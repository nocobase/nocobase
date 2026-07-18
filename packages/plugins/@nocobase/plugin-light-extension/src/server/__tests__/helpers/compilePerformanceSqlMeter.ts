/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import type { CompilePerformanceSqlMeasurement } from './compilePerformanceAcceptanceReport';

export interface SqlCaptureResult<T> {
  value?: T;
  error?: unknown;
  sql: CompilePerformanceSqlMeasurement;
}

interface SqlCaptureState extends CompilePerformanceSqlMeasurement {
  starts: WeakMap<object, number>;
  fallbackStarts: number[];
}

export interface SequelizeQueryHooks {
  addHook(
    hookType: 'beforeQuery' | 'afterQuery',
    hookName: string,
    hook: (options: unknown, query: unknown) => void,
  ): void;
  removeHook(hookType: 'beforeQuery' | 'afterQuery', hookName: string): void;
}

export class SaveSqlQueryMeter {
  private readonly storage = new AsyncLocalStorage<SqlCaptureState>();

  private readonly hookName = `light-extension-benchmark-${randomUUID()}`;

  constructor(private readonly sequelize: SequelizeQueryHooks) {
    sequelize.addHook('beforeQuery', this.hookName, (options, query) => this.beforeQuery(options, query));
    sequelize.addHook('afterQuery', this.hookName, (options, query) => this.afterQuery(options, query));
  }

  async capture<T>(run: () => Promise<T>): Promise<SqlCaptureResult<T>> {
    const state: SqlCaptureState = {
      queryCount: 0,
      totalDurationMs: 0,
      starts: new WeakMap<object, number>(),
      fallbackStarts: [],
    };
    try {
      const value = await this.storage.run(state, run);
      return { value, sql: measurementFromState(state) };
    } catch (error) {
      return { error, sql: measurementFromState(state) };
    }
  }

  dispose(): void {
    this.sequelize.removeHook('beforeQuery', this.hookName);
    this.sequelize.removeHook('afterQuery', this.hookName);
  }

  private beforeQuery(options: unknown, query: unknown): void {
    const state = this.storage.getStore();
    if (!state) {
      return;
    }
    state.queryCount += 1;
    const key = queryKey(options, query);
    const startedAt = performance.now();
    if (key) {
      state.starts.set(key, startedAt);
    } else {
      state.fallbackStarts.push(startedAt);
    }
  }

  private afterQuery(options: unknown, query: unknown): void {
    const state = this.storage.getStore();
    if (!state) {
      return;
    }
    const key = queryKey(options, query);
    const startedAt = key ? state.starts.get(key) : state.fallbackStarts.shift();
    if (typeof startedAt === 'number') {
      state.totalDurationMs += Math.max(0, performance.now() - startedAt);
      if (key) {
        state.starts.delete(key);
      }
    }
  }
}

function queryKey(options: unknown, query: unknown): object | undefined {
  if (typeof query === 'object' && query !== null) {
    return query;
  }
  if (typeof options === 'object' && options !== null) {
    return options;
  }
  return undefined;
}

function measurementFromState(state: SqlCaptureState): CompilePerformanceSqlMeasurement {
  return {
    queryCount: state.queryCount,
    totalDurationMs: Number(state.totalDurationMs.toFixed(3)),
  };
}
