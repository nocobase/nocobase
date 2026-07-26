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
  it('normalizes and sorts the same tree to the same revision', () => {
    const first = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        { path: 'src\\b.ts', content: 'b', language: 'typescript' },
        { path: './src/a.ts', content: 'a', language: 'typescript' },
      ],
      virtualFiles: [{ path: '.generated/types.d.ts', content: 'declare const value: string;' }],
    });
    const second = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        { path: 'src/a.ts', content: 'a', language: 'typescript' },
        { path: 'src/b.ts', content: 'b', language: 'typescript' },
      ],
      virtualFiles: [{ path: '.generated/types.d.ts', content: 'declare const value: string;' }],
    });

    expect(first.snapshotId).toBe(second.snapshotId);
    expect(first.files.map((file) => [file.path, file.kind, file.writable])).toEqual([
      ['.generated/types.d.ts', 'virtual', false],
      ['src/a.ts', 'source', true],
      ['src/b.ts', 'source', true],
    ]);
  });

  it('changes revisions when content or effective write access changes', () => {
    const createSnapshot = (content: string, readOnly = false) =>
      buildWorkspaceAuthoringTreeSnapshot({
        sourceFiles: [{ path: 'src/index.ts', content, language: 'typescript', readOnly }],
        virtualFiles: [],
      });
    const base = createSnapshot('export const value = 1;');
    const contentChanged = createSnapshot('export const value = 2;');
    const readOnlyChanged = createSnapshot('export const value = 1;', true);

    expect(contentChanged.snapshotId).not.toBe(base.snapshotId);
    expect(contentChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);
    expect(readOnlyChanged.snapshotId).not.toBe(base.snapshotId);
    expect(readOnlyChanged.sourceFiles[0].writable).toBe(false);
  });
});
