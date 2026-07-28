/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRunJSImportModuleCompletions } from '../studioUtils';
import type { RunJSWorkspaceFile } from '../types';

function workspaceFile(path: string, content = ''): RunJSWorkspaceFile {
  return { content, path };
}

describe('useRunJSImportModuleCompletions', () => {
  it('refreshes imported exports when file content or revision changes', () => {
    const { result, rerender } = renderHook(
      ({ files }) => useRunJSImportModuleCompletions(files, 'src/client/index.tsx'),
      {
        initialProps: {
          files: [workspaceFile('src/client/helper.ts', 'export const first = 1;')],
        },
      },
    );

    expect(result.current[0].exports).toEqual(['first']);

    rerender({ files: [workspaceFile('src/client/helper.ts', 'export const second = 2;')] });
    expect(result.current[0].exports).toEqual(['second']);

    rerender({
      files: [{ ...workspaceFile('src/client/helper.ts', 'export const third = 3;'), revision: 2 }],
    });
    expect(result.current[0].exports).toEqual(['third']);
  });
});
