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
import { clearTypeScriptProjectCachesForTests, type CodeEditorTypeScriptProject } from '../typescriptProject';

function reactProject(code: string): CodeEditorTypeScriptProject {
  return {
    currentFilePath: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
  };
}

function errorMessages(diagnostics: Diagnostic[]) {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

// Pack content is covered by packages/core/runjs/src/type-packs/*/__tests__ and the official-type-packs-*.cases
// layer in core/runjs; this file only smoke-tests that the pack loads into the editor project.
describe('RunJS official React TypeScript project', () => {
  it('loads the React pack into the editor project and resolves a representative completion', async () => {
    const code = 'ctx.libs.React.useState(0); const node = <div />; ctx.render(node);';
    const project = reactProject(code);
    await withTypeScriptProjectSession(async (session) => {
      expect(errorMessages(await session.getDiagnostics(project, code))).toEqual([]);
      const completionPosition = code.indexOf('ctx.libs.React.') + 'ctx.libs.React.'.length;
      const completion = await session.getCompletionResult(project, completionPosition, code, true);
      expect(completion?.options.some((option) => option.label === 'useState')).toBe(true);
    });
  });
});
