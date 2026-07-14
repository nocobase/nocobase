/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPack } from '@nocobase/runjs/client-v2';

import type { RunJSTypeLibraryLoadObserver } from './typescriptLibraryRegistry';

export type RunJSTypeScriptOperation = 'completion' | 'diagnostics' | 'hover' | 'language-service-create';

export interface RunJSTypeScriptDurationSample {
  durationMs: number;
  operation: RunJSTypeScriptOperation;
}

export interface RunJSTypeScriptLongTaskSample {
  durationMs: number;
  name: string;
  source: 'performance-observer' | 'typescript';
}

export interface RunJSTypeScriptMetricsSnapshot {
  actualLoadIds: string[];
  cacheHitIds: string[];
  dependencyFileCount: number;
  durationSamples: RunJSTypeScriptDurationSample[];
  enabled: boolean;
  immutableCacheCharacterCount: number;
  immutableCacheFileCount: number;
  languageServiceCreationCount: number;
  languageServiceRebuildCount: number;
  longTasks: RunJSTypeScriptLongTaskSample[];
  packLoadDurationMs: Record<string, number[]>;
  packRequestIds: string[];
  peakDeclarationCharacterCount: number;
  programSourceFileCount: number;
}

export interface RunJSTypeScriptMetricsOptions {
  enabled?: boolean;
  longTaskThresholdMs?: number;
  now?: () => number;
}

export interface RunJSTypeScriptWorkerStateSample {
  cacheHitIds: readonly string[];
  dependencyFileCount: number;
  immutableCacheCharacterCount: number;
  immutableCacheFileCount: number;
  languageServiceCreationCount: number;
  languageServiceRebuildCount: number;
  packRequestIds: readonly string[];
  peakDeclarationCharacterCount: number;
  programSourceFileCount: number;
}

type LongTaskPerformanceObserver = {
  disconnect(): void;
  observe(options: { buffered?: boolean; type: string }): void;
};

type LongTaskPerformanceObserverConstructor = new (
  callback: (list: { getEntries(): ArrayLike<{ duration: number; name: string }> }) => void,
) => LongTaskPerformanceObserver;

function isMetricsEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

function defaultNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export class RunJSTypeScriptMetrics {
  private readonly actualLoadIds: string[] = [];
  private readonly cacheHitIds: string[] = [];
  private dependencyFileCount = 0;
  private readonly durationSamples: RunJSTypeScriptDurationSample[] = [];
  readonly enabled: boolean;
  private immutableCacheCharacterCount = 0;
  private immutableCacheFileCount = 0;
  private languageServiceCreationCount = 0;
  private languageServiceRebuildCount = 0;
  private readonly longTasks: RunJSTypeScriptLongTaskSample[] = [];
  private longTaskObserver: LongTaskPerformanceObserver | null = null;
  private readonly longTaskThresholdMs: number;
  private readonly nowProvider: () => number;
  private readonly packLoadDurationMs = new Map<string, number[]>();
  private readonly packRequestIds: string[] = [];
  private peakDeclarationCharacterCount = 0;
  private programSourceFileCount = 0;

  constructor(options: RunJSTypeScriptMetricsOptions = {}) {
    this.enabled = options.enabled !== false && isMetricsEnvironment();
    this.longTaskThresholdMs = options.longTaskThresholdMs ?? 100;
    this.nowProvider = options.now || defaultNow;
  }

  now(): number {
    return this.nowProvider();
  }

  recordDuration(operation: RunJSTypeScriptOperation, startedAt: number): void {
    if (!this.enabled) return;
    this.durationSamples.push({ durationMs: Math.max(0, this.now() - startedAt), operation });
  }

  recordSynchronousTypeScriptTask(name: string, startedAt: number): void {
    if (!this.enabled) return;
    const durationMs = Math.max(0, this.now() - startedAt);
    if (durationMs > this.longTaskThresholdMs) {
      this.longTasks.push({ durationMs, name, source: 'typescript' });
    }
  }

  recordLanguageServiceCreation(rebuild: boolean): void {
    if (!this.enabled) return;
    this.languageServiceCreationCount += 1;
    if (rebuild) this.languageServiceRebuildCount += 1;
  }

  recordPackRequests(packIds: readonly string[]): void {
    if (!this.enabled) return;
    this.packRequestIds.push(...packIds);
  }

  recordPreparedPacks(packs: readonly RunJSTypeLibraryPack[]): void {
    if (!this.enabled) return;
    const dependencyFiles = new Map<string, string>();
    const declarationFiles = new Map<string, string>();
    for (const pack of packs) {
      for (const file of pack.rootFiles) declarationFiles.set(file.path, file.content);
      for (const file of pack.dependencyFiles) {
        dependencyFiles.set(file.path, file.content);
        declarationFiles.set(file.path, file.content);
      }
    }
    this.dependencyFileCount = Math.max(this.dependencyFileCount, dependencyFiles.size);
    const declarationCharacterCount = [...declarationFiles.values()].reduce((sum, content) => sum + content.length, 0);
    this.peakDeclarationCharacterCount = Math.max(this.peakDeclarationCharacterCount, declarationCharacterCount);
  }

  recordProgramSourceFileCount(sourceFileCount: number): void {
    if (!this.enabled) return;
    this.programSourceFileCount = Math.max(this.programSourceFileCount, sourceFileCount);
  }

  recordImmutableCache(fileCount: number, characterCount: number): void {
    if (!this.enabled) return;
    this.immutableCacheFileCount = Math.max(this.immutableCacheFileCount, fileCount);
    this.immutableCacheCharacterCount = Math.max(this.immutableCacheCharacterCount, characterCount);
  }

  recordWorkerState(sample: RunJSTypeScriptWorkerStateSample): void {
    if (!this.enabled) return;
    this.cacheHitIds.push(...sample.cacheHitIds);
    this.packRequestIds.push(...sample.packRequestIds);
    this.dependencyFileCount = Math.max(this.dependencyFileCount, sample.dependencyFileCount);
    this.immutableCacheCharacterCount = Math.max(
      this.immutableCacheCharacterCount,
      sample.immutableCacheCharacterCount,
    );
    this.immutableCacheFileCount = Math.max(this.immutableCacheFileCount, sample.immutableCacheFileCount);
    this.languageServiceCreationCount += sample.languageServiceCreationCount;
    this.languageServiceRebuildCount += sample.languageServiceRebuildCount;
    this.peakDeclarationCharacterCount = Math.max(
      this.peakDeclarationCharacterCount,
      sample.peakDeclarationCharacterCount,
    );
    this.programSourceFileCount = Math.max(this.programSourceFileCount, sample.programSourceFileCount);
  }

  createLibraryLoadObserver(): RunJSTypeLibraryLoadObserver | undefined {
    if (!this.enabled) return undefined;
    return {
      onCacheHit: (packId) => {
        this.cacheHitIds.push(packId);
      },
      onLoadEnd: (packId, durationMs) => {
        this.actualLoadIds.push(packId);
        const samples = this.packLoadDurationMs.get(packId) || [];
        samples.push(durationMs);
        this.packLoadDurationMs.set(packId, samples);
      },
      now: () => this.now(),
    };
  }

  startLongTaskObservation(): () => void {
    if (!this.enabled || typeof globalThis.PerformanceObserver === 'undefined') return () => undefined;
    const Observer = globalThis.PerformanceObserver as unknown as LongTaskPerformanceObserverConstructor;
    try {
      this.longTaskObserver = new Observer((list) => {
        for (const entry of Array.from(list.getEntries())) {
          if (entry.duration <= this.longTaskThresholdMs) continue;
          this.longTasks.push({
            durationMs: entry.duration,
            name: entry.name || 'longtask',
            source: 'performance-observer',
          });
        }
      });
      this.longTaskObserver.observe({ buffered: false, type: 'longtask' });
    } catch (_) {
      this.longTaskObserver = null;
    }
    return () => this.stopLongTaskObservation();
  }

  stopLongTaskObservation(): void {
    this.longTaskObserver?.disconnect();
    this.longTaskObserver = null;
  }

  snapshot(): RunJSTypeScriptMetricsSnapshot {
    return {
      actualLoadIds: uniqueSorted(this.actualLoadIds),
      cacheHitIds: uniqueSorted(this.cacheHitIds),
      dependencyFileCount: this.dependencyFileCount,
      durationSamples: this.durationSamples.map((sample) => ({ ...sample })),
      enabled: this.enabled,
      immutableCacheCharacterCount: this.immutableCacheCharacterCount,
      immutableCacheFileCount: this.immutableCacheFileCount,
      languageServiceCreationCount: this.languageServiceCreationCount,
      languageServiceRebuildCount: this.languageServiceRebuildCount,
      longTasks: this.longTasks.map((sample) => ({ ...sample })),
      packLoadDurationMs: Object.fromEntries(
        [...this.packLoadDurationMs.entries()].map(([packId, samples]) => [packId, [...samples]]),
      ),
      packRequestIds: uniqueSorted(this.packRequestIds),
      peakDeclarationCharacterCount: this.peakDeclarationCharacterCount,
      programSourceFileCount: this.programSourceFileCount,
    };
  }
}

export function createRunJSTypeScriptMetrics(options?: RunJSTypeScriptMetricsOptions): RunJSTypeScriptMetrics {
  return new RunJSTypeScriptMetrics(options);
}
