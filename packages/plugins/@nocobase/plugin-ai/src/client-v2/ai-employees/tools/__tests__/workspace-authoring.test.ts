/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringSnapshot, CodeAuthoringSurface } from '@nocobase/client-v2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeWorkspaceContext } from '../../context/code-workspace';
import { executeFrontendTool, loadFrontendTool } from '../../frontend-tools';
import { getWorkspaceAuthoringToolManifests, WORKSPACE_AUTHORING_TOOL_NAMES } from '../workspace-authoring';

function createSnapshot(snapshotId: string): CodeAuthoringSnapshot {
  return {
    surfaceId: 'workspace-1',
    kind: 'runjs-studio',
    title: 'Workspace one',
    snapshotId,
    activePath: 'src/index.ts',
    files: [
      {
        path: 'src/index.ts',
        language: 'typescript',
        hash: `hash-${snapshotId}`,
        kind: 'source',
        writable: true,
      },
    ],
    diagnostics: [],
  };
}

function createSurface(snapshotId: string, content = 'export const value = 1;'): CodeAuthoringSurface {
  const snapshot = createSnapshot(snapshotId);
  return {
    id: 'workspace-1',
    getSnapshot: vi.fn(async () => snapshot),
    read: vi.fn(async () => [{ ...snapshot.files[0], content }]),
    search: vi.fn(async () => [{ path: 'src/index.ts', line: 1, column: 1, preview: content }]),
    prepareChanges: vi.fn(async (input) => ({
      planId: 'plan-1',
      surfaceId: 'workspace-1',
      baseSnapshotId: input.baseSnapshotId,
      changes: input.changes,
      diffs: [{ path: 'src/index.ts', status: 'modified', before: content, after: 'updated' }],
    })),
    applyPreparedChanges: vi.fn(async () => ({
      surfaceId: 'workspace-1',
      snapshotId: 'snapshot-applied',
      changedPaths: ['src/index.ts'],
    })),
    validateDraft: vi.fn(async () => ({
      surfaceId: 'workspace-1',
      snapshotId,
      diagnostics: [],
      stale: false,
      validationPassed: true,
    })),
  };
}

