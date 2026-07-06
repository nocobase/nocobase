/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceResolver } from './types';
import { INLINE_RUNJS_SOURCE_MODE, RunJSSourceResolverError } from './types';

function normalizeSourceMode(sourceMode: unknown): string {
  return typeof sourceMode === 'string' ? sourceMode.trim() : '';
}

export class RunJSSourceResolverRegistryManager {
  private readonly resolvers = new Map<string, RunJSSourceResolver>();

  registerResolver(resolver: RunJSSourceResolver): () => void {
    const sourceMode = normalizeSourceMode(resolver?.sourceMode);
    if (!sourceMode || sourceMode === INLINE_RUNJS_SOURCE_MODE || typeof resolver?.resolve !== 'function') {
      throw new RunJSSourceResolverError('RunJS source resolver requires a non-inline sourceMode and resolve()', {
        code: 'RUNJS_SOURCE_RESOLVER_REQUIRED',
        sourceMode,
      });
    }

    const normalizedResolver = {
      ...resolver,
      sourceMode,
    };
    this.resolvers.set(sourceMode, normalizedResolver);

    return () => {
      if (this.resolvers.get(sourceMode) === normalizedResolver) {
        this.resolvers.delete(sourceMode);
      }
    };
  }

  getResolver(sourceMode: unknown): RunJSSourceResolver | null {
    const normalizedSourceMode = normalizeSourceMode(sourceMode);
    return normalizedSourceMode ? this.resolvers.get(normalizedSourceMode) || null : null;
  }

  getResolvers(): RunJSSourceResolver[] {
    return Array.from(this.resolvers.values());
  }

  clear() {
    this.resolvers.clear();
  }
}

export const RunJSSourceResolverRegistry = new RunJSSourceResolverRegistryManager();
