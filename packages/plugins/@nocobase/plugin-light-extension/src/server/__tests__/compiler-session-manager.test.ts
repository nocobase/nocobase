/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  compileRunJSSourceWorkspace,
  RunJSEntryCompilerSession,
  type CompileRunJSSourceWorkspaceInput,
  type CompileRunJSSourceWorkspaceResult,
  type RunJSCompilerSessionContract,
  type RunJSEntryCompilerSessionDebugState,
} from '@nocobase/runjs/compiler';

import {
  LightExtensionCompilerSessionManager,
  type LightExtensionCompilerSessionLike,
  type LightExtensionCompilerSessionMetric,
} from '../services/LightExtensionCompilerSessionManager';

function contract(
  repoId: string,
  entryIdentity: string,
  entryPath = `src/entries/${entryIdentity}/index.ts`,
  compilerBuildId = 'compiler-build-1',
): RunJSCompilerSessionContract {
  return {
    repoId,
    entryIdentity,
    entryPath,
    runtimeVersion: 'v2',
    surfaceStyle: 'value',
    modelUse: 'RunJSValue',
    runtimeContract: 'runtime-v1',
    compilerBuildId,
    securityPolicyFingerprint: 'security-v1',
    typeLibraryFingerprint: 'types-v1',
  };
}

function compileInput(
  sessionContract: RunJSCompilerSessionContract,
  content: string,
  extraFiles: CompileRunJSSourceWorkspaceInput['files'] = [],
): CompileRunJSSourceWorkspaceInput {
  return {
    files: [{ path: sessionContract.entryPath, content }, ...extraFiles],
    entry: sessionContract.entryPath,
    runtimeVersion: sessionContract.runtimeVersion,
    surfaceStyle: sessionContract.surfaceStyle,
    legacy: {
      version: sessionContract.runtimeVersion,
      surfaceStyle: sessionContract.surfaceStyle,
      language: 'typescript',
      metadata: { kind: 'runjs', modelUse: sessionContract.modelUse },
    },
  };
}

