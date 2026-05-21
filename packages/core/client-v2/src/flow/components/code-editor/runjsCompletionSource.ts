/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import { isHtmlTemplateContext } from './htmlCompletion';
import { createJsxCompletion } from './jsxCompletion';

const WORD_RE = /[$_\p{Letter}][$_\p{Letter}\p{Number}.-]*/u;

type CreateRunJSCompletionSourceOptions = {
  hostCtx: any;
  staticOptions?: Completion[];
  /**
   * Roots that should use FlowContext meta tree to provide deep completions.
   * When omitted/empty, all `ctx.*` roots are enabled.
   */
  metaRoots?: string[];
};

const isPromiseLike = (v: any): v is Promise<any> =>
  !!v && (typeof v === 'object' || typeof v === 'function') && typeof (v as any).then === 'function';

export function createRunJSCompletionSource({
  hostCtx,
  staticOptions,
  metaRoots,
}: CreateRunJSCompletionSourceOptions): CompletionSource {
  const optionsSnapshot: Completion[] = Array.isArray(staticOptions) ? staticOptions : [];
  const jsxCompletion = createJsxCompletion();
  const enabledRoots =
    Array.isArray(metaRoots) && metaRoots.length > 0 ? new Set(metaRoots.map((r) => String(r))) : null;

  const metaChildrenCache = new Map<string, Promise<any[]>>();
  const rootChildrenCache = new Map<string, Promise<any[]>>();
  const popupAvailableCache: { promise?: Promise<boolean> } = {};

  const translateText = (s: any): string => {
    if (typeof s !== 'string' || !s) return '';
    try {
      const t = (hostCtx as any)?.t;
      return typeof t === 'function' ? String(t(s)) : s;
    } catch (_) {
      return s;
    }
  };

  const toText = (v: any): string => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return String(v);
    return '';
  };

  const normalizeLabel = (label: string): string => (typeof label === 'string' ? label.trim() : '');

  const isInStringLiteral = (doc: any, pos: number): boolean => {
    try {
      const end = typeof pos === 'number' && Number.isFinite(pos) ? Math.max(0, Math.floor(pos)) : 0;
      const start = Math.max(0, end - 4000);
      const src = doc?.sliceString ? String(doc.sliceString(start, end) || '') : '';
      if (!src) return false;

      let inSingle = false;
      let inDouble = false;
      let inTemplate = false;
      let inLineComment = false;
      let inBlockComment = false;
      let escaped = false;

      for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        const next = src[i + 1];

        if (inLineComment) {
          if (ch === '\n') inLineComment = false;
          continue;
        }
        if (inBlockComment) {
          if (ch === '*' && next === '/') {
            inBlockComment = false;
            i++;
          }
          continue;
        }

        if (inSingle) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (ch === "'") inSingle = false;
          continue;
        }

        if (inDouble) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (ch === '"') inDouble = false;
          continue;
        }

        if (inTemplate) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (ch === '`') inTemplate = false;
          // NOTE: We intentionally do not try to parse `${...}` back into JS mode here.
          continue;
        }

        // Not in string/comment: detect comment starts
        if (ch === '/' && next === '/') {
          inLineComment = true;
          i++;
          continue;
        }
        if (ch === '/' && next === '*') {
          inBlockComment = true;
          i++;
          continue;
        }

        // Detect string starts
        if (ch === "'") {
          inSingle = true;
          continue;
        }
        if (ch === '"') {
          inDouble = true;
          continue;
        }
        if (ch === '`') {
          inTemplate = true;
          continue;
        }
      }

      return inSingle || inDouble || inTemplate;
    } catch (_) {
      return false;
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
    if (!node?.children) return [];
    if (typeof node.children === 'function') {
      try {
        const v = await node.children();
        const list = Array.isArray(v) ? v : [];
        node.children = list;
        return list;
      } catch (_) {
        return [];
      }
    }
    return Array.isArray(node.children) ? node.children : [];
  };

  const isPrivatePath = (paths: string[]): boolean => paths.some((p) => typeof p === 'string' && p.startsWith('_'));

  const isHidden = async (node: any): Promise<boolean> => {
    try {
      const raw = node?.hidden;
      const v = typeof raw === 'function' ? raw() : raw;
      const resolved = isPromiseLike(v) ? await v : v;
      return !!resolved;
    } catch (_) {
      // fail-open: if we cannot determine, do not hide
      return false;
    }
  };

  const getDisabled = async (node: any): Promise<{ disabled: boolean; reason?: string }> => {
    try {
      const raw = node?.disabled;
      const v = typeof raw === 'function' ? raw() : raw;
      const resolved = isPromiseLike(v) ? await v : v;
      const disabled = !!resolved;
      if (!disabled) return { disabled: false };

      const rawReason = node?.disabledReason;
      const reasonValue = typeof rawReason === 'function' ? rawReason() : rawReason;
      const resolvedReason = isPromiseLike(reasonValue) ? await reasonValue : reasonValue;
      const reasonText = translateText(toText(resolvedReason));
      return { disabled: true, reason: reasonText || undefined };
    } catch (_) {
      return { disabled: false };
    }
  };

  const resolvePopupAvailable = async (): Promise<boolean> => {
    if (popupAvailableCache.promise) return popupAvailableCache.promise;
    popupAvailableCache.promise = (async () => {
      try {
        const raw = (hostCtx as any)?.popup;
        const v = isPromiseLike(raw) ? await raw : raw;
        return !!v?.uid;
      } catch (_) {
        // fail-open: keep popup completions
        return true;
      }
    })();
    return popupAvailableCache.promise;
  };

  const getMetaChildrenForExpr = async (expr: string): Promise<any[]> => {
    if (!hostCtx || typeof (hostCtx as any).getPropertyMetaTree !== 'function') return [];
    if (metaChildrenCache.has(expr)) return (await metaChildrenCache.get(expr)) as any[];
    const p = (async () => {
      try {
        const segments = String(expr || '')
          .split('.')
          .map((x) => x.trim())
          .filter(Boolean);
        if (!segments.length || segments[0] !== 'ctx') return [];
        if (segments.length < 2) return [];

        const root = segments[1];
        if (!root) return [];
        if (root.startsWith('_')) return [];
        if (enabledRoots && !enabledRoots.has(root)) return [];

        if (root === 'popup') {
          const available = await resolvePopupAvailable();
          if (!available) return [];
        }

        const getRootChildren = async (): Promise<any[]> => {
          if (rootChildrenCache.has(root)) return (await rootChildrenCache.get(root)) as any[];
          const rp = (async () => {
            try {
              const maybeRoot = (hostCtx as any).getPropertyMetaTree(`{{ ctx.${root} }}`);
              return await resolveMetaNodes(maybeRoot);
            } catch (_) {
              return [];
            }
          })();
          rootChildrenCache.set(root, rp);
          return await rp;
        };

        const subPath = segments.slice(2);
        let list = await getRootChildren();
        if (!subPath.length) return list;

        for (const seg of subPath) {
          if (!seg || seg.startsWith('_')) return [];
          const found = Array.isArray(list) ? list.find((n) => String(n?.name ?? '') === seg) : null;
          if (!found) return [];
          list = await resolveChildren(found);
        }

        return Array.isArray(list) ? list : [];
      } catch (_) {
        return [];
      }
    })();
    metaChildrenCache.set(expr, p);
    return await p;
  };

  const buildMetaCompletions = async (wordText: string, pos: number, prevChar: string): Promise<Completion[]> => {
    if (!wordText || typeof wordText !== 'string') return [];
    if (!wordText.startsWith('ctx.')) return [];

    const endsWithDot = pos > 0 && prevChar === '.';
    const parts = wordText
      .split('.')
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts[0] !== 'ctx') return [];

    const parentParts = endsWithDot ? parts : parts.slice(0, -1);
    if (parentParts.length < 2) return [];

    const root = parentParts[1];
    if (!root) return [];
    if (root.startsWith('_')) return [];
    if (parentParts.some((seg, i) => i > 0 && typeof seg === 'string' && seg.startsWith('_'))) return [];
    if (enabledRoots && !enabledRoots.has(root)) return [];

    // Avoid suggesting popup.* when popup is not available.
    if (root === 'popup') {
      const available = await resolvePopupAvailable();
      if (!available) return [];
    }

    const expr = parentParts.join('.'); // e.g. 'ctx.record.roles'
    const nodes = await getMetaChildrenForExpr(expr);
    if (!nodes.length) return [];

    const metaOptions: Completion[] = [];

    for (const node of nodes) {
      const pathsRaw = Array.isArray(node?.paths) ? node.paths : [];
      const paths = pathsRaw.map((x: any) => String(x)).filter(Boolean);
      if (!paths.length) continue;
      if (isPrivatePath(paths)) continue;

      const label = `ctx.${paths.join('.')}`;
      if (!label.startsWith('ctx.')) continue;
      if (await isHidden(node)) continue;

      const title = translateText(toText(node?.title)) || translateText(toText(node?.name)) || paths[paths.length - 1];
      const parentTitles = Array.isArray(node?.parentTitles)
        ? node.parentTitles.map((x: any) => translateText(toText(x))).filter(Boolean)
        : [];
      const breadcrumb = [...parentTitles, title].filter(Boolean).join(' / ');

      const { disabled, reason } = await getDisabled(node);
      const infoLines: string[] = [];
      if (breadcrumb) infoLines.push(breadcrumb);
      if (disabled) infoLines.push('Disabled:', `- ${reason || 'true'}`);
      const info = infoLines.join('\n') || breadcrumb || title || label;

      metaOptions.push({
        label,
        type: 'property',
        detail: breadcrumb || 'context value',
        info,
        boost: 110,
        apply: (view: any, _completion: any, from: number, to: number) => {
          const inString = isInStringLiteral(view?.state?.doc, from);
          const insert = inString ? label : `await ctx.getVar('${label}')`;
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + insert.length },
            scrollIntoView: true,
          });
        },
      } as Completion);
    }

    return metaOptions;
  };

  const dedupeByLabelKeepLast = (list: Completion[]): Completion[] => {
    const seen = new Set<string>();
    const out: Completion[] = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const c: any = list[i];
      const label = typeof c?.label === 'string' ? normalizeLabel(c.label) : '';
      if (label) {
        if (seen.has(label)) continue;
        seen.add(label);
      }
      out.push(list[i]);
    }
    out.reverse();
    return out;
  };

  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    // Avoid mixing ctx completions into HTML template or JSX tag completions.
    try {
      if (isHtmlTemplateContext(context)) return null;
    } catch (_) {
      // ignore
    }
    try {
      if (jsxCompletion(context)) return null;
    } catch (_) {
      // ignore
    }

    const word = context.matchBefore(WORD_RE);
    if (!word) {
      if (context.explicit) {
        return { from: context.pos, to: context.pos, options: optionsSnapshot };
      }
      return null;
    }
    if (word.from === word.to && !context.explicit) return null;

    const prevChar = context.pos > 0 ? context.state.doc.sliceString(context.pos - 1, context.pos) : '';
    let metaOptions: Completion[] = [];
    try {
      metaOptions = await buildMetaCompletions(word.text, context.pos, prevChar);
    } catch (_) {
      metaOptions = [];
    }

    const getMetaRootFromWord = (wordText: string): string | undefined => {
      if (!wordText || typeof wordText !== 'string') return undefined;
      if (!wordText.startsWith('ctx.')) return undefined;
      const parts = wordText
        .split('.')
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts[0] !== 'ctx') return undefined;
      const root = parts[1];
      return root && typeof root === 'string' ? root : undefined;
    };

    // When meta tree provides deep completions for `ctx.<root>.*`, suppress snapshot
    // property completions under that root to avoid duplicate/less-friendly entries.
    const metaRoot = metaOptions.length > 0 ? getMetaRootFromWord(word.text) : undefined;
    const filteredSnapshot =
      metaRoot && metaRoot.length
        ? optionsSnapshot.filter((c: any) => {
            const label = typeof c?.label === 'string' ? normalizeLabel(c.label) : '';
            if (!label) return true;
            if (!label.startsWith('ctx.')) return true;
            if (label === 'ctx') return true;
            const isFn = c?.type === 'function' || label.endsWith('()');
            if (isFn) return true;
            if (label === `ctx.${metaRoot}`) return false;
            if (label.startsWith(`ctx.${metaRoot}.`)) return false;
            return true;
          })
        : optionsSnapshot;

    const merged =
      metaOptions.length > 0 ? dedupeByLabelKeepLast([...filteredSnapshot, ...metaOptions]) : optionsSnapshot;

    return {
      from: word.from,
      to: word.to,
      options: merged,
    };
  };
}
