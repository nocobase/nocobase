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
import {
  getRunJSDocFor,
  setupRunJSContexts,
  listSnippetsForContext,
  type RunJSDocCompletionDoc,
} from '@nocobase/flow-engine';
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

type StaticCompletionEntry = {
  label: string;
  type: Completion['type'];
  detail?: string;
  info?: string;
  insertText?: string;
  boost?: number;
  requires?: Array<'element'>;
};

const NON_ELEMENT_COMPLETION_SCENES = new Set(['eventFlow', 'formValue', 'linkage']);

const normalizeScenes = (scene?: string | string[]): string[] =>
  (Array.isArray(scene) ? scene : scene ? [scene] : [])
    .map((sceneName) => (typeof sceneName === 'string' ? sceneName.trim() : ''))
    .filter(Boolean);

const hasRunJSElementContext = (doc: any, apiInfos: any, requestedScenes: string[]): boolean => {
  if (requestedScenes.some((sceneName) => NON_ELEMENT_COMPLETION_SCENES.has(sceneName))) return false;
  return !!((doc as any)?.properties?.element || (apiInfos as any)?.element);
};

const usesCtxElement = (text?: string): boolean => typeof text === 'string' && /\bctx\.element\b/.test(text);

const satisfiesCompletionRequirements = (
  completionSpec: Pick<RunJSDocCompletionDoc, 'requires'> | undefined,
  capabilities: { element: boolean },
): boolean => {
  if (!completionSpec?.requires?.length) return true;
  return completionSpec.requires.every((requirement) => requirement !== 'element' || capabilities.element);
};

const createApply = (insertText?: string) => (view: EditorView, _completion: Completion, from: number, to: number) => {
  if (!insertText) return;
  view.dispatch({
    changes: { from, to, insert: insertText },
    selection: { anchor: from + insertText.length },
    scrollIntoView: true,
  });
};

const staticEntry = ({ label, type, detail, info, insertText, boost = 85 }: StaticCompletionEntry): Completion =>
  ({
    label,
    type,
    detail,
    info,
    boost,
    apply: insertText ? createApply(insertText) : undefined,
  }) as Completion;

