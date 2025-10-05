/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Simple manual exports - no build-time magic needed
const snippets: Record<string, () => Promise<any>> = {
  // global
  'global/message-success': () => import('./global/message-success.snippet'),
  'global/message-error': () => import('./global/message-error.snippet'),
  'global/log-json-record': () => import('./global/log-json-record.snippet'),
  'global/api-request-get': () => import('./global/api-request-get.snippet'),
  'global/api-request-post': () => import('./global/api-request-post.snippet'),
  'global/requireAsync': () => import('./global/requireAsync.snippet'),
  'global/try-catch-async': () => import('./global/try-catch-async.snippet'),
  'global/sleep': () => import('./global/sleep.snippet'),
  'global/notification-open': () => import('./global/notification-open.snippet'),
  'global/window-open': () => import('./global/window-open.snippet'),
  'global/console-log-ctx': () => import('./global/console-log-ctx.snippet'),
  'global/open-view-drawer': () => import('./global/open-view-drawer.snippet'),
  'global/open-view-dialog': () => import('./global/open-view-dialog.snippet'),
  'global/view-navigation-push': () => import('./global/view-navigation-push.snippet'),
  // libs
  'libs/echarts-init': () => import('./libs/echarts-init.snippet'),
  // scene/jsblock
  'scene/jsblock/render-basic': () => import('./scene/jsblock/render-basic.snippet'),
  'scene/jsblock/render-react': () => import('./scene/jsblock/render-react.snippet'),
  'scene/jsblock/render-card': () => import('./scene/jsblock/render-card.snippet'),
  'scene/jsblock/render-button-handler': () => import('./scene/jsblock/render-button-handler.snippet'),
  'scene/jsblock/jsx-mount': () => import('./scene/jsblock/jsx-mount.snippet'),
  'scene/jsblock/jsx-unmount': () => import('./scene/jsblock/jsx-unmount.snippet'),
  'scene/jsblock/add-event-listener': () => import('./scene/jsblock/add-event-listener.snippet'),
  'scene/jsblock/append-style': () => import('./scene/jsblock/append-style.snippet'),
  // scene/jsfield
  'scene/jsfield/innerHTML-value': () => import('./scene/jsfield/innerHTML-value.snippet'),
  'scene/jsfield/format-number': () => import('./scene/jsfield/format-number.snippet'),
  'scene/jsfield/color-by-value': () => import('./scene/jsfield/color-by-value.snippet'),
  // scene/jsitem
  'scene/jsitem/render-basic': () => import('./scene/jsitem/render-basic.snippet'),
  // scene/actions
  'scene/actions/record-id-message': () => import('./scene/actions/record-id-message.snippet'),
  'scene/actions/run-action-basic': () => import('./scene/actions/run-action-basic.snippet'),
  'scene/actions/collection-selected-count': () => import('./scene/actions/collection-selected-count.snippet'),
  'scene/actions/iterate-selected-rows': () => import('./scene/actions/iterate-selected-rows.snippet'),
  // scene/linkage
  'scene/linkage/set-field-value': () => import('./scene/linkage/set-field-value.snippet'),
  'scene/linkage/toggle-visible': () => import('./scene/linkage/toggle-visible.snippet'),
  'scene/linkage/set-disabled': () => import('./scene/linkage/set-disabled.snippet'),
  'scene/linkage/set-required': () => import('./scene/linkage/set-required.snippet'),
};

export default snippets;

// Cohesive snippet helpers for clients (editor, etc.)
type EngineSnippetEntry = {
  name: string;
  prefix?: string;
  description?: string;
  body: string;
  ref: string;
  group?: string;
};

function deriveNameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

function groupFromKey(key: string): string | undefined {
  const parts = key.split('/');
  if (!parts.length) return undefined;
  const first = parts[0];
  if (first === 'global' || first === 'libs') return first;
  if (first === 'scene' && parts.length >= 2) return `${first}/${parts[1]}`;
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return parts[0];
}

function resolveLocaleMeta(def: any, locale?: string) {
  if (!locale || !def?.locales) return {};
  const exact = def.locales[locale];
  if (exact) return exact;
  const normalized = locale.toLowerCase();
  if (normalized !== locale && def.locales[normalized]) return def.locales[normalized];
  const base = locale.split('-')[0];
  if (base && def.locales[base]) return def.locales[base];
  if (base) {
    const lowerBase = base.toLowerCase();
    if (def.locales[lowerBase]) return def.locales[lowerBase];
  }
  return {};
}

export async function getSnippetBody(ref: string): Promise<string> {
  const loader = (snippets as any)[ref];
  if (!loader) throw new Error(`[flow-engine] snippet not found: ${ref}`);
  const mod = await loader();
  const def = mod?.default;
  // engine snippet modules export a SnippetModule as default
  const content = def?.content ?? mod?.content ?? mod?.body ?? '';
  return typeof content === 'string' ? content : String(content ?? '');
}

export async function listSnippetsForContext(
  ctxClassName: string,
  version = 'v1',
  locale?: string,
): Promise<EngineSnippetEntry[]> {
  const entries: EngineSnippetEntry[] = [];
  await Promise.all(
    Object.entries(snippets).map(async ([key, loader]) => {
      try {
        const mod = await (loader as any)();
        const def = mod?.default || {};
        const body: any = def?.content ?? mod?.content;
        if (typeof body !== 'string') return;
        // contexts filter: supports '*' or specific RunJSContext class name
        let ok = true;
        if (Array.isArray(def?.contexts) && def.contexts.length) {
          ok = def.contexts.includes('*') || def.contexts.includes(ctxClassName);
        }
        // versions filter
        if (ok && Array.isArray(def?.versions) && def.versions.length) {
          ok = def.versions.includes('*') || def.versions.includes(version);
        }
        if (!ok) return;
        const localeMeta = resolveLocaleMeta(def, locale);
        const name = localeMeta.label || def?.label || deriveNameFromKey(key);
        const description = localeMeta.description ?? def?.description;
        const prefix = def?.prefix || name;
        entries.push({ name, prefix, description, body, ref: key, group: groupFromKey(key) });
      } catch (err) {
        try {
          console.debug?.('[flow-engine] load snippet fail', key, err);
        } catch (_) {
          // noop
        }
      }
    }),
  );
  return entries;
}
