/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Completion, snippetCompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { getRunJSDocFor, FlowRunJSContext } from '@nocobase/flow-engine';
import { loadSnippets, loadSnippetsForContext } from './snippets/loader';

export type SnippetEntry = {
  name: string;
  prefix?: string;
  description?: string;
  body: string;
  ref?: string;
  group?: string;
};

export async function buildRunJSCompletions(
  hostCtx: any,
  version = 'v1',
): Promise<{
  completions: Completion[];
  entries: SnippetEntry[];
}> {
  const doc = hostCtx ? getRunJSDocFor(hostCtx as any, { version }) : FlowRunJSContext.getDoc();
  const sn = await loadSnippets(doc?.snipastes || {});
  const completions: Completion[] = [];
  const toMd = (v: any) => (typeof v === 'string' ? v : JSON.stringify(v));

  const props = doc?.properties || {};
  for (const k of Object.keys(props)) {
    completions.push({ label: `ctx.${k}`, type: 'property', info: toMd(props[k]), detail: 'ctx property' });
  }
  const methods = doc?.methods || {};
  for (const k of Object.keys(methods)) {
    completions.push({
      label: `ctx.${k}()` as any,
      type: 'function',
      info: toMd(methods[k]),
      detail: 'ctx method',
      apply: (view: EditorView, _c: Completion, from: number, to: number) => {
        view.dispatch({ changes: { from, to, insert: `ctx.${k}()` } });
      },
    });
  }

  const entries: SnippetEntry[] = [];
  for (const [name, def] of Object.entries<any>(sn || {})) {
    const body = typeof def === 'string' ? def : def.body;
    const label = (def && def.prefix) || name;
    if (!body) continue;
    const text = Array.isArray(body) ? body.join('\n') : String(body);
    completions.push(
      snippetCompletion(text, {
        label,
        detail: name,
        info: (def && def.description) || name,
      }) as any,
    );
    const ref = (def && def.$ref) || '';
    const group =
      typeof ref === 'string'
        ? ref
            .replace(/^\.\/?/, '')
            .split('/')
            .slice(0, 2)
            .join('/')
        : undefined;
    entries.push({ name, prefix: def?.prefix, description: def?.description, body: text, ref, group });
  }

  try {
    const ctxClassName = (hostCtx as any)?.model?.constructor?.name || '*';
    const classSnippets = await loadSnippetsForContext(ctxClassName, version);
    for (const s of classSnippets) {
      completions.push(
        snippetCompletion(s.body, {
          label: s.prefix || s.name,
          detail: s.name,
          info: s.description || s.ref,
        }) as any,
      );
      entries.push({
        name: s.name,
        prefix: s.prefix,
        description: s.description,
        body: s.body,
        ref: s.ref,
        group: s.group,
      });
    }
  } catch (_) {
    // ignore single failure
  }

  return { completions, entries };
}