const BROWSER_GLOBAL_COMPLETIONS: StaticCompletionEntry[] = [
  {
    label: 'window.open()',
    type: 'function',
    detail: '(url: string, target?: string, features?: string) => Window | null',
    info: 'Open a URL in a new tab or window.',
    insertText: "window.open('https://example.com')",
    boost: 105,
  },
  {
    label: 'window.addEventListener()',
    type: 'function',
    detail: '(type: string, listener: EventListener) => void',
    info: 'Attach a listener to the browser window.',
    insertText: "window.addEventListener('resize', () => {})",
    boost: 105,
  },
  {
    label: 'window.setTimeout()',
    type: 'function',
    detail: '(handler: Function, timeout?: number) => number',
    insertText: 'window.setTimeout(() => {}, 0)',
    boost: 100,
  },
  {
    label: 'window.clearTimeout()',
    type: 'function',
    detail: '(id?: number) => void',
    insertText: 'window.clearTimeout(timer)',
    boost: 100,
  },
  {
    label: 'window.setInterval()',
    type: 'function',
    detail: '(handler: Function, timeout?: number) => number',
    insertText: 'window.setInterval(() => {}, 1000)',
    boost: 100,
  },
  {
    label: 'window.clearInterval()',
    type: 'function',
    detail: '(id?: number) => void',
    insertText: 'window.clearInterval(timer)',
    boost: 100,
  },
  {
    label: 'window.FormData',
    type: 'class',
    detail: 'FormData constructor',
    insertText: 'new window.FormData()',
    boost: 95,
  },
  { label: 'window.Blob', type: 'class', detail: 'Blob constructor', insertText: 'window.Blob', boost: 95 },
  { label: 'window.URL', type: 'class', detail: 'URL constructor', insertText: 'window.URL', boost: 95 },
  { label: 'window.location.origin', type: 'property', detail: 'string', boost: 100 },
  { label: 'window.location.protocol', type: 'property', detail: 'string', boost: 100 },
  { label: 'window.location.host', type: 'property', detail: 'string', boost: 100 },
  { label: 'window.location.hostname', type: 'property', detail: 'string', boost: 100 },
  { label: 'window.location.port', type: 'property', detail: 'string', boost: 100 },
  { label: 'window.location.pathname', type: 'property', detail: 'string', boost: 100 },
  { label: 'window.location.href', type: 'property', detail: 'string', boost: 100 },
  {
    label: 'window.location.assign()',
    type: 'function',
    detail: '(url: string) => void',
    insertText: "window.location.assign('/path')",
    boost: 105,
  },
  {
    label: 'window.location.replace()',
    type: 'function',
    detail: '(url: string) => void',
    insertText: "window.location.replace('/path')",
    boost: 105,
  },
  {
    label: 'window.location.reload()',
    type: 'function',
    detail: '() => void',
    insertText: 'window.location.reload()',
    boost: 110,
  },
  {
    label: 'window.location.href =',
    type: 'snippet',
    detail: 'string assignment',
    info: 'Assign a new browser location.',
    insertText: "window.location.href = '/path'",
    boost: 95,
  },
  { label: 'document.body', type: 'property', detail: 'HTMLElement | null', boost: 100 },
  { label: 'document.cookie', type: 'property', detail: 'string', boost: 100 },
  {
    label: 'document.createElement()',
    type: 'function',
    detail: '(tagName: string) => HTMLElement',
    insertText: "document.createElement('div')",
    boost: 105,
  },
  {
    label: 'document.querySelector()',
    type: 'function',
    detail: '(selectors: string) => Element | null',
    insertText: "document.querySelector('.selector')",
    boost: 105,
  },
  {
    label: 'document.querySelectorAll()',
    type: 'function',
    detail: '(selectors: string) => NodeListOf<Element>',
    insertText: "document.querySelectorAll('.selector')",
    boost: 105,
  },
  {
    label: 'document.getElementById()',
    type: 'function',
    detail: '(elementId: string) => HTMLElement | null',
    insertText: "document.getElementById('id')",
    boost: 105,
  },
  {
    label: 'navigator.clipboard.writeText()',
    type: 'function',
    detail: '(text: string) => Promise<void>',
    insertText: "await navigator.clipboard.writeText('text')",
    boost: 105,
  },
  { label: 'navigator.onLine', type: 'property', detail: 'boolean', boost: 100 },
  { label: 'navigator.language', type: 'property', detail: 'string', boost: 100 },
  { label: 'navigator.languages', type: 'property', detail: 'string[]', boost: 100 },
  { label: 'navigator.userAgent', type: 'property', detail: 'string', boost: 100 },
  { label: 'navigator.geolocation', type: 'property', detail: 'Geolocation', boost: 100 },
  {
    label: 'console.log()',
    type: 'function',
    detail: '(...args: any[]) => void',
    insertText: "console.log('message')",
    boost: 95,
  },
  {
    label: 'console.info()',
    type: 'function',
    detail: '(...args: any[]) => void',
    insertText: "console.info('message')",
    boost: 95,
  },
  {
    label: 'console.warn()',
    type: 'function',
    detail: '(...args: any[]) => void',
    insertText: "console.warn('message')",
    boost: 95,
  },
  {
    label: 'console.error()',
    type: 'function',
    detail: '(...args: any[]) => void',
    insertText: "console.error('message')",
    boost: 95,
  },
  {
    label: 'setTimeout()',
    type: 'function',
    detail: '(handler: Function, timeout?: number) => number',
    insertText: 'setTimeout(() => {}, 0)',
    boost: 95,
  },
  {
    label: 'clearTimeout()',
    type: 'function',
    detail: '(id?: number) => void',
    insertText: 'clearTimeout(timer)',
    boost: 95,
  },
  {
    label: 'setInterval()',
    type: 'function',
    detail: '(handler: Function, timeout?: number) => number',
    insertText: 'setInterval(() => {}, 1000)',
    boost: 95,
  },
  {
    label: 'clearInterval()',
    type: 'function',
    detail: '(id?: number) => void',
    insertText: 'clearInterval(timer)',
    boost: 95,
  },
  { label: 'Blob', type: 'class', detail: 'Blob constructor', insertText: 'Blob', boost: 90 },
  { label: 'URL', type: 'class', detail: 'URL constructor', insertText: 'URL', boost: 90 },
];

