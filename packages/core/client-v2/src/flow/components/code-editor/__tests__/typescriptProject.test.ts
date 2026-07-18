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

import {
  clearTypeScriptProjectCachesForTests,
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptProject,
  getTypeScriptCompletionResult,
  getTypeScriptProjectDiagnostics,
} from '../typescriptProject';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  registerRunJSTypeLibraryPackLoader,
} from '../typescriptLibraryRegistry';
import {
  getRunJSBuiltInAutoImportLibrary,
  isRunJSTypeScriptAutoImportSourceAllowed,
} from '../typescriptBuiltInAutoImport';

function baseProject(currentFileContent = '', modelUse?: string): CodeEditorTypeScriptProject {
  return {
    currentFilePath: 'src/main.tsx',
    files: [
      {
        content: currentFileContent,
        path: 'src/main.tsx',
      },
      {
        content: `export const abc = 333;\nexport const test = () => {\n  console.log('hello!');\n};`,
        path: 'src/helper.ts',
      },
    ],
    ...(modelUse ? { runJSContext: { modelUse } } : {}),
  };
}

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function fakePack(
  id: string,
  options: {
    bridgeContent?: string;
    bridgePath?: string;
    dependencyContent?: string;
    dependencyPath?: string;
  } = {},
): RunJSTypeLibraryPack {
  const bridgePath = options.bridgePath || `/__fake_packs__/${id}/bridge.d.ts`;
  const dependencyPath = options.dependencyPath || '/node_modules/fake-lib/index.d.ts';
  const bridgeContent = options.bridgeContent || "interface RunJSContext { fakeLib: typeof import('fake-lib'); }";
  const dependencyContent = options.dependencyContent || 'export const answer: 42;';
  return {
    contentHash: `${id}-pack-hash`,
    dependencies: [],
    dependencyFiles: [
      {
        content: '{"name":"fake-lib","types":"index.d.ts"}',
        contentHash: 'fake-package-json-hash',
        path: '/node_modules/fake-lib/package.json',
      },
      {
        content: dependencyContent,
        contentHash: `dependency-${dependencyContent}`,
        path: dependencyPath,
      },
    ],
    id,
    libraryName: id,
    rootFiles: [
      {
        content: bridgeContent,
        contentHash: `bridge-${bridgeContent}`,
        path: bridgePath,
      },
    ],
    version: '1.0.0',
  };
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

describe('CodeEditor TypeScript project', () => {
  it('uses an exact, prototype-safe built-in auto-import allowlist', () => {
    expect(getRunJSBuiltInAutoImportLibrary('react')).toBe('React');
    expect(getRunJSBuiltInAutoImportLibrary('react-dom/client')).toBe('ReactDOM');
    expect(getRunJSBuiltInAutoImportLibrary('@nocobase/sdk/client')).toBe('clientSdk');
    expect(getRunJSBuiltInAutoImportLibrary('@nocobase/sdk')).toBeUndefined();
    expect(getRunJSBuiltInAutoImportLibrary('@nocobase/sdk/client/typo')).toBeUndefined();
    expect(getRunJSBuiltInAutoImportLibrary('react-dom')).toBeUndefined();
    expect(getRunJSBuiltInAutoImportLibrary('constructor')).toBeUndefined();
    expect(getRunJSBuiltInAutoImportLibrary('__proto__')).toBeUndefined();
    expect(isRunJSTypeScriptAutoImportSourceAllowed('./helper', true)).toBe(true);
    expect(isRunJSTypeScriptAutoImportSourceAllowed('../helper', true)).toBe(true);
    expect(isRunJSTypeScriptAutoImportSourceAllowed('/src/helper', true)).toBe(false);
    expect(isRunJSTypeScriptAutoImportSourceAllowed('external-package', true)).toBe(false);
  });

  it('suggests workspace exports with auto import changes', async () => {
    const code = 'tes';
    const result = await getTypeScriptCompletionResult(baseProject(code), code.length, code, true);

    expect(result).toBeTruthy();
    const options = result?.options || [];
    const testCompletion = options.find((option) => option.label === 'test');
    expect(testCompletion).toBeTruthy();

    const abcResult = await getTypeScriptCompletionResult(baseProject('ab'), 'ab'.length, 'ab', true);
    expect(abcResult?.options.some((option) => option.label === 'abc')).toBe(true);

    const dispatch = vi.fn();
    const applyCompletion = testCompletion?.apply as unknown as
      | ((view: { dispatch: typeof dispatch }, completion: typeof testCompletion, from: number, to: number) => void)
      | undefined;
    applyCompletion?.({ dispatch }, testCompletion, result?.from || 0, result?.to || code.length);
    const changesText = JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes || []);
    expect(changesText).toContain('./helper');
    expect(changesText).toContain('test');
  });

  it('filters unsupported package auto imports in rewrite mode while keeping workspace auto imports', async () => {
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.ts',
      declarationFiles: [
        {
          content: `declare module 'external-package' { export const externalThing: number; }`,
          path: 'src/external.d.ts',
        },
      ],
      files: [
        { content: '', path: 'src/main.ts' },
        { content: 'export const workspaceThing = 42;', path: 'src/helper.ts' },
      ],
      rewriteBuiltInAutoImports: true,
    };

    const externalCode = 'externalTh';
    const externalResult = await getTypeScriptCompletionResult(project, externalCode.length, externalCode, true);
    expect(externalResult?.options.some((option) => option.label === 'externalThing') ?? false).toBe(false);

    const workspaceCode = 'workspaceTh';
    const workspaceResult = await getTypeScriptCompletionResult(project, workspaceCode.length, workspaceCode, true);
    expect(workspaceResult?.options.some((option) => option.label === 'workspaceThing')).toBe(true);

    const nativeResult = await getTypeScriptCompletionResult(
      { ...project, rewriteBuiltInAutoImports: false },
      externalCode.length,
      externalCode,
      true,
    );
    expect(nativeResult?.options.some((option) => option.label === 'externalThing')).toBe(true);
  });

  it('rewrites built-in auto imports to ctx.libs declarations when enabled', async () => {
    const code = 'useEff';
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
      rewriteBuiltInAutoImports: true,
      typeLibraryIds: ['react'],
    };
    const result = await getTypeScriptCompletionResult(project, code.length, code, true);
    const completion = result?.options.find((option) => option.label === 'useEffect');
    const dispatch = vi.fn();

    expect(completion?.detail).toBe('Auto import from ctx.libs.React');
    if (typeof completion?.apply === 'function') {
      completion.apply({ dispatch } as never, completion, 0, code.length);
    }
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.arrayContaining([
          expect.objectContaining({ from: 0, insert: 'const { useEffect } = ctx.libs.React;\n', to: 0 }),
          expect.objectContaining({ from: 0, insert: 'useEffect', to: code.length }),
        ]),
      }),
    );
    expect(JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes)).not.toContain(`from 'react'`);
  });

  it('rewrites the client SDK auto import to the shared ctx.libs module', async () => {
    const code = 'createCli';
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.ts',
      files: [{ content: code, path: 'src/main.ts' }],
      rewriteBuiltInAutoImports: true,
      typeLibraryIds: ['@nocobase/sdk/client'],
    };
    const result = await getTypeScriptCompletionResult(project, code.length, code, true);
    const completion = result?.options.find((option) => option.label === 'createClient');
    const dispatch = vi.fn();

    expect(completion?.detail).toBe('Auto import from ctx.libs.clientSdk');
    if (typeof completion?.apply === 'function') {
      completion.apply({ dispatch } as never, completion, result?.from || 0, result?.to || code.length);
    }
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.arrayContaining([
          expect.objectContaining({ from: 0, insert: 'const { createClient } = ctx.libs.clientSdk;\n', to: 0 }),
          expect.objectContaining({ from: 0, insert: 'createClient', to: code.length }),
        ]),
      }),
    );
    expect(JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes)).not.toContain('@nocobase/sdk/client');
  });

  it('rewrites default and namespace built-in auto imports according to the TypeScript code action', async () => {
    const testAutoImport = async (declaration: string, code: string, completionName: string) => {
      const project: CodeEditorTypeScriptProject = {
        currentFilePath: 'src/main.ts',
        declarationFiles: [{ content: declaration, path: 'src/library.d.ts' }],
        files: [{ content: code, path: 'src/main.ts' }],
        rewriteBuiltInAutoImports: true,
      };
      const result = await getTypeScriptCompletionResult(project, code.length, code, true);
      const completion = result?.options.find((option) => option.label === completionName);
      const dispatch = vi.fn();

      expect(completion?.detail).toBe('Auto import from ctx.libs.React');
      if (typeof completion?.apply === 'function') {
        completion.apply({ dispatch } as never, completion, result?.from || 0, result?.to || code.length);
      }
      return JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes || []);
    };

    const defaultChanges = await testAutoImport(
      `declare module 'react' { export default function React(): void; }`,
      'Reac',
      'React',
    );
    expect(defaultChanges).toContain('const React = ctx.libs.React;');
    expect(defaultChanges).not.toContain('const { React }');

    const namespaceChanges = await testAutoImport(
      `declare module 'react' { export = React; namespace React { const version: string; } }`,
      'Reac',
      'React',
    );
    expect(namespaceChanges).toContain('const React = ctx.libs.React;');
    expect(namespaceChanges).not.toContain('const { React }');
  });

  it('merges a named built-in auto import into the existing declaration shape', async () => {
    const code = `import React from 'react';\nuseEff`;
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
      rewriteBuiltInAutoImports: true,
      typeLibraryIds: ['react'],
    };
    const result = await getTypeScriptCompletionResult(project, code.length, code, true);
    const completion = result?.options.find((option) => option.label === 'useEffect');
    const dispatch = vi.fn();

    if (typeof completion?.apply === 'function') {
      completion.apply({ dispatch } as never, completion, result?.from || code.length - 'useEff'.length, code.length);
    }
    const changes = JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes || []);
    expect(changes).toContain('const React = ctx.libs.React;');
    expect(changes).toContain('const { useEffect } = ctx.libs.React;');
    expect(changes).not.toContain(`from 'react'`);
  });

  it('preserves type-only imports while adding a runtime ctx.libs declaration', async () => {
    const code = `import type { FC } from 'react';\nuseEff`;
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
      rewriteBuiltInAutoImports: true,
      typeLibraryIds: ['react'],
    };
    const result = await getTypeScriptCompletionResult(project, code.length, code, true);
    const completion = result?.options.find((option) => option.label === 'useEffect');
    const dispatch = vi.fn();

    if (typeof completion?.apply === 'function') {
      completion.apply({ dispatch } as never, completion, result?.from || code.length - 'useEff'.length, code.length);
    }
    const changes = JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes || []);
    expect(changes).toContain('const { useEffect } = ctx.libs.React;');
    expect(changes).not.toContain('"insert":"","to":11');
  });

  it('reuses an existing ctx.libs React binding without inserting another declaration', async () => {
    const code = `const { useEffect } = ctx.libs.React;\nuseEff`;
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
      rewriteBuiltInAutoImports: true,
      typeLibraryIds: ['react'],
    };
    const result = await getTypeScriptCompletionResult(project, code.length, code, true);
    const completion = result?.options.find((option) => option.label === 'useEffect');
    const dispatch = vi.fn();

    expect(completion?.detail).not.toBe('Auto import from react');
    if (typeof completion?.apply === 'function') {
      completion.apply({ dispatch } as never, completion, result?.from || code.length - 'useEff'.length, code.length);
    }
    const changes = JSON.stringify(dispatch.mock.calls[0]?.[0]?.changes || []);
    expect(changes).not.toContain('const { useEffect } = ctx.libs.React;');
    expect(changes).not.toContain(`from 'react'`);
  });

  it('uses user declaration files for completions and diagnostics', async () => {
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      declarationFiles: [
        {
          content: 'declare const customGlobal: { value: number };',
          path: 'src/custom.d.ts',
        },
      ],
      files: [
        {
          content: 'customGlobal.',
          path: 'src/main.tsx',
        },
      ],
    };

    const completion = await getTypeScriptCompletionResult(project, 'customGlobal.'.length, 'customGlobal.', true);
    expect(completion?.options.some((option) => option.label === 'value')).toBe(true);

    const okDiagnostics = await getTypeScriptProjectDiagnostics(project, 'customGlobal.value;');
    expect(okDiagnostics.some((diagnostic) => /Cannot find name 'customGlobal'/.test(diagnostic.message))).toBe(false);

    const missingDiagnostics = await getTypeScriptProjectDiagnostics(project, 'customGlobal.missing;');
    expect(missingDiagnostics.some((diagnostic) => /missing/.test(diagnostic.message))).toBe(true);
  });

  it('supports an editor-only active Entry ctx type without dropping the RunJS context', async () => {
    const code = 'ctx.settings.';
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
      declarationFiles: [
        {
          path: '.light-extension/types/__active-entry-context.d.ts',
          content:
            'interface ActiveSettings { mode: 1 | 2; title?: string; }\ntype LightExtensionActiveEntryContext = RunJSContext & { settings: ActiveSettings };',
        },
      ],
      runJSContext: {
        globalContextType: 'LightExtensionActiveEntryContext',
        modelUse: 'JSBlockModel',
      },
    };

    const completion = await getTypeScriptCompletionResult(project, code.length, code, true);
    expect(completion?.options.some((option) => option.label === 'mode')).toBe(true);
    expect(completion?.options.some((option) => option.label === 'title')).toBe(true);
    expect(await getTypeScriptProjectDiagnostics(project, 'ctx.logger; ctx.settings.mode;')).toEqual([]);
    expect(
      (await getTypeScriptProjectDiagnostics(project, 'const mode: string = ctx.settings.mode;')).some((diagnostic) =>
        /string/.test(diagnostic.message),
      ),
    ).toBe(true);
  });

  it('uses the shared compiler profile for JSON module imports', async () => {
    const code = "import config from './config.json';\nconfig.label.toUpperCase();";
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.ts',
      files: [
        { path: 'src/main.ts', content: code },
        { path: 'src/config.json', content: '{"label":"Ready"}' },
      ],
    };

    expect(await getTypeScriptProjectDiagnostics(project, code)).toEqual([]);
  });

  it('filters diagnostics explicitly ignored by the editor project', async () => {
    const code = 'return ctx.record;';
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.ts',
      files: [{ path: 'src/main.ts', content: code }],
      ignoredDiagnosticCodes: [1108],
    };

    expect(await getTypeScriptProjectDiagnostics(project, code)).toEqual([]);
  });

  it('provides RunJS ctx completions and reports unknown ctx members', async () => {
    const project = baseProject('ctx.');
    const completion = await getTypeScriptCompletionResult(project, 'ctx.'.length, 'ctx.', true);

    expect(completion?.options.some((option) => option.label === 'render')).toBe(true);
    expect(completion?.options.some((option) => option.label === 'logger')).toBe(true);

    const diagnostics = await getTypeScriptProjectDiagnostics(project, 'ctx.notARealMember;');
    expect(diagnostics.some((diagnostic) => /notARealMember/.test(diagnostic.message))).toBe(true);
    expect(diagnostics.some((diagnostic) => diagnostic.code === 2339)).toBe(true);
  });

  it('uses the official TypeScript browser libraries for RunJS globals', async () => {
    const code = `
const blob1 = new Blob(['hello']);
const blob2 = new window.Blob(['hello']);
new window.File(['hello'], 'hello.txt').size;
const url1 = URL.createObjectURL(blob1);
const url2 = window.URL.createObjectURL(blob2);
URL.revokeObjectURL(url1);
window.URL.revokeObjectURL(url2);
window.location.assign('/demo');
document.createElement('div');
navigator.clipboard.writeText('x');
fetch('/api/test');
globalThis.Blob;
window.Array.isArray([]);
window.Promise.resolve('ready');
`;

    expect(await getTypeScriptProjectDiagnostics(baseProject(code), code)).toEqual([]);

    const invalidCode = `
window.notARealBrowserGlobal;
new File(['hello'], 'hello.txt');
`;
    const invalidDiagnostics = await getTypeScriptProjectDiagnostics(baseProject(invalidCode), invalidCode);
    expect(invalidDiagnostics.some((diagnostic) => /notARealBrowserGlobal/.test(diagnostic.message))).toBe(true);
    expect(invalidDiagnostics.some((diagnostic) => /'File' only refers to a type/.test(diagnostic.message))).toBe(true);
  });

  it('types the shared RunJS runtime APIs for known source models', async () => {
    const code = `
ctx.i18n.t('Hello', { ns: 'runjs' });
ctx.message.success('Saved');
await ctx.request({ url: 'users:list' });
await ctx.api.request({ url: 'users:list' });
ctx.React.createElement('div');
ctx.onRefReady(ctx.ref, (element) => {
  element.innerHTML = ctx.runJsSource.sourceMode;
});
ctx.settings.title;
ctx.model.uid;
`;

    const diagnostics = await getTypeScriptProjectDiagnostics(baseProject(code, 'JSBlockModel'), code);
    expect(diagnostics).toEqual([]);
  });

  it('types JS field values and field-specific context members', async () => {
    const code = `
ctx.element.innerHTML = String(ctx.value);
ctx.record?.id;
ctx.collection?.name;
ctx.collectionField?.name;
ctx.onRefReady(ctx.ref, (element) => {
  element.textContent = String(ctx.value);
});
`;

    const diagnostics = await getTypeScriptProjectDiagnostics(baseProject(code, 'JSFieldModel'), code);
    expect(diagnostics).toEqual([]);
  });

  it('types editable JS field form APIs without exposing them to JS blocks', async () => {
    const editableCode = `
ctx.getValue();
ctx.setValue('next');
ctx.form?.getFieldValue('name');
ctx.namePath?.join('.');
ctx.disabled;
ctx.readOnly;
`;
    const editableDiagnostics = await getTypeScriptProjectDiagnostics(
      baseProject(editableCode, 'JSEditableFieldModel'),
      editableCode,
    );
    expect(editableDiagnostics).toEqual([]);

    const blockDiagnostics = await getTypeScriptProjectDiagnostics(
      baseProject('ctx.getValue();', 'JSBlockModel'),
      'ctx.getValue();',
    );
    expect(blockDiagnostics.some((diagnostic) => /getValue/.test(diagnostic.message))).toBe(true);
  });

  it('types action-specific RunJS context members', async () => {
    const recordActionCode = `
ctx.record.id;
ctx.filterByTk;
ctx.runJsSource.sourceMode;
`;
    expect(
      await getTypeScriptProjectDiagnostics(baseProject(recordActionCode, 'JSRecordActionModel'), recordActionCode),
    ).toEqual([]);

    const formActionCode = `
ctx.form?.getFieldsValue();
await ctx.refresh();
`;
    expect(
      await getTypeScriptProjectDiagnostics(baseProject(formActionCode, 'JSFormActionModel'), formActionCode),
    ).toEqual([]);
  });

  it('keeps dependency files readable for module resolution without making them roots', async () => {
    registerRunJSTypeLibraryPackLoader('dayjs', () => fakePack('dayjs'));
    const code = 'ctx.libs.dayjs; (ctx.fakeLib.answer satisfies 42);';
    const project = baseProject(code);
    const session = createTypeScriptProjectSession();

    expect(await session.getDiagnostics(project, code)).toEqual([]);
    const state = session.getDebugState();
    expect(state.allFileNames).toContain('/node_modules/fake-lib/index.d.ts');
    expect(state.rootFileNames).toContain('/__fake_packs__/dayjs/bridge.d.ts');
    expect(state.rootFileNames).not.toContain('/node_modules/fake-lib/index.d.ts');
    expect(state.rootFileNames).not.toContain('/node_modules/fake-lib/package.json');
  });

  it('merges concurrent completion, hover, and lint loads for the same pack', async () => {
    const deferred = createDeferred<RunJSTypeLibraryPack>();
    const loader = vi.fn(() => deferred.promise);
    registerRunJSTypeLibraryPackLoader('dayjs', loader);
    const code = 'ctx.libs.dayjs; ctx.fakeLib.answer;';
    const project = baseProject(code);
    const session = createTypeScriptProjectSession();

    const completion = session.getCompletionResult(project, code.length, code, true);
    const hover = session.getHover(project, code.indexOf('fakeLib') + 2, code);
    const diagnostics = session.getDiagnostics(project, code);
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    deferred.resolve(fakePack('dayjs'));
    await Promise.all([completion, hover, diagnostics]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('deduplicates identical immutable files and reports conflicting content', async () => {
    const sharedOptions = {
      bridgePath: '/__fake_packs__/shared/bridge.d.ts',
      dependencyPath: '/node_modules/fake-lib/index.d.ts',
    };
    registerRunJSTypeLibraryPackLoader('react', () => fakePack('react', sharedOptions));
    registerRunJSTypeLibraryPackLoader('dayjs', () => fakePack('dayjs', sharedOptions));
    const session = createTypeScriptProjectSession();
    const code = 'ctx.React; ctx.dayjs; ctx.fakeLib.answer;';

    expect(await session.getDiagnostics(baseProject(code), code)).toEqual([]);
    expect(session.getDebugState().allFileNames.filter((path) => path === sharedOptions.dependencyPath)).toHaveLength(
      1,
    );

    clearRunJSTypeLibraryPackRegistryForTests();
    clearTypeScriptProjectCachesForTests();
    registerRunJSTypeLibraryPackLoader('react', () => fakePack('react', sharedOptions));
    registerRunJSTypeLibraryPackLoader('dayjs', () =>
      fakePack('dayjs', { ...sharedOptions, dependencyContent: 'export const answer: "wrong";' }),
    );
    const conflictingSession = createTypeScriptProjectSession();
    const onInternalError = vi.fn();
    const diagnostics = await conflictingSession.getDiagnostics({ ...baseProject(code), onInternalError }, code);
    expect(diagnostics).toEqual([]);
    expect(onInternalError).toHaveBeenCalledWith(expect.objectContaining({ code: 'TYPE_LIBRARY_FILE_CONFLICT' }));
  });

  it('increments file versions for same-length edits without recreating the language service', async () => {
    registerRunJSTypeLibraryPackLoader('dayjs', () => fakePack('dayjs'));
    const session = createTypeScriptProjectSession();
    const first = 'ctx.libs.dayjs; (1 satisfies number);';
    const second = 'ctx.libs.dayjs; (1 satisfies string);';
    const project = baseProject(first);

    expect(await session.getDiagnostics(project, first)).toEqual([]);
    const firstState = session.getDebugState();
    const secondDiagnostics = await session.getDiagnostics(baseProject(second), second);
    const secondState = session.getDebugState();

    expect(secondDiagnostics.some((diagnostic) => /string/.test(diagnostic.message))).toBe(true);
    expect(secondState.fileVersions['/src/main.tsx']).not.toBe(firstState.fileVersions['/src/main.tsx']);
    expect(secondState.languageServiceCreationCount).toBe(1);
    expect(secondState.immutableSnapshotCreationCount).toBe(firstState.immutableSnapshotCreationCount);
  });

  it('updates declarations incrementally and rebuilds only for structural changes', async () => {
    const session = createTypeScriptProjectSession();
    const code = 'customGlobal.value;';
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.ts',
      declarationFiles: [{ content: 'declare const customGlobal: { value: number };', path: 'src/custom.d.ts' }],
      files: [
        { content: code, path: 'src/main.ts' },
        { content: 'export const helper = 1;', path: 'src/helper.ts' },
      ],
    };

    expect(await session.getDiagnostics(project, code)).toEqual([]);
    expect(session.getDebugState().languageServiceCreationCount).toBe(1);

    const changedDeclaration = {
      ...project,
      declarationFiles: [{ content: 'declare const customGlobal: { other: number };', path: 'src/custom.d.ts' }],
    };
    expect((await session.getDiagnostics(changedDeclaration, code)).some((item) => /value/.test(item.message))).toBe(
      true,
    );
    expect(session.getDebugState().languageServiceCreationCount).toBe(1);

    const addedFile = {
      ...changedDeclaration,
      files: [...changedDeclaration.files, { content: '', path: 'src/new.ts' }],
    };
    await session.getDiagnostics(addedFile, code);
    expect(session.getDebugState().languageServiceCreationCount).toBe(2);

    await session.getDiagnostics({ ...addedFile, currentFilePath: 'src/helper.ts' }, 'export const helper = 1;');
    expect(session.getDebugState().languageServiceCreationCount).toBe(2);

    await session.getDiagnostics({ ...addedFile, compilerOptions: { strict: true } }, code);
    expect(session.getDebugState().languageServiceCreationCount).toBe(3);

    await session.getDiagnostics({ ...addedFile, runJSContext: { modelUse: 'JSBlockModel' } }, code);
    expect(session.getDebugState().languageServiceCreationCount).toBe(4);

    await session.getDiagnostics(changedDeclaration, code);
    expect(session.getDebugState().languageServiceCreationCount).toBe(5);
  });

  it('waits for packs before diagnostics and exposes loader failures as internal errors', async () => {
    const deferred = createDeferred<RunJSTypeLibraryPack>();
    registerRunJSTypeLibraryPackLoader('dayjs', () => deferred.promise);
    const code = 'ctx.libs.dayjs; ctx.fakeLib.answer;';
    const session = createTypeScriptProjectSession();
    let settled = false;
    const loadingDiagnostics = session.getDiagnostics(baseProject(code), code).finally(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    deferred.resolve(fakePack('dayjs'));
    expect(await loadingDiagnostics).toEqual([]);

    clearRunJSTypeLibraryPackRegistryForTests();
    registerRunJSTypeLibraryPackLoader('dayjs', async () => {
      throw new Error('fake loader failed');
    });
    const onInternalError = vi.fn();
    const failedSession = createTypeScriptProjectSession();
    expect(await failedSession.getDiagnostics({ ...baseProject(code), onInternalError }, code)).toEqual([]);
    expect(onInternalError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TYPE_LIBRARY_LOAD_FAILED', packIds: ['dayjs'] }),
    );
  });

  it('keeps syntax diagnostics while suppressing semantic noise when a type pack fails', async () => {
    registerRunJSTypeLibraryPackLoader('antd/full', async () => {
      throw new Error('full pack failed');
    });
    const code = `
const name = getComponentName();
ctx.libs.antd[name];
const broken = ;
ctx.libs.antd.NotAComponent;
`;
    const session = createTypeScriptProjectSession();
    const diagnostics = await session.getDiagnostics(baseProject(code), code);

    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((diagnostic) => /Expression expected/.test(diagnostic.message))).toBe(true);
    expect(diagnostics.some((diagnostic) => /getComponentName|NotAComponent|antd/.test(diagnostic.message))).toBe(
      false,
    );
    expect(session.getLastInternalError()).toEqual(
      expect.objectContaining({ code: 'TYPE_LIBRARY_LOAD_FAILED', packIds: ['antd/full'] }),
    );
  });

  it('upgrades symbol packs to full packs, reuses full, and rebuilds one shared project version', async () => {
    const inputLoader = vi.fn(() =>
      fakePack('antd/Input', {
        bridgeContent: 'interface RunJSAntdLibrary { readonly Input: { readonly kind: "input" } }',
        bridgePath: '/__fake_packs__/antd/input-bridge.d.ts',
      }),
    );
    const buttonLoader = vi.fn(() =>
      fakePack('antd/Button', {
        bridgeContent: 'interface RunJSAntdLibrary { readonly Button: { readonly kind: "button" } }',
        bridgePath: '/__fake_packs__/antd/button-bridge.d.ts',
      }),
    );
    const fullLoader = vi.fn(() =>
      fakePack('antd/full', {
        bridgeContent:
          'interface RunJSAntdLibrary { readonly Input: { readonly kind: "input" }; readonly Button: { readonly kind: "button" } }',
        bridgePath: '/__fake_packs__/antd/full-bridge.d.ts',
      }),
    );
    registerRunJSTypeLibraryPackLoader('antd/Input', inputLoader);
    registerRunJSTypeLibraryPackLoader('antd/Button', buttonLoader);
    registerRunJSTypeLibraryPackLoader('antd/full', fullLoader);
    const session = createTypeScriptProjectSession();
    const inputCode = 'ctx.libs.antd.Input.kind;';

    expect(await session.getDiagnostics(baseProject(inputCode), inputCode)).toEqual([]);
    const symbolState = session.getDebugState();
    expect(inputLoader).toHaveBeenCalledTimes(1);
    expect(symbolState.structureKey).toContain('antd/Input');

    const dynamicCode = 'const name: keyof RunJSAntdLibrary = "Button"; ctx.libs.antd[name];';
    const project = baseProject(dynamicCode);
    const completion = session.getCompletionResult(project, dynamicCode.length, dynamicCode, true);
    const hover = session.getHover(project, dynamicCode.indexOf('antd') + 2, dynamicCode);
    const diagnostics = session.getDiagnostics(project, dynamicCode);
    await Promise.all([completion, hover, diagnostics]);
    const fullState = session.getDebugState();

    expect(fullLoader).toHaveBeenCalledTimes(1);
    expect(fullState.structureKey).toContain('antd/full');
    expect(fullState.structureKey).not.toContain('antd/Input');
    expect(fullState.languageServiceCreationCount).toBe(symbolState.languageServiceCreationCount + 1);

    const buttonCode = 'ctx.libs.antd.Button.kind;';
    expect(await session.getDiagnostics(baseProject(buttonCode), buttonCode)).toEqual([]);
    expect(buttonLoader).not.toHaveBeenCalled();
    expect(fullLoader).toHaveBeenCalledTimes(1);
    expect(session.getDebugState().languageServiceCreationCount).toBe(fullState.languageServiceCreationCount);
  });

  it('rejects changed declarations at a shared path when upgrading a symbol pack to full', async () => {
    const sharedPath = '/node_modules/fake-lib/index.d.ts';
    registerRunJSTypeLibraryPackLoader('antd/Input', () =>
      fakePack('antd/Input', {
        bridgeContent: 'interface RunJSAntdLibrary { readonly Input: 1 }',
        dependencyContent: 'export const answer: 1;',
        dependencyPath: sharedPath,
      }),
    );
    registerRunJSTypeLibraryPackLoader('antd/full', () =>
      fakePack('antd/full', {
        bridgeContent: 'interface RunJSAntdLibrary { readonly Input: 1 }',
        dependencyContent: 'export const answer: 2;',
        dependencyPath: sharedPath,
      }),
    );
    const session = createTypeScriptProjectSession();
    const inputCode = 'ctx.libs.antd.Input;';
    expect(await session.getDiagnostics(baseProject(inputCode), inputCode)).toEqual([]);

    const onInternalError = vi.fn();
    const dynamicCode = 'const name: keyof RunJSAntdLibrary = "Input"; ctx.libs.antd[name];';
    expect(await session.getDiagnostics({ ...baseProject(dynamicCode), onInternalError }, dynamicCode)).toEqual([]);
    expect(onInternalError).toHaveBeenCalledWith(expect.objectContaining({ code: 'TYPE_LIBRARY_FILE_CONFLICT' }));
  });

  it('drops an in-flight symbol result after a newer full-pack request wins', async () => {
    const inputDeferred = createDeferred<RunJSTypeLibraryPack>();
    const inputLoader = vi.fn(() => inputDeferred.promise);
    registerRunJSTypeLibraryPackLoader('antd/Input', inputLoader);
    registerRunJSTypeLibraryPackLoader('antd/full', () =>
      fakePack('antd/full', {
        bridgeContent: 'interface RunJSAntdLibrary { readonly Input: 1; readonly Button: 2 }',
        bridgePath: '/__fake_packs__/antd/full-bridge.d.ts',
      }),
    );
    const session = createTypeScriptProjectSession();
    const inputCode = 'ctx.libs.antd.Input;';
    const stale = session.getDiagnostics(baseProject(inputCode), inputCode);
    await vi.waitFor(() => expect(inputLoader).toHaveBeenCalledTimes(1));

    const dynamicCode = 'const name: keyof RunJSAntdLibrary = "Button"; ctx.libs.antd[name];';
    expect(await session.getDiagnostics(baseProject(dynamicCode), dynamicCode)).toEqual([]);
    inputDeferred.resolve(
      fakePack('antd/Input', {
        bridgeContent: 'interface RunJSAntdLibrary { readonly Input: 1 }',
        bridgePath: '/__fake_packs__/antd/input-bridge.d.ts',
      }),
    );

    expect(await stale).toEqual([]);
    expect(session.getDebugState().rootFileNames).toContain('/__fake_packs__/antd/full-bridge.d.ts');
    expect(session.getDebugState().rootFileNames).not.toContain('/__fake_packs__/antd/input-bridge.d.ts');
  });

  it('loads pack dependencies recursively, handles cycles, and retries rejected loaders', async () => {
    const reactPack: RunJSTypeLibraryPack = {
      ...fakePack('react', {
        bridgeContent: 'interface FakeReactModule { version: 18 }',
        bridgePath: '/__fake_packs__/react/bridge.d.ts',
      }),
      contentHash: 'react-pack-hash',
      dependencies: [
        {
          contentHash: 'dayjs-pack-hash',
          id: 'dayjs',
          version: '1.0.0',
        },
      ],
    };
    const dayjsPack: RunJSTypeLibraryPack = {
      ...fakePack('dayjs', {
        bridgeContent: 'interface RunJSContext { fakeReact: FakeReactModule; }',
        bridgePath: '/__fake_packs__/dayjs/bridge.d.ts',
      }),
      contentHash: 'dayjs-pack-hash',
      dependencies: [
        {
          contentHash: 'react-pack-hash',
          id: 'react',
          version: '1.0.0',
        },
      ],
    };
    const reactLoader = vi.fn(() => reactPack);
    const dayjsLoader = vi.fn(() => dayjsPack);
    registerRunJSTypeLibraryPackLoader('react', reactLoader);
    registerRunJSTypeLibraryPackLoader('dayjs', dayjsLoader);
    const code = 'ctx.libs.dayjs; (ctx.fakeReact.version satisfies 18);';
    const session = createTypeScriptProjectSession();

    expect(await session.getDiagnostics(baseProject(code), code)).toEqual([]);
    expect(dayjsLoader).toHaveBeenCalledTimes(1);
    expect(reactLoader).toHaveBeenCalledTimes(1);
    expect(session.getDebugState().rootFileNames).toContain('/__fake_packs__/react/bridge.d.ts');

    clearRunJSTypeLibraryPackRegistryForTests();
    clearTypeScriptProjectCachesForTests();
    let attempts = 0;
    registerRunJSTypeLibraryPackLoader('dayjs', () => {
      attempts += 1;
      if (attempts === 1) throw new Error('retry me');
      return fakePack('dayjs');
    });
    const retrySession = createTypeScriptProjectSession();
    const retryCode = 'ctx.libs.dayjs; ctx.fakeLib.answer;';
    expect(await retrySession.getDiagnostics(baseProject(retryCode), retryCode)).toEqual([]);
    expect(retrySession.getLastInternalError()?.code).toBe('TYPE_LIBRARY_LOAD_FAILED');
    expect(await retrySession.getDiagnostics(baseProject(retryCode), retryCode)).toEqual([]);
    expect(attempts).toBe(2);
  });

  it('drops stale requests and supports explicit disposal', async () => {
    const deferred = createDeferred<RunJSTypeLibraryPack>();
    registerRunJSTypeLibraryPackLoader('dayjs', () => deferred.promise);
    const session = createTypeScriptProjectSession();
    const oldCode = 'ctx.libs.dayjs; ctx.notARealMember;';
    const oldRequest = session.getDiagnostics(baseProject(oldCode), oldCode);
    const newCode = 'ctx.logger.info("ready");';

    expect(await session.getDiagnostics(baseProject(newCode), newCode)).toEqual([]);
    deferred.resolve(fakePack('dayjs'));
    expect(await oldRequest).toEqual([]);
    expect(session.getDebugState().allFileNames).not.toContain('/__fake_packs__/dayjs/bridge.d.ts');

    session.dispose();
    expect(session.getDebugState()).toEqual(
      expect.objectContaining({ allFileNames: [], disposed: true, rootFileNames: [] }),
    );
    expect(await session.getDiagnostics(baseProject('ctx.missing;'), 'ctx.missing;')).toEqual([]);
  });
});
