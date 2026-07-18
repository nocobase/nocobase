/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { context as createEsbuildContext, type BuildContext } from 'esbuild';

import {
  buildRunJSCompilerSessionIdentity,
  compileRunJSSourceWorkspace,
  RunJSEntryCompilerSession,
  RunJSTypeScriptProject,
  type CompileRunJSSourceWorkspaceInput,
  type RunJSCompilerSessionContract,
  type RunJSCompilerSessionMetric,
} from '../compiler';

const baseContract: RunJSCompilerSessionContract = {
  repoId: 'repo-1',
  entryIdentity: 'entry-1',
  entryPath: 'src/entries/demo/index.ts',
  runtimeVersion: 'v2',
  surfaceStyle: 'value',
  modelUse: 'RunJSValue',
  runtimeContract: 'runtime-v1',
  compilerBuildId: 'compiler-build-1',
  securityPolicyFingerprint: 'security-v1',
  typeLibraryFingerprint: 'types-v1',
};

function compileInput(files: CompileRunJSSourceWorkspaceInput['files']): CompileRunJSSourceWorkspaceInput {
  return {
    files,
    entry: baseContract.entryPath,
    runtimeVersion: 'v2',
    surfaceStyle: 'value',
    legacy: {
      version: 'v2',
      surfaceStyle: 'value',
      language: 'typescript',
      metadata: { kind: 'runjs', modelUse: 'RunJSValue' },
    },
  };
}

describe('@nocobase/runjs incremental compiler session', () => {
  it('keeps cold and warm artifacts equivalent across continuous edits', async () => {
    const identity = buildRunJSCompilerSessionIdentity(baseContract);
    const metrics: RunJSCompilerSessionMetric[] = [];
    const session = new RunJSEntryCompilerSession({
      entryPath: baseContract.entryPath,
      contractFingerprint: identity.contractFingerprint,
      metricObserver: (metric) => metrics.push(metric),
    });
    const sequence: CompileRunJSSourceWorkspaceInput[] = [
      compileInput([
        {
          path: baseContract.entryPath,
          content: `import { suffix } from './shared'; return 'ready' + suffix;`,
        },
        { path: 'src/entries/demo/shared.ts', content: `export const suffix = '-one';` },
      ]),
      compileInput([
        {
          path: baseContract.entryPath,
          content: `import { suffix } from './shared'; return 'updated' + suffix;`,
        },
        { path: 'src/entries/demo/shared.ts', content: `export const suffix = '-one';` },
      ]),
      compileInput([
        { path: baseContract.entryPath, content: `const value = ; return value;` },
        { path: 'src/entries/demo/shared.ts', content: `export const suffix = '-one';` },
      ]),
      compileInput([
        {
          path: baseContract.entryPath,
          content: `import type { Label } from './types'; const value: Label = 'fixed'; return value;`,
        },
        { path: 'src/entries/demo/types.ts', content: `export type Label = string;` },
      ]),
      compileInput([
        {
          path: baseContract.entryPath,
          content: `import get from 'lodash'; return get({ nested: { value: 7 } }, 'nested.value');`,
        },
      ]),
    ];

    for (const input of sequence) {
      const cold = await compileRunJSSourceWorkspace(input);
      const warm = await session.compile(input);
      expect(warm).toEqual(cold);
    }

    const state = session.getDebugState();
    expect(state.contextCreateCount).toBe(1);
    expect(state.rebuildCount).toBe(sequence.length);
    expect(state.typeScriptProjectCreateCount).toBeGreaterThanOrEqual(2);
    expect(state.typeScriptProjectReuseCount).toBeGreaterThanOrEqual(1);
    expect(metrics.filter((metric) => metric.name === 'compile.entry.esbuild.rebuild')).toHaveLength(sequence.length);
    expect(metrics.some((metric) => metric.name === 'compile.entry.typescript.incremental' && metric.reused)).toBe(
      true,
    );
    await session.dispose();
  });

  it('updates create, delete, and rename changes without stale bundle, diagnostics, or dependency graph state', async () => {
    const identity = buildRunJSCompilerSessionIdentity(baseContract);
    const session = new RunJSEntryCompilerSession({
      entryPath: baseContract.entryPath,
      contractFingerprint: identity.contractFingerprint,
    });
    const inputs = [
      compileInput([
        { path: baseContract.entryPath, content: `import { value } from './shared'; return value;` },
        { path: 'src/entries/demo/shared.ts', content: `export const value: string = 'shared';` },
      ]),
      compileInput([
        { path: baseContract.entryPath, content: `import { value } from './renamed'; return value;` },
        { path: 'src/entries/demo/renamed.ts', content: `export const value: number = 2;` },
        { path: 'src/entries/demo/unused.ts', content: `export const unused = true;` },
      ]),
      compileInput([{ path: baseContract.entryPath, content: `const repaired: string = 'ok'; return repaired;` }]),
    ];

    const results: Awaited<ReturnType<typeof compileRunJSSourceWorkspace>>[] = [];
    for (const input of inputs) {
      const warm = await session.compile(input);
      expect(warm).toEqual(await compileRunJSSourceWorkspace(input));
      results.push(warm);
    }
    expect(results[1].dependencyGraph).toMatchObject({
      runtime: {
        files: [baseContract.entryPath, 'src/entries/demo/renamed.ts'],
        edges: [{ importer: baseContract.entryPath, imported: 'src/entries/demo/renamed.ts' }],
      },
      types: {
        files: [baseContract.entryPath, 'src/entries/demo/renamed.ts'],
        edges: [{ importer: baseContract.entryPath, imported: 'src/entries/demo/renamed.ts', kind: 'runtime' }],
      },
      unresolved: [],
    });
    const final = results[2];
    expect(final.failureCode).toBeUndefined();
    expect(final.artifact.code).toContain('repaired');
    expect(final.artifact.code).not.toContain('shared');
    expect(final.artifact.code).not.toContain('unused');
    expect(final.dependencyGraph).toMatchObject({
      runtime: { files: [baseContract.entryPath], edges: [] },
      types: { files: [baseContract.entryPath], edges: [] },
      unresolved: [],
    });
    await session.dispose();
  });

  it('isolates entry identity and every compile contract field in the session key', () => {
    const base = buildRunJSCompilerSessionIdentity(baseContract);
    const changes: Array<[keyof RunJSCompilerSessionContract, unknown]> = [
      ['repoId', 'repo-2'],
      ['entryIdentity', 'entry-2'],
      ['entryPath', 'src/entries/demo/other.ts'],
      ['runtimeVersion', 'v3'],
      ['surfaceStyle', 'action'],
      ['modelUse', 'JSActionModel'],
      ['runtimeContract', 'runtime-v2'],
      ['compilerBuildId', 'compiler-build-2'],
      ['securityPolicyFingerprint', 'security-v2'],
      ['typeLibraryFingerprint', 'types-v2'],
      ['typeLibraryIds', ['react']],
      ['authoringInspectorFingerprint', 'authoring-v1'],
    ];

    for (const [field, value] of changes) {
      const changed = buildRunJSCompilerSessionIdentity({ ...baseContract, [field]: value });
      expect(changed.key, field).not.toBe(base.key);
      expect(changed.contractFingerprint, field).not.toBe(base.contractFingerprint);
    }
  });

  it('serializes concurrent rebuild requests and disposes the esbuild context exactly once', async () => {
    const identity = buildRunJSCompilerSessionIdentity(baseContract);
    let disposeCount = 0;
    const session = new RunJSEntryCompilerSession({
      entryPath: baseContract.entryPath,
      contractFingerprint: identity.contractFingerprint,
      esbuildContextFactory: async (options) => {
        const context = await createEsbuildContext(options);
        return wrapContext(context, async () => {
          disposeCount += 1;
          await context.dispose();
        });
      },
    });
    const first = compileInput([{ path: baseContract.entryPath, content: `return 'first';` }]);
    const second = compileInput([{ path: baseContract.entryPath, content: `return 'second';` }]);

    const [firstResult, secondResult] = await Promise.all([session.compile(first), session.compile(second)]);
    expect(firstResult.artifact.code).toContain('first');
    expect(secondResult.artifact.code).toContain('second');
    expect(session.getDebugState()).toMatchObject({ contextCreateCount: 1, rebuildCount: 2 });
    await Promise.all([session.dispose(), session.dispose()]);
    expect(disposeCount).toBe(1);
    await expect(session.compile(first)).rejects.toThrow('disposed');
  });
});

