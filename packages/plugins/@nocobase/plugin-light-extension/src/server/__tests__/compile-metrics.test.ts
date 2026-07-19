/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS,
  LIGHT_EXTENSION_COMPILE_METRIC_OPERATIONS,
  LIGHT_EXTENSION_COMPILE_METRIC_RESULTS,
  LIGHT_EXTENSION_COMPILE_METRIC_STAGES,
  LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
} from '../../shared/compileMetrics';
import { LightExtensionError } from '../../shared/errors';
import {
  classifyLightExtensionCompileMetricsError,
  LightExtensionCompileMetricsProbe,
} from '../services/LightExtensionCompileMetrics';

describe('light extension compile metrics', () => {
  it('keeps the versioned operation, result, stage, and counter names stable', () => {
    expect(LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION).toBe(1);
    expect(LIGHT_EXTENSION_COMPILE_METRIC_OPERATIONS).toEqual(['workspacePreview', 'saveSource', 'runtimeCompile']);
    expect(LIGHT_EXTENSION_COMPILE_METRIC_RESULTS).toEqual(['success', 'rejected', 'failed', 'outdated']);
    expect(LIGHT_EXTENSION_COMPILE_METRIC_STAGES).toEqual([
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
    ]);
    expect(LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS).toEqual([
      'repoFileCount',
      'repoByteSize',
      'changedFileCount',
      'entryCount',
      'affectedEntryCount',
      'compiledEntryCount',
      'skippedEntryCount',
      'blobContentQueryCount',
      'blobContentRowCount',
      'snapshotMaterializationCount',
      'treeNormalizationCount',
      'referenceScanCount',
    ]);
  });

  it('emits one sanitized summary and ignores duplicate finish calls', async () => {
    const summaries = [];
    const times = [1, 3, 8, 13];
    const probe = new LightExtensionCompileMetricsProbe(
      'saveSource',
      (summary) => summaries.push(summary),
      () => times.shift() || 13,
    );

    probe.increment('changedFileCount');
    probe.set('repoFileCount', 10);
    probe.measure('push', () => undefined);
    await probe.finish('success');
    await probe.finish('failed');

    expect(summaries).toEqual([
      {
        schemaVersion: 1,
        operation: 'saveSource',
        result: 'success',
        durationsMs: {
          push: 5,
          total: 12,
        },
        counters: expect.objectContaining({
          changedFileCount: 1,
          repoFileCount: 10,
        }),
      },
    ]);
    expect(Object.keys(summaries[0])).toEqual(['schemaVersion', 'operation', 'result', 'durationsMs', 'counters']);
  });

  it('rejects invalid counter values without emitting them', () => {
    const probe = new LightExtensionCompileMetricsProbe('runtimeCompile');

    expect(() => probe.increment('compiledEntryCount', -1)).toThrow(RangeError);
    expect(() => probe.set('repoByteSize', 1.5)).toThrow(RangeError);
  });

  it('does not let synchronous or asynchronous collector failures change the operation result', async () => {
    const synchronous = new LightExtensionCompileMetricsProbe('workspacePreview', () => {
      throw new Error('collector unavailable');
    });
    const asynchronous = new LightExtensionCompileMetricsProbe('runtimeCompile', async () => {
      throw new Error('collector unavailable');
    });

    await expect(synchronous.finish('success')).resolves.toBeUndefined();
    await expect(asynchronous.finish('rejected')).resolves.toBeUndefined();
  });

  it('maps validation and source conflicts to stable results', () => {
    expect(
      classifyLightExtensionCompileMetricsError(
        new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'invalid workspace'),
      ),
    ).toBe('rejected');
    expect(
      classifyLightExtensionCompileMetricsError(
        new LightExtensionError('LIGHT_EXTENSION_SOURCE_OUTDATED', 'head changed'),
      ),
    ).toBe('outdated');
    expect(classifyLightExtensionCompileMetricsError(new Error('compiler crashed'))).toBe('failed');
  });
});
