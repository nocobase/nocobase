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
};

type PluginWithApp = {
  app?: {
    pm?: PluginManagerLike;
  };
};

export type JsTemplateUsageContext = {
  transaction?: unknown;
  requestId?: string;
  requestSource?: string;
  actorUserId?: string | null;
  can?: (input: { resource: string; action: string }) => unknown | Promise<unknown>;
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
};

export type JsTemplateUsageProvider = {
  syncJsTemplateUsagesForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: JsTemplateUsageContext,
  ) => Promise<unknown>;
  markJsTemplateUsagesOwnerMissingForNodeTree?: (
    input: { rootUid: string; action?: string },
    ctx?: JsTemplateUsageContext,
  ) => Promise<unknown>;
};

const JS_TEMPLATE_PLUGIN_NAME = '@nocobase/plugin-js-template';

export async function syncJsTemplateUsagesForNodeTree(
  plugin: PluginWithApp,
  input: { rootUid?: string | null; action?: string },
  ctx: JsTemplateUsageContext = {},
): Promise<void> {
  const rootUid = normalizeString(input.rootUid);
  if (!rootUid) {
    return;
  }
  const provider = getJsTemplateUsageProvider(plugin.app?.pm);
  await provider?.syncJsTemplateUsagesForNodeTree?.({ rootUid, action: input.action }, ctx);
}

export async function markJsTemplateUsagesOwnerMissingForNodeTree(
  plugin: PluginWithApp,
  input: { rootUid?: string | null; action?: string },
  ctx: JsTemplateUsageContext = {},
): Promise<void> {
  const rootUid = normalizeString(input.rootUid);
  if (!rootUid) {
    return;
  }
  const provider = getJsTemplateUsageProvider(plugin.app?.pm);
  await provider?.markJsTemplateUsagesOwnerMissingForNodeTree?.({ rootUid, action: input.action }, ctx);
}

function getJsTemplateUsageProvider(pm?: PluginManagerLike): JsTemplateUsageProvider | null {
  if (!pm?.get) {
    return null;
  }
  try {
    const plugin = pm.get(JS_TEMPLATE_PLUGIN_NAME);
    return isJsTemplateUsageProvider(plugin) ? plugin : null;
  } catch {
    return null;
  }
}

function isJsTemplateUsageProvider(value: unknown): value is JsTemplateUsageProvider {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (typeof (value as JsTemplateUsageProvider).syncJsTemplateUsagesForNodeTree === 'function' ||
      typeof (value as JsTemplateUsageProvider).markJsTemplateUsagesOwnerMissingForNodeTree === 'function')
  );
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}
