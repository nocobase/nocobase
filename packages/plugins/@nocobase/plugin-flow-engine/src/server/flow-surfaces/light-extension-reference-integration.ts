/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type PluginManagerLike = {
  get?: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
};

type PluginWithApp = {
  app?: {
    pm?: PluginManagerLike;
  };
};

type LightExtensionReferenceContext = {
  transaction?: unknown;
  requestId?: string;
  requestSource?: string;
  actorUserId?: string | null;
  can?: (input: { resource: string; action: string }) => unknown | Promise<unknown>;
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
};

type LightExtensionReferenceProvider = {
  syncFlowModelReferencesForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: LightExtensionReferenceContext,
  ) => Promise<unknown>;
  markFlowModelReferencesOwnerMissingForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: LightExtensionReferenceContext,
  ) => Promise<unknown>;
};

const LIGHT_EXTENSION_PLUGIN_ALIASES = [
  '@nocobase/plugin-light-extension',
  'light-extension',
  'plugin-light-extension',
];

export async function syncLightExtensionReferencesForNodeTree(
  plugin: PluginWithApp,
  input: { rootUid?: string | null; action?: string },
  ctx: LightExtensionReferenceContext = {},
): Promise<void> {
  const rootUid = normalizeString(input.rootUid);
  if (!rootUid) {
    return;
  }
  const provider = findLightExtensionReferenceProvider(plugin.app?.pm);
  await provider?.syncFlowModelReferencesForNodeTree?.(
    {
      rootUid,
      action: input.action,
    },
    ctx,
  );
}

export async function markLightExtensionReferencesOwnerMissingForNodeTree(
  plugin: PluginWithApp,
  input: { rootUid?: string | null; action?: string },
  ctx: LightExtensionReferenceContext = {},
): Promise<void> {
  const rootUid = normalizeString(input.rootUid);
  if (!rootUid) {
    return;
  }
  const provider = findLightExtensionReferenceProvider(plugin.app?.pm);
  await provider?.markFlowModelReferencesOwnerMissingForNodeTree?.(
    {
      rootUid,
      action: input.action,
    },
    ctx,
  );
}

function findLightExtensionReferenceProvider(pm?: PluginManagerLike): LightExtensionReferenceProvider | null {
  if (!pm) {
    return null;
  }

  for (const alias of LIGHT_EXTENSION_PLUGIN_ALIASES) {
    const plugin = getPluginByAlias(pm, alias);
    if (isLightExtensionReferenceProvider(plugin)) {
      return plugin;
    }
  }

  const plugins = getInstalledPlugins(pm);
  if (!plugins) {
    return null;
  }
  for (const plugin of plugins.values()) {
    if (isLightExtensionReferenceProvider(plugin)) {
      return plugin;
    }
  }

  return null;
}

function getPluginByAlias(pm: PluginManagerLike, alias: string): unknown {
  try {
    return pm.get?.(alias);
  } catch {
    return undefined;
  }
}

function getInstalledPlugins(pm: PluginManagerLike): Map<unknown, unknown> | undefined {
  try {
    return pm.getPlugins?.();
  } catch {
    return undefined;
  }
}

function isLightExtensionReferenceProvider(value: unknown): value is LightExtensionReferenceProvider {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (typeof (value as LightExtensionReferenceProvider).syncFlowModelReferencesForNodeTree === 'function' ||
      typeof (value as LightExtensionReferenceProvider).markFlowModelReferencesOwnerMissingForNodeTree === 'function')
  );
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}
