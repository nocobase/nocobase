/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { performance } from 'node:perf_hooks';

import {
  LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS,
  LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
  type LightExtensionCompileMetricCounter,
  type LightExtensionCompileMetricOperation,
  type LightExtensionCompileMetricResult,
  type LightExtensionCompileMetricStage,
  type LightExtensionCompileMetricsSummary,
} from '../../shared/compileMetrics';
import { isLightExtensionError } from '../../shared/errors';

export type LightExtensionCompileMetricsCollector =
  | ((summary: LightExtensionCompileMetricsSummary) => void | Promise<void>)
  | {
      collect(summary: LightExtensionCompileMetricsSummary): void | Promise<void>;
    };

export interface LightExtensionCompileMetricsRecorder {
  increment(counter: LightExtensionCompileMetricCounter, amount?: number): void;
  set(counter: LightExtensionCompileMetricCounter, value: number): void;
  measure<T>(stage: LightExtensionCompileMetricStage, run: () => T): T;
  measureAsync<T>(stage: LightExtensionCompileMetricStage, run: () => Promise<T>): Promise<T>;
}

type MonotonicClock = () => number;

export class LightExtensionCompileMetricsProbe implements LightExtensionCompileMetricsRecorder {
  private readonly startedAt: number;

  private readonly durationsMs: Partial<Record<LightExtensionCompileMetricStage, number>> = {};

  private readonly counters: Record<LightExtensionCompileMetricCounter, number> = Object.fromEntries(
    LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map((counter) => [counter, 0]),
  ) as Record<LightExtensionCompileMetricCounter, number>;

  private finished = false;

  constructor(
    private readonly operation: LightExtensionCompileMetricOperation,
    private readonly collector?: LightExtensionCompileMetricsCollector,
    private readonly clock: MonotonicClock = performance.now.bind(performance),
  ) {
    this.startedAt = this.clock();
  }

  increment(counter: LightExtensionCompileMetricCounter, amount = 1): void {
    assertNonNegativeInteger(amount, counter);
    this.counters[counter] += amount;
  }

  set(counter: LightExtensionCompileMetricCounter, value: number): void {
    assertNonNegativeInteger(value, counter);
    this.counters[counter] = value;
  }

  measure<T>(stage: LightExtensionCompileMetricStage, run: () => T): T {
    const startedAt = this.clock();
    try {
      return run();
    } finally {
      this.addDuration(stage, this.clock() - startedAt);
    }
  }

  async measureAsync<T>(stage: LightExtensionCompileMetricStage, run: () => Promise<T>): Promise<T> {
    const startedAt = this.clock();
    try {
      return await run();
    } finally {
      this.addDuration(stage, this.clock() - startedAt);
    }
  }

  async finish(result: LightExtensionCompileMetricResult): Promise<void> {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.addDuration('total', this.clock() - this.startedAt);
    if (!this.collector) {
      return;
    }

    const summary: LightExtensionCompileMetricsSummary = {
      schemaVersion: LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
      operation: this.operation,
      result,
      durationsMs: { ...this.durationsMs },
      counters: { ...this.counters },
    };
    try {
      if (typeof this.collector === 'function') {
        await this.collector(summary);
      } else {
        await this.collector.collect(summary);
      }
    } catch {
      // Metrics collection must never affect preview, compilation, or persistence results.
    }
  }

  private addDuration(stage: LightExtensionCompileMetricStage, durationMs: number): void {
    const normalizedDuration = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;
    this.durationsMs[stage] = (this.durationsMs[stage] || 0) + normalizedDuration;
  }
}

export function combineLightExtensionCompileMetricsRecorders(
  ...recorders: Array<LightExtensionCompileMetricsRecorder | undefined>
): LightExtensionCompileMetricsRecorder | undefined {
  const available = recorders.filter(
    (recorder): recorder is LightExtensionCompileMetricsRecorder => typeof recorder !== 'undefined',
  );
  if (available.length === 0) {
    return undefined;
  }
  if (available.length === 1) {
    return available[0];
  }

  return {
    increment(counter, amount) {
      for (const recorder of available) {
        recorder.increment(counter, amount);
      }
    },
    set(counter, value) {
      for (const recorder of available) {
        recorder.set(counter, value);
      }
    },
    measure(stage, run) {
      return measureWithRecorders(available, stage, run);
    },
    measureAsync(stage, run) {
      return measureAsyncWithRecorders(available, stage, run);
    },
  };
}

export function classifyLightExtensionCompileMetricsError(error: unknown): LightExtensionCompileMetricResult {
  if (isLightExtensionError(error)) {
    if (error.code === 'LIGHT_EXTENSION_SOURCE_OUTDATED') {
      return 'outdated';
    }
    if (error.status >= 400 && error.status < 500) {
      return 'rejected';
    }
  }

  return 'failed';
}

export function createLightExtensionCompileMetricsLoggerCollector(logger: {
  debug: (details: Record<string, unknown>, message?: string) => unknown;
}): LightExtensionCompileMetricsCollector {
  return (summary) => {
    logger.debug({ lightExtensionCompileMetrics: summary }, 'Light extension compile metrics');
  };
}

function measureWithRecorders<T>(
  recorders: LightExtensionCompileMetricsRecorder[],
  stage: LightExtensionCompileMetricStage,
  run: () => T,
  index = 0,
): T {
  const recorder = recorders[index];
  return recorder.measure(stage, () =>
    index === recorders.length - 1 ? run() : measureWithRecorders(recorders, stage, run, index + 1),
  );
}

function measureAsyncWithRecorders<T>(
  recorders: LightExtensionCompileMetricsRecorder[],
  stage: LightExtensionCompileMetricStage,
  run: () => Promise<T>,
  index = 0,
): Promise<T> {
  const recorder = recorders[index];
  return recorder.measureAsync(stage, () =>
    index === recorders.length - 1 ? run() : measureAsyncWithRecorders(recorders, stage, run, index + 1),
  );
}

function assertNonNegativeInteger(value: number, counter: LightExtensionCompileMetricCounter): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Light extension compile metric counter "${counter}" must be a non-negative integer`);
  }
}
