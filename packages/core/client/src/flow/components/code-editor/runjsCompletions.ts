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
import { getRunJSDocFor, setupRunJSContexts, listSnippetsForContext } from '@nocobase/flow-engine';

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
  // Ensure RunJS contexts are registered (lazy, avoids static cycles)
  try {
    await setupRunJSContexts();
  } catch (_) {
    // ignore if setup fails
  }
  // 当 hostCtx 不存在时，传入空对象以获取通用（*）上下文的文档
  const doc = getRunJSDocFor((hostCtx as any) || ({} as any), { version });
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
  let entries: SnippetEntry[] = [];
  try {
    const ctxClassName = (hostCtx as any)?.model?.constructor?.name || '*';
    const locale = (hostCtx as any)?.api?.auth?.locale || (hostCtx as any)?.i18n?.language;
    entries = await listSnippetsForContext(ctxClassName, version, locale);
  } catch (_) {
    entries = [];
  }

  for (const s of entries) {
    completions.push(
      snippetCompletion(s.body, {
        label: s.prefix || s.name,
        detail: s.name,
        info: s.description || s.ref,
      }) as any,
    );
  }

  return { completions, entries };
}
