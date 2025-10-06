/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunJSContextRegistry } from '../registry';

// Simple manual exports - no build-time magic needed
const snippets: Record<string, () => Promise<any>> = {
  // global
  'global/message-success': () => import('./global/message-success.snippet'),
  'global/message-error': () => import('./global/message-error.snippet'),
  'global/log-json-record': () => import('./global/log-json-record.snippet'),
  'global/api-request-get': () => import('./global/api-request-get.snippet'),
  'global/api-request-post': () => import('./global/api-request-post.snippet'),
  'global/api-request-basic': () => import('./global/api-request-basic.snippet'),
  'global/requireAsync': () => import('./global/requireAsync.snippet'),
  'global/try-catch-async': () => import('./global/try-catch-async.snippet'),
  'global/sleep': () => import('./global/sleep.snippet'),
  'global/notification-open': () => import('./global/notification-open.snippet'),
  'global/window-open': () => import('./global/window-open.snippet'),
  'global/open-view-drawer': () => import('./global/open-view-drawer.snippet'),
  'global/open-view-dialog': () => import('./global/open-view-dialog.snippet'),
  'global/view-navigation-push': () => import('./global/view-navigation-push.snippet'),
  'global/open-view-page-or-drawer': () => import('./global/open-view-page-or-drawer.snippet'),
  'global/view-read-input-args': () => import('./global/view-read-input-args.snippet'),
  'global/api-response': () => import('./global/api-response.snippet'),
  'global/i18n-example': () => import('./global/i18n-example.snippet'),
  'global/viewer-dialog-basic': () => import('./global/viewer-dialog-basic.snippet'),
  'global/batch-api-requests': () => import('./global/batch-api-requests.snippet'),
  'global/array-operations': () => import('./global/array-operations.snippet'),
  'global/debounce-function': () => import('./global/debounce-function.snippet'),
  'global/form-validation': () => import('./global/form-validation.snippet'),
  'global/deep-clone': () => import('./global/deep-clone.snippet'),
  'global/retry-requests': () => import('./global/retry-requests.snippet'),
  // libs
  'libs/echarts-init': () => import('./libs/echarts-init.snippet'),
  // scene/block
  'scene/block/render-basic': () => import('./scene/block/render-basic.snippet'),
  'scene/block/render-react': () => import('./scene/block/render-react.snippet'),
  'scene/block/render-card': () => import('./scene/block/render-card.snippet'),
  'scene/block/render-button-handler': () => import('./scene/block/render-button-handler.snippet'),
  'scene/block/jsx-mount': () => import('./scene/block/jsx-mount.snippet'),
  'scene/block/jsx-unmount': () => import('./scene/block/jsx-unmount.snippet'),
  'scene/block/add-event-listener': () => import('./scene/block/add-event-listener.snippet'),
  'scene/block/append-style': () => import('./scene/block/append-style.snippet'),
  'scene/block/basic-html-template': () => import('./scene/block/basic-html-template.snippet'),
  'scene/block/echarts-random': () => import('./scene/block/echarts-random.snippet'),
  'scene/block/query-selector': () => import('./scene/block/query-selector.snippet'),
  'scene/block/resource-example': () => import('./scene/block/resource-example.snippet'),
  'scene/block/api-fetch-render-list': () => import('./scene/block/api-fetch-render-list.snippet'),
  'scene/block/render-info-card': () => import('./scene/block/render-info-card.snippet'),
  'scene/block/render-pie-chart': () => import('./scene/block/render-pie-chart.snippet'),
  'scene/block/render-statistics': () => import('./scene/block/render-statistics.snippet'),
  'scene/block/render-timeline': () => import('./scene/block/render-timeline.snippet'),
  // scene/detail
  'scene/detail/innerHTML-value': () => import('./scene/detail/innerHTML-value.snippet'),
  'scene/detail/format-number': () => import('./scene/detail/format-number.snippet'),
  'scene/detail/color-by-value': () => import('./scene/detail/color-by-value.snippet'),
  'scene/detail/copy-to-clipboard': () => import('./scene/detail/copy-to-clipboard.snippet'),
  'scene/detail/status-tag': () => import('./scene/detail/status-tag.snippet'),
  'scene/detail/relative-time': () => import('./scene/detail/relative-time.snippet'),
  'scene/detail/currency-format': () => import('./scene/detail/currency-format.snippet'),
  'scene/detail/percentage-bar': () => import('./scene/detail/percentage-bar.snippet'),
  'scene/detail/truncate-text': () => import('./scene/detail/truncate-text.snippet'),
  // scene/form
  'scene/form/render-basic': () => import('./scene/form/render-basic.snippet'),
  'scene/form/set-field-value': () => import('./scene/form/set-field-value.snippet'),
  'scene/form/toggle-visible': () => import('./scene/form/toggle-visible.snippet'),
  'scene/form/set-disabled': () => import('./scene/form/set-disabled.snippet'),
  'scene/form/set-required': () => import('./scene/form/set-required.snippet'),
  'scene/form/calculate-total': () => import('./scene/form/calculate-total.snippet'),
  'scene/form/conditional-required': () => import('./scene/form/conditional-required.snippet'),
  'scene/form/cascade-select': () => import('./scene/form/cascade-select.snippet'),
  'scene/form/toggle-multiple-fields': () => import('./scene/form/toggle-multiple-fields.snippet'),
  'scene/form/copy-field-values': () => import('./scene/form/copy-field-values.snippet'),
  // scene/table
  'scene/table/cell-open-dialog': () => import('./scene/table/cell-open-dialog.snippet'),
  'scene/table/record-id-message': () => import('./scene/table/record-id-message.snippet'),
  'scene/table/run-action-basic': () => import('./scene/table/run-action-basic.snippet'),
  'scene/table/collection-selected-count': () => import('./scene/table/collection-selected-count.snippet'),
  'scene/table/iterate-selected-rows': () => import('./scene/table/iterate-selected-rows.snippet'),
  'scene/table/destroy-selected': () => import('./scene/table/destroy-selected.snippet'),
  'scene/table/batch-update-status': () => import('./scene/table/batch-update-status.snippet'),
  'scene/table/export-selected-json': () => import('./scene/table/export-selected-json.snippet'),
  'scene/table/calculate-sum': () => import('./scene/table/calculate-sum.snippet'),
  'scene/table/batch-delete-confirm': () => import('./scene/table/batch-delete-confirm.snippet'),
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
  groups?: string[];
  scenes?: string[];
};

function deriveNameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

function normalizeScenes(def: any, key: string): string[] {
  if (Array.isArray(def?.scenes) && def.scenes.length) {
    return def.scenes.map((scene: any) => String(scene).trim()).filter((scene: string) => scene.length > 0);
  }
  const parts = key.split('/');
  if (parts[0] === 'scene' && parts[1]) {
    return [parts[1]];
  }
  return [];
}

function computeGroups(def: any, key: string): string[] {
  const scenes = normalizeScenes(def, key);
  if (scenes.length) {
    return scenes.map((scene) => `scene/${scene}`);
  }
  const parts = key.split('/');
  if (!parts.length) return [];
  const first = parts[0];
  if (first === 'global' || first === 'libs') return [first];
  if (first === 'scene' && parts.length >= 2) return [`${first}/${parts[1]}`];
  if (parts.length >= 2) return [`${parts[0]}/${parts[1]}`];
  return [parts[0]];
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
  const allowedContextNames = new Set<string>();
  if (typeof ctxClassName === 'string' && ctxClassName) allowedContextNames.add(ctxClassName);
  try {
    const resolvedCtor = RunJSContextRegistry['resolve'](version as any, ctxClassName);
    if (resolvedCtor?.name) allowedContextNames.add(resolvedCtor.name);
  } catch (_) {
    // ignore resolution failure
  }
  await Promise.all(
    Object.entries(snippets).map(async ([key, loader]) => {
      const mod = await (loader as any)();
      const def = mod?.default || {};
      const body: any = def?.content ?? mod?.content;
      if (typeof body !== 'string') return;
      let ok = true;
      if (Array.isArray(def?.contexts) && def.contexts.length) {
        const ctxNames = def.contexts.map((item: any) => {
          if (item === '*') return '*';
          if (typeof item === 'string') return item;
          if (typeof item === 'function') return item.name || '*';
          if (item && typeof item === 'object' && typeof item.name === 'string') return item.name;
          return String(item ?? '');
        });
        if (ctxClassName === '*') {
          ok = ctxNames.includes('*') || ctxNames.length === 0;
        } else {
          ok = ctxNames.includes('*') || ctxNames.some((name: string) => allowedContextNames.has(name));
        }
      }
      if (ok && Array.isArray(def?.versions) && def.versions.length) {
        ok = def.versions.includes('*') || def.versions.includes(version);
      }
      if (!ok) return;
      const localeMeta = resolveLocaleMeta(def, locale);
      const name = localeMeta.label || def?.label || deriveNameFromKey(key);
      const description = localeMeta.description ?? def?.description;
      const prefix = def?.prefix || name;
      const groups = computeGroups(def, key);
      const scenes = normalizeScenes(def, key);
      entries.push({
        name,
        prefix,
        description,
        body,
        ref: key,
        group: groups[0],
        groups,
        scenes,
      });
    }),
  );
  return entries;
}
