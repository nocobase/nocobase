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

import { createWorkspaceAuthoringSurface } from '../workspace/authoring';
import type { WorkspaceAuthoringFile } from '../workspace/authoring/workspaceSnapshot';
import {
  canReadLightExtensionWorkspacePathForAI,
  getLightExtensionWorkspaceAuthoringPathAccess,
  type LightExtensionWorkspaceScope,
} from '../workspace/lightExtensionWorkspaceAccess';

const entryPath = 'src/client/js-blocks/sales-kpi/index.tsx';
const helperPath = 'src/client/js-blocks/sales-kpi/helper.ts';
const hiddenEntryPath = 'src/client/js-actions/private-action/index.ts';
const scope: LightExtensionWorkspaceScope = { mode: 'entry', entryPath, kind: 'js-block' };

function createHarness(options: { now?: () => number } = {}) {
  let sourceFiles: WorkspaceAuthoringFile[] = [
    { path: entryPath, content: 'ctx.render(<div>Baseline</div>);\n', language: 'typescriptreact' },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: '{"schemaVersion":1,"key":"sales-kpi"}\n',
      language: 'json',
    },
    { path: hiddenEntryPath, content: 'export const privateAction = true;\n', language: 'typescript' },
    { path: 'src/shared/currency.ts', content: 'export const currency = "USD";\n', language: 'typescript' },
    { path: 'README.md', content: 'private repository notes\n', language: 'markdown' },
  ];
  const virtualFiles: WorkspaceAuthoringFile[] = [
    {
      path: '.light-extension/types/sdk.d.ts',
      content: 'declare const ctx: unknown;\n',
      language: 'typescript',
      readOnly: true,
      persisted: false,
    },
  ];
  const commitSourceFiles = vi.fn(async (nextFiles: WorkspaceAuthoringFile[]) => {
    sourceFiles = nextFiles;
  });
  const reveal = vi.fn();
  let validationDiagnostics: CodeAuthoringDiagnostic[] = [];
  let resolveValidation: ((diagnostics: CodeAuthoringDiagnostic[]) => void) | undefined;
  const validateDraft = vi.fn(
    () =>
      new Promise<CodeAuthoringDiagnostic[]>((resolve) => {
        resolveValidation = resolve;
      }),
  );
  const getPathOptions = (path: string) => ({
    virtual: virtualFiles.some((file) => file.path === path),
    workspaceWritable: sourceFiles.find((file) => file.path === path)?.readOnly !== true,
  });
  const surface = createWorkspaceAuthoringSurface({
    id: 'light-extension:ler_sales:entry:entry-sales-kpi',
    kind: 'light-extension-workspace',
    title: 'Sales KPI',
    scope: { type: 'entry', id: 'entry-sales-kpi', label: entryPath },
    getSourceFiles: () => sourceFiles,
    getVirtualFiles: () => virtualFiles,
    commitSourceFiles,
    getActivePath: () => entryPath,
    getPathAccess: (path) => {
      const access = getLightExtensionWorkspaceAuthoringPathAccess(scope, path, getPathOptions(path));
      return {
        canCreate: access.canCreate,
        canUpdate: access.canUpdate,
        canPatch: access.canPatch,
        canDelete: access.canDelete,
        reason: access.reason,
      };
    },
    canReadForAI: (file) => canReadLightExtensionWorkspacePathForAI(scope, file.path, getPathOptions(file.path)),
    getDiagnostics: () => validationDiagnostics,
    sanitizeDiagnostic: (diagnostic, readablePaths) =>
      diagnostic.path && !readablePaths.has(diagnostic.path) ? null : diagnostic,
    validateDraft,
    reveal,
    planTtlMs: 100,
    now: options.now,
  });

  return {
    surface,
    commitSourceFiles,
    reveal,
    getSourceFiles: () => sourceFiles,
    setSourceContent(path: string, content: string) {
      sourceFiles = sourceFiles.map((file) => (file.path === path ? { ...file, content } : file));
    },
    resolveValidation(diagnostics = validationDiagnostics) {
      resolveValidation?.(diagnostics);
    },
    setValidationDiagnostics(diagnostics: CodeAuthoringDiagnostic[]) {
      validationDiagnostics = diagnostics;
    },
  };
}

function getSnapshotFile(snapshot: CodeAuthoringSnapshot, path: string) {
  const file = snapshot.files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`Expected snapshot file: ${path}`);
  }
  return file;
}

