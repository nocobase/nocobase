/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from '../../../BaseApplication';
import { AIManager } from '../../ai-manager';
import type {
  CodeAuthoringCapabilities,
  CodeAuthoringSnapshot,
  CodeAuthoringSurface,
  CodeAuthoringSurfaceEvent,
} from '../types';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

const capabilities: CodeAuthoringCapabilities = {
  applyPreparedChanges: true,
  describe: true,
  listFiles: true,
  prepareChanges: true,
  readFiles: true,
  reveal: true,
  search: true,
  supportedChanges: ['create', 'update', 'patch', 'delete'],
  validateDraft: true,
};

const createSnapshot = (surfaceId: string): CodeAuthoringSnapshot => ({
  activePath: 'src/index.ts',
  capabilities,
  diagnostics: [],
  files: [
    {
      hash: 'visible-hash',
      kind: 'source',
      language: 'typescript',
      path: 'src/index.ts',
      persisted: true,
      size: 24,
      writable: true,
    },
  ],
  kind: 'test-workspace',
  scope: { id: 'entry-1', type: 'entry' },
  snapshotId: 'full-tree-revision-including-hidden-files',
  surfaceId,
  title: 'Test workspace',
});

const createSurface = (id: string): CodeAuthoringSurface => {
  const snapshot = createSnapshot(id);
  return {
    id,
    applyPreparedChanges: vi.fn(),
    describe: vi.fn(async () => snapshot),
    getSnapshot: vi.fn(async () => snapshot),
    list: vi.fn(async () => snapshot.files),
    prepareChanges: vi.fn(),
    read: vi.fn(async () => []),
    reveal: vi.fn(async () => undefined),
    search: vi.fn(async () => []),
    validateDraft: vi.fn(async () => ({
      diagnostics: [],
      saved: false,
      snapshotId: snapshot.snapshotId,
      stale: false,
      surfaceId: id,
    })),
  };
};

const createManager = () => new AIManager({} as BaseApplication);

describe('CodeAuthoringSurfaceRegistry', () => {
  it('keeps registrations and active surfaces isolated by application', () => {
    const firstManager = createManager();
    const secondManager = createManager();
    const firstSurface = createSurface('shared-id');
    const secondSurface = createSurface('shared-id');

    firstManager.authoringSurfaces.register(firstSurface);
    secondManager.authoringSurfaces.register(secondSurface);
    firstManager.authoringSurfaces.activate('shared-id');

    expect(firstManager.authoringSurfaces.get('shared-id')).toBe(firstSurface);
    expect(secondManager.authoringSurfaces.get('shared-id')).toBe(secondSurface);
    expect(firstManager.authoringSurfaces.getActive()).toBe(firstSurface);
    expect(secondManager.authoringSurfaces.getActive()).toBeUndefined();
  });

  it('requires explicit activation and never falls back to the latest registration', () => {
    const registry = createManager().authoringSurfaces;
    const firstSurface = createSurface('first');
    const secondSurface = createSurface('second');

    registry.register(firstSurface);
    registry.register(secondSurface);
    expect(registry.getActive()).toBeUndefined();

    registry.activate('first');
    expect(registry.getActive()).toBe(firstSurface);

    const disposeFirst = registry.register(createSurface('third'));
    disposeFirst();
    expect(registry.getActive()).toBe(firstSurface);
  });

  it('returns an idempotent disposer and emits one deterministic unregister event', () => {
    const registry = createManager().authoringSurfaces;
    const surface = createSurface('workspace');
    const events: CodeAuthoringSurfaceEvent[] = [];
    const unsubscribe = registry.subscribe((event) => events.push(event));
    const dispose = registry.register(surface);
    registry.activate(surface.id);

    dispose();
    dispose();
    unsubscribe();
    unsubscribe();

    expect(registry.get(surface.id)).toBeUndefined();
    expect(registry.getActive()).toBeUndefined();
    expect(events.map((event) => event.type)).toEqual(['register', 'activate', 'unregister']);
  });

  it('rejects duplicate ids without replacing the registered instance', () => {
    const registry = createManager().authoringSurfaces;
    const surface = createSurface('workspace');
    registry.register(surface);

    expect(() => registry.register(surface)).toThrow('already registered');
    expect(() => registry.register(createSurface('workspace'))).toThrow('already registered');
    expect(registry.get('workspace')).toBe(surface);
  });

  it('exposes only the surface public projection while retaining an opaque full-tree revision', async () => {
    const surface = createSurface('workspace');
    const snapshot = await surface.getSnapshot();

    expect(snapshot.snapshotId).toBe('full-tree-revision-including-hidden-files');
    expect(snapshot.files.map((file) => file.path)).toEqual(['src/index.ts']);
    expect(JSON.stringify(snapshot)).not.toContain('hidden-entry');
    expectTypeOf(surface.applyPreparedChanges).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(surface).not.toHaveProperty('save');
    expectTypeOf(surface).not.toHaveProperty('run');
  });
});
