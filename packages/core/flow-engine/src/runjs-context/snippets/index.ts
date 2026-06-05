/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunJSContextRegistry } from '../registry';

export type RunJSSnippetLoader = () => Promise<any>;

// Simple manual exports - no build-time magic needed
const snippets: Record<string, RunJSSnippetLoader | undefined> = {
  // global
  'global/message-success': () => import('./global/message-success.snippet'),
  'global/message-error': () => import('./global/message-error.snippet'),
  'global/api-request': () => import('./global/api-request.snippet'),
  'global/require-amd': () => import('./global/require-amd.snippet'),
  'global/import-esm': () => import('./global/import-esm.snippet'),
  'global/notification-open': () => import('./global/notification-open.snippet'),
  'global/window-open': () => import('./global/window-open.snippet'),
  'global/open-view-drawer': () => import('./global/open-view-drawer.snippet'),
  'global/open-view-dialog': () => import('./global/open-view-dialog.snippet'),
  'global/query-selector': () => import('./global/query-selector.snippet'),
  'global/clipboard-copy-text': () => import('./global/clipboard-copy-text.snippet'),
  // libs
  'scene/block/echarts-init': () => import('./scene/block/echarts-init.snippet'),
  // scene/block
  'scene/block/render-react': () => import('./scene/block/render-react.snippet'),
  'scene/block/render-react-jsx': () => import('./scene/block/render-react-jsx.snippet'),
  'scene/block/render-antd-icons': () => import('./scene/block/render-antd-icons.snippet'),
  'scene/block/render-button-handler': () => import('./scene/block/render-button-handler.snippet'),
  'scene/block/add-event-listener': () => import('./scene/block/add-event-listener.snippet'),
  'scene/block/chartjs-bar': () => import('./scene/block/chartjs-bar.snippet'),
  'scene/block/vue-component': () => import('./scene/block/vue-component.snippet'),
  'scene/block/resource-example': () => import('./scene/block/resource-example.snippet'),
  'scene/block/api-fetch-render-list': () => import('./scene/block/api-fetch-render-list.snippet'),
  'scene/block/render-info-card': () => import('./scene/block/render-info-card.snippet'),
  'scene/block/render-statistics': () => import('./scene/block/render-statistics.snippet'),
  'scene/block/render-timeline': () => import('./scene/block/render-timeline.snippet'),
  'scene/block/render-iframe': () => import('./scene/block/render-iframe.snippet'),
  // scene/detail
  'scene/detail/innerHTML-value': () => import('./scene/detail/innerHTML-value.snippet'),
  'scene/detail/format-number': () => import('./scene/detail/format-number.snippet'),
  'scene/detail/color-by-value': () => import('./scene/detail/color-by-value.snippet'),
  'scene/detail/copy-to-clipboard': () => import('./scene/detail/copy-to-clipboard.snippet'),
  'scene/detail/status-tag': () => import('./scene/detail/status-tag.snippet'),
  'scene/detail/relative-time': () => import('./scene/detail/relative-time.snippet'),
  'scene/detail/percentage-bar': () => import('./scene/detail/percentage-bar.snippet'),
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
  'scene/table/concat-fields': () => import('./scene/table/concat-fields.snippet'),
  'scene/table/collection-selected-count': () => import('./scene/table/collection-selected-count.snippet'),
  'scene/table/iterate-selected-rows': () => import('./scene/table/iterate-selected-rows.snippet'),
  'scene/table/destroy-selected': () => import('./scene/table/destroy-selected.snippet'),
  'scene/table/export-selected-json': () => import('./scene/table/export-selected-json.snippet'),
};

export default snippets;

/**
 * Register a RunJS snippet loader for editors/AI coding.
 *
 * - By default, an existing ref will NOT be overwritten (returns false).
 * - Use { override: true } to overwrite an existing ref (returns true).
 */
export function registerRunJSSnippet(
  ref: string,
  loader: RunJSSnippetLoader,
  options?: {
    override?: boolean;
  },
): boolean {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new Error('[flow-engine] registerRunJSSnippet: ref must be a non-empty string');
  }
  if (typeof loader !== 'function') {
    throw new Error('[flow-engine] registerRunJSSnippet: loader must be a function returning a Promise');
  }
  const key = ref.trim();
  const existed = typeof snippets[key] === 'function';
  if (existed && !options?.override) return false;
  snippets[key] = loader;
  return true;
}

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
  const loader = snippets[ref];
  if (typeof loader !== 'function') throw new Error(`[flow-engine] snippet not found: ${ref}`);
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
      if (typeof loader !== 'function') return;
      try {
        const mod = await loader();
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
            // '*' means return all snippets without filtering by context
            ok = true;
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
      } catch (_) {
        // fail-open: ignore broken snippet loader
        return;
      }
    }),
  );
  return entries;
}
