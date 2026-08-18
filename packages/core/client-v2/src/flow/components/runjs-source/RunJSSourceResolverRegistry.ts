/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceResolver } from './types';
import { getRunJSRegistryHost, requireRunJSRegistryHost } from './RunJSRegistryHost';

export interface RunJSSourceResolverRegistryHost {
  registerResolver(resolver: RunJSSourceResolver): () => void;
  getResolver(sourceMode: unknown): RunJSSourceResolver | null;
  getResolvers(): RunJSSourceResolver[];
  clear(): void;
}

export type RunJSSourceResolverRegistryManager = RunJSSourceResolverRegistryHost;

export const RunJSSourceResolverRegistry: RunJSSourceResolverRegistryHost = {
  registerResolver(resolver) {
    return requireRunJSRegistryHost().sourceResolvers.registerResolver(resolver);
  },
  getResolver(sourceMode) {
    return getRunJSRegistryHost()?.sourceResolvers.getResolver(sourceMode) || null;
  },
  getResolvers() {
    return getRunJSRegistryHost()?.sourceResolvers.getResolvers() || [];
  },
  clear() {
    getRunJSRegistryHost()?.sourceResolvers.clear();
  },
};
