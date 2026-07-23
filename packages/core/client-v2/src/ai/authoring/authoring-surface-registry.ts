/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringSurface, CodeAuthoringSurfaceEvent, CodeAuthoringSurfaceListener } from './types';

export class CodeAuthoringSurfaceRegistry {
  private readonly surfaces = new Map<string, CodeAuthoringSurface>();
  private readonly listeners = new Set<CodeAuthoringSurfaceListener>();
  private activeSurfaceId?: string;

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
    this.emit({ type: 'register', surfaceId, surface });

    let disposed = false;
    return () => {
      if (disposed) {
        return;
      }
      disposed = true;
      if (this.surfaces.get(surfaceId) !== surface) {
        return;
      }
      this.unregister(surfaceId, surface);
    };
  }

  get(surfaceId: string): CodeAuthoringSurface | undefined {
    return this.surfaces.get(surfaceId);
  }

  activate(surfaceId: string): CodeAuthoringSurface {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) {
      throw new Error(`Code authoring surface is unavailable: ${surfaceId}`);
    }
    if (this.activeSurfaceId === surfaceId) {
      return surface;
    }

    const previousSurfaceId = this.activeSurfaceId;
    const previousSurface = previousSurfaceId ? this.surfaces.get(previousSurfaceId) : undefined;
    this.activeSurfaceId = surfaceId;
    if (previousSurfaceId && previousSurface) {
      this.emit({ type: 'deactivate', surfaceId: previousSurfaceId, surface: previousSurface });
    }
    this.emit({ type: 'activate', surfaceId, surface });
    return surface;
  }

  deactivate(surfaceId?: string): void {
    const currentSurfaceId = this.activeSurfaceId;
    if (!currentSurfaceId || (surfaceId && currentSurfaceId !== surfaceId)) {
      return;
    }
    const surface = this.surfaces.get(currentSurfaceId);
    this.activeSurfaceId = undefined;
    if (surface) {
      this.emit({ type: 'deactivate', surfaceId: currentSurfaceId, surface });
    }
  }

  getActive(): CodeAuthoringSurface | undefined {
    return this.activeSurfaceId ? this.surfaces.get(this.activeSurfaceId) : undefined;
  }

  subscribe(listener: CodeAuthoringSurfaceListener): () => void {
    this.listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    for (const [surfaceId, surface] of Array.from(this.surfaces.entries())) {
      this.unregister(surfaceId, surface);
    }
  }

  private unregister(surfaceId: string, surface: CodeAuthoringSurface): void {
    if (this.activeSurfaceId === surfaceId) {
      this.activeSurfaceId = undefined;
    }
    this.surfaces.delete(surfaceId);
    surface.dispose?.();
    this.emit({ type: 'unregister', surfaceId, surface });
  }

  private emit(event: CodeAuthoringSurfaceEvent): void {
    for (const listener of Array.from(this.listeners)) {
      listener(event);
    }
  }
}
