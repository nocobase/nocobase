/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Diagnostic } from '@codemirror/lint';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import {
  shutdownTypeScriptProjectSessionSuite,
  withTypeScriptProjectSession,
} from './helpers/withTypeScriptProjectSession';
import { clearRunJSTypeLibraryPackRegistryForTests } from '../typescriptLibraryRegistry';
import { clearTypeScriptProjectCachesForTests } from '../typescriptProject';

function errorMessages(diagnostics: Diagnostic[]): string[] {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

function project(code: string) {
  return {
    currentFilePath: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
  };
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

// Pack content is covered by packages/core/runjs/src/type-packs/*/__tests__ and the official-type-packs-*.cases
// layer in core/runjs; this file only smoke-tests that the packs load into the editor project.
describe('RunJS generated Ant Design and Icons TypeScript packs', () => {
  it('loads the antd and icons packs into the editor project and resolves a representative completion', async () => {
    const code = `
const AntButton = ctx.libs.antd.Button;
const PlusIcon = ctx.libs.antdIcons.PlusOutlined;
const view = <AntButton type="primary" icon={<PlusIcon />}>Save</AntButton>;
void view;
`;
    const editorProject = project(code);
    await withTypeScriptProjectSession(async (session) => {
      expect(errorMessages(await session.getDiagnostics(editorProject, code))).toEqual([]);
      const completionPosition = code.indexOf('ctx.libs.antd.Button') + 'ctx.libs.antd.'.length;
      const completion = await session.getCompletionResult(editorProject, completionPosition, code, true);
      expect(completion?.options.some((option) => option.label === 'Button')).toBe(true);
    });
  });
});
