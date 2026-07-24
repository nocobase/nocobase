/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringChange, CodeAuthoringDiagnostic, CodeAuthoringSnapshot } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import { createWorkspaceAuthoringSurface } from '../createWorkspaceAuthoringSurface';
import type { WorkspaceAuthoringError } from '../workspaceChanges';
import type { WorkspaceAuthoringFile } from '../workspaceSnapshot';

function createHarness(overrides: { sourceFiles?: WorkspaceAuthoringFile[] } = {}) {
  let sourceFiles = overrides.sourceFiles || [
    {
      path: 'src/index.ts',
      content: "import { value } from './value';\nconsole.log(value);\n",
      language: 'typescript',
    },
    { path: 'src/value.ts', content: 'export const value = 1;\n', language: 'typescript' },
    { path: 'src/old.ts', content: 'export const old = true;\n', language: 'typescript' },
    { path: 'src/locked.ts', content: 'export const locked = true;\n', language: 'typescript', readOnly: true },
    { path: 'private/secret.ts', content: 'secret', language: 'typescript' },
  ];
  const virtualFiles: WorkspaceAuthoringFile[] = [
    {
      path: '.generated/types.d.ts',
      content: 'declare const generated: string;\n',
      language: 'typescript',
      readOnly: true,
    },
  ];
  const commitSourceFiles = vi.fn(async (nextFiles: WorkspaceAuthoringFile[]) => {
    sourceFiles = nextFiles;
  });
  const diagnostics: CodeAuthoringDiagnostic[] = [
    { path: 'src/index.ts', message: 'visible diagnostic', severity: 'warning' },
    { path: 'private/secret.ts', message: 'secret diagnostic', severity: 'error' },
    { message: 'safe workspace diagnostic', severity: 'info' },
  ];
  const surface = createWorkspaceAuthoringSurface({
    id: 'workspace:test',
    kind: 'runjs-workspace',
    title: 'Test workspace',
    scope: { type: 'entry', id: 'entry-1' },
    getSourceFiles: () => sourceFiles,
    getVirtualFiles: () => virtualFiles,
    commitSourceFiles,
    getActivePath: () => 'src/index.ts',
    getPathAccess: (path) => ({
      canCreate: path.startsWith('src/'),
      canWrite: path.startsWith('src/'),
      canDelete: path.startsWith('src/'),
      reason: path.startsWith('src/') ? undefined : 'Outside entry scope',
    }),
    canReadForAI: (file) => !file.path.startsWith('private/'),
    getDiagnostics: () => diagnostics,
    sanitizeDiagnostic: (diagnostic) => ({
      ...diagnostic,
      message: diagnostic.message.replace('secret', '[redacted]'),
    }),
    validateDraft: () => diagnostics,
    reveal: vi.fn(),
    supportedLanguages: ['typescript', 'javascript', 'json'],
  });

  return { surface, commitSourceFiles, getSourceFiles: () => sourceFiles };
}

async function expectAuthoringError(promise: Promise<unknown>, code: WorkspaceAuthoringError['code']) {
  await expect(promise).rejects.toMatchObject({ name: 'WorkspaceAuthoringError', code });
}

function getSnapshotFile(snapshot: CodeAuthoringSnapshot, path: string) {
  const file = snapshot.files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`Expected snapshot file: ${path}`);
  }
  return file;
}

