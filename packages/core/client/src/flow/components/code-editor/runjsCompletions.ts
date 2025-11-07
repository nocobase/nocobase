/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Completion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { getRunJSDocFor, setupRunJSContexts, listSnippetsForContext } from '@nocobase/flow-engine';

export type SnippetEntry = {
  name: string;
  prefix?: string;
  description?: string;
  body: string;
  ref?: string;
  group?: string;
  groups?: string[];
  scenes?: string[];
};

export async function buildRunJSCompletions(
  hostCtx: any,
  version = 'v1',
  scene?: string | string[],
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

  if (doc?.label || doc?.properties || doc?.methods) {
    completions.push({
      label: 'ctx',
      type: 'class',
      detail: 'FlowRunJSContext',
      info: doc?.label || 'RunJS context',
      boost: 115,
    } as Completion);
  }

  const collectProperties = (props: Record<string, any> | undefined, parentPath: string[] = []) => {
    if (!props) return;
    for (const [key, value] of Object.entries(props)) {
      const path = [...parentPath, key];
      const ctxLabel = `ctx.${path.join('.')}`;
      const depth = path.length;
      let description: any = value;
      let detail: string | undefined;
      let children: Record<string, any> | undefined;
      let completionSpec: any;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        description = value.description ?? value.detail ?? value.type ?? value;
        detail = value.detail ?? value.type ?? 'ctx property';
        completionSpec = value.completion;
        children = value.properties as Record<string, any> | undefined;
      }
      const apply = completionSpec?.insertText
        ? (view: EditorView, _completion: Completion, from: number, to: number) => {
            view.dispatch({
              changes: { from, to, insert: completionSpec.insertText },
              selection: { anchor: from + completionSpec.insertText.length },
              scrollIntoView: true,
            });
          }
        : undefined;
      completions.push({
        label: ctxLabel,
        type: 'property',
        info: toMd(description),
        detail: detail || 'ctx property',
        boost: Math.max(90 - depth * 5, 10),
        apply,
      } as Completion);
      if (children) {
        collectProperties(children, path);
      }
    }
  };

  collectProperties(doc?.properties || {});
  const methods = doc?.methods || {};
  for (const k of Object.keys(methods)) {
    const methodDoc = methods[k];
    let description: any = methodDoc;
    let detail = 'ctx method';
    let completionSpec: any;
    if (methodDoc && typeof methodDoc === 'object' && !Array.isArray(methodDoc)) {
      description = methodDoc.description ?? methodDoc.detail ?? methodDoc;
      detail = methodDoc.detail ?? detail;
      completionSpec = methodDoc.completion;
    }
    const insertText = completionSpec?.insertText ?? `ctx.${k}()`;
    completions.push({
      label: `ctx.${k}()` as any,
      type: 'function',
      info: toMd(description),
      detail,
      boost: 95,
      apply: (view: EditorView, _c: Completion, from: number, to: number) => {
        view.dispatch({
          changes: { from, to, insert: insertText },
          selection: { anchor: from + insertText.length },
          scrollIntoView: true,
        });
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

  const requestedScenes = Array.isArray(scene)
    ? scene.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : scene
      ? [scene]
      : [];

  const filteredEntries = requestedScenes.length
    ? entries.filter((entry) => {
        if (entry.scenes?.length) {
          return entry.scenes.some((sceneName) => requestedScenes.includes(sceneName));
        }
        const group = entry.group || '';
        if (!group.startsWith('scene/')) return true; // global/libs snippets
        const [_, inferredScene] = group.split('/');
        if (inferredScene) {
          return requestedScenes.includes(inferredScene);
        }
        return false;
      })
    : entries;

  const snippetLabelSet = new Set<string>();

  for (const s of filteredEntries) {
    const text = s.body;
    const baseLabel = String(s.name ?? '').trim();
    const prefixLabel = typeof s.prefix === 'string' ? s.prefix.trim() : '';
    // 为了与测试及常见补全行为一致，label 仅使用展示名（不拼接 prefix）
    const label = baseLabel || prefixLabel;
    const displayLabel = label;
    const detail = baseLabel && prefixLabel && prefixLabel !== displayLabel ? prefixLabel : undefined;
    const dedupeKey = s.ref || `${label}|${detail ?? ''}`;
    if (!displayLabel || snippetLabelSet.has(dedupeKey)) continue;
    snippetLabelSet.add(dedupeKey);
    completions.push({
      label,
      displayLabel,
      detail,
      type: 'snippet',
      info: s.description || s.ref,
      boost: 80,
      apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
          scrollIntoView: true,
        });
      },
    });
  }

  return { completions, entries: filteredEntries };
}
