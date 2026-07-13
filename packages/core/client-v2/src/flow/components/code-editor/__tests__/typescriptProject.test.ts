/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  type CodeEditorTypeScriptProject,
  getTypeScriptCompletionResult,
  getTypeScriptProjectDiagnostics,
} from '../typescriptProject';

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
    expect(invalidDiagnostics.some((diagnostic) => /Cannot find name 'File'/.test(diagnostic.message))).toBe(true);
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
});
