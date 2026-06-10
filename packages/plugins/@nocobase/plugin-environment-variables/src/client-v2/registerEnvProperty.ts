/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Shared registration of the `$env` property on a flow-engine context — the
 * single source of truth used by BOTH client runtimes:
 *   - v2 (`client-v2/plugin.tsx`) registers it on its own flow-engine context;
 *   - v1 (`client/index.tsx`) imports this same helper via the allowed v1 → v2
 *     direction and registers it on v1's flow-engine context, so workflow's v2
 *     config drawer (which renders detached from the React tree and therefore
 *     can't reach v1's React-context-based `addGlobalVar('$env')`) can still read
 *     `$env` from `flowEngine.context.getPropertyMetaTree()`.
 *
 * Framework-agnostic: dependencies (`apiClient`, `t`) are injected as parameters,
 * so it carries no React hooks and no `@nocobase/client` import — usable from
 * either runtime. The list is fetched lazily (first read only) and cached by the
 * flow-engine context, so the picker never re-requests on every expand.
 */

import type { FlowContext, PropertyMeta } from '@nocobase/flow-engine';

type EnvironmentVariable = {
  name: string;
  value?: string;
  type?: 'default' | 'secret';
};

/** Minimal structural slice of the API client — only the one call this needs.
 *  Avoids importing the concrete `APIClient` type across the package boundary. */
type EnvApiClient = {
  request(options: { url: string; skipNotify?: boolean }): Promise<unknown>;
};

const ENV_VARS_LIST_URL = 'environmentVariables?paginate=false';
const ENV_ROOT = '$env';

export async function fetchEnvironmentVariables(apiClient: EnvApiClient): Promise<EnvironmentVariable[]> {
  try {
    const response = await apiClient.request({ url: ENV_VARS_LIST_URL, skipNotify: true });
    const list = (response as { data?: { data?: unknown } })?.data?.data;
    return Array.isArray(list) ? (list as EnvironmentVariable[]) : [];
  } catch {
    return [];
  }
}

/** A translator for the scope label. Accepts the i18next `t` from either runtime
 *  (its return type isn't a bare `string` — it's a `TFunctionDetailedResult` /
 *  union), so the result is coerced to a string by the helper. */
type Translate = (key: string) => unknown;

/**
 * Define `$env` on the given flow-engine context. `t` translates the scope label
 * ("Variables and secrets"); `apiClient` fetches the variable list lazily.
 */
export function registerEnvProperty(context: FlowContext, apiClient: EnvApiClient, t: Translate): void {
  context.defineProperty(ENV_ROOT, {
    get: async () => {
      const list = await fetchEnvironmentVariables(apiClient);
      return Object.fromEntries(list.map((item) => [item.name, item.value]));
    },
    meta: {
      type: 'object',
      title: String(t('Variables and secrets')),
      properties: async (): Promise<Record<string, PropertyMeta>> => {
        const list = await fetchEnvironmentVariables(apiClient);
        const out: Record<string, PropertyMeta> = {};
        for (const item of list) {
          out[item.name] = {
            type: item.type === 'secret' ? 'string' : item.type || 'string',
            title: item.name,
          };
        }
        return out;
      },
    },
  });
}
