/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringSurface } from './types';

export class CodeAuthoringSurfaceRegistry {
  private readonly surfaces = new Map<string, CodeAuthoringSurface>();

  register(surface: CodeAuthoringSurface): () => void {
    const surfaceId = surface.id.trim();
    if (!surfaceId) {
      throw new Error('Code authoring surface id cannot be empty');
    }
    if (surfaceId !== surface.id) {
      throw new Error(`Code authoring surface id must be normalized: ${surface.id}`);
    }
    if (this.surfaces.has(surfaceId)) {
      throw new Error(`Code authoring surface is already registered: ${surfaceId}`);
    }

    this.surfaces.set(surfaceId, surface);

    let disposed = false;
    return () => {
      if (disposed) {
        return;
      }
      disposed = true;
      if (this.surfaces.get(surfaceId) !== surface) {
        return;
      }
      this.surfaces.delete(surfaceId);
      surface.dispose?.();
    };
  }

  get(surfaceId: string): CodeAuthoringSurface | undefined {
    return this.surfaces.get(surfaceId);
  }

  clear(): void {
    for (const surface of this.surfaces.values()) {
      surface.dispose?.();
    }
    this.surfaces.clear();
  }
}
