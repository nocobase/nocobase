/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, it, vi } from 'vitest';

vi.mock('../typescriptWorkerProjectSession', () => {
  throw new Error('worker chunk failed to load');
});

const createMainThreadSession = vi.fn(() => ({
  dispose() {},
  async getCompletionResult() {
    return null;
  },
  getDebugState() {
    return {
      allFileNames: [],
      disposed: false,
      fileVersions: {},
      immutableFileCount: 0,
      immutableSnapshotCreationCount: 0,
      languageServiceCreationCount: 0,
      rootFileNames: [],
    };
  },
  async getDiagnostics() {
    return [];
  },
  async getHover() {
    return null;
  },
  getLastInternalError() {
    return null;
  },
  whenDisposed() {
    return Promise.resolve();
  },
}));

vi.mock('../typescriptProjectRuntime', () => ({
  clearMainThreadTypeScriptProjectCachesForTests() {},
  createMainThreadTypeScriptProjectSession: createMainThreadSession,
}));

it('uses the main-thread fallback when the Worker runtime chunk fails to load', async () => {
  const { createTypeScriptProjectSession } = await import('../typescriptProject');
  const session = createTypeScriptProjectSession();

  await expect(
    session.getDiagnostics(
      { currentFilePath: 'main.ts', files: [{ content: 'const value = 1;', path: 'main.ts' }] },
      'const value = 1;',
    ),
  ).resolves.toEqual([]);
  expect(createMainThreadSession).toHaveBeenCalledTimes(1);
  session.dispose();
  await session.whenDisposed();
});
