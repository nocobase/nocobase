/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as antdIcons from '@ant-design/icons';
import { autorun } from '@formily/reactive';
import type { FlowContext } from './flowContext';

export type RunJSLibCache = 'global' | 'context';
export type RunJSLibLoader<T = any> = (ctx: FlowContext) => T | Promise<T>;

type RunJSLibRegistryEntry = {
  loader: RunJSLibLoader<unknown>;
  cache: RunJSLibCache;
};

const __runjsLibRegistry = new Map<string, RunJSLibRegistryEntry>();

const __runjsLibResolvedCache = new Map<string, unknown>();
const __runjsLibPendingCache = new Map<string, Promise<unknown>>();
const __runjsLibPendingByCtx = new WeakMap<FlowContext, Map<string, Promise<unknown>>>();

function __runjsGetPendingMapForCtx(ctx: FlowContext): Map<string, Promise<unknown>> {
  let m = __runjsLibPendingByCtx.get(ctx);
  if (!m) {
    m = new Map<string, Promise<unknown>>();
    __runjsLibPendingByCtx.set(ctx, m);
  }
  return m;
}

export function registerRunJSLib(name: string, loader: RunJSLibLoader, options?: { cache?: RunJSLibCache }): void {
  if (typeof name !== 'string' || !name) return;
  if (typeof loader !== 'function') return;
  __runjsLibRegistry.set(name, { loader, cache: options?.cache || 'global' });
  // allow re-register to take effect on next ensure
  __runjsLibResolvedCache.delete(name);
  __runjsLibPendingCache.delete(name);
}

function __runjsIsObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object';
}

