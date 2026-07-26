/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringDiagnostic, CodeAuthoringSnapshot } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import { createWorkspaceAuthoringSurface } from '../createWorkspaceAuthoringSurface';
import { WorkspaceAuthoringError } from '../workspaceChanges';
import type { WorkspaceAuthoringFile } from '../workspaceSnapshot';

function createHarness() {
  let sourceFiles: WorkspaceAuthoringFile[] = [
    { path: 'src/index.ts', content: 'export const value = 1;\n', language: 'typescript' },
    { path: 'src/old.ts', content: 'export const old = true;\n', language: 'typescript' },
    { path: 'src/locked.ts', content: 'locked\n', language: 'typescript', readOnly: true },
    { path: 'private/secret.ts', content: 'secret\n', language: 'typescript' },
  ];
  const virtualFiles: WorkspaceAuthoringFile[] = [
    { path: '.generated/types.d.ts', content: 'declare const generated: string;\n', language: 'typescript' },
  ];
  const commitSourceFiles = vi.fn(async (nextFiles: WorkspaceAuthoringFile[]) => {
    sourceFiles = nextFiles;
  });
  const diagnostics: CodeAuthoringDiagnostic[] = [
    { path: 'src/index.ts', message: 'visible', severity: 'warning' },
    { path: 'private/secret.ts', message: 'hidden', severity: 'error' },
  ];
  const surface = createWorkspaceAuthoringSurface({
    id: 'workspace:test',
    kind: 'test-workspace',
    title: 'Test workspace',
    getSourceFiles: () => sourceFiles,
    getVirtualFiles: () => virtualFiles,
    commitSourceFiles,
    getActivePath: () => 'src/index.ts',
    getPathAccess: (path) => ({
      canCreate: path.startsWith('src/') || path.startsWith('.generated/'),
      canUpdate: path.startsWith('src/') || path.startsWith('.generated/'),
      canDelete: path.startsWith('src/') || path.startsWith('.generated/'),
      reason: 'Outside workspace scope',
    }),
    canReadForAI: (file) => !file.path.startsWith('private/'),
    getDiagnostics: () => diagnostics,
    sanitizeDiagnostic: (diagnostic) => diagnostic,
    validateDraft: () => diagnostics,
    supportedLanguages: ['typescript', 'javascript', 'json'],
  });

  return {
    surface,
    commitSourceFiles,
    getSourceFiles: () => sourceFiles,
    edit(path: string, content: string) {
      const file = sourceFiles.find((candidate) => candidate.path === path);
      if (file) {
        file.content = content;
      }
    },
  };
}

function getFile(snapshot: CodeAuthoringSnapshot, path: string) {
  const file = snapshot.files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`Expected snapshot file: ${path}`);
  }
  return file;
}

async function expectAuthoringError(promise: Promise<unknown>, code: WorkspaceAuthoringError['code']) {
  await expect(promise).rejects.toMatchObject({ name: 'WorkspaceAuthoringError', code });
}