describe('workspace authoring frontend tools', () => {
  let surfaces: Map<string, CodeAuthoringSurface>;
  let app: {
    aiManager: { authoringSurfaces: { get: (surfaceId: string) => CodeAuthoringSurface | undefined } };
    pm: { get: () => undefined };
  };

  beforeEach(() => {
    surfaces = new Map([['workspace-1', createSurface('snapshot-1')]]);
    app = {
      aiManager: { authoringSurfaces: { get: (surfaceId) => surfaces.get(surfaceId) } },
      pm: { get: () => undefined },
    };
  });

  it('publishes six scoped tools and requires approval only for apply', async () => {
    const manifests = getWorkspaceAuthoringToolManifests('workspace-1');

    expect(manifests.map((manifest) => manifest.name)).toEqual(Object.values(WORKSPACE_AUTHORING_TOOL_NAMES));
    expect(Object.fromEntries(manifests.map((manifest) => [manifest.name, manifest.permission]))).toMatchObject({
      workspaceDescribe: 'ALLOW',
      workspaceReadFiles: 'ALLOW',
      workspaceSearch: 'ALLOW',
      workspacePrepareChanges: 'ALLOW',
      workspaceApplyPreparedChanges: 'ASK',
      workspaceValidateDraft: 'ALLOW',
    });
    await expect(
      loadFrontendTool[1].invoke?.(app as never, { toolId: 'workspace-1:workspaceApplyPreparedChanges' }),
    ).resolves.toMatchObject({ permission: 'ASK' });
  });

  it('looks up the current same-id surface for every execution', async () => {
    const oldSurface = surfaces.get('workspace-1');
    const remountedSurface = createSurface('snapshot-2', 'export const value = 2;');
    surfaces.set('workspace-1', remountedSurface);

    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspaceReadFiles',
        args: { paths: ['src/index.ts'] },
      }),
    ).resolves.toMatchObject({
      status: 'success',
      content: { files: [expect.objectContaining({ content: 'export const value = 2;' })] },
    });
    expect(oldSurface?.read).not.toHaveBeenCalled();
    expect(remountedSurface.read).toHaveBeenCalledWith(['src/index.ts']);
  });

  it('keeps workspace descriptions non-authoritative and validation results explicit', async () => {
    const surface = surfaces.get('workspace-1');
    if (!surface) {
      throw new Error('Expected workspace surface');
    }
    vi.mocked(surface.getSnapshot).mockResolvedValue({
      ...(await surface.getSnapshot()),
      diagnostics: [],
    });

    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspaceDescribe',
        args: {},
      }),
    ).resolves.toMatchObject({
      status: 'success',
      content: {
        cachedDiagnostics: [],
        validationPassed: null,
        validationRequired: true,
      },
    });

    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspaceValidateDraft',
        args: {},
      }),
    ).resolves.toMatchObject({
      status: 'success',
      content: { diagnostics: [], stale: false, validationPassed: true },
    });

    vi.mocked(surface.validateDraft).mockResolvedValue({
      surfaceId: 'workspace-1',
      snapshotId: 'snapshot-1',
      diagnostics: [{ message: 'TypeScript error', severity: 'error' }],
      stale: false,
      validationPassed: false,
    });
    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspaceValidateDraft',
        args: {},
      }),
    ).resolves.toMatchObject({
      status: 'success',
      content: { validationPassed: false },
    });
  });

  it('returns a structured error when the surface is unavailable', async () => {
    surfaces.clear();

    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspaceValidateDraft',
        args: {},
      }),
    ).resolves.toMatchObject({
      status: 'error',
      content: { code: 'WORKSPACE_SURFACE_UNAVAILABLE', surfaceId: 'workspace-1' },
    });
  });

  it('validates change arguments before invoking the surface', async () => {
    const surface = surfaces.get('workspace-1');

    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspacePrepareChanges',
        args: {
          baseSnapshotId: 'snapshot-1',
          changes: [{ type: 'patch', path: 'src/index.ts', patch: 'unsupported' }],
        },
      }),
    ).resolves.toMatchObject({ status: 'error', content: { code: 'WORKSPACE_TOOL_ERROR' } });
    expect(surface?.prepareChanges).not.toHaveBeenCalled();
  });

  it('reports truncated search previews', async () => {
    const surface = surfaces.get('workspace-1');
    if (!surface) {
      throw new Error('Expected workspace surface');
    }
    vi.mocked(surface.search).mockResolvedValue([
      { path: 'src/index.ts', line: 1, column: 1, preview: 'x'.repeat(1_001) },
    ]);

    await expect(
      executeFrontendTool[1].invoke?.(app as never, {
        toolId: 'workspace-1:workspaceSearch',
        args: { query: 'x' },
      }),
    ).resolves.toMatchObject({ status: 'success', content: { truncated: true } });
  });

  it('resolves fresh snapshots and scoped manifests from workspace context', async () => {
    const item = {
      type: 'code-workspace',
      uid: 'workspace-1',
      content: { surfaceId: 'workspace-1', title: 'stale content' },
    };

    await expect(CodeWorkspaceContext.getContent?.(app as never, item)).resolves.toMatchObject({
      surfaceId: 'workspace-1',
      snapshotId: 'snapshot-1',
    });
    surfaces.set('workspace-1', createSurface('snapshot-2'));
    await expect(CodeWorkspaceContext.getContent?.(app as never, item)).resolves.toMatchObject({
      snapshotId: 'snapshot-2',
    });
    await expect(CodeWorkspaceContext.getFrontendTools?.(app as never, item)).resolves.toHaveLength(6);
  });
});
