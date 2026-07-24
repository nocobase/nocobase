/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CodeAuthoringChange,
  CodeAuthoringDiagnostic,
  CodeAuthoringSnapshot,
  CodeAuthoringSurface,
} from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import { createWorkspaceAuthoringSurface } from '../createWorkspaceAuthoringSurface';
import { WorkspaceAuthoringError } from '../workspaceChanges';
import type { WorkspaceAuthoringFile } from '../workspaceSnapshot';

function createHarness(
  overrides: {
    sourceFiles?: WorkspaceAuthoringFile[];
    virtualFiles?: WorkspaceAuthoringFile[];
    now?: () => number;
    maxPlans?: number;
  } = {},
) {
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
  const virtualFiles = overrides.virtualFiles || [
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
    now: overrides.now,
    maxPlans: overrides.maxPlans,
    planTtlMs: 100,
    supportedLanguages: ['typescript', 'javascript', 'json'],
  });

  return { surface, commitSourceFiles, getSourceFiles: () => sourceFiles, virtualFiles };
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
  it('prepares a side-effect-free multi-file plan and applies it with one source-only commit', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const beforeSource = structuredClone(harness.getSourceFiles());
    const beforeVirtual = structuredClone(harness.virtualFiles);
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

    expect(plan.diffs.map((diff) => [diff.path, diff.status])).toEqual([
      ['src/index.ts', 'modified'],
      ['src/new.ts', 'created'],
      ['src/old.ts', 'deleted'],
      ['src/value.ts', 'modified'],
    ]);
    expect(harness.getSourceFiles()).toEqual(beforeSource);
    expect(harness.virtualFiles).toEqual(beforeVirtual);
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();

    const result = await harness.surface.applyPreparedChanges(plan.planId);

    expect(harness.commitSourceFiles).toHaveBeenCalledTimes(1);
    expect(result.saved).toBe(false);
    expect(result.changedPaths).toEqual(['src/index.ts', 'src/new.ts', 'src/old.ts', 'src/value.ts']);
    expect(harness.getSourceFiles().map((file) => file.path)).toEqual([
      'private/secret.ts',
      'src/index.ts',
      'src/locked.ts',
      'src/new.ts',
      'src/value.ts',
    ]);
    expect(harness.getSourceFiles()).not.toContainEqual(expect.objectContaining({ path: '.generated/types.d.ts' }));
    await expectAuthoringError(harness.surface.applyPreparedChanges(plan.planId), 'PLAN_CONSUMED');
  });

  it('rejects stale apply without committing any part of the prepared plan', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const index = getSnapshotFile(snapshot, 'src/index.ts');
    const plan = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: index.path, baseHash: index.hash, content: 'prepared content\n' }],
    });
    harness.getSourceFiles()[0].content = 'manual edit\n';

    await expectAuthoringError(harness.surface.applyPreparedChanges(plan.planId), 'STALE_SNAPSHOT');
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
    expect(harness.getSourceFiles()[0].content).toBe('manual edit\n');
  });

  it('serializes plan commits and never overwrites edits made while post-commit diagnostics are pending', async () => {
    let sourceFiles: WorkspaceAuthoringFile[] = [
      { path: 'src/index.ts', content: 'export const value = 1;\n', language: 'typescript' },
    ];
    let resolveCommit: (() => void) | undefined;
    let resolveDiagnostics: ((diagnostics: CodeAuthoringDiagnostic[]) => void) | undefined;
    let diagnosticsStarted = false;
    const diagnosticsPromise = new Promise<CodeAuthoringDiagnostic[]>((resolve) => {
      resolveDiagnostics = resolve;
    });
    const commitSourceFiles = vi.fn(
      (nextFiles: WorkspaceAuthoringFile[]) =>
        new Promise<void>((resolve) => {
          resolveCommit = () => {
            sourceFiles = nextFiles;
            resolve();
          };
        }),
    );
    const surface = createWorkspaceAuthoringSurface({
      id: 'workspace:serialized-apply',
      kind: 'runjs-workspace',
      title: 'Serialized workspace',
      scope: { type: 'entry', id: 'entry-1' },
      getSourceFiles: () => sourceFiles,
      getVirtualFiles: () => [],
      commitSourceFiles,
      getActivePath: () => 'src/index.ts',
      getPathAccess: () => ({ canCreate: true, canUpdate: true, canPatch: true, canDelete: true }),
      canReadForAI: () => true,
      getDiagnostics: () => (diagnosticsStarted ? diagnosticsPromise : []),
      sanitizeDiagnostic: (diagnostic) => diagnostic,
      validateDraft: () => [],
      reveal: vi.fn(),
    });
    const snapshot = await surface.getSnapshot();
    const file = getSnapshotFile(snapshot, 'src/index.ts');
    const firstPlan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: file.path, baseHash: file.hash, content: 'export const value = 2;\n' }],
    });
    const secondPlan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: file.path, baseHash: file.hash, content: 'export const value = 3;\n' }],
    });

    const firstApply = surface.applyPreparedChanges(firstPlan.planId);
    await vi.waitFor(() => expect(commitSourceFiles).toHaveBeenCalledTimes(1));
    await expectAuthoringError(surface.applyPreparedChanges(secondPlan.planId), 'PLAN_APPLYING');

    diagnosticsStarted = true;
    resolveCommit?.();
    await vi.waitFor(() => expect(sourceFiles[0].content).toBe('export const value = 2;\n'));
    sourceFiles[0].content = 'manual edit after commit\n';
    resolveDiagnostics?.([]);
    await expect(firstApply).resolves.toMatchObject({ saved: false });
    expect(sourceFiles[0].content).toBe('manual edit after commit\n');

    await expectAuthoringError(surface.applyPreparedChanges(firstPlan.planId), 'PLAN_CONSUMED');
    await expectAuthoringError(surface.applyPreparedChanges(secondPlan.planId), 'STALE_SNAPSHOT');
  });

  it('keeps a committed plan consumed when post-commit diagnostic projection fails', async () => {
    let sourceFiles: WorkspaceAuthoringFile[] = [
      { path: 'src/index.ts', content: 'export const value = 1;\n', language: 'typescript' },
    ];
    let failDiagnostics = false;
    const surface = createWorkspaceAuthoringSurface({
      id: 'workspace:diagnostic-fallback',
      kind: 'runjs-workspace',
      title: 'Diagnostic fallback workspace',
      scope: { type: 'entry', id: 'entry-1' },
      getSourceFiles: () => sourceFiles,
      getVirtualFiles: () => [],
      commitSourceFiles: (nextFiles) => {
        sourceFiles = nextFiles;
        failDiagnostics = true;
      },
      getActivePath: () => 'src/index.ts',
      getPathAccess: () => ({ canCreate: true, canUpdate: true, canPatch: true, canDelete: true }),
      canReadForAI: () => true,
      getDiagnostics: () => {
        if (failDiagnostics) {
          throw new Error('diagnostics unavailable');
        }
        return [];
      },
      sanitizeDiagnostic: (diagnostic) => diagnostic,
      validateDraft: () => [],
      reveal: vi.fn(),
    });
    const snapshot = await surface.getSnapshot();
    const file = getSnapshotFile(snapshot, 'src/index.ts');
    const plan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: file.path, baseHash: file.hash, content: 'export const value = 2;\n' }],
    });

    await expect(surface.applyPreparedChanges(plan.planId)).resolves.toMatchObject({
      snapshot: { diagnostics: [] },
      saved: false,
    });
    expect(sourceFiles[0].content).toBe('export const value = 2;\n');
    await expectAuthoringError(surface.applyPreparedChanges(plan.planId), 'PLAN_CONSUMED');
  });

  it('returns committed apply success when the surface is disposed immediately after commit', async () => {
    let sourceFiles: WorkspaceAuthoringFile[] = [
      { path: 'src/index.ts', content: 'export const value = 1;\n', language: 'typescript' },
    ];
    const surface: CodeAuthoringSurface = createWorkspaceAuthoringSurface({
      id: 'workspace:dispose-after-commit',
      kind: 'runjs-workspace',
      title: 'Dispose after commit workspace',
      scope: { type: 'entry', id: 'entry-1' },
      getSourceFiles: () => sourceFiles,
      getVirtualFiles: () => [],
      commitSourceFiles: (nextFiles) => {
        sourceFiles = nextFiles;
        surface.dispose?.();
      },
      getActivePath: () => 'src/index.ts',
      getPathAccess: () => ({ canCreate: true, canUpdate: true, canPatch: true, canDelete: true }),
      canReadForAI: () => true,
      getDiagnostics: () => [],
      sanitizeDiagnostic: (diagnostic) => diagnostic,
      validateDraft: () => [],
      reveal: vi.fn(),
    });
    const snapshot = await surface.getSnapshot();
    const file = getSnapshotFile(snapshot, 'src/index.ts');
    const plan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'update', path: file.path, baseHash: file.hash, content: 'export const value = 2;\n' }],
    });

    await expect(surface.applyPreparedChanges(plan.planId)).resolves.toMatchObject({
      changedPaths: ['src/index.ts'],
      saved: false,
    });
    expect(sourceFiles[0].content).toBe('export const value = 2;\n');
  });

  it.each([
    ['absolute path', { type: 'create', path: '/tmp/escape.ts', content: '' }, 'INVALID_PATH'],
    ['parent traversal', { type: 'create', path: '../escape.ts', content: '' }, 'INVALID_PATH'],
    ['scope escape', { type: 'create', path: 'outside.ts', content: '' }, 'PATH_ACCESS_DENIED'],
    [
      'virtual file',
      { type: 'update', path: '.generated/types.d.ts', baseHash: 'wrong', content: '' },
      'PATH_ACCESS_DENIED',
    ],
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
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it('rejects duplicate targets, read-only files, wrong hashes, and inexact patches', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const index = getSnapshotFile(snapshot, 'src/index.ts');
    const locked = getSnapshotFile(snapshot, 'src/locked.ts');

    await expectAuthoringError(
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [
          { type: 'update', path: index.path, baseHash: index.hash, content: 'first' },
          { type: 'delete', path: index.path, baseHash: index.hash },
        ],
      }),
      'DUPLICATE_TARGET',
    );
    await expectAuthoringError(
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [{ type: 'update', path: locked.path, baseHash: locked.hash, content: 'changed' }],
      }),
      'READ_ONLY_FILE',
    );
    await expectAuthoringError(
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [{ type: 'update', path: index.path, baseHash: 'stale-hash', content: 'changed' }],
      }),
      'BASE_HASH_MISMATCH',
    );
    await expectAuthoringError(
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [
          {
            type: 'patch',
            path: index.path,
            baseHash: index.hash,
            patch: '@@ -1,1 +1,1 @@\n-not the exact source\n+replacement\n',
          },
        ],
      }),
      'PATCH_CONFLICT',
    );
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it('expires plans and clears them when the surface is disposed', async () => {
    let currentTime = 1_000;
    const harness = createHarness({ now: () => currentTime });
    const snapshot = await harness.surface.getSnapshot();
    const index = getSnapshotFile(snapshot, 'src/index.ts');
    const plan = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'delete', path: index.path, baseHash: index.hash }],
    });
    currentTime = plan.expiresAt;

    await expectAuthoringError(harness.surface.applyPreparedChanges(plan.planId), 'PLAN_EXPIRED');
    harness.surface.dispose?.();
    await expectAuthoringError(harness.surface.applyPreparedChanges(plan.planId), 'SURFACE_DISPOSED');
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it('evicts the oldest prepared plan when the per-surface capacity is reached', async () => {
    const harness = createHarness({ maxPlans: 2 });
    const snapshot = await harness.surface.getSnapshot();
    const index = getSnapshotFile(snapshot, 'src/index.ts');
    const prepare = (content: string) =>
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [{ type: 'update' as const, path: index.path, baseHash: index.hash, content }],
      });

    const first = await prepare('first\n');
    const second = await prepare('second\n');
    const third = await prepare('third\n');

    await expectAuthoringError(harness.surface.applyPreparedChanges(first.planId), 'PLAN_NOT_FOUND');
    await expect(harness.surface.applyPreparedChanges(second.planId)).resolves.toMatchObject({ saved: false });
    await expectAuthoringError(harness.surface.applyPreparedChanges(third.planId), 'STALE_SNAPSHOT');
  });

  it('uses the same read policy for descriptors, reads, searches, and diagnostics with bounded output', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();

    expect(snapshot.files.map((file) => file.path)).not.toContain('private/secret.ts');
    expect(snapshot.diagnostics).toEqual([
      expect.objectContaining({ path: 'src/index.ts', message: 'visible diagnostic' }),
      expect.objectContaining({ message: 'safe workspace diagnostic' }),
    ]);
    expect(await harness.surface.read(['private/secret.ts', 'src/missing.ts', '.generated/types.d.ts'])).toEqual([
      expect.objectContaining({ path: '.generated/types.d.ts', kind: 'virtual', writable: false }),
    ]);
    const matches = await harness.surface.search({ query: 'e', limit: 1000, contextLength: 1000 });
    expect(matches.length).toBeLessThanOrEqual(50);
    expect(matches.every((match) => match.preview.length <= 240)).toBe(true);
    expect(matches.map((match) => match.path)).not.toContain('private/secret.ts');
  });

  it('rejects empty plans and exposes a read-only capability gate for adapters', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    await expectAuthoringError(
      harness.surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes: [] }),
      'INVALID_CHANGE',
    );

    const readOnlySurface = createWorkspaceAuthoringSurface({
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
    const descriptor = await readOnlySurface.describe();

    expect(descriptor.capabilities).toMatchObject({
      prepareChanges: false,
      applyPreparedChanges: false,
      unavailableReason: 'Repository authoring is read-only',
    });
    await expectAuthoringError(
      readOnlySurface.prepareChanges({ baseSnapshotId: descriptor.snapshotId, changes: [] }),
      'CAPABILITY_UNAVAILABLE',
    );
    await expectAuthoringError(readOnlySurface.applyPreparedChanges('arbitrary-plan'), 'CAPABILITY_UNAVAILABLE');
  });
});