describe('workspace authoring changes', () => {
  it('prepares atomic CRUD without side effects and commits source files once', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const before = structuredClone(harness.getSourceFiles());
    const plan = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        { type: 'create', path: 'src/new.ts', content: 'export const created = true;\n', language: 'typescript' },
        {
          type: 'update',
          path: 'src/index.ts',
          baseHash: getFile(snapshot, 'src/index.ts').hash,
          content: 'export const value = 2;\n',
        },
        { type: 'delete', path: 'src/old.ts', baseHash: getFile(snapshot, 'src/old.ts').hash },
      ],
    });

    expect(harness.getSourceFiles()).toEqual(before);
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
    const result = await harness.surface.applyPreparedChanges(plan.planId);
    expect(result).toMatchObject({
      changedPaths: ['src/new.ts', 'src/index.ts', 'src/old.ts'],
    });
    expect(result.snapshotId).toBe((await harness.surface.getSnapshot()).snapshotId);
    expect(harness.commitSourceFiles).toHaveBeenCalledOnce();
    expect(harness.getSourceFiles().map((file) => file.path)).toEqual([
      'private/secret.ts',
      'src/index.ts',
      'src/locked.ts',
      'src/new.ts',
    ]);
  });

  it('leaves the workspace unchanged when a later change fails', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const before = structuredClone(harness.getSourceFiles());

    await expectAuthoringError(
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [
          {
            type: 'update',
            path: 'src/index.ts',
            baseHash: getFile(snapshot, 'src/index.ts').hash,
            content: 'valid\n',
          },
          {
            type: 'update',
            path: 'src/locked.ts',
            baseHash: getFile(snapshot, 'src/locked.ts').hash,
            content: 'invalid\n',
          },
        ],
      }),
      'READ_ONLY_FILE',
    );
    expect(harness.getSourceFiles()).toEqual(before);
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it.each([
    [
      'stale snapshot',
      'STALE_SNAPSHOT',
      async (harness: ReturnType<typeof createHarness>, snapshot: CodeAuthoringSnapshot) => {
        harness.edit('src/index.ts', 'manual edit\n');
        return harness.surface.prepareChanges({
          baseSnapshotId: snapshot.snapshotId,
          changes: [{ type: 'create', path: 'src/new.ts', content: '' }],
        });
      },
    ],
    [
      'wrong base hash',
      'BASE_HASH_MISMATCH',
      async (harness: ReturnType<typeof createHarness>, snapshot: CodeAuthoringSnapshot) =>
        harness.surface.prepareChanges({
          baseSnapshotId: snapshot.snapshotId,
          changes: [{ type: 'update', path: 'src/index.ts', baseHash: 'wrong', content: '' }],
        }),
    ],
    [
      'path access',
      'PATH_ACCESS_DENIED',
      async (harness: ReturnType<typeof createHarness>, snapshot: CodeAuthoringSnapshot) =>
        harness.surface.prepareChanges({
          baseSnapshotId: snapshot.snapshotId,
          changes: [{ type: 'create', path: 'outside.ts', content: '' }],
        }),
    ],
    [
      'virtual file',
      'VIRTUAL_FILE',
      async (harness: ReturnType<typeof createHarness>, snapshot: CodeAuthoringSnapshot) =>
        harness.surface.prepareChanges({
          baseSnapshotId: snapshot.snapshotId,
          changes: [{ type: 'update', path: '.generated/types.d.ts', baseHash: 'unused', content: '' }],
        }),
    ],
  ] as const)('rejects %s', async (_label, code, run) => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    await expectAuthoringError(run(harness, snapshot), code);
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it('rejects stale apply after a manual edit', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const plan = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: 'src/index.ts',
          baseHash: getFile(snapshot, 'src/index.ts').hash,
          content: 'prepared\n',
        },
      ],
    });
    harness.edit('src/index.ts', 'manual edit\n');

    await expectAuthoringError(harness.surface.applyPreparedChanges(plan.planId), 'STALE_SNAPSHOT');
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it('keeps only the latest plan and does not reuse plan ids after remount', async () => {
    const first = createHarness();
    const firstSnapshot = await first.surface.getSnapshot();
    const firstFile = getFile(firstSnapshot, 'src/index.ts');
    const replacedPlan = await first.surface.prepareChanges({
      baseSnapshotId: firstSnapshot.snapshotId,
      changes: [{ type: 'update', path: firstFile.path, baseHash: firstFile.hash, content: 'first\n' }],
    });
    const latestPlan = await first.surface.prepareChanges({
      baseSnapshotId: firstSnapshot.snapshotId,
      changes: [{ type: 'update', path: firstFile.path, baseHash: firstFile.hash, content: 'second\n' }],
    });
    await expectAuthoringError(first.surface.applyPreparedChanges(replacedPlan.planId), 'PLAN_NOT_FOUND');

    const remounted = createHarness();
    const remountedSnapshot = await remounted.surface.getSnapshot();
    const remountedFile = getFile(remountedSnapshot, 'src/index.ts');
    const remountedPlan = await remounted.surface.prepareChanges({
      baseSnapshotId: remountedSnapshot.snapshotId,
      changes: [{ type: 'update', path: remountedFile.path, baseHash: remountedFile.hash, content: 'remounted\n' }],
    });

    expect(remountedPlan.planId).not.toBe(latestPlan.planId);
    await expectAuthoringError(remounted.surface.applyPreparedChanges(latestPlan.planId), 'PLAN_NOT_FOUND');
  });

  it('applies one read policy to snapshots, reads, searches, diagnostics, and validation', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();

    expect(snapshot.files.map((file) => file.path)).not.toContain('private/secret.ts');
    expect(snapshot.diagnostics).toEqual([expect.objectContaining({ path: 'src/index.ts' })]);
    expect(await harness.surface.read(['private/secret.ts', '.generated/types.d.ts'])).toEqual([
      expect.objectContaining({ path: '.generated/types.d.ts', kind: 'virtual', writable: false }),
    ]);
    expect((await harness.surface.search({ query: 'secret' })).map((match) => match.path)).not.toContain(
      'private/secret.ts',
    );
    await expect(harness.surface.validateDraft()).resolves.toMatchObject({
      stale: false,
      diagnostics: [expect.objectContaining({ path: 'src/index.ts' })],
    });
  });
});
