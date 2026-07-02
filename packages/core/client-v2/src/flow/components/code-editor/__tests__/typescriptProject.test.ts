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

function baseProject(currentFileContent = ''): CodeEditorTypeScriptProject {
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
});
