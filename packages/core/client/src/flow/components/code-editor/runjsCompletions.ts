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
import { formatDocInfo } from './formatDocInfo';

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
  const isFunctionLikeDocNode = (node: any, completionSpec: any): boolean => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
    const type = typeof (node as any).type === 'string' ? String((node as any).type) : '';
    if (type === 'function' || type === 'method') return true;
    if (Array.isArray((node as any).params) && (node as any).params.length) return true;
    if ((node as any).returns) return true;

    // Heuristic: if completion.insertText looks like a ctx.<...>(...) call, treat it as callable.
    const insertText = completionSpec?.insertText;
    if (typeof insertText === 'string' && /\bctx\.[\w$.]+\s*\(/.test(insertText)) return true;

    return false;
  };

  // Ensure RunJS contexts are registered (lazy, avoids static cycles)
  try {
    await setupRunJSContexts();
  } catch (_) {
    // ignore if setup fails
  }
  // 当 hostCtx 不存在时，传入空对象以获取通用（*）上下文的文档
  const doc = getRunJSDocFor((hostCtx as any) || ({} as any), { version });
  let apiInfos: any = null;
  try {
    if (hostCtx && typeof (hostCtx as any).getApiInfos === 'function') {
      apiInfos = await (hostCtx as any).getApiInfos({ version });
    }
  } catch (_) {
    apiInfos = null;
  }
  const normalizeMethodsRecord = (methods: any): Record<string, any> => {
    const src = methods && typeof methods === 'object' ? methods : {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      if (typeof v === 'string') out[k] = { description: v, type: 'function' };
      else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = { ...(v as any), type: 'function' };
      else out[k] = v as any;
    }
    return out;
  };
  const docApis = { ...((doc as any)?.properties || {}), ...normalizeMethodsRecord((doc as any)?.methods) };
  const apisSource = { ...(apiInfos && typeof apiInfos === 'object' ? apiInfos : {}), ...(docApis || {}) };
  const completions: Completion[] = [];
  const priorityRoots = new Set(['api', 'resource', 'viewer', 'record', 'formValues', 'popup']);
  const hiddenDecisionCache = new Map<string, { hideSelf: boolean; hideSubpaths: string[] }>();
  const hiddenPathPrefixes = new Set<string>();

  const isHiddenByPaths = (label: string) => {
    if (!label || typeof label !== 'string') return false;
    const normalized = label.endsWith('()') ? label.slice(0, -2) : label;
    if (!normalized.startsWith('ctx.')) return false;
    const parts = normalized.split('.').filter(Boolean);
    if (parts[0] !== 'ctx') return false;
    while (parts.length) {
      const prefix = parts.join('.');
      if (hiddenPathPrefixes.has(prefix)) return true;
      parts.pop();
    }
    return false;
  };

  const resolveHiddenDecision = async (
    node: any,
    cacheKey: string,
    parentPath: string[],
  ): Promise<{ hideSelf: boolean; hideSubpaths: string[] }> => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return { hideSelf: false, hideSubpaths: [] };
    if (hiddenDecisionCache.has(cacheKey)) return hiddenDecisionCache.get(cacheKey) as any;

    const raw = (node as any).hidden;
    let hideSelf = false;
    let list: any = [];
    try {
      if (typeof raw === 'boolean') hideSelf = raw;
      else if (Array.isArray(raw)) list = raw;
      else if (typeof raw === 'function') {
        const v = await raw(hostCtx);
        if (typeof v === 'boolean') hideSelf = v;
        else if (Array.isArray(v)) list = v;
      }
    } catch (_) {
      // Fail-open: if we cannot determine, do not hide.
      hideSelf = false;
      list = [];
    }

    const hideSubpaths: string[] = [];
    if (Array.isArray(list)) {
      for (const p of list) {
        if (typeof p !== 'string') continue;
        const s = p.trim();
        if (!s) continue;
        // Only relative paths are supported. Ignore "ctx.xxx" absolute style to avoid ambiguity.
        if (s === 'ctx' || s.startsWith('ctx.')) continue;
        if (/\s/.test(s)) continue;
        const segs = s
          .split('.')
          .map((x) => x.trim())
          .filter(Boolean);
        if (!segs.length) continue;
        if (segs[0] === 'ctx') continue;
        hideSubpaths.push(['ctx', ...parentPath, ...segs].join('.'));
      }
    }

    const decision = { hideSelf, hideSubpaths };
    hiddenDecisionCache.set(cacheKey, decision);
    return decision;
  };

  // When we merge ctx.getApiInfos() into the source, it may no longer carry `hidden` definitions.
  // Pre-compute hidden path prefixes from the RunJS doc so completions can still be filtered.
  const precomputeHiddenPrefixesFromDoc = async (
    props: Record<string, any> | undefined,
    parentPath: string[] = [],
  ): Promise<void> => {
    if (!props) return;
    for (const [key, value] of Object.entries(props)) {
      const path = [...parentPath, key];
      const ctxLabel = `ctx.${path.join('.')}`;
      if (isHiddenByPaths(ctxLabel)) continue;
      const decision = await resolveHiddenDecision(value, `p:${path.join('.')}`, path);
      if (decision.hideSelf) continue;
      for (const prefix of decision.hideSubpaths) hiddenPathPrefixes.add(prefix);
      let children: any;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        children = (value as any).properties as Record<string, any> | undefined;
      }
      if (children && typeof children === 'object') {
        await precomputeHiddenPrefixesFromDoc(children, path);
      }
    }
  };

  await precomputeHiddenPrefixesFromDoc((doc as any)?.properties || {});

  if (doc?.label || doc?.properties || doc?.methods) {
    completions.push({
      label: 'ctx',
      type: 'class',
      detail: 'FlowRunJSContext',
      info: doc?.label || 'RunJS context',
      boost: 115,
    } as Completion);
  }

  const collectProperties = async (props: Record<string, any> | undefined, parentPath: string[] = []) => {
    if (!props) return;
    for (const [key, value] of Object.entries(props)) {
      const path = [...parentPath, key];
      const ctxLabel = `ctx.${path.join('.')}`;
      const depth = path.length;
      const root = path[0];
      if (isHiddenByPaths(ctxLabel)) continue;
      const decision = await resolveHiddenDecision(value, `p:${path.join('.')}`, path);
      if (decision.hideSelf) continue;
      for (const prefix of decision.hideSubpaths) hiddenPathPrefixes.add(prefix);

      let detail: string | undefined;
      let children: Record<string, any> | undefined;
      let completionSpec: any;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        detail = value.detail ?? value.type ?? 'ctx property';
        completionSpec = value.completion;
        children = value.properties as Record<string, any> | undefined;
      }
      const isCallable = isFunctionLikeDocNode(value, completionSpec);
      const insertText =
        completionSpec?.insertText ??
        (root === 'popup' ? `await ctx.getVar('${ctxLabel}')` : isCallable ? `${ctxLabel}()` : undefined);
      const apply = insertText
        ? (view: EditorView, _completion: Completion, from: number, to: number) => {
            view.dispatch({
              changes: { from, to, insert: insertText },
              selection: { anchor: from + insertText.length },
              scrollIntoView: true,
            });
          }
        : undefined;
      const label = isCallable ? `${ctxLabel}()` : ctxLabel;
      completions.push({
        label,
        type: isCallable ? 'function' : 'property',
        info: formatDocInfo(value),
        detail: detail || (isCallable ? 'ctx function' : 'ctx property'),
        boost: Math.max(90 - depth * 5, 10) + (priorityRoots.has(root) ? 10 : 0),
        apply,
      } as Completion);
      if (children) {
        await collectProperties(children, path);
      }
    }
  };

  await collectProperties(apisSource || {});
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

  // Dedupe by label and keep last definition.
  const seenLabels = new Set<string>();
  const dedupedCompletions: Completion[] = [];
  for (let i = completions.length - 1; i >= 0; i--) {
    const c: any = completions[i];
    const label = c?.label;
    if (typeof label !== 'string' || !label) {
      dedupedCompletions.push(completions[i]);
      continue;
    }
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    dedupedCompletions.push(completions[i]);
  }
  dedupedCompletions.reverse();

  return { completions: dedupedCompletions, entries: filteredEntries };
}
