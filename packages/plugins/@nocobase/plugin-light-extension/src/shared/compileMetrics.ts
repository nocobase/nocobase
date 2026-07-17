/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION = 1 as const;

export const LIGHT_EXTENSION_COMPILE_METRIC_OPERATIONS = ['workspacePreview', 'saveSource', 'runtimeCompile'] as const;

export const LIGHT_EXTENSION_COMPILE_METRIC_RESULTS = ['success', 'rejected', 'failed', 'outdated'] as const;

export const LIGHT_EXTENSION_COMPILE_METRIC_STAGES = [
  'total',
  'push',
  'snapshotMaterialize',
  'treePrepare',
  'workspaceValidation',
  'entryReconcile',
  'compilePlan',
  'compileEntries',
  'artifactPersist',
  'referenceRefresh',
  'transaction',
] as const;

export const LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS = [
  'repoFileCount',
  'repoByteSize',
  'changedFileCount',
  'entryCount',
  'affectedEntryCount',
  'compiledEntryCount',
  'reusedEntryCount',
  'skippedEntryCount',
  'compileCacheHitCount',
  'blobContentQueryCount',
  'blobContentRowCount',
  'snapshotMaterializationCount',
  'treeNormalizationCount',
  'referenceScanCount',
] as const;

export type LightExtensionCompileMetricOperation = (typeof LIGHT_EXTENSION_COMPILE_METRIC_OPERATIONS)[number];

export type LightExtensionCompileMetricResult = (typeof LIGHT_EXTENSION_COMPILE_METRIC_RESULTS)[number];

export type LightExtensionCompileMetricStage = (typeof LIGHT_EXTENSION_COMPILE_METRIC_STAGES)[number];

export type LightExtensionCompileMetricCounter = (typeof LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS)[number];

export interface LightExtensionCompileMetricsSummary {
  schemaVersion: typeof LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION;
  operation: LightExtensionCompileMetricOperation;
  result: LightExtensionCompileMetricResult;
  durationsMs: Partial<Record<LightExtensionCompileMetricStage, number>>;
  counters: Record<LightExtensionCompileMetricCounter, number>;
}