describe('Light Extension AI authoring contract', () => {
  it('changes the private CAS revision without exposing another entry', async () => {
    const harness = createHarness();
    const before = await harness.surface.getSnapshot();

    expect(before.files.map((file) => file.path)).not.toContain(hiddenEntryPath);
    harness.setSourceContent(hiddenEntryPath, 'export const privateAction = false;\n');
    const after = await harness.surface.getSnapshot();

    expect(after.snapshotId).not.toBe(before.snapshotId);
    expect(after.files.map((file) => file.path)).not.toContain(hiddenEntryPath);
  });

  it('keeps entry-scoped prepare side-effect free and applies one source-only multi-file commit', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const sourceBeforePrepare = structuredClone(harness.getSourceFiles());
    const entry = getSnapshotFile(snapshot, entryPath);

    expect(snapshot.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([entryPath, 'src/shared/currency.ts', '.light-extension/types/sdk.d.ts']),
    );
    expect(snapshot.files.map((file) => file.path)).not.toEqual(expect.arrayContaining([hiddenEntryPath, 'README.md']));

    const plan = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: entry.hash,
          content: "import { message } from './helper';\nctx.render(<div>{message}</div>);\n",
        },
        { type: 'create', path: helperPath, content: "export const message = 'Ready';\n", language: 'typescript' },
      ],
    });

    expect(harness.getSourceFiles()).toEqual(sourceBeforePrepare);
    expect(plan.diffs.map((diff) => diff.path)).toEqual([helperPath, entryPath]);

    const result = await harness.surface.applyPreparedChanges(plan.planId);

    expect(result).toMatchObject({ changedPaths: [helperPath, entryPath], saved: false });
    expect(harness.commitSourceFiles).toHaveBeenCalledTimes(1);
    expect(harness.getSourceFiles().map((file) => file.path)).toContain(helperPath);
    expect(harness.getSourceFiles().map((file) => file.path)).toContain(hiddenEntryPath);
    expect(harness.getSourceFiles().map((file) => file.path)).not.toContain('.light-extension/types/sdk.d.ts');
  });

  it('keeps earlier changes out of the draft when a later scoped change is rejected', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const sourceBeforePrepare = structuredClone(harness.getSourceFiles());
    const entry = getSnapshotFile(snapshot, entryPath);

    await expect(
      harness.surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [
          { type: 'update', path: entryPath, baseHash: entry.hash, content: 'ctx.render(<div>First</div>);\n' },
          { type: 'create', path: helperPath, content: 'export const helper = true;\n', language: 'typescript' },
          {
            type: 'update',
            path: hiddenEntryPath,
            baseHash: 'hidden',
            content: 'export const privateAction = false;\n',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'PATH_ACCESS_DENIED' });

    expect(harness.getSourceFiles()).toEqual(sourceBeforePrepare);
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
  });

  it('rejects stale plans without partial writes and preserves diagnostic reveal coordinates', async () => {
    const harness = createHarness();
    const snapshot = await harness.surface.getSnapshot();
    const entry = getSnapshotFile(snapshot, entryPath);
    const plan = await harness.surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        { type: 'update', path: entryPath, baseHash: entry.hash, content: 'ctx.render(<div>AI</div>);\n' },
        { type: 'create', path: helperPath, content: 'export const helper = true;\n', language: 'typescript' },
      ],
    });

    harness.setSourceContent(entryPath, 'ctx.render(<div>Manual edit</div>);\n');

    await expect(harness.surface.applyPreparedChanges(plan.planId)).rejects.toMatchObject({ code: 'STALE_SNAPSHOT' });
    expect(harness.commitSourceFiles).not.toHaveBeenCalled();
    expect(harness.getSourceFiles().map((file) => file.path)).not.toContain(helperPath);

    await harness.surface.reveal(entryPath, { start: { line: 3, column: 7 } });
    expect(harness.reveal).toHaveBeenCalledWith(entryPath, { start: { line: 3, column: 7 } });
  });

  it('marks validation stale and filters diagnostics through the entry read projection', async () => {
    const harness = createHarness();
    harness.setValidationDiagnostics([
      { path: entryPath, range: { start: { line: 1, column: 1 } }, severity: 'warning', message: 'Visible warning' },
      {
        path: hiddenEntryPath,
        range: { start: { line: 1, column: 1 } },
        severity: 'error',
        message: 'Hidden error',
      },
    ]);
    const validationPromise = harness.surface.validateDraft();

    harness.setSourceContent(entryPath, 'ctx.render(<div>Changed during validation</div>);\n');
    harness.resolveValidation([
      { path: entryPath, range: { start: { line: 1, column: 1 } }, severity: 'warning', message: 'Visible warning' },
      {
        path: hiddenEntryPath,
        range: { start: { line: 1, column: 1 } },
        severity: 'error',
        message: 'Hidden error',
      },
    ]);

    await expect(validationPromise).resolves.toMatchObject({
      stale: true,
      saved: false,
      diagnostics: [{ path: entryPath, message: 'Visible warning' }],
    });
  });

  it('expires old plans and consumes successfully applied plans exactly once', async () => {
    let currentTime = 1_000;
    const expiredHarness = createHarness({ now: () => currentTime });
    const expiredSnapshot = await expiredHarness.surface.getSnapshot();
    const expiredEntry = getSnapshotFile(expiredSnapshot, entryPath);
    const expiredPlan = await expiredHarness.surface.prepareChanges({
      baseSnapshotId: expiredSnapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: expiredEntry.hash,
          content: 'ctx.render(<div>Expired</div>);\n',
        },
      ],
    });

    currentTime = expiredPlan.expiresAt;
    await expect(expiredHarness.surface.applyPreparedChanges(expiredPlan.planId)).rejects.toMatchObject({
      code: 'PLAN_EXPIRED',
    });
    expect(expiredHarness.commitSourceFiles).not.toHaveBeenCalled();

    const consumedHarness = createHarness();
    const consumedSnapshot = await consumedHarness.surface.getSnapshot();
    const consumedEntry = getSnapshotFile(consumedSnapshot, entryPath);
    const consumedPlan = await consumedHarness.surface.prepareChanges({
      baseSnapshotId: consumedSnapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: consumedEntry.hash,
          content: 'ctx.render(<div>Applied</div>);\n',
        },
      ],
    });

    await expect(consumedHarness.surface.applyPreparedChanges(consumedPlan.planId)).resolves.toMatchObject({
      saved: false,
    });
    await expect(consumedHarness.surface.applyPreparedChanges(consumedPlan.planId)).rejects.toMatchObject({
      code: 'PLAN_CONSUMED',
    });
    expect(consumedHarness.commitSourceFiles).toHaveBeenCalledTimes(1);
  });
});