function __runjsHasOwn(obj: unknown, key: string): obj is Record<string, unknown> {
  return __runjsIsObject(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

function __runjsIsPromiseLike(val: unknown): val is PromiseLike<unknown> {
  if (!__runjsIsObject(val)) return false;
  const then = (val as { then?: unknown }).then;
  return typeof then === 'function';
}

function __runjsGetCtxValue(ctx: FlowContext, key: string): unknown {
  return (ctx as unknown as Record<string, unknown>)[key];
}

async function __runjsEnsureLib(ctx: FlowContext, name: string): Promise<unknown> {
  const libs = (ctx as unknown as { libs?: unknown })?.libs;
  if (__runjsHasOwn(libs, name)) {
    const existing = libs[name];
    if (typeof existing !== 'undefined') return existing;
  }

  const entry = __runjsLibRegistry.get(name);
  if (!entry) return __runjsIsObject(libs) ? libs[name] : undefined;

  const setLib = (v: unknown) => {
    if (__runjsIsObject(libs)) libs[name] = v;
  };

  if (entry.cache === 'context') {
    const pendingMap = __runjsGetPendingMapForCtx(ctx);
    const existingPending = pendingMap.get(name);
    if (existingPending) {
      const v = await existingPending;
      setLib(v);
      return v;
    }

    const task = Promise.resolve()
      .then(() => entry.loader(ctx))
      .then(
        (v) => {
          pendingMap.delete(name);
          return v;
        },
        (err) => {
          pendingMap.delete(name);
          throw err;
        },
      );
    pendingMap.set(name, task);
    const v = await task;
    setLib(v);
    return v;
  }

  if (__runjsLibResolvedCache.has(name)) {
    const v = __runjsLibResolvedCache.get(name);
    setLib(v);
    return v;
  }

  const existingPending = __runjsLibPendingCache.get(name);
  if (existingPending) {
    const v = await existingPending;
    setLib(v);
    return v;
  }

  const task = Promise.resolve()
    .then(() => entry.loader(ctx))
    .then(
      (v) => {
        __runjsLibResolvedCache.set(name, v);
        __runjsLibPendingCache.delete(name);
        return v;
      },
      (err) => {
        __runjsLibPendingCache.delete(name);
        throw err;
      },
    );
  __runjsLibPendingCache.set(name, task);
  const v = await task;
  setLib(v);
  return v;
}

function setupRunJSLibAPIs(ctx: FlowContext): void {
  if (!ctx || typeof ctx !== 'object') return;
  if (typeof ctx.defineMethod !== 'function') return;

  // Internal: ensure libs are loaded before first use.
  // NOTE: name with `__` prefix to reduce accidental use; still callable from RunJS.
  ctx.defineMethod('__ensureLib', async function (this: FlowContext, name: string) {
    if (typeof name !== 'string' || !name) return undefined;
    return await __runjsEnsureLib(this, name);
  });
  ctx.defineMethod('__ensureLibs', async function (this: FlowContext, names: unknown) {
    if (!Array.isArray(names)) return;
    for (const n of names) {
      if (typeof n !== 'string' || !n) continue;
      await __runjsEnsureLib(this, n);
    }
  });
}

const DEFAULT_RUNJS_LIBS: Array<{ name: string; cache: RunJSLibCache; loader: RunJSLibLoader }> = [
  { name: 'React', cache: 'context', loader: (ctx) => __runjsGetCtxValue(ctx, 'React') },
  { name: 'ReactDOM', cache: 'context', loader: (ctx) => __runjsGetCtxValue(ctx, 'ReactDOM') },
  { name: 'antd', cache: 'context', loader: (ctx) => __runjsGetCtxValue(ctx, 'antd') },
  { name: 'dayjs', cache: 'context', loader: (ctx) => __runjsGetCtxValue(ctx, 'dayjs') },
  { name: 'antdIcons', cache: 'global', loader: () => antdIcons },
  { name: 'lodash', cache: 'global', loader: () => import('lodash').then((m) => m.default || m) },
  { name: 'formula', cache: 'global', loader: () => import('@formulajs/formulajs').then((m) => m.default || m) },
  { name: 'math', cache: 'global', loader: () => import('mathjs').then((m) => m) },
];

let __defaultRunJSLibsRegistered = false;

function ensureDefaultRunJSLibsRegistered(): void {
  if (__defaultRunJSLibsRegistered) return;
  __defaultRunJSLibsRegistered = true;
  for (const { name, loader, cache } of DEFAULT_RUNJS_LIBS) {
    if (__runjsLibRegistry.has(name)) continue;
    registerRunJSLib(name, loader, { cache });
  }
}

function resolveRegisteredLibSync(ctx: FlowContext, name: string): unknown {
  const entry = __runjsLibRegistry.get(name);
  if (!entry) return undefined;
  if (entry.cache === 'global' && __runjsLibResolvedCache.has(name)) {
    return __runjsLibResolvedCache.get(name);
  }
  const v = entry.loader(ctx);
  if (__runjsIsPromiseLike(v)) return undefined;
  if (entry.cache === 'global') __runjsLibResolvedCache.set(name, v);
  return v;
}

export function setupRunJSLibs(ctx: FlowContext): void {
  if (!ctx || typeof ctx !== 'object') return;
  if (typeof ctx.defineProperty !== 'function') return;

  ensureDefaultRunJSLibsRegistered();

  // 为第三方/通用库提供统一命名空间：ctx.libs
  // - 新增库应优先挂载到 ctx.libs.xxx（通过 registerRunJSLib）
  // - 同时保留顶层别名（如 ctx.React / ctx.antd），以兼容历史代码
  const libs: Record<string, unknown> = {};
  for (const { name } of DEFAULT_RUNJS_LIBS) {
    Object.defineProperty(libs, name, {
      configurable: true,
      enumerable: true,
      get() {
        const v = resolveRegisteredLibSync(ctx, name);
        // Lazy materialize as writable data property on first access
        Object.defineProperty(libs, name, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: v,
        });
        return v;
      },
    });
  }
  ctx.defineProperty('libs', { value: libs });
  setupRunJSLibAPIs(ctx);
}

export function setRunJSLibOverride(
  ctx: FlowContext,
  name: string,
  value: unknown,
  options?: { topLevelKey?: string | false },
): void {
  const topLevelKey = options?.topLevelKey === false ? null : options?.topLevelKey || name;
  if (topLevelKey) {
    ctx.defineProperty(topLevelKey, { value });
  }

  const libs = ctx.libs;
  Object.defineProperty(libs, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

function buildMixedReactHint(options: { ctx: any; internalReact: any; internalAntd: any }): string {
  const { ctx, internalReact, internalAntd } = options;

  const lines: string[] = [];
  const externalReact = ctx.React && ctx.React !== internalReact;
  const internalReactDOM = !!(ctx.ReactDOM as any)?.__nbRunjsInternalShim;
  const usingInternalAntd = ctx.antd === internalAntd;
  const externalAntd = ctx.antd && ctx.antd !== internalAntd;

  if (externalReact && internalReactDOM) {
    const reactInfo = ctx.__runjsExternalReact;
    const v = reactInfo?.version;
    const domHint = v ? `react-dom@${v}/client` : 'react-dom/client';
    lines.push(
      `- You have imported external React, but you're still using the built-in ReactDOM Root; please also run: await ctx.importAsync("${domHint}")`,
    );
  }
  if (externalAntd && !externalReact) {
    lines.push(
      `- You have imported external antd, but you're still using the built-in React; please run: await ctx.importAsync("react@18.x")`,
    );
    lines.push(`- And make sure ReactDOM matches: await ctx.importAsync("react-dom@18.x/client")`);
  }
  if (externalReact && usingInternalAntd) {
    lines.push(
      `- You have imported external React, but you're still using the built-in antd; please switch to: await ctx.importAsync("antd@5.x")`,
    );
    lines.push(`- If you use icon components, also import: await ctx.importAsync("@ant-design/icons@5.x")`);
  }
  return lines.length ? `\n\n[RunJS Hint]\n${lines.join('\n')}` : '';
}

function tryRenderWithExternalAntdTheme(options: {
  ctx: any;
  entry: any;
  containerEl: any;
  rootMap: WeakMap<any, any>;
  unmountContainerRoot: () => void;
  enhanceReactError: (err: any) => any;
  internalReact: any;
  internalAntd: any;
}): boolean {
  const { ctx, entry, containerEl, rootMap, unmountContainerRoot, enhanceReactError, internalReact, internalAntd } =
    options;

  const canUseExternalAntd =
    !(ctx.ReactDOM as any)?.__nbRunjsInternalShim &&
    ctx.React &&
    ctx.React !== internalReact &&
    ctx.antd &&
    ctx.antd !== internalAntd &&
    typeof (ctx.antd as any).ConfigProvider !== 'undefined';

  if (!canUseExternalAntd) {
    if (entry.disposeTheme) {
      try {
        entry.disposeTheme();
      } catch (_) {
        // ignore
      }
      entry.disposeTheme = undefined;
    }
    return false;
  }

  const renderWithExternalAntdTheme = () => {
    // Make theme token reactive dependency (best-effort)
    const themeToken = ctx?.engine?.context?.themeToken;
    void themeToken;

    const appConfig = ctx?.engine?.context?.antdConfig;
    const locale = ctx?.engine?.context?.locales?.antd || appConfig?.locale;

    const ConfigProvider = (ctx.antd as any).ConfigProvider;
    const App = (ctx.antd as any).App;

    const configProps: any = {
      popupMatchSelectWidth: false,
      locale: locale || {},
    };

    if (appConfig && typeof appConfig === 'object') {
      if (typeof appConfig.direction !== 'undefined') configProps.direction = appConfig.direction;
      if (typeof appConfig.prefixCls === 'string') configProps.prefixCls = appConfig.prefixCls;
      if (typeof appConfig.iconPrefixCls === 'string') configProps.iconPrefixCls = appConfig.iconPrefixCls;
      if (typeof appConfig.getPopupContainer === 'function')
        configProps.getPopupContainer = appConfig.getPopupContainer;
      if (appConfig.theme && typeof appConfig.theme === 'object') configProps.theme = appConfig.theme;
    }

    const child = entry.lastVnode as any;
    const wrapped = App
      ? ctx.React.createElement(ConfigProvider, configProps, ctx.React.createElement(App, null, child))
      : ctx.React.createElement(ConfigProvider, configProps, child);

    entry.root.render(wrapped);
  };

  if (!entry.disposeTheme) {
    entry.disposeTheme = autorun(() => {
      try {
        // 兜底：如果容器节点曾经连接过 DOM，但后续又被移除（且仍被外部引用），
        // autorun 继续运行会导致泄漏；因此这里在“连接→断开”后执行清理。
        //
        // 注意：不在首次 render 就用 isConnected 拦截：
        // - React 允许渲染到“未挂载到 DOM 的容器”（如离屏渲染/测试）；
        // - 因此只在容器“曾连接过”之后再做断开检测。
        // 同时 DocumentFragment 的 isConnected 通常为 false，因此这里只对 Element 做判断。
        if (
          containerEl &&
          containerEl.nodeType === 1 &&
          typeof (containerEl as any).isConnected === 'boolean' &&
          !(containerEl as any).isConnected &&
          entry.wasConnected
        ) {
          queueMicrotask(() => {
            const cur = rootMap.get(containerEl);
            if (cur === entry) unmountContainerRoot();
          });
          return;
        }
        if (
          containerEl &&
          containerEl.nodeType === 1 &&
          typeof (containerEl as any).isConnected === 'boolean' &&
          (containerEl as any).isConnected
        ) {
          entry.wasConnected = true;
        }
        renderWithExternalAntdTheme();
      } catch (e) {
        throw enhanceReactError(e);
      }
    });
  } else {
    renderWithExternalAntdTheme();
  }

  return true;
}

export function externalReactRender(options: {
  ctx: any;
  entry: any;
  vnode: any;
  containerEl: any;
  rootMap: WeakMap<any, any>;
  unmountContainerRoot: () => void;
  internalReact: any;
  internalAntd: any;
}): any {
  const { ctx, entry, vnode, containerEl, rootMap, unmountContainerRoot, internalReact, internalAntd } = options;

  const enhanceReactError = (err: any) => {
    const msg = String(err?.message || err || '');
    if (!msg || !/invalid hook call/i.test(msg)) return err;
    if (/\[RunJS Hint\]/.test(msg)) return err;
    const hint = buildMixedReactHint({ ctx, internalReact, internalAntd });
    if (!hint) return err;
    const e: any = new Error(`${msg}${hint}`);
    e.cause = err;
    return e;
  };

  try {
    entry.lastVnode = vnode;
    const renderedWithExternalAntdTheme = tryRenderWithExternalAntdTheme({
      ctx,
      entry,
      containerEl,
      rootMap,
      unmountContainerRoot,
      enhanceReactError,
      internalReact,
      internalAntd,
    });
    if (!renderedWithExternalAntdTheme) {
      entry.root.render(vnode as any);
    }
    return entry.root;
  } catch (e) {
    throw enhanceReactError(e);
  }
}
