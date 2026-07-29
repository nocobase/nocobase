/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { RunJSSourceHistoryItem } from '../runjs-studio/types';
import {
  buildWorkspaceDraftToken,
  buildWorkspaceChanges,
  buildWorkspaceSnapshotChanges,
  ensureWorkspaceManifest,
  inferLanguageFromPath,
  mergeHistoryItems,
  mergeRunJSWorkspaceFiles,
  normalizeWorkspaceFiles,
} from '../runjs-studio/workspaceUtils';

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
  it('preserves persisted metadata while accepting newly created workspace files', () => {
    expect(
      normalizeWorkspaceFiles([
        {
          path: 'src/existing.ts',
          content: 'export const existing = true;',
          blobHash: 'blob-existing',
          size: 29,
          managed: false,
        },
        { path: 'src/new.ts', content: 'export const created = true;' },
      ]),
    ).toEqual([
      expect.objectContaining({
        path: 'src/existing.ts',
        content: 'export const existing = true;',
        blobHash: 'blob-existing',
        size: 29,
        managed: false,
      }),
      expect.objectContaining({
        path: 'src/new.ts',
        content: 'export const created = true;',
      }),
    ]);
  });

  it('builds a minimal delta with persisted blob guards', () => {
    const baseFiles = [
      { path: '.nocobase/runjs-source.json', content: '{"entry":"src/client/index.tsx"}', blobHash: 'manifest' },
      { path: 'src/client/delete.ts', content: 'delete me', blobHash: 'delete' },
      { path: 'src/client/index.tsx', content: 'return 1;', blobHash: 'index' },
      { path: 'src/client/unchanged.ts', content: 'same', blobHash: 'unchanged' },
    ];
    const nextFiles = [
      { path: '.nocobase/runjs-source.json', content: '{"entry":"src/client/new.ts"}' },
      { path: 'src/client/index.tsx', content: 'return 2;' },
      { path: 'src/client/new.ts', content: 'export const created = true;' },
      { path: 'src/client/unchanged.ts', content: 'same' },
    ];

    expect(buildWorkspaceChanges(baseFiles, nextFiles)).toEqual([
      {
        path: 'src/client/delete.ts',
        operation: 'delete',
        expectedBlobHash: 'delete',
      },
      {
        path: 'src/client/index.tsx',
        operation: 'upsert',
        expectedBlobHash: 'index',
        content: 'return 2;',
        language: 'tsx',
        mode: undefined,
      },
      {
        path: 'src/client/new.ts',
        operation: 'upsert',
        expectedBlobHash: null,
        content: 'export const created = true;',
        language: 'typescript',
        mode: undefined,
      },
    ]);
  });

  it('keeps unchanged files in compile preview snapshots', () => {
    expect(
      buildWorkspaceSnapshotChanges([
        { path: 'src/client/index.tsx', content: 'import "./helper";' },
        { path: 'src/client/helper.ts', content: 'export const helper = true;' },
      ]),
    ).toEqual([
      expect.objectContaining({ path: 'src/client/helper.ts', operation: 'upsert' }),
      expect.objectContaining({ path: 'src/client/index.tsx', operation: 'upsert' }),
    ]);
  });

  it('keeps draft identity separate from workspace content and server state', () => {
    expect(buildWorkspaceDraftToken(4, 2, 'v2')).toBe(
      JSON.stringify({ draftRevision: 4, runtimeVersion: 'v2', workspaceSession: 2 }),
    );
  });

  it('updates manifest entry and folders through one normalization boundary', () => {
    const files = ensureWorkspaceManifest(
      [
        {
          path: '.nocobase/runjs-source.json',
          content: '{"entry":"src/old.ts","runtimeVersion":"v2","custom":true}',
          mode: '100644',
        },
        { path: 'src/index.ts', content: 'return true;' },
      ],
      { createIfMissing: true, entryPath: 'src/index.ts', folders: ['src/empty', 'src/empty'] },
    );
    const manifest = files.find((file) => file.path === '.nocobase/runjs-source.json');

    expect(manifest).toMatchObject({ mode: '100644', language: 'json' });
    expect(JSON.parse(manifest?.content || '')).toEqual({
      entry: 'src/index.ts',
      runtimeVersion: 'v2',
      custom: true,
      folders: ['src/empty'],
    });
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
