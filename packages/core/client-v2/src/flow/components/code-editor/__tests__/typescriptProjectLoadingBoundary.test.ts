/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, afterEach, expect, it, vi } from 'vitest';

import {
  createTypeScriptProjectSession as createProjectSession,
  type CodeEditorTypeScriptProject,
  type CodeEditorTypeScriptProjectSession,
} from '../typescriptProject';
import { shutdownTypeScriptProjectSessionSuite } from './helpers/withTypeScriptProjectSession';

const counters = vi.hoisted(() => ({
  mainRuntimeLoads: vi.fn(),
  mainSessionCreates: vi.fn(),
  workerFactoryCalls: vi.fn(),
  workerAvailable: true,
  workerRuntimeLoads: vi.fn(),
}));

vi.mock('../typescriptWorkerProjectSession', () => {
  counters.workerRuntimeLoads();
  return {
    canUseTypeScriptWorker: () => counters.workerAvailable,
    WorkerBackedTypeScriptProjectSession: class {
      constructor(private readonly workerFactory?: () => unknown) {}
      dispose() {}
      async getCompletionResult() {
        this.workerFactory?.();
        return null;
      }
      getDebugState() {
        return emptyDebugState();
      }
      async getDiagnostics() {
        this.workerFactory?.();
        return [];
      }
      async getHover() {
        this.workerFactory?.();
        return null;
      }
      getLastInternalError() {
        return null;
      }
      whenDisposed() {
        return Promise.resolve();
      }
    },
  };
});

vi.mock('../typescriptProjectRuntime', () => {
  counters.mainRuntimeLoads();
  return {
    clearMainThreadTypeScriptProjectCachesForTests() {},
    createMainThreadTypeScriptProjectSession() {
      counters.mainSessionCreates();
      return {
        dispose() {},
        async getCompletionResult() {
          return null;
        },
        getDebugState: emptyDebugState,
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
      };
    },
  };
});

const sessions = new Set<CodeEditorTypeScriptProjectSession>();

function createTypeScriptProjectSession(
  options?: Parameters<typeof createProjectSession>[0],
): CodeEditorTypeScriptProjectSession {
  const session = createProjectSession(options);
  sessions.add(session);
  return session;
}

afterEach(async () => {
  for (const session of sessions) session.dispose();
  await Promise.all([...sessions].map((session) => session.whenDisposed()));
  sessions.clear();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

it('loads TypeScript implementations only for requests and keeps the main runtime out of the Worker path', async () => {
  const workerFactory = () => {
    counters.workerFactoryCalls();
    return {};
  };
  const session = createTypeScriptProjectSession({ workerFactory });

  expect(counters.workerRuntimeLoads).not.toHaveBeenCalled();
  expect(counters.mainRuntimeLoads).not.toHaveBeenCalled();
  expect(counters.workerFactoryCalls).not.toHaveBeenCalled();

  expect(await session.getDiagnostics(project, project.files[0].content)).toEqual([]);
  expect(counters.workerRuntimeLoads).toHaveBeenCalledTimes(1);
  expect(counters.workerFactoryCalls).toHaveBeenCalledTimes(1);
  expect(counters.mainRuntimeLoads).not.toHaveBeenCalled();
  expect(counters.mainSessionCreates).not.toHaveBeenCalled();

  counters.workerAvailable = false;
  const fallbackSession = createTypeScriptProjectSession();
  expect(counters.mainRuntimeLoads).not.toHaveBeenCalled();
  expect(await fallbackSession.getDiagnostics(project, project.files[0].content)).toEqual([]);
  expect(counters.mainRuntimeLoads).toHaveBeenCalledTimes(1);
  expect(counters.mainSessionCreates).toHaveBeenCalledTimes(1);

  session.dispose();
  fallbackSession.dispose();
  await Promise.all([session.whenDisposed(), fallbackSession.whenDisposed()]);
});

const project: CodeEditorTypeScriptProject = {
  currentFilePath: 'main.ts',
  files: [{ content: 'const value: number = 1;', path: 'main.ts' }],
};

function emptyDebugState() {
  return {
    allFileNames: [],
    disposed: false,
    fileVersions: {},
    immutableFileCount: 0,
    immutableSnapshotCreationCount: 0,
    languageServiceCreationCount: 0,
    rootFileNames: [],
  };
}
