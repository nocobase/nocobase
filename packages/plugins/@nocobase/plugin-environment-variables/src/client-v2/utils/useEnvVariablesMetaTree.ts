/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext, type MetaTreeNode } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

const CACHE_KEY = '@nocobase/plugin-environment-variables:metaTree';

/**
 * Returns the `$env` sub-tree of the FlowContext meta tree as a fully-resolved
 * (sync `children`) array, or an empty array when no environment variables
 * exist (mirroring v1's `useGetEnvironmentVariables` returning null +
 * filter(Boolean)).
 *
 * Why this hook exists:
 *   - `$env` is registered globally on FlowContext via
 *     `defineProperty('$env', { meta: { properties: async () => ... } })`.
 *     That registration is the single source of truth for both runtime value
 *     resolution (`ctx.$env.X`) and picker meta info.
 *   - The variable picker's tag label map walks `children` only when it is a
 *     plain array; the lazy `() => Promise<MetaTreeNode[]>` produced by
 *     `getPropertyMetaTree()` is skipped, so existing values like
 *     `{{ $env.foo }}` would render as raw expressions on first paint.
 *   - This hook awaits the lazy children once, returning a fully-resolved tree
 *     that the picker can both display and traverse for tag labels.
 *
 * Consumers (e.g. file manager's storage configuration) should use this hook
 * so that:
 *   - the empty-state behaviour is centralised here, not duplicated per consumer
 *   - the underlying API endpoint stays an internal detail of this plugin
 *   - multiple consumers share a single cached request via ahooks' `cacheKey`
 *   - the picker stays in sync after the user switches tabs back from another
 *     window where env vars may have been edited (`refreshOnWindowFocus`)
 */
export function useEnvVariablesMetaTree(): MetaTreeNode[] {
  const ctx = useFlowContext();
  const { data } = useRequest<MetaTreeNode[], []>(
    async () => {
      const tree = ctx.getPropertyMetaTree().filter((node) => node.name === '$env');
      // Resolve lazy `children` (driven by `meta.properties: async () => ...`)
      // so that downstream label-map construction can walk them synchronously.
      for (const node of tree) {
        if (typeof node.children === 'function') {
          try {
            const resolved = await (node.children as () => Promise<MetaTreeNode[]>)();
            node.children = Array.isArray(resolved) ? resolved : [];
          } catch {
            node.children = [];
          }
        }
      }
      // Hide `$env` entirely when no env vars exist, matching v1's empty-state UX.
      return tree.filter((node) => Array.isArray(node.children) && node.children.length > 0);
    },
    {
      cacheKey: CACHE_KEY,
      refreshOnWindowFocus: true,
    },
  );

  return data ?? [];
}