describe('@nocobase/runjs TypeScript incremental project', () => {
  it('tracks add, update, delete, rename, roots, and unchanged inputs by version', () => {
    const project = new RunJSTypeScriptProject();
    expect(project.update([{ path: '/index.ts', content: 'export const value = 1;', root: true }])).toEqual({
      added: ['/index.ts'],
      changed: [],
      deleted: [],
      rootNamesChanged: true,
      unchanged: false,
    });
    expect(project.update([{ path: '/index.ts', content: 'export const value = 1;', root: true }]).unchanged).toBe(
      true,
    );
    expect(
      project.update([
        { path: '/index.ts', content: `import { value } from './renamed'; value;`, root: true },
        { path: '/renamed.ts', content: 'export const value = 2;', root: true },
      ]),
    ).toMatchObject({ added: ['/renamed.ts'], changed: ['/index.ts'], deleted: [] });
    expect(
      project.update([
        { path: '/index.ts', content: `import { value } from './other'; value;`, root: true },
        { path: '/other.ts', content: 'export const value = 3;', root: true },
      ]),
    ).toMatchObject({ added: ['/other.ts'], changed: ['/index.ts'], deleted: ['/renamed.ts'] });
    expect(project.getDebugState()).toMatchObject({ projectVersion: 3, updateCount: 3, fileCount: 2 });
    project.dispose();
    project.dispose();
    expect(project.getDebugState().disposed).toBe(true);
    expect(() => project.update([])).toThrow('disposed');
  });
});

function wrapContext(context: BuildContext, dispose: () => Promise<void>): BuildContext {
  return {
    cancel: context.cancel.bind(context),
    dispose,
    rebuild: context.rebuild.bind(context),
    serve: context.serve.bind(context),
    watch: context.watch.bind(context),
  };
}
