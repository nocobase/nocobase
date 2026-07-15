/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  evaluateRunJSTypeScriptPerformanceBudgets,
  renderRunJSTypeScriptPerformanceBudgetMarkdown,
} from './runjsTypeScriptPerformanceBudgets';

describe('RunJS TypeScript performance budgets', () => {
  it('evaluates every default budget and keeps stable checks as CI gates', () => {
    const report = evaluateRunJSTypeScriptPerformanceBudgets({
      antdButtonWarmReactP95Ms: 250,
      concurrentSamePackLoaderCount: 1,
      declarationGraphChunkCount: 53,
      declarationGraphGzipBytes: 2 * 1024 * 1024,
      declarationGraphRawBytes: 8 * 1024 * 1024,
      hotDiagnosticsBaselineP95Ms: 50,
      hotDiagnosticsP95Ms: 60,
      initialChunkContainsThirdPartyDeclarations: false,
      initialChunkGzipIncrementBytes: 50 * 1024,
      languageServiceRebuildCountDuringHotInput: 0,
      maximumTypeSystemLongTaskMs: 100,
      reactColdP95Ms: 400,
      singleIconColdP95Ms: 250,
      typePackCount: 109,
    });

    expect(report.results).toHaveLength(12);
    expect(report.results.every((result) => result.passed)).toBe(true);
    expect(report.results.filter((result) => result.policy === 'ci-gate').map((result) => result.id)).toEqual([
      'initial-code-editor-gzip-increment',
      'initial-chunk-third-party-declarations',
      'shared-declaration-graph-chunks',
      'declaration-graph-raw-bytes',
      'declaration-graph-gzip-bytes',
      'hot-input-language-service-rebuilds',
      'concurrent-same-pack-loader-count',
    ]);
    expect(report.executeTask17).toBe(false);
    expect(renderRunJSTypeScriptPerformanceBudgetMarkdown(report)).toContain('DO NOT EXECUTE TASK 17');
  });

  it('triggers task 17 for a type-system long task over 100 ms', () => {
    const report = evaluateRunJSTypeScriptPerformanceBudgets({
      antdButtonWarmReactP95Ms: 0,
      concurrentSamePackLoaderCount: 1,
      declarationGraphChunkCount: 53,
      declarationGraphGzipBytes: 0,
      declarationGraphRawBytes: 0,
      hotDiagnosticsBaselineP95Ms: 1,
      hotDiagnosticsP95Ms: 1,
      initialChunkContainsThirdPartyDeclarations: false,
      initialChunkGzipIncrementBytes: 0,
      languageServiceRebuildCountDuringHotInput: 0,
      maximumTypeSystemLongTaskMs: 100.01,
      reactColdP95Ms: 0,
      singleIconColdP95Ms: 0,
      typePackCount: 109,
    });

    expect(report.executeTask17).toBe(true);
    expect(report.results.find((result) => result.id === 'maximum-type-system-long-task')?.passed).toBe(false);
  });

  it('rejects one declaration chunk per logical pack even when the chunk-count ceiling is met', () => {
    const report = evaluateRunJSTypeScriptPerformanceBudgets({
      antdButtonWarmReactP95Ms: 0,
      concurrentSamePackLoaderCount: 1,
      declarationGraphChunkCount: 60,
      declarationGraphGzipBytes: 0,
      declarationGraphRawBytes: 0,
      hotDiagnosticsBaselineP95Ms: 1,
      hotDiagnosticsP95Ms: 1,
      initialChunkContainsThirdPartyDeclarations: false,
      initialChunkGzipIncrementBytes: 0,
      languageServiceRebuildCountDuringHotInput: 0,
      maximumTypeSystemLongTaskMs: 0,
      reactColdP95Ms: 0,
      singleIconColdP95Ms: 0,
      typePackCount: 60,
    });

    expect(report.results.find((result) => result.id === 'shared-declaration-graph-chunks')?.passed).toBe(false);
  });
});
