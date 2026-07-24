/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringCapabilities, CodeAuthoringSnapshot, CodeAuthoringSurface } from '@nocobase/client-v2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeWorkspaceContext } from '../../context/code-workspace';
import { FrontendToolRegistry } from '../../../manager/frontend-tool-registry';
import { registerWorkspaceAuthoringTools, WORKSPACE_AUTHORING_TOOL_NAMES } from '../workspace-authoring';

const fullCapabilities: CodeAuthoringCapabilities = {
  describe: true,
  listFiles: true,
  readFiles: true,
  search: true,
  prepareChanges: true,
  applyPreparedChanges: true,
  validateDraft: true,
  reveal: true,
  supportedChanges: ['create', 'update', 'patch', 'delete'],
};

function createSnapshot(capabilities: CodeAuthoringCapabilities = fullCapabilities): CodeAuthoringSnapshot {
  return {
    surfaceId: 'workspace-1',
    kind: 'runjs-studio',
    title: 'Workspace one',
    scope: { type: 'flowModel.step', id: 'repo-1' },
    snapshotId: 'snapshot-1',
    activePath: 'src/index.ts',
    files: [
      {
        path: 'src/index.ts',
        language: 'typescript',
        hash: 'hash-1',
        kind: 'source',
        writable: true,
        persisted: true,
        size: 9,
      },
    ],
    diagnostics: [],
    capabilities,
  };
}

function createSurface(snapshotRef: { current: CodeAuthoringSnapshot }): CodeAuthoringSurface {
  return {
    id: 'workspace-1',
    describe: vi.fn(async () => snapshotRef.current),
    getSnapshot: vi.fn(async () => snapshotRef.current),
    list: vi.fn(async () => snapshotRef.current.files),
    read: vi.fn(async (paths) =>
      paths.map((path) => ({
        ...snapshotRef.current.files[0],
        path,
        content: `content:${path}`,
      })),
    ),
    search: vi.fn(async () => [{ path: 'src/index.ts', line: 1, column: 1, preview: 'return 1' }]),
    prepareChanges: vi.fn(async (input) => ({
      planId: 'plan-1',
      surfaceId: 'workspace-1',
      baseSnapshotId: input.baseSnapshotId,
      changes: input.changes,
      diffs: [{ path: 'src/helper.ts', status: 'created', after: 'export const helper = 1;' }],
      warnings: [],
      createdAt: 1,
      expiresAt: 2,
      saved: false,
    })),
    applyPreparedChanges: vi.fn(async (planId) => ({
      surfaceId: 'workspace-1',
      snapshot: snapshotRef.current,
      changedPaths: planId === 'plan-1' ? ['src/helper.ts'] : [],
      saved: false,
    })),
    validateDraft: vi.fn(async () => ({
      surfaceId: 'workspace-1',
      snapshotId: snapshotRef.current.snapshotId,
      diagnostics: [],
      stale: false,
      saved: false,
    })),
    reveal: vi.fn(async () => undefined),
  };
}