describe('workspace authoring changes', () => {
  it('prepares a side-effect-free multi-file plan and applies it to source files only', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const beforeSource = structuredClone(harness.getSourceFiles());
    const changes: CodeAuthoringChange[] = [
      { type: 'create', path: 'src/new.ts', content: 'export const created = true;\n', language: 'typescript' },
      {
        type: 'update',
        path: 'src/index.ts',
        baseHash: getSnapshotFile(snapshot, 'src/index.ts').hash,
        content: "import { value } from './value';\nconsole.log(value + 1);\n",
      },
      {
        type: 'patch',
        path: 'src/value.ts',
        baseHash: getSnapshotFile(snapshot, 'src/value.ts').hash,
        patch: '@@ -1,1 +1,1 @@\n-export const value = 1;\n+export const value = 2;\n',
      },
      { type: 'delete', path: 'src/old.ts', baseHash: getSnapshotFile(snapshot, 'src/old.ts').hash },
    ];

    const plan = await harness.surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes });
    expect(harness.getSourceFiles()).toEqual(beforeSource);
    expect(plan.diffs.map((diff) => [diff.path, diff.status])).toEqual([
      ['src/index.ts', 'modified'],
      ['src/new.ts', 'created'],
      ['src/old.ts', 'deleted'],
      ['src/value.ts', 'modified'],
    ]);

    const result = await harness.surface.applyPreparedChanges(plan.planId);
    expect(result.changedPaths).toEqual(['src/index.ts', 'src/new.ts', 'src/old.ts', 'src/value.ts']);
    expect(harness.commitSourceFiles).toHaveBeenCalledTimes(1);
    expect(harness.getSourceFiles().map((file) => file.path)).not.toContain('.generated/types.d.ts');
    await expectAuthoringError(harness.surface.applyPreparedChanges(plan.planId), 'PLAN_NOT_FOUND');
  });

  it('keeps only the latest plan and rejects it when the workspace becomes stale', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const index = getSnapshotFile(snapshot, 'src/index.ts');
    const first = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: index.path, baseHash: index.hash, content: 'first\n' }],
    });
    const second = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: index.path, baseHash: index.hash, content: 'second\n' }],
    });

    await expectAuthoringError(harness.surface.applyPreparedChanges(first.planId), 'PLAN_NOT_FOUND');
    harness.getSourceFiles()[0].content = 'manual edit\n';
    await expectAuthoringError(harness.surface.applyPreparedChanges(second.planId), 'STALE_SNAPSHOT');
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it.each([
    ['absolute path', { type: 'create', path: '/tmp/escape.ts', content: '' }, 'INVALID_PATH'],
    ['parent traversal', { type: 'create', path: '../escape.ts', content: '' }, 'INVALID_PATH'],
    ['scope escape', { type: 'create', path: 'outside.ts', content: '' }, 'PATH_ACCESS_DENIED'],
    ['binary content', { type: 'create', path: 'src/binary.ts', content: 'text\0binary' }, 'BINARY_CONTENT'],
    [
      'unsupported language',
      { type: 'create', path: 'src/image.png', content: 'text', language: 'binary' },
      'UNSUPPORTED_LANGUAGE',
    ],
  ] as const)('rejects %s', async (_label, change, code) => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    await expectAuthoringError(
      harness.surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes: [change as CodeAuthoringChange] }),
      code,
    );
  });

  it('rejects duplicate, read-only, stale-hash, and conflicting patch changes', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const index = getSnapshotFile(snapshot, 'src/index.ts');
    const locked = getSnapshotFile(snapshot, 'src/locked.ts');
    const prepare = (changes: CodeAuthoringChange[]) =>
      harness.surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes });

    await expectAuthoringError(
      prepare([
        { type: 'update', path: index.path, baseHash: index.hash, content: 'first' },
        { type: 'delete', path: index.path, baseHash: index.hash },
      ]),
      'DUPLICATE_TARGET',
    );
    await expectAuthoringError(
      prepare([{ type: 'update', path: locked.path, baseHash: locked.hash, content: 'changed' }]),
      'READ_ONLY_FILE',
    );
    await expectAuthoringError(
      prepare([{ type: 'update', path: index.path, baseHash: 'stale-hash', content: 'changed' }]),
      'BASE_HASH_MISMATCH',
    );
    await expectAuthoringError(
      prepare([
        {
          type: 'patch',
          path: index.path,
          baseHash: index.hash,
          patch: '@@ -1,1 +1,1 @@\n-not the exact source\n+replacement\n',
        },
      ]),
      'PATCH_CONFLICT',
    );
  });

  it('applies the same read policy to snapshots, reads, searches, and diagnostics', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();

    expect(snapshot.files.map((file) => file.path)).not.toContain('private/secret.ts');
    expect(snapshot.diagnostics).toEqual([
      expect.objectContaining({ path: 'src/index.ts', message: 'visible diagnostic' }),
      expect.objectContaining({ message: 'safe workspace diagnostic' }),
    ]);
    await expect(harness.surface.read(['private/secret.ts', '.generated/types.d.ts'])).resolves.toEqual([
      expect.objectContaining({ path: '.generated/types.d.ts', kind: 'virtual', writable: false }),
    ]);
    const matches = await harness.surface.search({ query: 'e', limit: 1_000, contextLength: 1_000 });
    expect(matches.length).toBeLessThanOrEqual(50);
    expect(matches.every((match) => match.preview.length <= 240)).toBe(true);
    expect(matches.map((match) => match.path)).not.toContain('private/secret.ts');
  });

  it('exposes read-only capabilities and rejects changes after disposal', async () => {
    const surface = createWorkspaceAuthoringSurface({
      id: 'workspace:repository-read-only',
      kind: 'light-extension-workspace',
      title: 'Repository workspace',
      scope: { type: 'repository', id: 'repo-1' },
      getSourceFiles: () => [{ path: 'src/index.ts', content: 'export default 1;' }],
      getVirtualFiles: () => [],
      commitSourceFiles: vi.fn(),
      getActivePath: () => 'src/index.ts',
      getPathAccess: () => ({ canCreate: false, canWrite: false, canDelete: false }),
      canReadForAI: () => true,
      getDiagnostics: () => [],
      sanitizeDiagnostic: (diagnostic) => diagnostic,
      validateDraft: () => [],
      reveal: vi.fn(),
      unavailableReason: 'Repository authoring is read-only',
      changeCapabilities: { prepareChanges: false, applyPreparedChanges: false },
    });
    const snapshot = await surface.describe();
    expect(snapshot.capabilities).toMatchObject({
      prepareChanges: false,
      applyPreparedChanges: false,
      unavailableReason: 'Repository authoring is read-only',
    });
    await expectAuthoringError(
      surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes: [] }),
      'CAPABILITY_UNAVAILABLE',
    );
    surface.dispose?.();
    await expectAuthoringError(surface.getSnapshot(), 'SURFACE_DISPOSED');
  });
});
