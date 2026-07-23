/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { buildWorkspaceAuthoringTreeSnapshot } from '../workspaceSnapshot';

describe('workspace authoring snapshot', () => {
  it('creates the same revision for the same normalized and sorted tree', () => {
    const first = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        { path: 'src\\b.ts', content: 'b', language: 'typescript' },
        { path: './src/a.ts', content: 'a', language: 'typescript' },
      ],
      virtualFiles: [{ path: '.generated/types.d.ts', content: 'declare const value: string;', readOnly: true }],
    });
    const second = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        { path: 'src/a.ts', content: 'a', language: 'typescript' },
        { path: 'src/b.ts', content: 'b', language: 'typescript' },
      ],
      virtualFiles: [{ path: '.generated/types.d.ts', content: 'declare const value: string;', readOnly: true }],
    });

    expect(first.snapshotId).toBe(second.snapshotId);
    expect(first.files.map((file) => file.path)).toEqual(['.generated/types.d.ts', 'src/a.ts', 'src/b.ts']);
    expect(first.virtualFiles[0]).toMatchObject({ kind: 'virtual', writable: false, persisted: false });
  });

  it('changes file hashes and the tree revision when content or access metadata changes', () => {
    const base = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [{ path: 'src/index.ts', content: 'export const value = 1;', scope: 'entry:a' }],
      virtualFiles: [],
    });
    const contentChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [{ path: 'src/index.ts', content: 'export const value = 2;', scope: 'entry:a' }],
      virtualFiles: [],
    });
    const pathChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [{ path: 'src/main.ts', content: 'export const value = 1;', scope: 'entry:a' }],
      virtualFiles: [],
    });
    const scopeChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [{ path: 'src/index.ts', content: 'export const value = 1;', scope: 'entry:b' }],
      virtualFiles: [],
    });
    const readOnlyChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [{ path: 'src/index.ts', content: 'export const value = 1;', scope: 'entry:a', readOnly: true }],
      virtualFiles: [],
    });

    expect(contentChanged.snapshotId).not.toBe(base.snapshotId);
    expect(pathChanged.snapshotId).not.toBe(base.snapshotId);
    expect(scopeChanged.snapshotId).not.toBe(base.snapshotId);
    expect(readOnlyChanged.snapshotId).not.toBe(base.snapshotId);
    expect(contentChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);
    expect(scopeChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);
  });
});
