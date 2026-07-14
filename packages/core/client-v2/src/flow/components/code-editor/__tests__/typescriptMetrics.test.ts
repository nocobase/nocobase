/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPack } from '@nocobase/runjs/client-v2';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRunJSTypeScriptMetrics } from '../typescriptMetrics';
import { createRunJSTypeLibraryRegistry } from '../typescriptLibraryRegistry';
import {
  clearTypeScriptProjectCachesForTests,
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptProject,
} from '../typescriptProject';

function fakePack(): RunJSTypeLibraryPack {
  return {
    contentHash: 'fake-pack',
    dependencies: [],
    dependencyFiles: [
      {
        content: '{"name":"fake-lib","types":"index.d.ts"}',
        contentHash: 'fake-package-json',
        path: '/node_modules/fake-lib/package.json',
      },
      {
        content: 'export const answer: 42;',
        contentHash: 'fake-index',
        path: '/node_modules/fake-lib/index.d.ts',
      },
    ],
    id: 'fake-lib',
    libraryName: 'fakeLib',
    rootFiles: [
      {
        content: "interface RunJSLibraries { fakeLib: typeof import('fake-lib') }",
        contentHash: 'fake-bridge',
        path: '/__runjs__/fake-lib.d.ts',
      },
    ],
    version: '1.0.0',
  };
}

function createProject(code: string, metrics = createRunJSTypeScriptMetrics()): CodeEditorTypeScriptProject {
  const registry = createRunJSTypeLibraryRegistry();
  registry.register({
    id: 'fake-lib',
    libraryName: 'fakeLib',
    loader: () => fakePack(),
    topLevelNames: ['fakeLib'],
  });
  return {
    currentFilePath: 'src/main.ts',
    files: [{ content: code, path: 'src/main.ts' }],
    metrics,
    typeLibraryRegistry: registry,
  };
}

afterEach(() => {
  clearTypeScriptProjectCachesForTests();
  vi.unstubAllEnvs();
});

describe('RunJS TypeScript metrics', () => {
  it('counts requests, actual loads, cache hits, files, and rebuilds without timing assertions', async () => {
    const metrics = createRunJSTypeScriptMetrics();
    const code = 'ctx.libs.fakeLib.answer;';
    const project = createProject(code, metrics);
    const session = createTypeScriptProjectSession();

    await Promise.all([
      session.getCompletionResult(project, code.length, code, true),
      session.getHover(project, code.indexOf('fakeLib') + 2, code),
      session.getDiagnostics(project, code),
    ]);
    const concurrent = metrics.snapshot();

    expect(concurrent.packRequestIds).toEqual(['fake-lib']);
    expect(concurrent.actualLoadIds).toEqual(['fake-lib']);
    expect(concurrent.cacheHitIds).toEqual(['fake-lib']);
    expect(concurrent.dependencyFileCount).toBe(2);
    expect(concurrent.languageServiceCreationCount).toBe(1);
    expect(concurrent.languageServiceRebuildCount).toBe(0);
    expect(concurrent.programSourceFileCount).toBeGreaterThan(0);
    expect(concurrent.peakDeclarationCharacterCount).toBeGreaterThan(0);
    expect(concurrent.immutableCacheCharacterCount).toBeGreaterThan(0);

    const immutableCacheCount = concurrent.immutableCacheFileCount;
    const hotCode = 'ctx.libs.fakeLib.answer satisfies 42;';
    await session.getDiagnostics({ ...project, files: [{ content: hotCode, path: 'src/main.ts' }] }, hotCode);
    expect(metrics.snapshot()).toEqual(
      expect.objectContaining({
        immutableCacheFileCount: immutableCacheCount,
        languageServiceCreationCount: 1,
        languageServiceRebuildCount: 0,
      }),
    );

    await session.getDiagnostics(
      {
        ...project,
        files: [
          { content: hotCode, path: 'src/main.ts' },
          { content: 'export const added = true;', path: 'src/added.ts' },
        ],
      },
      hotCode,
    );
    expect(metrics.snapshot()).toEqual(
      expect.objectContaining({ languageServiceCreationCount: 2, languageServiceRebuildCount: 1 }),
    );
  });

  it('records deterministic TypeScript long tasks and remains disabled in production', () => {
    let now = 0;
    const metrics = createRunJSTypeScriptMetrics({ longTaskThresholdMs: 100, now: () => now });
    const startedAt = metrics.now();
    now = 101;
    metrics.recordSynchronousTypeScriptTask('diagnostics', startedAt);
    expect(metrics.snapshot().longTasks).toEqual([{ durationMs: 101, name: 'diagnostics', source: 'typescript' }]);

    vi.stubEnv('NODE_ENV', 'production');
    const disabled = createRunJSTypeScriptMetrics({ enabled: true });
    disabled.recordPackRequests(['react']);
    expect(disabled.snapshot()).toEqual(expect.objectContaining({ enabled: false, packRequestIds: [] }));
  });
});
