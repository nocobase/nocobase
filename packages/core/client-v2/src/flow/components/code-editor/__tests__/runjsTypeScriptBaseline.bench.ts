/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { performance } from 'node:perf_hooks';
import { describe, it, vi } from 'vitest';

import { runJSTypeScriptPerformanceProbe } from '../../../../../../runjs/src/__tests__/fixtures/runjs-typescript-baseline';

const counters = vi.hoisted(() => ({ languageServiceCreations: 0 }));

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    createLanguageService: (...args: Parameters<typeof actual.createLanguageService>) => {
      counters.languageServiceCreations += 1;
      return actual.createLanguageService(...args);
    },
  };
});

describe('RunJS TypeScript baseline measurement', () => {
  it('prints reproducible browser Language Service timings without enforcing thresholds', async () => {
    const initialLoadStartedAt = performance.now();
    const { getTypeScriptCompletionResult, getTypeScriptProjectDiagnostics } = await import('../typescriptProject');
    const initialLoadMs = performance.now() - initialLoadStartedAt;
    const project = {
      currentFilePath: runJSTypeScriptPerformanceProbe.currentFilePath,
      files: runJSTypeScriptPerformanceProbe.files.map((file) => ({ ...file })),
    };
    const code = project.files[0].content;

    const firstDiagnosticStartedAt = performance.now();
    const firstDiagnostics = await getTypeScriptProjectDiagnostics(project, code);
    const firstDiagnosticMs = performance.now() - firstDiagnosticStartedAt;

    const firstCompletionStartedAt = performance.now();
    const firstCompletion = await getTypeScriptCompletionResult(project, code.length, code, true);
    const firstCompletionMs = performance.now() - firstCompletionStartedAt;

    const hotDiagnosticStartedAt = performance.now();
    const hotDiagnostics = await getTypeScriptProjectDiagnostics(project, code);
    const hotDiagnosticMs = performance.now() - hotDiagnosticStartedAt;

    console.info(
      'RUNJS_TYPESCRIPT_BASELINE',
      JSON.stringify(
        {
          completionCount: firstCompletion?.options.length || 0,
          firstCompletionMs,
          firstDiagnosticCount: firstDiagnostics.length,
          firstDiagnosticMs,
          hotDiagnosticCount: hotDiagnostics.length,
          hotDiagnosticMs,
          initialLoadMs,
          languageServiceCreations: counters.languageServiceCreations,
        },
        null,
        2,
      ),
    );
  });
});