const RUNJS_RUNTIME_COMPLETIONS: StaticCompletionEntry[] = [
  {
    label: 'ctx.runjs()',
    type: 'function',
    detail: '(code: string, variables?: object, options?: object) => Promise<any>',
    insertText: "await ctx.runjs('return 1')",
    boost: 105,
  },
  {
    label: 'ctx.loadCSS()',
    type: 'function',
    detail: '(href: string) => Promise<void>',
    insertText: "await ctx.loadCSS('https://example.com/style.css')",
    boost: 105,
  },
  {
    label: 'ctx.previewRunJS()',
    type: 'function',
    detail: '(code: string, version?: string) => Promise<PreviewRunJSResult>',
    insertText: "await ctx.previewRunJS('console.log(1)', 'v2')",
    boost: 105,
  },
  {
    label: 'ctx.requireAsync()',
    type: 'function',
    detail: '(url: string) => Promise<any>',
    insertText: "const lib = await ctx.requireAsync('https://cdn.example.com/lib.umd.js')",
    boost: 100,
  },
  {
    label: 'ctx.importAsync()',
    type: 'function',
    detail: '(url: string) => Promise<any>',
    insertText: "const mod = await ctx.importAsync('lodash-es')",
    boost: 100,
  },
  {
    label: 'ctx.t()',
    type: 'function',
    detail: '(key: string, options?: object) => string',
    insertText: "ctx.t('Hello')",
    boost: 100,
  },
  {
    label: 'ctx.resolveJsonTemplate()',
    type: 'function',
    detail: '(template: any) => Promise<any>',
    insertText: "await ctx.resolveJsonTemplate({ value: '{{ctx.record.id}}' })",
    boost: 100,
  },
  {
    label: 'ctx.sql.run()',
    type: 'function',
    detail: '(sql: string, options?: SQLRunOptions) => Promise<any>',
    insertText: "await ctx.sql.run('SELECT 1', { type: 'selectRows' })",
    boost: 100,
  },
  {
    label: 'ctx.sql.save()',
    type: 'function',
    detail: '(data: { uid: string; sql: string; dataSourceKey?: string }) => Promise<void>',
    insertText: "await ctx.sql.save({ uid: 'sql-uid', sql: 'SELECT 1' })",
    boost: 95,
  },
  {
    label: 'ctx.sql.runById()',
    type: 'function',
    detail: '(uid: string, options?: SQLRunOptions) => Promise<any>',
    insertText: "await ctx.sql.runById('sql-uid', { type: 'selectRows' })",
    boost: 100,
  },
  {
    label: 'ctx.sql.destroy()',
    type: 'function',
    detail: '(uid: string) => Promise<void>',
    insertText: "await ctx.sql.destroy('sql-uid')",
    boost: 95,
  },
  {
    label: 'ctx.logger.info()',
    type: 'function',
    detail: 'Pino logger info',
    insertText: "ctx.logger.info({ foo: 1 }, 'message')",
    boost: 95,
  },
  {
    label: 'ctx.logger.warn()',
    type: 'function',
    detail: 'Pino logger warn',
    insertText: "ctx.logger.warn({ foo: 1 }, 'message')",
    boost: 95,
  },
  {
    label: 'ctx.logger.error()',
    type: 'function',
    detail: 'Pino logger error',
    insertText: "ctx.logger.error({ err }, 'message')",
    boost: 95,
  },
  {
    label: 'ctx.logger.debug()',
    type: 'function',
    detail: 'Pino logger debug',
    insertText: "ctx.logger.debug({ foo: 1 }, 'message')",
    boost: 95,
  },
  {
    label: 'ctx.logger.child()',
    type: 'function',
    detail: '(bindings: object) => Logger',
    insertText: "ctx.logger.child({ module: 'runjs' })",
    boost: 90,
  },
  {
    label: 'ctx.libs.React.createElement()',
    type: 'function',
    detail: 'React.createElement',
    insertText: "ctx.libs.React.createElement('div', null, 'Hello')",
    boost: 90,
  },
  {
    label: 'ctx.libs.React.useState()',
    type: 'function',
    detail: 'React.useState',
    insertText: 'ctx.libs.React.useState(initialValue)',
    boost: 90,
  },
  {
    label: 'ctx.libs.React.useEffect()',
    type: 'function',
    detail: 'React.useEffect',
    insertText: 'ctx.libs.React.useEffect(() => {}, [])',
    boost: 90,
  },
  {
    label: 'ctx.libs.React.useMemo()',
    type: 'function',
    detail: 'React.useMemo',
    insertText: 'ctx.libs.React.useMemo(() => value, [])',
    boost: 85,
  },
  {
    label: 'ctx.libs.React.useCallback()',
    type: 'function',
    detail: 'React.useCallback',
    insertText: 'ctx.libs.React.useCallback(() => {}, [])',
    boost: 85,
  },
  {
    label: 'ctx.libs.ReactDOM.createRoot()',
    type: 'function',
    detail: 'ReactDOM.createRoot',
    insertText: 'ctx.libs.ReactDOM.createRoot(ctx.element.__el)',
    boost: 90,
    requires: ['element'],
  },
  { label: 'ctx.libs.antd.Button', type: 'class', detail: 'Ant Design Button', boost: 90 },
  { label: 'ctx.libs.antd.Table', type: 'class', detail: 'Ant Design Table', boost: 90 },
  { label: 'ctx.libs.antd.Form', type: 'class', detail: 'Ant Design Form', boost: 90 },
  { label: 'ctx.libs.antd.Input', type: 'class', detail: 'Ant Design Input', boost: 90 },
  { label: 'ctx.libs.antd.Select', type: 'class', detail: 'Ant Design Select', boost: 90 },
  { label: 'ctx.libs.antd.Modal', type: 'class', detail: 'Ant Design Modal', boost: 90 },
  { label: 'ctx.libs.dayjs()', type: 'function', detail: 'dayjs', insertText: 'ctx.libs.dayjs()', boost: 90 },
  {
    label: 'ctx.libs.lodash.get()',
    type: 'function',
    detail: 'lodash.get',
    insertText: "ctx.libs.lodash.get(obj, 'a.b')",
    boost: 90,
  },
  {
    label: 'ctx.libs.lodash.set()',
    type: 'function',
    detail: 'lodash.set',
    insertText: "ctx.libs.lodash.set(obj, 'a.b', value)",
    boost: 85,
  },
  {
    label: 'ctx.libs.lodash.debounce()',
    type: 'function',
    detail: 'lodash.debounce',
    insertText: 'ctx.libs.lodash.debounce(() => {}, 300)',
    boost: 85,
  },
  {
    label: 'ctx.libs.lodash.cloneDeep()',
    type: 'function',
    detail: 'lodash.cloneDeep',
    insertText: 'ctx.libs.lodash.cloneDeep(value)',
    boost: 85,
  },
  {
    label: 'ctx.libs.formula.SUM()',
    type: 'function',
    detail: 'Formula.js SUM',
    insertText: 'ctx.libs.formula.SUM(1, 2, 3)',
    boost: 85,
  },
  {
    label: 'ctx.libs.formula.AVERAGE()',
    type: 'function',
    detail: 'Formula.js AVERAGE',
    insertText: 'ctx.libs.formula.AVERAGE(1, 2, 3)',
    boost: 85,
  },
  {
    label: 'ctx.libs.math.evaluate()',
    type: 'function',
    detail: 'mathjs evaluate',
    insertText: "ctx.libs.math.evaluate('2 + 3')",
    boost: 85,
  },
  {
    label: 'ctx.libs.math.round()',
    type: 'function',
    detail: 'mathjs round',
    insertText: 'ctx.libs.math.round(value, 2)',
    boost: 85,
  },
  {
    label: 'ctx.React.createElement()',
    type: 'function',
    detail: 'React.createElement alias',
    insertText: "ctx.React.createElement('div', null, 'Hello')",
    boost: 80,
  },
  {
    label: 'ctx.ReactDOM.createRoot()',
    type: 'function',
    detail: 'ReactDOM.createRoot alias',
    insertText: 'ctx.ReactDOM.createRoot(ctx.element.__el)',
    boost: 80,
    requires: ['element'],
  },
  { label: 'ctx.antd.Button', type: 'class', detail: 'Ant Design Button alias', boost: 80 },
  { label: 'ctx.antd.Modal', type: 'class', detail: 'Ant Design Modal alias', boost: 80 },
  { label: 'ctx.dayjs()', type: 'function', detail: 'dayjs alias', insertText: 'ctx.dayjs()', boost: 80 },
];

