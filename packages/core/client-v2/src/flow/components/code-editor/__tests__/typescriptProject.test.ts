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

  it('provides RunJS ctx completions and reports unknown ctx members', async () => {
    const project = baseProject('ctx.');
    const completion = await getTypeScriptCompletionResult(project, 'ctx.'.length, 'ctx.', true);

    expect(completion?.options.some((option) => option.label === 'render')).toBe(true);
    expect(completion?.options.some((option) => option.label === 'logger')).toBe(true);

    const diagnostics = await getTypeScriptProjectDiagnostics(project, 'ctx.notARealMember;');
    expect(diagnostics.some((diagnostic) => /notARealMember/.test(diagnostic.message))).toBe(true);
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
