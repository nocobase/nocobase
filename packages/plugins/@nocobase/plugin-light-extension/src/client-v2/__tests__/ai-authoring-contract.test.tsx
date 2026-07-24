/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringDiagnostic } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import { createWorkspaceAuthoringSurface, type WorkspaceAuthoringFile } from '../workspace/authoring';
import {
  canReadLightExtensionWorkspacePathForAI,
  getLightExtensionWorkspaceAuthoringPathAccess,
  type LightExtensionWorkspaceScope,
} from '../workspace/lightExtensionWorkspaceAccess';

const entryPath = 'src/client/js-blocks/current/index.tsx';
const helperPath = 'src/client/js-blocks/current/helper.ts';
const hiddenPath = 'src/client/js-actions/secret/index.ts';
const scope: LightExtensionWorkspaceScope = { mode: 'entry', entryPath, kind: 'js-block' };

function createContractSurface() {
  let sourceFiles: WorkspaceAuthoringFile[] = [
    { path: entryPath, content: 'export default function Current() { return null; }\n', language: 'typescriptreact' },
    {
      path: 'src/client/js-blocks/current/entry.json',
      content: '{"schemaVersion":1,"key":"current"}\n',
      language: 'json',
      readOnly: true,
    },
    {
      path: 'src/shared/format.ts',
      content: 'export const format = String;\n',
      language: 'typescript',
      readOnly: true,
    },
    { path: 'tsconfig.json', content: '{}\n', language: 'json', readOnly: true },
    { path: hiddenPath, content: 'export const secret = true;\n', language: 'typescript' },
    { path: 'README.md', content: 'private repository notes\n', language: 'markdown' },
  ];
  const virtualFiles: WorkspaceAuthoringFile[] = [
    {
      path: '.light-extension/types/sdk.d.ts',
      content: 'declare const sdk: unknown;\n',
      language: 'typescript',
      persisted: false,
      readOnly: true,
    },
  ];
  let diagnostics: CodeAuthoringDiagnostic[] = [
    { code: 'entry_warning', severity: 'warning', message: 'Visible warning', path: entryPath },
    { code: 'secret_error', severity: 'error', message: `Failure in ${hiddenPath}`, path: hiddenPath },
  ];
  let failNextCommit = false;
  const commitSourceFiles = vi.fn(async (nextFiles: WorkspaceAuthoringFile[]) => {
    if (failNextCommit) {
      failNextCommit = false;
      throw new Error('atomic commit rejected');
    }
    sourceFiles = nextFiles;
  });
  const validateDraft = vi.fn(async () => diagnostics);
  const reveal = vi.fn(async () => undefined);
  const save = vi.fn();
  const preview = vi.fn();

  const surface = createWorkspaceAuthoringSurface({
    id: 'light-extension:entry:current',
    kind: 'light-extension-workspace',
    title: 'Current entry',
    scope: { type: 'light-extension.entry', id: 'current' },
    getSourceFiles: () => sourceFiles,
    getVirtualFiles: () => virtualFiles,
    commitSourceFiles,
    getActivePath: () => entryPath,
    getPathAccess: (path) => {
      const access = getLightExtensionWorkspaceAuthoringPathAccess(scope, path, { workspaceWritable: true });
      return {
        canCreate: access.canCreate,
        canUpdate: access.canUpdate,
        canPatch: access.canPatch,
        canDelete: access.canDelete,
        reason: access.reason,
      };
    },
    canReadForAI: (file) =>
      canReadLightExtensionWorkspacePathForAI(scope, file.path, { virtual: file.persisted === false }),
    getDiagnostics: () => diagnostics,
    sanitizeDiagnostic: (diagnostic) => diagnostic,
    validateDraft,
    reveal,
    supportedLanguages: ['json', 'typescript', 'typescriptreact'],
  });

  return {
    surface,
    commitSourceFiles,
    validateDraft,
    reveal,
    save,
    preview,
    getSourceFiles: () => sourceFiles.map((file) => ({ ...file })),
    setDiagnostics: (nextDiagnostics: CodeAuthoringDiagnostic[]) => {
      diagnostics = nextDiagnostics;
    },
    editSource: (path: string, content: string) => {
      sourceFiles = sourceFiles.map((file) => (file.path === path ? { ...file, content } : file));
    },
    failNextCommit: () => {
      failNextCommit = true;
    },
  };
}

