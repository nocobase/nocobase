/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { buildRunJSImportModuleCompletionSignature } from '../studioUtils';
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