function buildStaticRuntimeCompletions(capabilities: { element: boolean }): Completion[] {
  return [...BROWSER_GLOBAL_COMPLETIONS, ...RUNJS_RUNTIME_COMPLETIONS]
    .filter((entry) => satisfiesCompletionRequirements(entry, capabilities))
    .filter((entry) => capabilities.element || !usesCtxElement(entry.insertText))
    .map(staticEntry);
}

export async function buildRunJSCompletions(
  hostCtx: any,
  version = 'v1',
  scene?: string | string[],
): Promise<{
  completions: Completion[];
  entries: SnippetEntry[];
}> {
  const requestedScenes = normalizeScenes(scene);
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
      apiInfos = await (hostCtx as any).getApiInfos({ version, includeCompletion: true });
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
  const hasElementContext = hasRunJSElementContext(doc, apiInfos, requestedScenes);
  const completions: Completion[] = buildStaticRuntimeCompletions({ element: hasElementContext });
  const priorityRoots = new Set(['api', 'resource', 'viewer', 'record', 'formValues', 'popup']);
  const hiddenDecisionCache = new Map<string, { hideSelf: boolean; hideSubpaths: string[] }>();
  const hiddenPathPrefixes = new Set<string>();
  if (!hasElementContext) hiddenPathPrefixes.add('ctx.element');

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
      if (!satisfiesCompletionRequirements(completionSpec, { element: hasElementContext })) continue;
      if (!hasElementContext && usesCtxElement(insertText)) continue;
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
