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
      sourceFiles: [
        {
          path: 'src/index.ts',
          content: 'export const value = 1;',
          scope: 'entry:a',
          mode: '100644',
          metadata: { access: { role: 'developer' } },
        },
      ],
      virtualFiles: [],
    });
    const contentChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        {
          path: 'src/index.ts',
          content: 'export const value = 2;',
          scope: 'entry:a',
          mode: '100644',
          metadata: { access: { role: 'developer' } },
        },
      ],
      virtualFiles: [],
    });
    const pathChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        {
          path: 'src/main.ts',
          content: 'export const value = 1;',
          scope: 'entry:a',
          mode: '100644',
          metadata: { access: { role: 'developer' } },
        },
      ],
      virtualFiles: [],
    });
    const scopeChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        {
          path: 'src/index.ts',
          content: 'export const value = 1;',
          scope: 'entry:b',
          mode: '100644',
          metadata: { access: { role: 'developer' } },
        },
      ],
      virtualFiles: [],
    });
    const metadataChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        {
          path: 'src/index.ts',
          content: 'export const value = 1;',
          scope: 'entry:a',
          mode: '100644',
          metadata: { access: { role: 'admin' } },
        },
      ],
      virtualFiles: [],
    });
    const modeChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        {
          path: 'src/index.ts',
          content: 'export const value = 1;',
          scope: 'entry:a',
          mode: '100755',
          metadata: { access: { role: 'developer' } },
        },
      ],
      virtualFiles: [],
    });
    const readOnlyChanged = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [
        {
          path: 'src/index.ts',
          content: 'export const value = 1;',
          scope: 'entry:a',
          mode: '100644',
          metadata: { access: { role: 'developer' } },
          readOnly: true,
        },
      ],
      virtualFiles: [],
    });

    expect(contentChanged.snapshotId).not.toBe(base.snapshotId);
    expect(pathChanged.snapshotId).not.toBe(base.snapshotId);
    expect(scopeChanged.snapshotId).not.toBe(base.snapshotId);
    expect(metadataChanged.snapshotId).not.toBe(base.snapshotId);
    expect(modeChanged.snapshotId).not.toBe(base.snapshotId);
    expect(readOnlyChanged.snapshotId).not.toBe(base.snapshotId);
    expect(contentChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);
    expect(scopeChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);
    expect(metadataChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);
    expect(modeChanged.sourceFiles[0].hash).not.toBe(base.sourceFiles[0].hash);

    const sourceMetadata = base.sourceFiles[0].source.metadata as { access: { role: string } };
    sourceMetadata.access.role = 'mutated';
    expect(base.sourceFiles[0].hash).not.toBe(
      buildWorkspaceAuthoringTreeSnapshot({
        sourceFiles: [base.sourceFiles[0].source],
        virtualFiles: [],
      }).sourceFiles[0].hash,
    );
  });

  it('deep clones nested file metadata into the snapshot', () => {
    const metadata = { access: { role: 'developer' } };
    const snapshot = buildWorkspaceAuthoringTreeSnapshot({
      sourceFiles: [{ path: 'src/index.ts', content: 'export default 1;', metadata }],
      virtualFiles: [],
    });

    metadata.access.role = 'admin';

    expect(snapshot.sourceFiles[0].source.metadata).toEqual({ access: { role: 'developer' } });
  });
});
