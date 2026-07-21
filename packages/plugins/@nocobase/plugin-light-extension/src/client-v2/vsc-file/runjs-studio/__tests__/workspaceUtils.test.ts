/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { RunJSSourceHistoryItem } from '../types';
import { buildLineDiff, buildWorkspaceSnapshotKey, inferLanguageFromPath, mergeHistoryItems } from '../workspaceUtils';

function createHistoryItem(id: string, seq: number, message: string): RunJSSourceHistoryItem {
  return {
    id,
    repoId: 'repo-1',
    hash: `hash-${seq}`,
    seq,
    parentCommitId: null,
    treeHash: `tree-${seq}`,
    message,
    authorId: null,
    metadata: {},
  };
}

describe('workspaceUtils', () => {
  it('keeps content-sensitive snapshot keys for callers without revision state', () => {
    expect(buildWorkspaceSnapshotKey([{ path: 'src/index.ts', content: 'one' }], 'src/index.ts', 'v2')).not.toBe(
      buildWorkspaceSnapshotKey([{ path: 'src/index.ts', content: 'two' }], 'src/index.ts', 'v2'),
    );
  });

  it('builds line diff rows for changed content', () => {
    expect(
      buildLineDiff(
        [{ path: 'src/index.ts', content: 'const value = 1;\n' }],
        [{ path: 'src/index.ts', content: 'const value = 2;\n' }],
        'src/index.ts',
        false,
      ),
    ).toEqual([
      { key: 'delete:0', type: 'delete', content: 'const value = 1;', oldLineNumber: 1 },
      { key: 'insert:0', type: 'insert', content: 'const value = 2;', newLineNumber: 1 },
      { key: 'context:1', type: 'context', content: '', oldLineNumber: 2, newLineNumber: 2 },
    ]);
  });

  it('merges history pages without duplicating commits', () => {
    const current = [createHistoryItem('commit-2', 2, 'Current'), createHistoryItem('commit-1', 1, 'Initial')];
    const next = [createHistoryItem('commit-1', 1, 'Updated initial'), createHistoryItem('commit-0', 0, 'Older')];

    expect(mergeHistoryItems(current, next).map(({ id, message }) => ({ id, message }))).toEqual([
      { id: 'commit-2', message: 'Current' },
      { id: 'commit-1', message: 'Updated initial' },
      { id: 'commit-0', message: 'Older' },
    ]);
  });

  it('supports both extension-specific and language-family JSX names', () => {
    expect(inferLanguageFromPath('src/index.tsx')).toBe('tsx');
    expect(inferLanguageFromPath('src/index.jsx')).toBe('jsx');
    expect(inferLanguageFromPath('src/index.tsx', { jsxLanguage: 'language-family' })).toBe('typescript');
    expect(inferLanguageFromPath('src/index.jsx', { jsxLanguage: 'language-family' })).toBe('javascript');
    expect(inferLanguageFromPath('src/style.css', { cssLanguage: 'text' })).toBe('text');
  });
});
