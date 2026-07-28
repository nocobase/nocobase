/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { appendRunDiagnostics, buildRunJSImportModuleCompletionSignature } from '../studioUtils';
import type { RunJSWorkspaceFile } from '../types';

function workspaceFile(path: string, content = ''): RunJSWorkspaceFile {
  return { content, path };
}

describe('buildRunJSImportModuleCompletionSignature', () => {
  it('uses file revisions when available and content as the compatibility fallback', () => {
    expect(
      buildRunJSImportModuleCompletionSignature([workspaceFile('src/client/helper.ts', 'one')], 'src/client/index.tsx'),
    ).not.toBe(
      buildRunJSImportModuleCompletionSignature([workspaceFile('src/client/helper.ts', 'two')], 'src/client/index.tsx'),
    );
    expect(
      buildRunJSImportModuleCompletionSignature(
        [{ ...workspaceFile('src/client/helper.ts', 'one'), revision: 1 }],
        'src/client/index.tsx',
      ),
    ).toBe(
      buildRunJSImportModuleCompletionSignature(
        [{ ...workspaceFile('src/client/helper.ts', 'two'), revision: 1 }],
        'src/client/index.tsx',
      ),
    );
  });
});

describe('appendRunDiagnostics', () => {
  it('shows a captured render error once in the Studio console', () => {
    const appendConsole = vi.fn();

    appendRunDiagnostics(
      {
        execution: { finished: true, started: true, timeout: false },
        issues: [{ type: 'runtime', ruleId: 'render-error', message: 'rawData.some is not a function' }],
        logs: [{ level: 'error', message: 'rawData.some is not a function' }],
      },
      appendConsole,
    );

    expect(appendConsole).toHaveBeenCalledTimes(1);
    expect(appendConsole).toHaveBeenCalledWith({
      column: undefined,
      level: 'error',
      line: undefined,
      message: 'rawData.some is not a function',
      path: undefined,
    });
  });
});
