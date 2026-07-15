/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface RunJSTypeScriptPerformanceBudgetInput {
  antdButtonWarmReactP95Ms: number;
  concurrentSamePackLoaderCount: number;
  declarationGraphChunkCount: number;
  declarationGraphGzipBytes: number;
  declarationGraphRawBytes: number;
  hotDiagnosticsBaselineP95Ms: number;
  hotDiagnosticsP95Ms: number;
  initialChunkContainsThirdPartyDeclarations: boolean;
  initialChunkGzipIncrementBytes: number;
  languageServiceRebuildCountDuringHotInput: number;
  maximumTypeSystemLongTaskMs: number;
  reactColdP95Ms: number;
  singleIconColdP95Ms: number;
  typePackCount: number;
}

export interface RunJSTypeScriptPerformanceBudgetResult {
  actual: boolean | number;
  budget: boolean | number;
  id: string;
  passed: boolean;
  policy: 'ci-gate' | 'trend';
  unit: 'boolean' | 'bytes' | 'count' | 'ms';
}

export interface RunJSTypeScriptPerformanceBudgetReport {
  executeTask17: boolean;
  results: RunJSTypeScriptPerformanceBudgetResult[];
}

const KIB = 1024;
const MIB = 1024 * KIB;

export function evaluateRunJSTypeScriptPerformanceBudgets(
  input: RunJSTypeScriptPerformanceBudgetInput,
): RunJSTypeScriptPerformanceBudgetReport {
  const hotDiagnosticsBudgetMs = Math.min(100, input.hotDiagnosticsBaselineP95Ms * 1.2);
  const results: RunJSTypeScriptPerformanceBudgetResult[] = [
    {
      actual: input.initialChunkGzipIncrementBytes,
      budget: 50 * KIB,
      id: 'initial-code-editor-gzip-increment',
      passed: input.initialChunkGzipIncrementBytes <= 50 * KIB,
      policy: 'ci-gate',
      unit: 'bytes',
    },
    {
      actual: input.initialChunkContainsThirdPartyDeclarations,
      budget: false,
      id: 'initial-chunk-third-party-declarations',
      passed: !input.initialChunkContainsThirdPartyDeclarations,
      policy: 'ci-gate',
      unit: 'boolean',
    },
    {
      actual: input.declarationGraphChunkCount,
      budget: 60,
      id: 'shared-declaration-graph-chunks',
      passed: input.declarationGraphChunkCount <= 60 && input.declarationGraphChunkCount < input.typePackCount,
      policy: 'ci-gate',
      unit: 'count',
    },
    {
      actual: input.declarationGraphRawBytes,
      budget: 8 * MIB,
      id: 'declaration-graph-raw-bytes',
      passed: input.declarationGraphRawBytes <= 8 * MIB,
      policy: 'ci-gate',
      unit: 'bytes',
    },
    {
      actual: input.declarationGraphGzipBytes,
      budget: 2 * MIB,
      id: 'declaration-graph-gzip-bytes',
      passed: input.declarationGraphGzipBytes <= 2 * MIB,
      policy: 'ci-gate',
      unit: 'bytes',
    },
    {
      actual: input.hotDiagnosticsP95Ms,
      budget: hotDiagnosticsBudgetMs,
      id: 'hot-diagnostics-p95',
      passed: input.hotDiagnosticsP95Ms <= hotDiagnosticsBudgetMs,
      policy: 'trend',
      unit: 'ms',
    },
    {
      actual: input.reactColdP95Ms,
      budget: 400,
      id: 'react-cold-diagnostics-p95',
      passed: input.reactColdP95Ms <= 400,
      policy: 'trend',
      unit: 'ms',
    },
    {
      actual: input.antdButtonWarmReactP95Ms,
      budget: 300,
      id: 'antd-button-warm-react-p95',
      passed: input.antdButtonWarmReactP95Ms <= 300,
      policy: 'trend',
      unit: 'ms',
    },
    {
      actual: input.singleIconColdP95Ms,
      budget: 250,
      id: 'single-icon-cold-p95',
      passed: input.singleIconColdP95Ms <= 250,
      policy: 'trend',
      unit: 'ms',
    },
    {
      actual: input.languageServiceRebuildCountDuringHotInput,
      budget: 0,
      id: 'hot-input-language-service-rebuilds',
      passed: input.languageServiceRebuildCountDuringHotInput === 0,
      policy: 'ci-gate',
      unit: 'count',
    },
    {
      actual: input.concurrentSamePackLoaderCount,
      budget: 1,
      id: 'concurrent-same-pack-loader-count',
      passed: input.concurrentSamePackLoaderCount === 1,
      policy: 'ci-gate',
      unit: 'count',
    },
    {
      actual: input.maximumTypeSystemLongTaskMs,
      budget: 100,
      id: 'maximum-type-system-long-task',
      passed: input.maximumTypeSystemLongTaskMs <= 100,
      policy: 'trend',
      unit: 'ms',
    },
  ];
  return {
    executeTask17: input.maximumTypeSystemLongTaskMs > 100,
    results,
  };
}

export function renderRunJSTypeScriptPerformanceBudgetMarkdown(report: RunJSTypeScriptPerformanceBudgetReport): string {
  const lines = [
    '# RunJS TypeScript performance budgets',
    '',
    '| Budget | Policy | Actual | Limit | Result |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.results.map(
      (result) =>
        `| ${result.id} | ${result.policy} | ${String(result.actual)} ${result.unit} | ${String(result.budget)} ${
          result.unit
        } | ${result.passed ? 'PASS' : 'FAIL'} |`,
    ),
    '',
    `Task 17 decision: **${report.executeTask17 ? 'EXECUTE TASK 17' : 'DO NOT EXECUTE TASK 17'}**.`,
    '',
  ];
  return lines.join('\n');
}
