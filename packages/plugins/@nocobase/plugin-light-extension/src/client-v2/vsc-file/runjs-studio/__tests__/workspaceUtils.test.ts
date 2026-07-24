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
import {
  buildLineDiff,
  buildWorkspaceSnapshotKey,
  inferLanguageFromPath,
  mergeHistoryItems,
  mergeRunJSWorkspaceFiles,
} from '../workspaceUtils';

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

  it('three-way merges independent path changes and preserves the complete snapshot', () => {
    const base = [
      { path: 'src/client/index.tsx', content: 'ctx.render(title);' },
      { path: 'src/client/title.ts', content: 'export const title = "base";' },
    ];
    const local = [{ path: 'src/client/index.tsx', content: 'ctx.render(title.toUpperCase());' }, base[1]];
    const latest = [
      base[0],
      { path: 'src/client/title.ts', content: 'export const title = "latest";' },
      { path: 'src/client/helper.ts', content: 'export const helper = true;' },
    ];

    expect(mergeRunJSWorkspaceFiles(base, local, latest)).toEqual({
      conflictPaths: [],
      files: [
        {
          path: 'src/client/helper.ts',
          content: 'export const helper = true;',
          language: 'typescript',
          mode: undefined,
        },
        {
          path: 'src/client/index.tsx',
          content: 'ctx.render(title.toUpperCase());',
          language: 'tsx',
          mode: undefined,
        },
        {
          path: 'src/client/title.ts',
          content: 'export const title = "latest";',
          language: 'typescript',
          mode: undefined,
        },
      ],
    });
  });

  it('reports same-path three-way conflicts without choosing either side', () => {
    const base = [{ path: 'src/client/index.tsx', content: 'ctx.render("base");' }];
    const local = [{ path: 'src/client/index.tsx', content: 'ctx.render("local");' }];
    const latest = [{ path: 'src/client/index.tsx', content: 'ctx.render("latest");' }];

    expect(mergeRunJSWorkspaceFiles(base, local, latest)).toEqual({
      files: [],
      conflictPaths: ['src/client/index.tsx'],
    });
  });
});
