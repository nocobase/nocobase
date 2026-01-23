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
  const toInfo = (doc: any) => {
    if (typeof doc === 'string') return doc;
    if (!doc || typeof doc !== 'object') return String(doc ?? '');
    const description = doc.description ?? doc.detail ?? doc.type ?? '';
    const params = Array.isArray(doc.params) ? doc.params : [];
    const returns = doc.returns;
    const ref = doc.ref;
    const disabled = doc.disabled;
    const disabledReason = doc.disabledReason;

    const formatRef = (v: any): string => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') {
        const url = typeof v.url === 'string' ? v.url : '';
        const title = typeof v.title === 'string' ? v.title : '';
        if (title && url) return `${title}: ${url}`;
        return url || title;
      }
      return String(v);
    };

    const formatParam = (p: any): string => {
      if (!p || typeof p !== 'object') return '';
      const name = typeof p.name === 'string' ? p.name : '';
      if (!name) return '';
      const type = typeof p.type === 'string' ? p.type : '';
      const optional = p.optional ? '?' : '';
      const def =
        typeof p.default === 'undefined'
          ? ''
          : ` = ${typeof p.default === 'string' ? JSON.stringify(p.default) : String(p.default)}`;
      const desc = typeof p.description === 'string' ? p.description : '';
      const sig = `${name}${optional}${type ? `: ${type}` : ''}${def}`;
      return desc ? `${sig} - ${desc}` : sig;
    };

    const formatReturn = (r: any): string => {
      if (!r || typeof r !== 'object') return '';
      const type = typeof r.type === 'string' ? r.type : '';
      const desc = typeof r.description === 'string' ? r.description : '';
      if (type && desc) return `${type} - ${desc}`;
      return type || desc;
    };

    const examples = Array.isArray(doc.examples) ? doc.examples.filter((x) => typeof x === 'string' && x.trim()) : [];
    const lines: string[] = [];
    if (typeof description === 'string' && description.trim()) lines.push(description);
    if (params.length) {
      const ps = params.map(formatParam).filter(Boolean);
      if (ps.length) lines.push('Params:', ...ps.map((x) => `- ${x}`));
    }
    const ret = formatReturn(returns);
    if (ret) lines.push('Returns:', `- ${ret}`);
    const refText = formatRef(ref);
    if (refText) lines.push('Ref:', `- ${refText}`);
    if (disabled) {
      const reason = typeof disabledReason === 'string' ? disabledReason : '';
      lines.push('Disabled:', `- ${reason || 'true'}`);
    }
    if (examples.length) lines.push('Examples:', ...examples);
    if (!lines.length) return '';
    return lines.join('\n');
  };

  const toTitle = (node: any) => {
    try {
      return String(node?.title ?? '');
    } catch (_) {
      return '';
    }
  };

  const resolveMetaNodes = async (maybe: any): Promise<any[]> => {
    if (!maybe) return [];
    if (typeof maybe === 'function') {
      try {
        const v = await maybe();
        return Array.isArray(v) ? v : [];
      } catch (_) {
        return [];
      }
    }
    return Array.isArray(maybe) ? maybe : [];
  };

  const resolveChildren = async (node: any): Promise<any[]> => {
    if (!node) return [];
    return resolveMetaNodes(node.children);
  };

  const buildAwaitedPopupExpr = (paths: string[]) => {
    // Use ctx.getVar('ctx.popup') for consistent and safe access (avoid async traps).
    if (!paths?.length || paths[0] !== 'popup') return `ctx.${(paths || []).join('.')}`;
    if (paths.length === 1) return "await ctx.getVar('ctx.popup')";
    const rest = paths.slice(1);
    return rest.reduce((acc, seg) => `${acc}?.${seg}`, "(await ctx.getVar('ctx.popup'))");
  };

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
  let infos: any = null;
  try {
    if (hostCtx && typeof (hostCtx as any).getInfos === 'function') {
      infos = await (hostCtx as any).getInfos({ version });
    }
  } catch (_) {
    infos = null;
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
  const infosApis = (infos as any)?.apis;
  const legacyInfosApis =
    (infos as any)?.properties || (infos as any)?.methods
      ? { ...((infos as any)?.properties || {}), ...normalizeMethodsRecord((infos as any)?.methods) }
      : null;
  const apisSource = infosApis || legacyInfosApis || docApis || {};
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

  // When we use ctx.getInfos() as source, it may no longer carry `hidden` definitions.
  // Pre-compute hidden path prefixes from the RunJS doc so meta-derived completions can still be filtered.
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
      const isPopupPath = root === 'popup';
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
      const isCallable = !isPopupPath && isFunctionLikeDocNode(value, completionSpec);
      const insertText =
        completionSpec?.insertText ??
        (isPopupPath ? buildAwaitedPopupExpr(path) : isCallable ? `${ctxLabel}()` : undefined);
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
        info: toInfo(value),
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

  // Build additional completions from FlowContext variable meta (record/formValues/popup...).
  // This is especially useful for ctx.record.<field> and ctx.formValues.<field> where fields are dynamic.
  try {
    if (hostCtx && typeof hostCtx.getPropertyMetaTree === 'function') {
      const popupDecision = await resolveHiddenDecision((doc as any)?.properties?.popup, 'p:popup', ['popup']);
      const roots = popupDecision.hideSelf ? ['record', 'formValues'] : ['record', 'formValues', 'popup'];
      const maxDepthAfterRoot = 2; // record.xxx(.yyy) / formValues.xxx(.yyy) / popup.record.xxx
      const maxTotal = 240;
      let added = 0;

      const addMetaCompletion = (node: any) => {
        if (!node?.paths?.length) return;
        const paths: string[] = Array.isArray(node.paths) ? node.paths.map(String) : [];
        if (!paths.length) return;
        const root = paths[0];
        if (!roots.includes(root)) return;
        const depthAfterRoot = Math.max(0, paths.length - 1);
        if (depthAfterRoot > maxDepthAfterRoot) return;
        const label = `ctx.${paths.join('.')}`;
        if (isHiddenByPaths(label)) return;
        // Avoid flooding with too many meta-derived entries.
        if (added >= maxTotal) return;

        const info = toTitle(node) || label;
        const insertText = root === 'popup' ? buildAwaitedPopupExpr(paths) : label;
        completions.push({
          label,
          type: 'property',
          detail: root === 'popup' ? 'popup (getVar)' : 'context value',
          info,
          boost: 70,
          apply: (view: EditorView, _c: Completion, from: number, to: number) => {
            view.dispatch({
              changes: { from, to, insert: insertText },
              selection: { anchor: from + insertText.length },
              scrollIntoView: true,
            });
          },
        } as Completion);
        added += 1;
      };

      const walk = async (nodes: any[], depthAfterRoot: number) => {
        for (const n of nodes) {
          addMetaCompletion(n);
          if (added >= maxTotal) return;
          if (depthAfterRoot >= maxDepthAfterRoot) continue;
          const children = await resolveChildren(n);
          if (children.length) {
            await walk(children, depthAfterRoot + 1);
            if (added >= maxTotal) return;
          }
        }
      };

      for (const root of roots) {
        if (added >= maxTotal) break;
        const maybe = hostCtx.getPropertyMetaTree(`{{ ctx.${root} }}`);
        const nodes = await resolveMetaNodes(maybe);
        await walk(nodes, 1);
      }
    }
  } catch (_) {
    // ignore meta completion failures
  }

  return { completions, entries: filteredEntries };
}