describe('workspace authoring frontend tools', () => {
  let snapshotRef: { current: CodeAuthoringSnapshot };
  let surface: CodeAuthoringSurface;
  let surfaces: Map<string, CodeAuthoringSurface>;
  let registry: FrontendToolRegistry;
  let app: {
    aiManager: { authoringSurfaces: { get: (surfaceId: string) => CodeAuthoringSurface | undefined } };
    pm: { get: () => { aiManager: { frontendTools: FrontendToolRegistry } } };
  };

  beforeEach(() => {
    snapshotRef = { current: createSnapshot() };
    surface = createSurface(snapshotRef);
    surfaces = new Map([['workspace-1', surface]]);
    registry = new FrontendToolRegistry();
    app = {
      aiManager: { authoringSurfaces: { get: (surfaceId) => surfaces.get(surfaceId) } },
      pm: { get: () => ({ aiManager: { frontendTools: registry } }) },
    };
  });

  it('registers the scoped catalog with ALLOW reads and ASK apply, without preview or save tools', async () => {
    const manifests = await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    const permissions = Object.fromEntries(manifests.map((manifest) => [manifest.name, manifest.permission]));

    expect(manifests.map((manifest) => manifest.name)).toEqual(Object.values(WORKSPACE_AUTHORING_TOOL_NAMES));
    expect(permissions).toMatchObject({
      workspaceDescribe: 'ALLOW',
      workspaceListFiles: 'ALLOW',
      workspaceReadFiles: 'ALLOW',
      workspaceSearch: 'ALLOW',
      workspacePrepareChanges: 'ALLOW',
      workspaceApplyPreparedChanges: 'ASK',
      workspaceValidateDraft: 'ALLOW',
    });
    expect(manifests.map((manifest) => manifest.name)).not.toEqual(
      expect.arrayContaining(['workspaceRunPreview', 'workspaceSave']),
    );
    expect(manifests.every((manifest) => manifest.id === `workspace-1:${manifest.name}`)).toBe(true);
  });

  it('keeps prepare side-effect free and applies only the opaque plan id', async () => {
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    const changes = [{ type: 'create' as const, path: 'src/helper.ts', content: 'export const helper = 1;' }];

    await expect(
      registry.execute('workspace-1:workspacePrepareChanges', {
        baseSnapshotId: 'snapshot-1',
        changes,
      }),
    ).resolves.toMatchObject({
      status: 'success',
      content: { planId: 'plan-1', diffs: [{ path: 'src/helper.ts' }], saved: false },
    });
    expect(surface.applyPreparedChanges).not.toHaveBeenCalled();

    await expect(
      registry.execute('workspace-1:workspaceApplyPreparedChanges', { planId: 'plan-1' }),
    ).resolves.toMatchObject({
      status: 'success',
      content: { changedPaths: ['src/helper.ts'], saved: false },
    });
    expect(surface.applyPreparedChanges).toHaveBeenCalledWith('plan-1');
  });

  it('omits disabled capabilities and rechecks the bound surface instance at execution time', async () => {
    snapshotRef.current = createSnapshot({
      ...fullCapabilities,
      prepareChanges: false,
      applyPreparedChanges: false,
      unavailableReason: 'Read-only repository',
    });
    const manifests = await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    expect(manifests.map((manifest) => manifest.name)).not.toEqual(
      expect.arrayContaining(['workspacePrepareChanges', 'workspaceApplyPreparedChanges']),
    );

    snapshotRef.current = createSnapshot();
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    surfaces.set('workspace-1', createSurface(snapshotRef));
    await expect(registry.execute('workspace-1:workspaceDescribe', {})).resolves.toMatchObject({
      status: 'error',
      content: { code: 'WORKSPACE_SURFACE_UNAVAILABLE', surfaceId: 'workspace-1' },
    });
  });

  it('resolves fresh safe snapshot metadata and scoped tools from code-workspace context', async () => {
    const item = {
      type: 'code-workspace',
      uid: 'workspace-1',
      title: 'Workspace one',
      content: { surfaceId: 'workspace-1', title: 'stale lightweight content' },
    };
    snapshotRef.current = { ...createSnapshot(), snapshotId: 'snapshot-latest' };

    await expect(CodeWorkspaceContext.getContent?.(app as never, item)).resolves.toMatchObject({
      surfaceId: 'workspace-1',
      snapshotId: 'snapshot-latest',
      files: [expect.objectContaining({ path: 'src/index.ts' })],
    });
    const manifests = await CodeWorkspaceContext.getFrontendTools?.(app as never, item);
    expect(manifests?.every((manifest) => manifest.blockUid === 'workspace-1')).toBe(true);
    expect(manifests).toHaveLength(7);

    surfaces.delete('workspace-1');
    await expect(CodeWorkspaceContext.getContent?.(app as never, item)).resolves.toMatchObject({
      status: 'error',
      error: { code: 'WORKSPACE_SURFACE_UNAVAILABLE' },
    });
    await expect(registry.execute('workspace-1:workspaceDescribe', {})).resolves.toMatchObject({
      status: 'error',
      content: { code: 'WORKSPACE_SURFACE_UNAVAILABLE' },
    });
  });

  it('rejects mismatched snapshots and clears stale closures when registration can no longer snapshot', async () => {
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    expect(registry.list('workspace-1')).toHaveLength(7);

    snapshotRef.current = { ...createSnapshot(), surfaceId: 'workspace-other' };
    await expect(
      CodeWorkspaceContext.getContent?.(app as never, {
        type: 'code-workspace',
        uid: 'workspace-1',
        content: { surfaceId: 'workspace-1' },
      }),
    ).resolves.toMatchObject({
      status: 'error',
      error: { code: 'WORKSPACE_SURFACE_MISMATCH' },
    });
    await expect(registerWorkspaceAuthoringTools(app, registry, 'workspace-1')).resolves.toEqual([]);
    expect(registry.list('workspace-1')).toEqual([]);

    snapshotRef.current = createSnapshot();
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    vi.mocked(surface.getSnapshot).mockRejectedValueOnce(new Error('disposed'));
    await expect(registerWorkspaceAuthoringTools(app, registry, 'workspace-1')).resolves.toEqual([]);
    expect(registry.list('workspace-1')).toEqual([]);
  });

  it('rejects results from a surface that is replaced while an async tool or context call is pending', async () => {
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    let resolveList: ((files: CodeAuthoringSnapshot['files']) => void) | undefined;
    vi.mocked(surface.list).mockImplementationOnce(
      () =>
        new Promise<CodeAuthoringSnapshot['files']>((resolve) => {
          resolveList = resolve;
        }),
    );
    const listPromise = registry.execute('workspace-1:workspaceListFiles', {});
    await vi.waitFor(() => expect(surface.list).toHaveBeenCalled());
    surfaces.set('workspace-1', createSurface(snapshotRef));
    resolveList?.(snapshotRef.current.files);
    await expect(listPromise).resolves.toMatchObject({
      status: 'error',
      content: { code: 'WORKSPACE_SURFACE_UNAVAILABLE', surfaceId: 'workspace-1' },
    });

    surfaces.set('workspace-1', surface);
    let resolveDescription: ((snapshot: CodeAuthoringSnapshot) => void) | undefined;
    vi.mocked(surface.describe).mockImplementationOnce(
      () =>
        new Promise<CodeAuthoringSnapshot>((resolve) => {
          resolveDescription = resolve;
        }),
    );
    const contextPromise = CodeWorkspaceContext.getContent?.(app as never, {
      type: 'code-workspace',
      uid: 'workspace-1',
      content: { surfaceId: 'workspace-1' },
    });
    await vi.waitFor(() => expect(surface.describe).toHaveBeenCalled());
    surfaces.set('workspace-1', createSurface(snapshotRef));
    resolveDescription?.(snapshotRef.current);
    await expect(contextPromise).resolves.toMatchObject({
      status: 'error',
      error: { code: 'WORKSPACE_SURFACE_UNAVAILABLE' },
    });
  });

  it('reports a completed apply as successful when the surface is replaced after commit', async () => {
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    let resolveApply: ((result: Awaited<ReturnType<CodeAuthoringSurface['applyPreparedChanges']>>) => void) | undefined;
    vi.mocked(surface.applyPreparedChanges).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveApply = resolve;
        }),
    );

    const applyPromise = registry.execute('workspace-1:workspaceApplyPreparedChanges', { planId: 'plan-1' });
    await vi.waitFor(() => expect(surface.applyPreparedChanges).toHaveBeenCalledWith('plan-1'));
    surfaces.set('workspace-1', createSurface(snapshotRef));
    resolveApply?.({
      surfaceId: 'workspace-1',
      snapshot: snapshotRef.current,
      changedPaths: ['src/helper.ts'],
      saved: false,
    });

    await expect(applyPromise).resolves.toMatchObject({
      status: 'success',
      content: { changedPaths: ['src/helper.ts'], saved: false },
    });
  });

  it('does not let an old async registration clear tools registered by a same-id remount', async () => {
    let resolveOldSnapshot: ((snapshot: CodeAuthoringSnapshot) => void) | undefined;
    vi.mocked(surface.getSnapshot).mockImplementationOnce(
      () =>
        new Promise<CodeAuthoringSnapshot>((resolve) => {
          resolveOldSnapshot = resolve;
        }),
    );
    const oldRegistration = registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    await vi.waitFor(() => expect(surface.getSnapshot).toHaveBeenCalledTimes(1));

    const remountedSurface = createSurface(snapshotRef);
    surfaces.set('workspace-1', remountedSurface);
    await expect(registerWorkspaceAuthoringTools(app, registry, 'workspace-1')).resolves.toHaveLength(7);
    resolveOldSnapshot?.(snapshotRef.current);
    await expect(oldRegistration).resolves.toEqual([]);

    expect(registry.list('workspace-1')).toHaveLength(7);
    await expect(registry.execute('workspace-1:workspaceDescribe', {})).resolves.toMatchObject({
      status: 'success',
      content: { surfaceId: 'workspace-1' },
    });
  });

  it('rejects malformed runtime changes before calling the authoring surface', async () => {
    await registerWorkspaceAuthoringTools(app, registry, 'workspace-1');
    const malformedChanges = [
      { type: 'rename', path: 'src/index.ts', baseHash: 'hash-1', content: 'broken' },
      { type: 'update', path: 'src/index.ts', baseHash: 'hash-1', content: { invalid: true } },
      { type: 'delete', path: 'src/index.ts', baseHash: 'hash-1', changes: [] },
    ];

    for (const change of malformedChanges) {
      await expect(
        registry.execute('workspace-1:workspacePrepareChanges', {
          baseSnapshotId: 'snapshot-1',
          changes: [change],
        }),
      ).resolves.toMatchObject({ status: 'error', content: { code: 'WORKSPACE_TOOL_ERROR' } });
    }
    expect(surface.prepareChanges).not.toHaveBeenCalled();
  });
});