describe('LightExtensionCompilerSessionManager', () => {
  it('reuses one Entry session and updates the Repo canonical VFS versions', async () => {
    const metrics: LightExtensionCompilerSessionMetric[] = [];
    const manager = new LightExtensionCompilerSessionManager({
      metricObserver: (metric) => metrics.push(metric),
      sweepIntervalMs: 0,
    });
    const sessionContract = contract('repo-1', 'entry-1');
    const firstInput = compileInput(sessionContract, `import { value } from './shared'; return value;`, [
      { path: 'src/entries/entry-1/shared.ts', content: `export const value = 'first';` },
    ]);
    const secondInput = compileInput(sessionContract, `import { value } from './shared'; return value + '!';`, [
      { path: 'src/entries/entry-1/shared.ts', content: `export const value = 'first';` },
    ]);

    const first = await manager.compile({ contract: sessionContract, input: firstInput });
    const second = await manager.compile({ contract: sessionContract, input: secondInput });
    expect(first.execution).toBe('session');
    expect(second.execution).toBe('session');
    expect(second.sessionKey).toBe(first.sessionKey);
    expect(first.result).toEqual(await compileRunJSSourceWorkspace(firstInput));
    expect(second.result).toEqual(await compileRunJSSourceWorkspace(secondInput));
    expect(manager.getDebugState()).toMatchObject({ activeRepos: 1, activeEntries: 1 });
    expect(manager.getDebugState().repos[0].fileVersions).toEqual({
      'src/entries/entry-1/index.ts': 2,
      'src/entries/entry-1/shared.ts': 1,
    });
    expect(metrics.filter((metric) => metric.name === 'compile.session.miss')).toHaveLength(1);
    expect(metrics.filter((metric) => metric.name === 'compile.session.hit')).toHaveLength(1);
    expect(metrics.some((metric) => metric.name === 'compile.entry.esbuild.rebuild' && metric.reused)).toBe(true);
    await manager.dispose();
  });

  it('tracks add, delete, rename, and unchanged delta versions in the Repo container', async () => {
    const manager = new LightExtensionCompilerSessionManager({ sweepIntervalMs: 0 });
    const sessionContract = contract('repo-versions', 'entry-versions');
    const base = compileInput(sessionContract, `return 1;`, [
      { path: 'src/entries/entry-versions/shared.ts', content: `export const value = 1;` },
    ]);
    await manager.compile({ contract: sessionContract, input: base });
    await manager.compile({
      contract: sessionContract,
      input: {
        ...base,
        files: [
          { path: sessionContract.entryPath, content: `return 1;` },
          { path: 'src/entries/entry-versions/shared.ts', operation: 'delete' },
          { path: 'src/entries/entry-versions/renamed.ts', content: `export const value = 1;` },
        ],
      },
      workspaceUpdate: 'delta',
    });
    await manager.compile({
      contract: sessionContract,
      input: { ...base, files: [] },
      workspaceUpdate: 'delta',
    });

    expect(manager.getDebugState().repos[0]).toMatchObject({
      fileCount: 2,
      fileVersions: {
        'src/entries/entry-versions/index.ts': 1,
        'src/entries/entry-versions/renamed.ts': 1,
        'src/entries/entry-versions/shared.ts': 1,
      },
    });
    await manager.dispose();
  });

  it('performs deterministic LRU, TTL, Repo, and byte-capacity eviction', async () => {
    let now = 1_000;
    const disposed: string[] = [];
    const manager = new LightExtensionCompilerSessionManager({
      idleTtlMs: 100,
      maxEntries: 2,
      maxRepos: 2,
      maxEstimatedFileBytes: 10_000,
      now: () => now,
      sweepIntervalMs: 0,
      createSession: ({ identity }) =>
        new FakeCompilerSession(identity.contract.entryIdentity, disposed, (input) =>
          compileRunJSSourceWorkspace(input),
        ),
    });
    const one = contract('repo-1', 'one');
    const two = contract('repo-1', 'two');
    const three = contract('repo-2', 'three');
    await manager.compile({ contract: one, input: compileInput(one, `return 1;`) });
    now += 1;
    await manager.compile({ contract: two, input: compileInput(two, `return 2;`) });
    now += 1;
    await manager.compile({ contract: one, input: compileInput(one, `return 11;`) });
    now += 1;
    await manager.compile({ contract: three, input: compileInput(three, `return 3;`) });
    expect(disposed).toContain('two');
    expect(manager.getDebugState()).toMatchObject({ activeRepos: 2, activeEntries: 2 });

    now += 101;
    expect(await manager.sweepExpired()).toBe(2);
    expect(manager.getDebugState()).toMatchObject({ activeRepos: 0, activeEntries: 0 });
    await manager.dispose();

    const byteDisposed: string[] = [];
    const byteManager = new LightExtensionCompilerSessionManager({
      maxEstimatedFileBytes: 1,
      sweepIntervalMs: 0,
      createSession: ({ identity }) =>
        new FakeCompilerSession(identity.contract.entryIdentity, byteDisposed, (input) =>
          compileRunJSSourceWorkspace(input),
        ),
    });
    const byteContract = contract('repo-byte', 'byte');
    await byteManager.compile({ contract: byteContract, input: compileInput(byteContract, `return 'large';`) });
    expect(byteManager.getDebugState()).toMatchObject({
      activeRepos: 0,
      activeEntries: 0,
      estimatedFileBytes: 0,
    });
    expect(byteDisposed).toEqual(['byte']);
    await byteManager.dispose();
  });

  it('recreates on contract/build changes and isolates identical Repo IDs across App-scoped managers', async () => {
    const disposedA: string[] = [];
    const disposedB: string[] = [];
    const createManager = (disposed: string[]) =>
      new LightExtensionCompilerSessionManager({
        sweepIntervalMs: 0,
        createSession: ({ identity }) =>
          new FakeCompilerSession(
            `${identity.contract.entryIdentity}:${identity.contract.compilerBuildId}:${identity.contract.surfaceStyle}`,
            disposed,
            (input) => compileRunJSSourceWorkspace(input),
          ),
      });
    const managerA = createManager(disposedA);
    const managerB = createManager(disposedB);
    const initial = contract('same-repo', 'same-entry');
    await managerA.compile({ contract: initial, input: compileInput(initial, `return 'A';`) });
    await managerB.compile({ contract: initial, input: compileInput(initial, `return 'B';`) });
    expect(managerA.getDebugState().activeEntries).toBe(1);
    expect(managerB.getDebugState().activeEntries).toBe(1);
    expect(disposedA).toEqual([]);
    expect(disposedB).toEqual([]);

    const changedSurface = { ...initial, surfaceStyle: 'action' as const };
    await managerA.compile({
      contract: changedSurface,
      input: compileInput(changedSurface, `ctx.message.success('A');`),
    });
    expect(disposedA).toContain('same-entry:compiler-build-1:value');
    expect(disposedB).toEqual([]);

    const changedBuild = contract('same-repo', 'same-entry', initial.entryPath, 'compiler-build-2');
    await managerA.compile({ contract: changedBuild, input: compileInput(changedBuild, `return 'new build';`) });
    expect(managerA.getDebugState()).toMatchObject({ compilerBuildId: 'compiler-build-2', activeEntries: 1 });
    await Promise.all([managerA.dispose(), managerB.dispose()]);
  });

  it('disposes only the failed session and cold-falls back once without disturbing other entries', async () => {
    const coldInputs: string[] = [];
    const disposed: string[] = [];
    const metrics: LightExtensionCompilerSessionMetric[] = [];
    const manager = new LightExtensionCompilerSessionManager({
      sweepIntervalMs: 0,
      metricObserver: (metric) => metrics.push(metric),
      coldCompile: async (input) => {
        coldInputs.push(input.entry);
        return compileRunJSSourceWorkspace(input);
      },
      createSession: ({ identity }) =>
        identity.contract.entryIdentity === 'bad'
          ? new FakeCompilerSession('bad', disposed, async () => {
              throw new Error('forced rebuild failure');
            })
          : new FakeCompilerSession('good', disposed, (input) => compileRunJSSourceWorkspace(input)),
    });
    const good = contract('repo-good', 'good');
    const bad = contract('repo-bad', 'bad');
    await manager.compile({ contract: good, input: compileInput(good, `return 'good';`) });
    const fallback = await manager.compile({ contract: bad, input: compileInput(bad, `return 'fallback';`) });

    expect(fallback.execution).toBe('cold-fallback');
    expect(fallback.result.failureCode).toBeUndefined();
    expect(coldInputs).toEqual([bad.entryPath]);
    expect(disposed).toContain('bad');
    expect(disposed).not.toContain('good');
    expect(manager.getDebugState()).toMatchObject({ activeEntries: 1 });
    expect(metrics).toContainEqual(expect.objectContaining({ name: 'compile.session.eviction', reason: 'error' }));
    expect(metrics).toContainEqual(expect.objectContaining({ name: 'compile.entry.cold_fallback', value: 1 }));
    await manager.dispose();
  });

  it('supports a zero-capacity kill switch, explicit Repo cleanup, and idempotent shutdown timer cleanup', async () => {
    vi.useFakeTimers();
    try {
      const zeroManager = new LightExtensionCompilerSessionManager({
        maxEntries: 0,
        sweepIntervalMs: 10,
        idleTtlMs: 20,
      });
      const zero = contract('repo-zero', 'zero');
      const result = await zeroManager.compile({ contract: zero, input: compileInput(zero, `return 0;`) });
      expect(result.execution).toBe('cold');
      expect(zeroManager.getDebugState()).toMatchObject({ activeRepos: 0, activeEntries: 0 });
      await Promise.all([zeroManager.dispose(), zeroManager.dispose()]);
      expect(vi.getTimerCount()).toBe(0);

      const disposed: string[] = [];
      const manager = new LightExtensionCompilerSessionManager({
        sweepIntervalMs: 0,
        createSession: ({ identity }) =>
          new FakeCompilerSession(identity.contract.entryIdentity, disposed, (input) =>
            compileRunJSSourceWorkspace(input),
          ),
      });
      const cleanup = contract('repo-cleanup', 'cleanup');
      await manager.compile({ contract: cleanup, input: compileInput(cleanup, `return 1;`) });
      await manager.disposeRepo('repo-cleanup');
      expect(manager.getDebugState()).toMatchObject({ activeRepos: 0, activeEntries: 0 });
      expect(disposed).toEqual(['cleanup']);
      await manager.dispose();
    } finally {
      vi.useRealTimers();
    }
  });
});

class FakeCompilerSession implements LightExtensionCompilerSessionLike {
  private disposed = false;

  private estimatedFileBytes = 0;

  constructor(
    private readonly name: string,
    private readonly disposals: string[],
    private readonly compileImplementation: (
      input: CompileRunJSSourceWorkspaceInput,
    ) => Promise<CompileRunJSSourceWorkspaceResult>,
  ) {}

  async compile(input: CompileRunJSSourceWorkspaceInput): Promise<CompileRunJSSourceWorkspaceResult> {
    this.estimatedFileBytes = input.files.reduce(
      (bytes, file) => bytes + Buffer.byteLength(file.path) + Buffer.byteLength(file.content || ''),
      0,
    );
    return this.compileImplementation(input);
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.disposals.push(this.name);
  }

  getDebugState(): RunJSEntryCompilerSessionDebugState {
    return {
      disposed: this.disposed,
      contractFingerprint: this.name,
      contextCreateCount: 1,
      rebuildCount: 1,
      estimatedFileBytes: this.estimatedFileBytes,
      typeScriptProjectCreateCount: 1,
      typeScriptProjectReuseCount: 0,
      typeScriptProjectVersion: 1,
      typeScriptProjectUpdateCount: 1,
    };
  }
}