describe('Light Extension AI authoring contract', () => {
  it('projects one entry, keeps prepare side-effect free, and applies only local source files', async () => {
    const contract = createContractSurface();
    const snapshot = await contract.surface.getSnapshot();
    const visiblePaths = snapshot.files.map((file) => file.path);

    expect(visiblePaths).toEqual(
      expect.arrayContaining([
        entryPath,
        'src/client/js-blocks/current/entry.json',
        'src/shared/format.ts',
        'tsconfig.json',
        '.light-extension/types/sdk.d.ts',
      ]),
    );
    expect(visiblePaths).not.toEqual(expect.arrayContaining([hiddenPath, 'README.md']));
    expect(JSON.stringify(snapshot)).not.toContain('secret');
    expect(snapshot.diagnostics).toEqual([expect.objectContaining({ code: 'entry_warning', path: entryPath })]);

    const entry = snapshot.files.find((file) => file.path === entryPath);
    if (!entry) {
      throw new Error('Expected entry metadata');
    }
    const beforePrepare = contract.getSourceFiles();
    const plan = await contract.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: entry.hash,
          content: "import { helper } from './helper';\nexport default helper;\n",
        },
        { type: 'create', path: helperPath, content: 'export const helper = () => null;\n', language: 'typescript' },
      ],
    });

    expect(plan.diffs.map((diff) => diff.path)).toEqual([helperPath, entryPath].sort());
    expect(plan.saved).toBe(false);
    expect(contract.getSourceFiles()).toEqual(beforePrepare);
    expect(contract.commitSourceFiles).not.toHaveBeenCalled();

    const applied = await contract.surface.applyPreparedChanges(plan.planId);
    expect(applied).toMatchObject({ changedPaths: [helperPath, entryPath].sort(), saved: false });
    expect(contract.commitSourceFiles).toHaveBeenCalledTimes(1);
    expect(contract.getSourceFiles().map((file) => file.path)).toEqual(expect.arrayContaining([entryPath, helperPath]));
    expect(contract.getSourceFiles().map((file) => file.path)).not.toContain('.light-extension/types/sdk.d.ts');
    expect(contract.save).not.toHaveBeenCalled();
    expect(contract.preview).not.toHaveBeenCalled();

    const validation = await contract.surface.validateDraft();
    expect(validation).toMatchObject({ saved: false, stale: false });
    expect(contract.validateDraft).toHaveBeenCalledTimes(1);
    expect(contract.save).not.toHaveBeenCalled();
    expect(contract.preview).not.toHaveBeenCalled();
  });

  it('rejects traversal, hidden, generated, descriptor, stale, bad-hash, and duplicate-plan changes', async () => {
    const contract = createContractSurface();
    const snapshot = await contract.surface.getSnapshot();
    const entry = snapshot.files.find((file) => file.path === entryPath);
    if (!entry) {
      throw new Error('Expected entry metadata');
    }

    const rejectedChanges = [
      { type: 'create' as const, path: '../secret.ts', content: 'secret', language: 'typescript' },
      { type: 'create' as const, path: hiddenPath, content: 'secret', language: 'typescript' },
      {
        type: 'update' as const,
        path: '.light-extension/types/sdk.d.ts',
        baseHash: snapshot.files.find((file) => file.path === '.light-extension/types/sdk.d.ts')?.hash || 'missing',
        content: 'tampered',
      },
      {
        type: 'update' as const,
        path: 'src/client/js-blocks/current/entry.json',
        baseHash: snapshot.files.find((file) => file.path.endsWith('/entry.json'))?.hash || 'missing',
        content: '{}',
      },
    ];
    for (const change of rejectedChanges) {
      await expect(
        contract.surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes: [change] }),
      ).rejects.toMatchObject({
        code: expect.stringMatching(/INVALID_PATH|PATH_ACCESS_DENIED|VIRTUAL_FILE|READ_ONLY_FILE/),
      });
    }

    await expect(
      contract.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [{ type: 'update', path: entryPath, baseHash: 'wrong-hash', content: 'export default null;\n' }],
      }),
    ).rejects.toMatchObject({ code: 'BASE_HASH_MISMATCH' });

    const plan = await contract.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: entry.hash,
          content: 'export default function Updated() { return null; }\n',
        },
      ],
    });
    contract.editSource(entryPath, 'manual edit\n');
    await expect(contract.surface.applyPreparedChanges(plan.planId)).rejects.toMatchObject({ code: 'STALE_SNAPSHOT' });

    const current = await contract.surface.getSnapshot();
    const currentEntry = current.files.find((file) => file.path === entryPath);
    if (!currentEntry) {
      throw new Error('Expected current entry metadata');
    }
    const freshPlan = await contract.surface.prepareChanges({
      baseSnapshotId: current.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: currentEntry.hash,
          content: 'export default function Final() { return null; }\n',
        },
      ],
    });
    await contract.surface.applyPreparedChanges(freshPlan.planId);
    await expect(contract.surface.applyPreparedChanges(freshPlan.planId)).rejects.toMatchObject({
      code: 'PLAN_CONSUMED',
    });
  });

  it('keeps failed apply atomic, reports stale validation, and reveals only readable diagnostics', async () => {
    const contract = createContractSurface();
    const snapshot = await contract.surface.getSnapshot();
    const entry = snapshot.files.find((file) => file.path === entryPath);
    if (!entry) {
      throw new Error('Expected entry metadata');
    }
    const plan = await contract.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: entry.hash,
          content: 'export default function Atomic() { return null; }\n',
        },
        { type: 'create', path: helperPath, content: 'export const helper = true;\n', language: 'typescript' },
      ],
    });
    const beforeApply = contract.getSourceFiles();
    contract.failNextCommit();
    await expect(contract.surface.applyPreparedChanges(plan.planId)).rejects.toThrow('atomic commit rejected');
    expect(contract.getSourceFiles()).toEqual(beforeApply);

    await contract.surface.applyPreparedChanges(plan.planId);
    expect(contract.getSourceFiles().map((file) => file.path)).toContain(helperPath);

    let resolveValidation: ((diagnostics: CodeAuthoringDiagnostic[]) => void) | undefined;
    contract.validateDraft.mockImplementationOnce(
      () =>
        new Promise<CodeAuthoringDiagnostic[]>((resolve) => {
          resolveValidation = resolve;
        }),
    );
    const validationPromise = contract.surface.validateDraft();
    contract.editSource(entryPath, 'manual validation edit\n');
    resolveValidation?.([
      { code: 'entry_error', severity: 'error', message: 'Visible error', path: entryPath },
      { code: 'hidden_error', severity: 'error', message: 'Hidden error', path: hiddenPath },
    ]);
    await expect(validationPromise).resolves.toMatchObject({
      stale: true,
      diagnostics: [expect.objectContaining({ code: 'entry_error', path: entryPath })],
      saved: false,
    });

    await contract.surface.reveal(entryPath, { start: { line: 1, column: 1 } });
    expect(contract.reveal).toHaveBeenCalledWith(entryPath, { start: { line: 1, column: 1 } });
    await expect(contract.surface.reveal(hiddenPath)).rejects.toMatchObject({ code: 'FILE_NOT_FOUND' });
  });

  it('keeps repository scope catalog read-only and unavailable for prepare/apply', async () => {
    const repositoryScope: LightExtensionWorkspaceScope = { mode: 'repository' };
    const sourceFiles: WorkspaceAuthoringFile[] = [
      { path: entryPath, content: 'export default null;\n', language: 'typescriptreact' },
    ];
    const surface = createWorkspaceAuthoringSurface({
      id: 'light-extension:repository',
      kind: 'light-extension-workspace',
      title: 'Repository',
      scope: { type: 'light-extension.repository', id: 'repository' },
      getSourceFiles: () => sourceFiles,
      getVirtualFiles: () => [],
      commitSourceFiles: vi.fn(),
      getActivePath: () => entryPath,
      getPathAccess: (path) => getLightExtensionWorkspaceAuthoringPathAccess(repositoryScope, path),
      canReadForAI: (file) => canReadLightExtensionWorkspacePathForAI(repositoryScope, file.path),
      getDiagnostics: () => [],
      sanitizeDiagnostic: (diagnostic) => diagnostic,
      validateDraft: () => [],
      reveal: () => undefined,
      changeCapabilities: { prepareChanges: false, applyPreparedChanges: false },
      unavailableReason: 'Repository authoring is read-only',
    });

    const snapshot = await surface.getSnapshot();
    expect(snapshot.files).toEqual([]);
    expect(snapshot.capabilities).toMatchObject({
      prepareChanges: false,
      applyPreparedChanges: false,
      unavailableReason: 'Repository authoring is read-only',
    });
    await expect(surface.prepareChanges({ baseSnapshotId: snapshot.snapshotId, changes: [] })).rejects.toMatchObject({
      code: 'CAPABILITY_UNAVAILABLE',
    });
    await expect(surface.applyPreparedChanges('plan')).rejects.toMatchObject({ code: 'CAPABILITY_UNAVAILABLE' });
  });
});
