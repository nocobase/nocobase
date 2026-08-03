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

export type JsTemplateReferenceContext = {
  transaction?: unknown;
  requestId?: string;
  requestSource?: string;
  actorUserId?: string | null;
  can?: (input: { resource: string; action: string }) => unknown | Promise<unknown>;
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
};

export type JsTemplateReferenceProvider = {
  syncJsTemplateReferencesForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: JsTemplateReferenceContext,
  ) => Promise<unknown>;
  markJsTemplateReferencesOwnerMissingForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: JsTemplateReferenceContext,
  ) => Promise<unknown>;
  syncFlowModelReferencesForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: JsTemplateReferenceContext,
  ) => Promise<unknown>;
  markFlowModelReferencesOwnerMissingForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: JsTemplateReferenceContext,
  ) => Promise<unknown>;
};

export type LightExtensionReferenceContext = JsTemplateReferenceContext;
export type LightExtensionReferenceProvider = JsTemplateReferenceProvider;

const LIGHT_EXTENSION_PLUGIN_ALIASES = [
  '@nocobase/plugin-light-extension',
  'light-extension',
  'plugin-light-extension',
];

export async function syncJsTemplateReferencesForNodeTree(
  plugin: PluginWithApp,
  input: { rootUid?: string | null; action?: string },
  ctx: JsTemplateReferenceContext = {},
): Promise<void> {
  const rootUid = normalizeString(input.rootUid);
  if (!rootUid) {
    return;
  }
  const provider = findJsTemplateReferenceProvider(plugin.app?.pm);
  const request = { rootUid, action: input.action };
  const sync = provider?.syncJsTemplateReferencesForNodeTree || provider?.syncFlowModelReferencesForNodeTree;
  await sync?.call(provider, request, ctx);
}

export async function markJsTemplateReferencesOwnerMissingForNodeTree(
  plugin: PluginWithApp,
  input: { rootUid?: string | null; action?: string },
  ctx: JsTemplateReferenceContext = {},
): Promise<void> {
  const rootUid = normalizeString(input.rootUid);
  if (!rootUid) {
    return;
  }
  const provider = findJsTemplateReferenceProvider(plugin.app?.pm);
  const request = { rootUid, action: input.action };
  const markOwnerMissing =
    provider?.markJsTemplateReferencesOwnerMissingForNodeTree ||
    provider?.markFlowModelReferencesOwnerMissingForNodeTree;
  await markOwnerMissing?.call(provider, request, ctx);
}

export const syncLightExtensionReferencesForNodeTree = syncJsTemplateReferencesForNodeTree;
export const markLightExtensionReferencesOwnerMissingForNodeTree = markJsTemplateReferencesOwnerMissingForNodeTree;

function findJsTemplateReferenceProvider(pm?: PluginManagerLike): JsTemplateReferenceProvider | null {
  if (!pm) {
    return null;
  }

  for (const alias of LIGHT_EXTENSION_PLUGIN_ALIASES) {
    const plugin = getPluginByAlias(pm, alias);
    if (isJsTemplateReferenceProvider(plugin)) {
      return plugin;
    }
  }

  const plugins = getInstalledPlugins(pm);
  if (!plugins) {
    return null;
  }
  for (const plugin of plugins.values()) {
    if (isJsTemplateReferenceProvider(plugin)) {
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

function isJsTemplateReferenceProvider(value: unknown): value is JsTemplateReferenceProvider {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (typeof (value as JsTemplateReferenceProvider).syncJsTemplateReferencesForNodeTree === 'function' ||
      typeof (value as JsTemplateReferenceProvider).markJsTemplateReferencesOwnerMissingForNodeTree === 'function' ||
      typeof (value as JsTemplateReferenceProvider).syncFlowModelReferencesForNodeTree === 'function' ||
      typeof (value as JsTemplateReferenceProvider).markFlowModelReferencesOwnerMissingForNodeTree === 'function')
  );
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}
