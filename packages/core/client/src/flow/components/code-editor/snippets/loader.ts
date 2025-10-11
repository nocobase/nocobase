/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// TS/JS module-based snippets loader
// Each snippet module exports either default string (body) or { body: string }

type ModuleLoader = Record<string, () => Promise<any>>;
// declare for webpack/rspack fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

// Engine-provided snippets map (normalized keys like 'global/message-success')
import { engineSnippets as engineModules } from '@nocobase/flow-engine';

function buildLocalModuleMap(): ModuleLoader {
  try {
    const anyMeta: any = import.meta as any;
    if (anyMeta && typeof anyMeta.glob === 'function') {
      return anyMeta.glob('./**/*.snippet.{ts,js}', { eager: false });
    }
  } catch (err) {
    try {
      console.debug?.('[snippets/loader] import.meta.glob not available', err);
    } catch (_) {
      void 0;
    }
  }
  // Fallback: webpack/rspack require.context
  try {
    const req = require?.context('./', true, /\.snippet\.(ts|js)$/);
    if (req) {
      const map: ModuleLoader = {};
      req.keys().forEach((k: string) => {
        map[k] = async () => req(k);
      });
      return map;
    }
  } catch (err) {
    try {
      console.debug?.('[snippets/loader] require.context not available', err);
    } catch (_) {
      void 0;
    }
  }
  return {} as ModuleLoader;
}

function normalizeKey(k: string): string {
  // ./scene/jsblock/render-basic.snippet.ts -> scene/jsblock/render-basic
  return k.replace(/^\.\//, '').replace(/\.(snippet\.)?(t|j)s$/, '');
}

function buildUnifiedMap(): ModuleLoader {
  const out: ModuleLoader = {};
  // Local snippets
  const locals = buildLocalModuleMap();
  Object.keys(locals).forEach((k) => {
    out[normalizeKey(k)] = (locals as any)[k];
  });
  // Engine snippets (already normalized keys)
  Object.assign(out, engineModules);
  return out;
}

const modules: ModuleLoader = buildUnifiedMap();

export async function loadOne(ref: string): Promise<string> {
  const loader = (modules as any)[ref];
  if (!loader) throw new Error(`Snippet not found: ${ref}`);
  const mod = await loader();
  const def = mod?.default;
  if (def && typeof def === 'object' && typeof def.content === 'string') return def.content;
  const val = def ?? mod?.body ?? mod?.content ?? '';
  return typeof val === 'string' ? val : String(val ?? '');
}

export async function loadSnippets(snipastes: Record<string, any>): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (const [name, def] of Object.entries(snipastes || {})) {
    if (def && typeof def === 'object' && typeof (def as any).$ref === 'string') {
      try {
        out[name] = { ...def, body: await loadOne((def as any).$ref) };
      } catch (err) {
        try {
          console.debug?.('[snippets/loader] missing snippet ref', (def as any).$ref, err);
        } catch (_) {
          void 0;
        }
        out[name] = def; // keep as is if missing
      }
    } else {
      out[name] = def;
    }
  }
  return out;
}

export type LoadedSnippetEntry = {
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
  // 归类规则：
  // - global/*      -> global
  // - libs/*        -> libs
  // - scene/x/*     -> scene/x（如 scene/jsblock、scene/actions）
  const first = parts[0];
  if (first === 'global' || first === 'libs') return first;
  if (first === 'scene' && parts.length >= 2) return `${first}/${parts[1]}`;
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return parts[0];
}

export async function loadSnippetsForContext(ctxClassName: string, version = 'v1'): Promise<LoadedSnippetEntry[]> {
  const entries: LoadedSnippetEntry[] = [];
  await Promise.all(
    Object.entries(modules).map(async ([key, loader]) => {
      try {
        const mod = await (loader as any)();
        const def = mod?.default;
        let meta: any = undefined;
        let body: any = undefined;
        if (def && typeof def === 'object' && typeof def.content === 'string') {
          meta = def;
          body = def.content;
        } else if (typeof def === 'string') {
          body = def;
          meta = mod?.meta || mod?.info || {};
        } else if (typeof mod?.body === 'string') {
          body = mod.body;
          meta = mod?.meta || mod?.info || {};
        }
        if (typeof body !== 'string') return;
        // If snippet declares contexts, filter; support '*' for all
        let ok = true;
        if (meta && Array.isArray(meta.contexts) && meta.contexts.length) {
          ok = meta.contexts.includes('*') || meta.contexts.includes(ctxClassName);
        }
        // If versions declared, filter
        if (ok && meta && Array.isArray(meta.versions) && meta.versions.length) {
          ok = meta.versions.includes('*') || meta.versions.includes(version);
        }
        if (!ok) return;
        const name = meta?.label || deriveNameFromKey(key);
        const prefix = meta?.prefix || name;
        entries.push({ name, prefix, description: meta?.description, body, ref: key, group: groupFromKey(key) });
      } catch (err) {
        try {
          console.debug?.('[snippets/loader] load module failed', key, err);
        } catch (_) {
          void 0;
        }
      }
    }),
  );
  return entries;
}
