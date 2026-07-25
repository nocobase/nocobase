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
import type { CodeAuthoringSurface } from '../types';
import { describe, expect, it, vi } from 'vitest';

const createSurface = (id: string): CodeAuthoringSurface => ({
  id,
  getSnapshot: vi.fn(),
  read: vi.fn(),
  search: vi.fn(),
  prepareChanges: vi.fn(),
  applyPreparedChanges: vi.fn(),
  validateDraft: vi.fn(),
  dispose: vi.fn(),
});

const createManager = () => new AIManager({} as BaseApplication);

describe('CodeAuthoringSurfaceRegistry', () => {
  it('keeps registrations isolated by application', () => {
    const firstManager = createManager();
    const secondManager = createManager();
    const firstSurface = createSurface('shared-id');
    const secondSurface = createSurface('shared-id');

    firstManager.authoringSurfaces.register(firstSurface);
    secondManager.authoringSurfaces.register(secondSurface);

    expect(firstManager.authoringSurfaces.get('shared-id')).toBe(firstSurface);
    expect(secondManager.authoringSurfaces.get('shared-id')).toBe(secondSurface);
  });

  it('returns an idempotent disposer for the registered surface', () => {
    const registry = createManager().authoringSurfaces;
    const surface = createSurface('workspace');
    const dispose = registry.register(surface);

    dispose();
    dispose();

    expect(registry.get(surface.id)).toBeUndefined();
    expect(surface.dispose).toHaveBeenCalledOnce();
  });

  it('rejects duplicate ids without replacing the registered surface', () => {
    const registry = createManager().authoringSurfaces;
    const surface = createSurface('workspace');
    registry.register(surface);

    expect(() => registry.register(createSurface('workspace'))).toThrow('already registered');
    expect(registry.get('workspace')).toBe(surface);
  });

  it('clears and disposes every registered surface', () => {
    const registry = createManager().authoringSurfaces;
    const first = createSurface('first');
    const second = createSurface('second');
    registry.register(first);
    registry.register(second);

    registry.clear();

    expect(registry.get('first')).toBeUndefined();
    expect(registry.get('second')).toBeUndefined();
    expect(first.dispose).toHaveBeenCalledOnce();
    expect(second.dispose).toHaveBeenCalledOnce();
  });
});
